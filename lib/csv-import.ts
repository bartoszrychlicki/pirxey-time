import type { Project, Tag, CreateTimeEntry } from "@/lib/types";
import type { CSVRow } from "@/lib/csv";
import { CSV_IMPORT_HEADERS } from "@/lib/csv";
import { calculateDurationMinutes } from "@/lib/format";
import { createTimeEntrySchema } from "@/lib/validation";

export interface ImportError {
  row: number;
  field: string;
  message: string;
}

export interface ProjectSummary {
  name: string;
  color: string;
  minutes: number;
  count: number;
}

export interface ImportValidationResult {
  valid: boolean;
  entries: CreateTimeEntry[];
  errors: ImportError[];
  summary: {
    totalEntries: number;
    totalMinutes: number;
    byProject: ProjectSummary[];
  };
}

export function validateCSVHeaders(headerLine: string): string[] {
  const errors: string[] = [];
  const clean = headerLine.replace(/^\uFEFF/, "");
  const headers = clean.split(",").map((h) => h.trim().replace(/^"|"$/g, ""));

  for (const required of CSV_IMPORT_HEADERS) {
    if (!headers.includes(required)) {
      errors.push(`Brak wymaganej kolumny: "${required}"`);
    }
  }
  return errors;
}

export function validateCSVImport(
  rows: CSVRow[],
  projects: Project[],
  tags: Tag[],
  userId: string,
  workspaceId: string,
): ImportValidationResult {
  const errors: ImportError[] = [];
  const entries: CreateTimeEntry[] = [];
  const projectMinutes = new Map<string, { name: string; color: string; minutes: number; count: number }>();
  let totalMinutes = 0;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = i + 2; // +2 because row 1 is header, data starts at row 2

    // Resolve project
    let projectId: string | null = null;
    if (row.Projekt && row.Projekt.trim()) {
      const project = projects.find(
        (p) => p.name.toLowerCase() === row.Projekt.trim().toLowerCase(),
      );
      if (!project) {
        errors.push({
          row: rowNum,
          field: "Projekt",
          message: `Nieznany projekt: "${row.Projekt}"`,
        });
      } else {
        projectId = project.id;
      }
    }

    // Resolve tags
    const tagIds: string[] = [];
    if (row.Tagi && row.Tagi.trim()) {
      const tagNames = row.Tagi.split(";").map((t) => t.trim()).filter(Boolean);
      for (const tagName of tagNames) {
        const tag = tags.find(
          (t) => t.name.toLowerCase() === tagName.toLowerCase(),
        );
        if (!tag) {
          errors.push({
            row: rowNum,
            field: "Tagi",
            message: `Nieznany tag: "${tagName}"`,
          });
        } else {
          tagIds.push(tag.id);
        }
      }
    }

    // Parse billable
    const billableStr = (row.Rozliczeniowy ?? "").trim().toLowerCase();
    const billable = billableStr === "tak" || billableStr === "yes" || billableStr === "1";

    // Calculate duration
    const startTime = (row.Start ?? "").trim();
    const endTime = (row.Koniec ?? "").trim();
    let durationMinutes = 0;
    if (startTime && endTime) {
      durationMinutes = calculateDurationMinutes(startTime, endTime);
      // Handle midnight crossing
      if (durationMinutes <= 0) {
        durationMinutes = calculateDurationMinutes(startTime, endTime) + 24 * 60;
      }
    }

    const payload = {
      workspaceId,
      userId,
      projectId,
      description: (row.Opis ?? "").trim(),
      date: (row.Data ?? "").trim(),
      startTime,
      endTime,
      durationMinutes,
      tagIds,
      billable,
    };

    // Validate with Zod schema
    const result = createTimeEntrySchema.safeParse(payload);
    if (!result.success) {
      for (const issue of result.error.issues) {
        const field = issue.path[0]?.toString() ?? "wiersz";
        // Map internal field names to CSV column names
        const fieldMap: Record<string, string> = {
          description: "Opis",
          date: "Data",
          startTime: "Start",
          endTime: "Koniec",
          durationMinutes: "Czas trwania",
        };
        errors.push({
          row: rowNum,
          field: fieldMap[field] ?? field,
          message: issue.message,
        });
      }
    }

    // Always build the entry for summary (even if errors exist)
    entries.push(payload as CreateTimeEntry);

    // Track project summary
    if (projectId) {
      const project = projects.find((p) => p.id === projectId)!;
      const existing = projectMinutes.get(projectId);
      if (existing) {
        existing.minutes += durationMinutes;
        existing.count += 1;
      } else {
        projectMinutes.set(projectId, {
          name: project.name,
          color: project.color,
          minutes: durationMinutes,
          count: 1,
        });
      }
    } else {
      const existing = projectMinutes.get("__none__");
      if (existing) {
        existing.minutes += durationMinutes;
        existing.count += 1;
      } else {
        projectMinutes.set("__none__", {
          name: "Bez projektu",
          color: "#6B7280",
          minutes: durationMinutes,
          count: 1,
        });
      }
    }

    totalMinutes += durationMinutes;
  }

  const valid = errors.length === 0;

  return {
    valid,
    entries: valid ? entries : [],
    errors,
    summary: {
      totalEntries: rows.length,
      totalMinutes,
      byProject: Array.from(projectMinutes.values()).sort((a, b) => b.minutes - a.minutes),
    },
  };
}
