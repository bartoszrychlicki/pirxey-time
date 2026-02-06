"use client";

import { useCallback, useMemo, useState } from "react";
import {
  startOfWeek,
  endOfWeek,
  subWeeks,
  startOfMonth,
  endOfMonth,
  format,
} from "date-fns";
import { pl } from "date-fns/locale";
import {
  BarChart3,
  Download,
  Clock,
  Wallet,
  WalletCards,
  Filter,
} from "lucide-react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";

import type { TimeEntry } from "@/lib/types";
import { useTimeEntries } from "@/hooks/use-time-entries";
import { useProjects } from "@/hooks/use-projects";
import { useTags } from "@/hooks/use-tags";
import { useMembers } from "@/hooks/use-members";
import { usePermissions } from "@/hooks/use-permissions";
import { formatDuration, formatDateISO } from "@/lib/format";
import { entriesToCSV, downloadCSV } from "@/lib/csv";
import { RequirePermission } from "@/lib/rbac/guards";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/empty-state";
import { TableSkeleton } from "@/components/loading-skeleton";
import { PageTransition } from "@/components/motion";

// ─── Date range presets ─────────────────────────────────────────────────────

type DatePreset = "this_week" | "last_week" | "this_month" | "custom";

function getDateRange(preset: DatePreset): { start: string; end: string } {
  const now = new Date();
  switch (preset) {
    case "this_week": {
      const s = startOfWeek(now, { weekStartsOn: 1 });
      const e = endOfWeek(now, { weekStartsOn: 1 });
      return { start: formatDateISO(s), end: formatDateISO(e) };
    }
    case "last_week": {
      const lastWeek = subWeeks(now, 1);
      const s = startOfWeek(lastWeek, { weekStartsOn: 1 });
      const e = endOfWeek(lastWeek, { weekStartsOn: 1 });
      return { start: formatDateISO(s), end: formatDateISO(e) };
    }
    case "this_month": {
      const s = startOfMonth(now);
      const e = endOfMonth(now);
      return { start: formatDateISO(s), end: formatDateISO(e) };
    }
    case "custom":
    default:
      return { start: formatDateISO(now), end: formatDateISO(now) };
  }
}

// ─── Billable filter ────────────────────────────────────────────────────────

type BillableFilter = "all" | "billable" | "non_billable";

// ─── Page component ─────────────────────────────────────────────────────────

