import type { TimeEntry, Project, Tag, Team, User, Client } from "@/lib/types";
import { formatDuration } from "@/lib/format";

interface CSVContext {
  projects: Project[];
  tags: Tag[];
  teams: Team[];
  users: User[];
  clients: Client[];
}

function escapeCSV(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function entriesToCSV(entries: TimeEntry[], context: CSVContext): string {
  const headers = [
    "User",
    "Teams",
    "Project",
    "Client",
    "Description",
    "Date",
    "Start",
    "End",
    "Duration",
    "Tags",
    "Billable",
  ];

  const rows = entries.map((entry) => {
    const user = context.users.find((u) => u.id === entry.userId);
    const userTeams = (user?.teamIds ?? [])
      .map((teamId) => context.teams.find((team) => team.id === teamId)?.name ?? "")
      .filter(Boolean)
      .join("; ");
    const project = context.projects.find((p) => p.id === entry.projectId);
    const client = project?.clientId
      ? context.clients.find((c) => c.id === project.clientId)
      : null;
    const entryTags = entry.tagIds
      .map((id) => context.tags.find((t) => t.id === id)?.name ?? "")
      .filter(Boolean)
      .join("; ");

    return [
      escapeCSV(user?.name ?? ""),
      escapeCSV(userTeams),
      escapeCSV(project?.name ?? "No project"),
      escapeCSV(client?.name ?? "No client"),
      escapeCSV(entry.description),
      entry.date,
      entry.startTime,
      entry.endTime,
      formatDuration(entry.durationMinutes),
      escapeCSV(entryTags),
      entry.billable ? "Yes" : "No",
    ].join(",");
  });

  return [headers.join(","), ...rows].join("\n");
}

export function downloadCSV(csv: string, filename: string): void {
  const BOM = "\uFEFF";
  const safeName = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  const blob = new Blob([BOM + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = safeName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// ─── CSV Import helpers ──────────────────────────────────────────────────────

export const CSV_IMPORT_HEADERS = [
  "Opis",
  "Projekt",
  "Data",
  "Start",
  "Koniec",
  "Tagi",
  "Rozliczeniowy",
] as const;

export function generateCSVTemplate(): string {
  const headers = CSV_IMPORT_HEADERS.join(",");
  const exampleRow = [
    '"Sprint planning"',
    '"Pirxey Dashboard"',
    "2026-02-07",
    "09:00",
    "10:30",
    '"spotkanie; planning"',
    "Tak",
  ].join(",");
  return [headers, exampleRow].join("\n");
}

export function downloadCSVTemplate(): void {
  downloadCSV(generateCSVTemplate(), "pirxey-time-szablon.csv");
}

export interface CSVRow {
  Opis: string;
  Projekt: string;
  Data: string;
  Start: string;
  Koniec: string;
  Tagi: string;
  Rozliczeniowy: string;
}

export function parseCSV(text: string): CSVRow[] {
  // Strip BOM
  const clean = text.replace(/^\uFEFF/, "");
  const lines = clean.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];

  const headers = parseCSVLine(lines[0]);
  const rows: CSVRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    const row: Record<string, string> = {};
    for (let j = 0; j < headers.length; j++) {
      row[headers[j].trim()] = (values[j] ?? "").trim();
    }
    rows.push(row as unknown as CSVRow);
  }

  return rows;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (inQuotes) {
      if (char === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ",") {
        result.push(current);
        current = "";
      } else {
        current += char;
      }
    }
  }
  result.push(current);
  return result;
}
