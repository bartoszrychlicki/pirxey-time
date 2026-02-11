import * as XLSX from "xlsx";
import type { TimeEntry, Project, Tag, Team, User, Client } from "@/lib/types";
import { formatDuration } from "@/lib/format";

// ─── Types ───────────────────────────────────────────────────────────────────

export type GroupByDimension = "none" | "member" | "client" | "project" | "team";

export interface GroupedEntry {
  groupKey: string;
  groupLabel: string;
  groupColor?: string;
  entries: TimeEntry[];
  totalMinutes: number;
  entryCount: number;
}

export interface ExcelContext {
  projects: Project[];
  tags: Tag[];
  teams: Team[];
  users: User[];
  clients: Client[];
}

// ─── Main export function ────────────────────────────────────────────────────

export function entriesToExcel(
  entries: TimeEntry[],
  context: ExcelContext,
  grouping?: {
    dimension: GroupByDimension;
    groups: GroupedEntry[];
  }
): XLSX.WorkBook {
  const workbook = XLSX.utils.book_new();

  if (!grouping || grouping.dimension === "none") {
    const worksheet = createFlatWorksheet(entries, context);
    XLSX.utils.book_append_sheet(workbook, worksheet, "Raport");
  } else {
    const worksheet = createGroupedWorksheet(
      grouping.groups,
      grouping.dimension,
      context
    );
    XLSX.utils.book_append_sheet(workbook, worksheet, "Raport");
  }

  return workbook;
}

// ─── Flat worksheet ─────────────────────────────────────────────────────────

function createFlatWorksheet(
  entries: TimeEntry[],
  context: ExcelContext
): XLSX.WorkSheet {
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
      user?.name ?? "",
      userTeams,
      project?.name ?? "No project",
      client?.name ?? "No client",
      entry.description,
      entry.date,
      entry.startTime,
      entry.endTime,
      formatDuration(entry.durationMinutes),
      entryTags,
      entry.billable ? "Yes" : "No",
    ];
  });

  const data = [headers, ...rows];
  const worksheet = XLSX.utils.aoa_to_sheet(data);

  // Apply formatting
  applyHeaderFormatting(worksheet, headers.length);
  autoFitColumns(worksheet, data);

  return worksheet;
}

// ─── Grouped worksheet ──────────────────────────────────────────────────────

function createGroupedWorksheet(
  groups: GroupedEntry[],
  dimension: GroupByDimension,
  context: ExcelContext
): XLSX.WorkSheet {
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

  const data: any[][] = [headers];
  const outlineLevel: number[] = [0]; // Track outline level for each row

  let totalMinutes = 0;

  groups.forEach((group) => {
    // Group header row
    const groupHeaderRow = [
      `[GROUP] ${getDimensionLabel(dimension)}: ${group.groupLabel}`,
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      formatDuration(group.totalMinutes),
      "",
      "",
    ];
    data.push(groupHeaderRow);
    outlineLevel.push(0); // Group header at level 0

    totalMinutes += group.totalMinutes;

    // Entry rows (indented)
    group.entries.forEach((entry) => {
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

      const entryRow = [
        user?.name ?? "",
        userTeams,
        project?.name ?? "No project",
        client?.name ?? "No client",
        entry.description,
        entry.date,
        entry.startTime,
        entry.endTime,
        formatDuration(entry.durationMinutes),
        entryTags,
        entry.billable ? "Tak" : "Nie",
      ];
      data.push(entryRow);
      outlineLevel.push(1); // Entry rows at level 1 (collapsible)
    });
  });

  // Total row
  const totalRow = [
    "TOTAL",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    formatDuration(totalMinutes),
    "",
    "",
  ];
  data.push(totalRow);
  outlineLevel.push(0); // Total row at level 0

  const worksheet = XLSX.utils.aoa_to_sheet(data);

  // Apply outline levels
  const range = XLSX.utils.decode_range(worksheet["!ref"] || "A1");
  for (let R = range.s.r; R <= range.e.r; R++) {
    const level = outlineLevel[R];
    if (level !== undefined && level > 0) {
      // Set hidden property to create collapsible groups
      const rowInfo = worksheet["!rows"] || [];
      worksheet["!rows"] = rowInfo;
      if (!rowInfo[R]) rowInfo[R] = {};
      rowInfo[R].level = level;
    }
  }

  // Apply formatting
  applyGroupedFormatting(worksheet, data, groups.length);
  autoFitColumns(worksheet, data);

  return worksheet;
}

