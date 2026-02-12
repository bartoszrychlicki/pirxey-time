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
  ArrowUpDown,
  Info,
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

import type { TimeEntry, GroupByDimension, GroupedEntry } from "@/lib/types";
import { useTimeEntries } from "@/hooks/use-time-entries";
import { useProjects } from "@/hooks/use-projects";
import { useTags } from "@/hooks/use-tags";
import { useCategories } from "@/hooks/use-categories";
import { useMembers } from "@/hooks/use-members";
import { useTeams } from "@/hooks/use-teams";
import { useClients } from "@/hooks/use-clients";
import { usePermissions } from "@/hooks/use-permissions";
import { formatDuration, formatDateISO } from "@/lib/format";
import { entriesToCSV, downloadCSV } from "@/lib/csv";
import { entriesToExcel, downloadExcel } from "@/lib/excel";

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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
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
  const { categories } = useCategories();
  const { members } = useMembers();
  const { teams } = useTeams();
  const { clients } = useClients();
  const { can } = usePermissions();

  // ─── Filter state ───────────────────────────────────────────────────────

  const [datePreset, setDatePreset] = useState<DatePreset>("this_month");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [projectFilter, setProjectFilter] = useState<string>("all");
  const [memberFilter, setMemberFilter] = useState<string>("all");
  const [teamFilter, setTeamFilter] = useState<string>("all");
  const [tagFilter, setTagFilter] = useState<string>("all");
  const [billableFilter, setBillableFilter] = useState<BillableFilter>("all");

  // ─── Grouping state ─────────────────────────────────────────────────────

  const [groupBy, setGroupBy] = useState<GroupByDimension>("none");
  const [groupSortBy, setGroupSortBy] = useState<"name" | "duration">("name");
  const [groupSortOrder, setGroupSortOrder] = useState<"asc" | "desc">("asc");

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

  const memberTeamMap = useMemo(
    () => new Map(members.map((member) => [member.id, member.teamIds])),
    [members],
  );

  // ─── Filtered entries ───────────────────────────────────────────────────

  const filteredEntries = useMemo(() => {
    return entries.filter((e) => {
      // Date range
      if (e.date < dateRange.start || e.date > dateRange.end) return false;

      // Project
      if (projectFilter !== "all" && e.projectId !== projectFilter) return false;

      // Member
      if (memberFilter !== "all" && e.userId !== memberFilter) return false;

      // Team
      if (teamFilter !== "all") {
        const memberTeamIds = memberTeamMap.get(e.userId) ?? [];
        if (!memberTeamIds.includes(teamFilter)) return false;
      }

      // Tag
      if (tagFilter !== "all" && !e.tagIds.includes(tagFilter)) return false;

      // Billable
      if (billableFilter === "billable" && !e.billable) return false;
      if (billableFilter === "non_billable" && e.billable) return false;

      return true;
    });
  }, [entries, dateRange, projectFilter, memberFilter, teamFilter, tagFilter, billableFilter, memberTeamMap]);

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
  const categoryMap = useMemo(
    () => new Map(categories.map((c) => [c.id, c])),
    [categories]
  );
  const clientMap = useMemo(
    () => new Map(clients.map((c) => [c.id, c])),
    [clients]
  );
  const teamMap = useMemo(
    () => new Map(teams.map((t) => [t.id, t])),
    [teams]
  );

  // ─── Grouping logic ──────────────────────────────────────────────────

  const groupedData = useMemo(() => {
    if (groupBy === "none") {
      return { groups: [] };
    }

    const groupMap = new Map<string, TimeEntry[]>();

    filteredEntries.forEach((entry) => {
      let groupKeys: { key: string; label: string; color?: string }[] = [];

      switch (groupBy) {
        case "member": {
          const member = memberMap.get(entry.userId);
          groupKeys = [
            {
              key: entry.userId,
              label: member?.name ?? "Nieznany użytkownik",
            },
          ];
          break;
        }
        case "project": {
          if (entry.projectId) {
            const project = projectMap.get(entry.projectId);
            groupKeys = [
              {
                key: entry.projectId,
                label: project?.name ?? "Nieznany projekt",
                color: project?.color,
              },
            ];
          } else {
            groupKeys = [{ key: "__no_project__", label: "Brak projektu" }];
          }
          break;
        }
        case "client": {
          const project = entry.projectId
            ? projectMap.get(entry.projectId)
            : null;
          if (project?.clientId) {
            const client = clientMap.get(project.clientId);
            groupKeys = [
              {
                key: project.clientId,
                label: client?.name ?? "Nieznany klient",
              },
            ];
          } else {
            groupKeys = [{ key: "__no_client__", label: "Brak klienta" }];
          }
          break;
        }
        case "team": {
          const member = memberMap.get(entry.userId);
          const teamIds = member?.teamIds ?? [];
          if (teamIds.length === 0) {
            groupKeys = [{ key: "__no_team__", label: "Brak zespołu" }];
          } else {
            groupKeys = teamIds.map((teamId) => {
              const team = teamMap.get(teamId);
              return {
                key: teamId,
                label: team?.name ?? "Nieznany zespół",
              };
            });
          }
          break;
        }
        case "category": {
          if (entry.categoryId) {
            const cat = categoryMap.get(entry.categoryId);
            groupKeys = [
              {
                key: entry.categoryId,
                label: cat?.name ?? "Nieznana kategoria",
                color: cat?.color,
              },
            ];
          } else {
            groupKeys = [{ key: "__no_category__", label: "Brak kategorii" }];
          }
          break;
        }
      }

      // Add entry to each group (for team dimension, entry can be in multiple groups)
      groupKeys.forEach(({ key }) => {
        if (!groupMap.has(key)) {
          groupMap.set(key, []);
        }
        groupMap.get(key)!.push(entry);
      });
    });

    // Convert map to array of GroupedEntry
    const groups: GroupedEntry[] = Array.from(groupMap.entries()).map(
      ([groupKey, entries]) => {
        const totalMinutes = entries.reduce(
          (sum, e) => sum + e.durationMinutes,
          0
        );

        // Get label and color
        let groupLabel = "";
        let groupColor: string | undefined;

        switch (groupBy) {
          case "member":
            groupLabel = memberMap.get(groupKey)?.name ?? "Nieznany użytkownik";
            break;
          case "project":
            if (groupKey === "__no_project__") {
              groupLabel = "Brak projektu";
            } else {
              const project = projectMap.get(groupKey);
              groupLabel = project?.name ?? "Nieznany projekt";
              groupColor = project?.color;
            }
            break;
          case "client":
            if (groupKey === "__no_client__") {
              groupLabel = "Brak klienta";
            } else {
              groupLabel = clientMap.get(groupKey)?.name ?? "Nieznany klient";
            }
            break;
          case "team":
            if (groupKey === "__no_team__") {
              groupLabel = "Brak zespołu";
            } else {
              groupLabel = teamMap.get(groupKey)?.name ?? "Nieznany zespół";
            }
            break;
          case "category":
            if (groupKey === "__no_category__") {
              groupLabel = "Brak kategorii";
            } else {
              const cat = categoryMap.get(groupKey);
              groupLabel = cat?.name ?? "Nieznana kategoria";
              groupColor = cat?.color;
            }
            break;
        }

        return {
          groupKey,
          groupLabel,
          groupColor,
          entries,
          totalMinutes,
          entryCount: entries.length,
        };
      }
    );

    // Sort groups
    groups.sort((a, b) => {
      let comparison = 0;
      if (groupSortBy === "name") {
        comparison = a.groupLabel.localeCompare(b.groupLabel, "pl");
      } else {
        comparison = a.totalMinutes - b.totalMinutes;
      }
      return groupSortOrder === "asc" ? comparison : -comparison;
    });

    return { groups };
  }, [
    filteredEntries,
    groupBy,
    groupSortBy,
    groupSortOrder,
    memberMap,
    projectMap,
    clientMap,
    teamMap,
    categoryMap,
  ]);

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
      categories,
      teams,
      users: members,
      clients,
    });
    const filename = `raport_${dateRange.start}_${dateRange.end}.csv`;
    downloadCSV(csv, filename);
  }, [filteredEntries, projects, tags, categories, teams, members, clients, dateRange]);

  // ─── Excel export ─────────────────────────────────────────────────────

  const handleExportExcel = useCallback(() => {
    const grouping =
      groupBy !== "none"
        ? { dimension: groupBy, groups: groupedData.groups }
        : undefined;

    const workbook = entriesToExcel(
      filteredEntries,
      { projects, tags, categories, teams, users: members, clients },
      grouping
    );

    const filename = `raport_${dateRange.start}_${dateRange.end}.xlsx`;
    downloadExcel(workbook, filename);
  }, [
    filteredEntries,
    groupedData,
    groupBy,
    projects,
    tags,
    categories,
    teams,
    members,
    clients,
    dateRange,
  ]);

  // ─── Date range label ─────────────────────────────────────────────────

  const dateRangeLabel = useMemo(() => {
    const start = new Date(dateRange.start + "T00:00:00");
    const end = new Date(dateRange.end + "T00:00:00");
    return `${format(start, "d MMM", { locale: pl })} - ${format(end, "d MMM yyyy", { locale: pl })}`;
  }, [dateRange]);

  // ─── Can see member filter ────────────────────────────────────────────

  const canSeeMembers = can("time_entries:all:read") || can("time_entries:assigned_projects:read");

  // ─── GroupedView component ────────────────────────────────────────────

  const GroupedView = ({ groups }: { groups: GroupedEntry[] }) => {
    if (groups.length === 0) {
      return (
        <EmptyState
          icon={BarChart3}
          title="Brak danych do wyświetlenia"
          description="Zmień filtry lub dodaj wpisy czasu."
        />
      );
    }

    return (
      <div className="space-y-4">
        {/* Sorting controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Sortuj grupy:</span>
            <Select
              value={groupSortBy}
              onValueChange={(v) => setGroupSortBy(v as "name" | "duration")}
            >
              <SelectTrigger className="h-8 w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Nazwa</SelectItem>
                <SelectItem value="duration">Czas trwania</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() =>
                setGroupSortOrder((prev) => (prev === "asc" ? "desc" : "asc"))
              }
            >
              <ArrowUpDown className="h-4 w-4" />
            </Button>
            <span className="text-xs">
              ({groupSortOrder === "asc" ? "rosnąco" : "malejąco"})
            </span>
          </div>
          {groupBy === "team" && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Info className="h-3 w-3" />
              <span>
                Przy grupowaniu po zespole suma może przekraczać całkowity czas,
                gdy pracownik należy do wielu zespołów
              </span>
            </div>
          )}
        </div>

        {/* Groups accordion */}
        <Accordion type="multiple" className="space-y-2">
          {groups.map((group) => (
            <AccordionItem
              key={group.groupKey}
              value={group.groupKey}
              className="rounded-md border bg-card"
            >
              <AccordionTrigger className="px-4 hover:no-underline">
                <div className="flex w-full items-center justify-between pr-4">
                  <div className="flex items-center gap-3">
                    {group.groupColor && (
                      <span
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: group.groupColor }}
                      />
                    )}
                    <span className="font-semibold">{group.groupLabel}</span>
                    <Badge variant="outline">
                      {group.entryCount}{" "}
                      {group.entryCount === 1 ? "wpis" : "wpisów"}
                    </Badge>
                  </div>
                  <span className="font-mono font-medium tabular-nums">
                    {formatDuration(group.totalMinutes)}
                  </span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <div className="overflow-x-auto rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>Opis</TableHead>
                        {groupBy !== "member" && (
                          <TableHead>Użytkownik</TableHead>
                        )}
                        {groupBy !== "project" && <TableHead>Projekt</TableHead>}
                        {groupBy !== "client" && <TableHead>Klient</TableHead>}
                        <TableHead>Start</TableHead>
                        <TableHead>Koniec</TableHead>
                        <TableHead>Czas</TableHead>
                        <TableHead>Rozliczalny</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {group.entries.map((entry) => {
                        const user = memberMap.get(entry.userId);
                        const project = entry.projectId
                          ? projectMap.get(entry.projectId)
                          : null;
                        const client =
                          project?.clientId
                            ? clientMap.get(project.clientId)
                            : null;

                        return (
                          <TableRow key={entry.id}>
                            <TableCell className="whitespace-nowrap">
                              {format(new Date(entry.date + "T00:00:00"), "d MMM yyyy", {
                                locale: pl,
                              })}
                            </TableCell>
                            <TableCell>
                              {entry.description || (
                                <span className="italic text-muted-foreground">
                                  Bez opisu
                                </span>
                              )}
                            </TableCell>
                            {groupBy !== "member" && (
                              <TableCell className="whitespace-nowrap">
                                {user?.name ?? "—"}
                              </TableCell>
                            )}
                            {groupBy !== "project" && (
                              <TableCell className="whitespace-nowrap">
                                {project ? (
                                  <div className="flex items-center gap-1.5">
                                    <span
                                      className="h-2 w-2 rounded-full"
                                      style={{ backgroundColor: project.color }}
                                    />
                                    {project.name}
                                  </div>
                                ) : (
                                  <span className="text-muted-foreground">—</span>
                                )}
                              </TableCell>
                            )}
                            {groupBy !== "client" && (
                              <TableCell className="whitespace-nowrap">
                                {client?.name ?? (
                                  <span className="text-muted-foreground">—</span>
                                )}
                              </TableCell>
                            )}
                            <TableCell className="whitespace-nowrap font-mono text-xs">
                              {entry.startTime}
                            </TableCell>
                            <TableCell className="whitespace-nowrap font-mono text-xs">
                              {entry.endTime}
                            </TableCell>
                            <TableCell className="whitespace-nowrap font-mono tabular-nums">
                              {formatDuration(entry.durationMinutes)}
                            </TableCell>
                            <TableCell>
                              {entry.billable ? (
                                <Badge variant="default" className="text-xs">
                                  Tak
                                </Badge>
                              ) : (
                                <Badge variant="secondary" className="text-xs">
                                  Nie
                                </Badge>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    );
  };

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
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-7">
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
              <Label className="text-xs">Zespol</Label>
              <Select value={teamFilter} onValueChange={setTeamFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Wszystkie zespoly</SelectItem>
                  {teams.map((team) => (
                    <SelectItem key={team.id} value={team.id}>
                      {team.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

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

            {/* Group By filter */}
            <div className="space-y-1.5">
              <Label className="text-xs">Grupuj według</Label>
              <Select
                value={groupBy}
                onValueChange={(v) => setGroupBy(v as GroupByDimension)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Brak</SelectItem>
                  <SelectItem value="member">Pracownik</SelectItem>
                  <SelectItem value="client">Klient</SelectItem>
                  <SelectItem value="project">Projekt</SelectItem>
                  <SelectItem value="team">Zespół</SelectItem>
                  <SelectItem value="category">Kategoria</SelectItem>
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
            <div className="flex gap-2">
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
              <Button
                size="sm"
                className="gap-1.5"
                onClick={handleExportExcel}
                disabled={filteredEntries.length === 0}
              >
                <Download className="h-3.5 w-3.5" />
                Eksportuj XLS
              </Button>
            </div>
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
          ) : groupBy !== "none" ? (
            <GroupedView groups={groupedData.groups} />
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