export default function ReportsPage() {
  const { entries, isLoading } = useTimeEntries();
  const { projects } = useProjects();
  const { tags } = useTags();
  const { members } = useMembers();
  const { can } = usePermissions();

  // ─── Filter state ───────────────────────────────────────────────────────

  const [datePreset, setDatePreset] = useState<DatePreset>("this_month");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [projectFilter, setProjectFilter] = useState<string>("all");
  const [memberFilter, setMemberFilter] = useState<string>("all");
  const [tagFilter, setTagFilter] = useState<string>("all");
  const [billableFilter, setBillableFilter] = useState<BillableFilter>("all");

  // ─── Computed date range ────────────────────────────────────────────────

  const dateRange = useMemo(() => {
    if (datePreset === "custom") {
      return {
        start: customStart || formatDateISO(new Date()),
        end: customEnd || formatDateISO(new Date()),
      };
    }
    return getDateRange(datePreset);
  }, [datePreset, customStart, customEnd]);

  // ─── Filtered entries ───────────────────────────────────────────────────

  const filteredEntries = useMemo(() => {
    return entries.filter((e) => {
      // Date range
      if (e.date < dateRange.start || e.date > dateRange.end) return false;

      // Project
      if (projectFilter !== "all" && e.projectId !== projectFilter) return false;

      // Member
      if (memberFilter !== "all" && e.userId !== memberFilter) return false;

      // Tag
      if (tagFilter !== "all" && !e.tagIds.includes(tagFilter)) return false;

      // Billable
      if (billableFilter === "billable" && !e.billable) return false;
      if (billableFilter === "non_billable" && e.billable) return false;

      return true;
    });
  }, [entries, dateRange, projectFilter, memberFilter, tagFilter, billableFilter]);

  // ─── Summary stats ─────────────────────────────────────────────────────

  const totalMinutes = useMemo(
    () => filteredEntries.reduce((sum, e) => sum + e.durationMinutes, 0),
    [filteredEntries]
  );
  const billableMinutes = useMemo(
    () =>
      filteredEntries
        .filter((e) => e.billable)
        .reduce((sum, e) => sum + e.durationMinutes, 0),
    [filteredEntries]
  );
  const nonBillableMinutes = totalMinutes - billableMinutes;

  // ─── Lookup maps ───────────────────────────────────────────────────────

  const projectMap = useMemo(
    () => new Map(projects.map((p) => [p.id, p])),
    [projects]
  );
  const memberMap = useMemo(
    () => new Map(members.map((m) => [m.id, m])),
    [members]
  );
  const tagMap = useMemo(
    () => new Map(tags.map((t) => [t.id, t])),
    [tags]
  );

  // ─── Table columns ────────────────────────────────────────────────────

  const columns = useMemo<ColumnDef<TimeEntry>[]>(
    () => [
      {
        accessorKey: "date",
        header: "Data",
        cell: ({ getValue }) => {
          const val = getValue<string>();
          const date = new Date(val + "T00:00:00");
          return format(date, "d MMM yyyy", { locale: pl });
        },
      },
      {
        accessorKey: "description",
        header: "Opis",
        cell: ({ getValue }) => {
          const val = getValue<string>();
          return val || <span className="italic text-muted-foreground">Bez opisu</span>;
        },
      },
      {
        id: "project",
        header: "Projekt",
        accessorFn: (row) => projectMap.get(row.projectId ?? "")?.name ?? "—",
        cell: ({ row }) => {
          const project = row.original.projectId
            ? projectMap.get(row.original.projectId)
            : null;
          if (!project) return <span className="text-muted-foreground">—</span>;
          return (
            <div className="flex items-center gap-1.5">
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: project.color }}
              />
              {project.name}
            </div>
          );
        },
      },
      {
        id: "user",
        header: "Uzytkownik",
        accessorFn: (row) => memberMap.get(row.userId)?.name ?? "—",
      },
      {
        id: "tags",
        header: "Tagi",
        cell: ({ row }) => {
          const entryTags = row.original.tagIds
            .map((id) => tagMap.get(id))
            .filter(Boolean);
          if (entryTags.length === 0)
            return <span className="text-muted-foreground">—</span>;
          return (
            <div className="flex flex-wrap gap-1">
              {entryTags.map((tag) =>
                tag ? (
                  <Badge key={tag.id} variant="outline" className="gap-1 text-xs">
                    <span
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ backgroundColor: tag.color }}
                    />
                    {tag.name}
                  </Badge>
                ) : null
              )}
            </div>
          );
        },
      },
      {
        accessorKey: "durationMinutes",
        header: "Czas trwania",
        cell: ({ getValue }) => (
          <span className="font-mono tabular-nums">
            {formatDuration(getValue<number>())}
          </span>
        ),
      },
      {
        accessorKey: "billable",
        header: "Rozliczalny",
        cell: ({ getValue }) =>
          getValue<boolean>() ? (
            <Badge variant="default" className="text-xs">
              Tak
            </Badge>
          ) : (
            <Badge variant="secondary" className="text-xs">
              Nie
            </Badge>
          ),
      },
    ],
    [projectMap, memberMap, tagMap]
  );

  // ─── Table instance ───────────────────────────────────────────────────

  const [sorting, setSorting] = useState<SortingState>([
    { id: "date", desc: true },
  ]);

  const table = useReactTable({
    data: filteredEntries,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: { pageSize: 20 },
    },
  });

  // ─── CSV export ───────────────────────────────────────────────────────

  const handleExportCSV = useCallback(() => {
    const csv = entriesToCSV(filteredEntries, {
      projects,
      tags,
      users: members,
    });
    const filename = `raport_${dateRange.start}_${dateRange.end}.csv`;
    downloadCSV(csv, filename);
  }, [filteredEntries, projects, tags, members, dateRange]);

  // ─── Date range label ─────────────────────────────────────────────────

  const dateRangeLabel = useMemo(() => {
    const start = new Date(dateRange.start + "T00:00:00");
    const end = new Date(dateRange.end + "T00:00:00");
    return `${format(start, "d MMM", { locale: pl })} - ${format(end, "d MMM yyyy", { locale: pl })}`;
  }, [dateRange]);

  // ─── Can see member filter ────────────────────────────────────────────

  const canSeeMembers = can("time_entries:all:read") || can("time_entries:assigned_projects:read");

  return (
    <PageTransition>
    <div className="space-y-6">
      {/* Filter bar */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Filter className="h-4 w-4" />
            Filtry raportu
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {/* Date preset */}
            <div className="space-y-1.5">
              <Label className="text-xs">Okres</Label>
              <Select
                value={datePreset}
                onValueChange={(v) => setDatePreset(v as DatePreset)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="this_week">Ten tydzien</SelectItem>
                  <SelectItem value="last_week">Poprzedni tydzien</SelectItem>
                  <SelectItem value="this_month">Ten miesiac</SelectItem>
                  <SelectItem value="custom">Niestandardowy</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Custom date range */}
            {datePreset === "custom" && (
              <>
                <div className="space-y-1.5">
                  <Label className="text-xs">Od</Label>
                  <Input
                    type="date"
                    value={customStart}
                    onChange={(e) => setCustomStart(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Do</Label>
                  <Input
                    type="date"
                    value={customEnd}
                    onChange={(e) => setCustomEnd(e.target.value)}
                  />
                </div>
              </>
            )}

            {/* Project filter */}
            <div className="space-y-1.5">
              <Label className="text-xs">Projekt</Label>
              <Select value={projectFilter} onValueChange={setProjectFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Wszystkie projekty</SelectItem>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      <span className="flex items-center gap-2">
                        <span
                          className="inline-block h-2 w-2 rounded-full"
                          style={{ backgroundColor: p.color }}
                        />
                        {p.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Member filter - only for ADMIN/MANAGER */}
            {canSeeMembers && (
              <div className="space-y-1.5">
                <Label className="text-xs">Pracownik</Label>
                <Select value={memberFilter} onValueChange={setMemberFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Wszyscy</SelectItem>
                    {members.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Tag filter */}
            <div className="space-y-1.5">
              <Label className="text-xs">Tag</Label>
              <Select value={tagFilter} onValueChange={setTagFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Wszystkie tagi</SelectItem>
                  {tags.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      <span className="flex items-center gap-2">
                        <span
                          className="inline-block h-2 w-2 rounded-full"
                          style={{ backgroundColor: t.color }}
                        />
                        {t.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Billable filter */}
            <div className="space-y-1.5">
              <Label className="text-xs">Rozliczalnosc</Label>
              <Select
                value={billableFilter}
                onValueChange={(v) => setBillableFilter(v as BillableFilter)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Wszystkie</SelectItem>
                  <SelectItem value="billable">Rozliczalne</SelectItem>
                  <SelectItem value="non_billable">Nierozliczalne</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
            <span>{dateRangeLabel}</span>
            <span>
              {filteredEntries.length}{" "}
              {filteredEntries.length === 1 ? "wpis" : "wpisow"}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="rounded-lg bg-primary/10 p-2.5">
              <Clock className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Lacznie godzin</p>
              <p className="text-2xl font-bold tabular-nums">
                {formatDuration(totalMinutes)}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="rounded-lg bg-green-500/10 p-2.5">
              <Wallet className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Rozliczalne</p>
              <p className="text-2xl font-bold tabular-nums">
                {formatDuration(billableMinutes)}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="rounded-lg bg-muted p-2.5">
              <WalletCards className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Nierozliczalne</p>
              <p className="text-2xl font-bold tabular-nums">
                {formatDuration(nonBillableMinutes)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Data table + export */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <BarChart3 className="h-4 w-4" />
              Szczegoly
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={handleExportCSV}
              disabled={filteredEntries.length === 0}
            >
              <Download className="h-3.5 w-3.5" />
              Eksportuj CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <TableSkeleton rows={5} cols={7} />
          ) : filteredEntries.length === 0 ? (
            <EmptyState
              icon={BarChart3}
              title="Brak danych do wyswietlenia"
              description="Zmien filtry lub dodaj wpisy czasu."
            />
          ) : (
            <>
              <div className="overflow-x-auto rounded-md border">
                <Table>
                  <TableHeader>
                    {table.getHeaderGroups().map((headerGroup) => (
                      <TableRow key={headerGroup.id}>
                        {headerGroup.headers.map((header) => (
                          <TableHead
                            key={header.id}
                            className="cursor-pointer select-none whitespace-nowrap"
                            onClick={header.column.getToggleSortingHandler()}
                          >
                            {header.isPlaceholder
                              ? null
                              : flexRender(
                                  header.column.columnDef.header,
                                  header.getContext()
                                )}
                            {{
                              asc: " ↑",
                              desc: " ↓",
                            }[header.column.getIsSorted() as string] ?? ""}
                          </TableHead>
                        ))}
                      </TableRow>
                    ))}
                  </TableHeader>
                  <TableBody>
                    {table.getRowModel().rows.map((row) => (
                      <TableRow key={row.id}>
                        {row.getVisibleCells().map((cell) => (
                          <TableCell key={cell.id} className="whitespace-nowrap">
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext()
                            )}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="mt-4 flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  Strona {table.getState().pagination.pageIndex + 1} z{" "}
                  {table.getPageCount()}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => table.previousPage()}
                    disabled={!table.getCanPreviousPage()}
                  >
                    Poprzednia
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => table.nextPage()}
                    disabled={!table.getCanNextPage()}
                  >
                    Nastepna
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
    </PageTransition>
  );
}