// ─── Helper: Get dimension label ────────────────────────────────────────────

function getDimensionLabel(dimension: GroupByDimension): string {
  switch (dimension) {
    case "member":
      return "Member";
    case "client":
      return "Client";
    case "project":
      return "Project";
    case "team":
      return "Team";
    default:
      return "";
  }
}

// ─── Formatting helpers ─────────────────────────────────────────────────────

function applyHeaderFormatting(worksheet: XLSX.WorkSheet, colCount: number): void {
  const headerStyle = {
    font: { bold: true },
    fill: { fgColor: { rgb: "E5E7EB" } },
  };

  for (let C = 0; C < colCount; C++) {
    const cellAddress = XLSX.utils.encode_cell({ r: 0, c: C });
    if (!worksheet[cellAddress]) continue;
    worksheet[cellAddress].s = headerStyle;
  }
}

function applyGroupedFormatting(
  worksheet: XLSX.WorkSheet,
  data: any[][],
  groupCount: number
): void {
  const headerStyle = {
    font: { bold: true },
    fill: { fgColor: { rgb: "E5E7EB" } },
  };

  const groupHeaderStyle = {
    font: { bold: true },
    fill: { fgColor: { rgb: "F3F4F6" } },
  };

  const totalStyle = {
    font: { bold: true },
    fill: { fgColor: { rgb: "DBEAFE" } },
  };

  // Header row (row 0)
  for (let C = 0; C < data[0].length; C++) {
    const cellAddress = XLSX.utils.encode_cell({ r: 0, c: C });
    if (!worksheet[cellAddress]) continue;
    worksheet[cellAddress].s = headerStyle;
  }

  // Group headers and total row
  let currentRow = 1;
  for (let g = 0; g < groupCount; g++) {
    // Group header row
    for (let C = 0; C < data[0].length; C++) {
      const cellAddress = XLSX.utils.encode_cell({ r: currentRow, c: C });
      if (!worksheet[cellAddress]) continue;
      worksheet[cellAddress].s = groupHeaderStyle;
    }

    // Skip entries in this group
    const groupData = data[currentRow];
    // Find next group or total (rows that start with "[GRUPA]" or "SUMA")
    currentRow++;
    while (
      currentRow < data.length &&
      !String(data[currentRow][0]).startsWith("[GRUPA]") &&
      !String(data[currentRow][0]).startsWith("SUMA")
    ) {
      currentRow++;
    }
  }

  // Total row (last row)
  const totalRowIndex = data.length - 1;
  for (let C = 0; C < data[0].length; C++) {
    const cellAddress = XLSX.utils.encode_cell({ r: totalRowIndex, c: C });
    if (!worksheet[cellAddress]) continue;
    worksheet[cellAddress].s = totalStyle;
  }
}

function autoFitColumns(worksheet: XLSX.WorkSheet, data: any[][]): void {
  const colWidths: number[] = [];

  data.forEach((row) => {
    row.forEach((cell, colIndex) => {
      const cellValue = String(cell ?? "");
      const cellWidth = cellValue.length + 2;
      colWidths[colIndex] = Math.max(colWidths[colIndex] || 10, cellWidth);
    });
  });

  worksheet["!cols"] = colWidths.map((w) => ({ wch: Math.min(w, 50) }));
}

// ─── Download function ──────────────────────────────────────────────────────

export function downloadExcel(workbook: XLSX.WorkBook, filename: string): void {
  const safeName = filename.endsWith(".xlsx") ? filename : `${filename}.xlsx`;
  XLSX.writeFile(workbook, safeName);
}
