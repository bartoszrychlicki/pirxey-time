import type { TimeEntry, Project, Tag, User } from "@/lib/types";
import { formatDuration } from "@/lib/format";

interface CSVContext {
  projects: Project[];
  tags: Tag[];
  users: User[];
}

function escapeCSV(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function entriesToCSV(entries: TimeEntry[], context: CSVContext): string {
  const headers = [
    "Uzytkownik",
    "Projekt",
    "Opis",
    "Data",
    "Start",
    "Koniec",
    "Czas trwania",
    "Tagi",
    "Rozliczeniowy",
  ];

  const rows = entries.map((entry) => {
    const user = context.users.find((u) => u.id === entry.userId);
    const project = context.projects.find((p) => p.id === entry.projectId);
    const entryTags = entry.tagIds
      .map((id) => context.tags.find((t) => t.id === id)?.name ?? "")
      .filter(Boolean)
      .join("; ");

    return [
      escapeCSV(user?.name ?? ""),
      escapeCSV(project?.name ?? "Brak projektu"),
      escapeCSV(entry.description),
      entry.date,
      entry.startTime,
      entry.endTime,
      formatDuration(entry.durationMinutes),
      escapeCSV(entryTags),
      entry.billable ? "Tak" : "Nie",
    ].join(",");
  });

  return [headers.join(","), ...rows].join("\n");
}

export function downloadCSV(csv: string, filename: string): void {
  const BOM = "\uFEFF";
  const blob = new Blob([BOM + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
