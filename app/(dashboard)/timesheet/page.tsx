"use client";

import { useCallback, useMemo, useState } from "react";
import {
  startOfWeek,
  endOfWeek,
  addWeeks,
  subWeeks,
  eachDayOfInterval,
  format,
  isWithinInterval,
  isSameWeek,
} from "date-fns";
import { pl } from "date-fns/locale";
import {
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Copy,
  Plus,
} from "lucide-react";
import { toast } from "sonner";

import type { TimeEntry, Project } from "@/lib/types";
import { useTimeEntries } from "@/hooks/use-time-entries";
import { useProjects } from "@/hooks/use-projects";
import { formatDuration, formatDateISO } from "@/lib/format";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from "@/components/ui/table";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EmptyState } from "@/components/empty-state";
import { TableSkeleton } from "@/components/loading-skeleton";
import { PageTransition } from "@/components/motion";

// ─── Polish day abbreviations ───────────────────────────────────────────────

const POLISH_DAY_ABBR = ["Pon", "Wt", "Sr", "Czw", "Pt", "Sob", "Ndz"];

// ─── Helper: duration string from minutes for cells ─────────────────────────

function cellDisplay(minutes: number): string {
  if (minutes === 0) return "";
  return formatDuration(minutes);
}

// ─── Timesheet grid types ───────────────────────────────────────────────────

interface TimesheetRow {
  projectId: string;
  project: Project;
  days: number[]; // 7 elements, minutes per day (Mon-Sun)
  total: number;
}

// ─── Time input popover ─────────────────────────────────────────────────────

function TimeInputPopover({
  projectId,
  projectName,
  date,
  currentMinutes,
  onSave,
}: {
  projectId: string;
  projectName: string;
  date: string;
  currentMinutes: number;
  onSave: (projectId: string, date: string, minutes: number) => void;
}) {
  const [value, setValue] = useState(
    currentMinutes > 0 ? formatDuration(currentMinutes) : ""
  );
  const [open, setOpen] = useState(false);

  const handleSave = () => {
    const parts = value.trim().split(":");
    let minutes = 0;
    if (parts.length === 2) {
      minutes = parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
    } else if (parts.length === 1) {
      const num = parseFloat(parts[0]);
      if (!isNaN(num)) minutes = Math.round(num * 60);
    }
    if (minutes > 0) {
      onSave(projectId, date, minutes);
    }
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className="flex h-8 w-full items-center justify-center rounded text-sm font-mono tabular-nums transition-colors hover:bg-muted/60"
          title={`${projectName} - ${date}`}
        >
          {cellDisplay(currentMinutes)}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-56" align="center">
        <div className="space-y-3">
          <div className="text-xs text-muted-foreground">
            {projectName} &middot; {date}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="time-input" className="text-xs">
              Czas (g:mm lub godziny)
            </Label>
            <Input
              id="time-input"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="1:30"
              className="h-8"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSave();
              }}
            />
          </div>
          <Button size="sm" className="w-full gap-1.5" onClick={handleSave}>
            <Plus className="h-3.5 w-3.5" />
            Dodaj czas
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

// ─── Page component ─────────────────────────────────────────────────────────

export default function TimesheetPage() {
  const { entries, isLoading, create } = useTimeEntries();
  const { projects } = useProjects();

  const [currentDate, setCurrentDate] = useState(() => new Date());

  // Week bounds (Monday start)
  const weekStart = useMemo(
    () => startOfWeek(currentDate, { weekStartsOn: 1 }),
    [currentDate]
  );
  const weekEnd = useMemo(
    () => endOfWeek(currentDate, { weekStartsOn: 1 }),
    [currentDate]
  );
  const weekDays = useMemo(
    () => eachDayOfInterval({ start: weekStart, end: weekEnd }),
    [weekStart, weekEnd]
  );
  const weekDayStrings = useMemo(
    () => weekDays.map((d) => formatDateISO(d)),
    [weekDays]
  );

  const isCurrentWeek = useMemo(
    () => isSameWeek(currentDate, new Date(), { weekStartsOn: 1 }),
    [currentDate]
  );

  // Filter entries for this week
  const weekEntries = useMemo(
    () =>
      entries.filter((e) => {
        const d = new Date(e.date + "T00:00:00");
        return isWithinInterval(d, { start: weekStart, end: weekEnd });
      }),
    [entries, weekStart, weekEnd]
  );

  // Build project map
  const projectMap = useMemo(
    () => new Map(projects.map((p) => [p.id, p])),
    [projects]
  );

  // Build grid rows
  const rows = useMemo<TimesheetRow[]>(() => {
    const projectIds = new Set<string>();
    for (const e of weekEntries) {
      if (e.projectId) projectIds.add(e.projectId);
    }

    return Array.from(projectIds)
      .map((pid) => {
        const project = projectMap.get(pid);
        if (!project) return null;

        const days = weekDayStrings.map((dayStr) =>
          weekEntries
            .filter((e) => e.projectId === pid && e.date === dayStr)
            .reduce((sum, e) => sum + e.durationMinutes, 0)
        );
        const total = days.reduce((s, d) => s + d, 0);

        return { projectId: pid, project, days, total };
      })
      .filter(Boolean) as TimesheetRow[];
  }, [weekEntries, weekDayStrings, projectMap]);

  // Daily totals
  const dailyTotals = useMemo(() => {
    const totals = new Array(7).fill(0) as number[];
    for (const row of rows) {
      for (let i = 0; i < 7; i++) {
        totals[i] += row.days[i];
      }
    }
    return totals;
  }, [rows]);

  const grandTotal = useMemo(
    () => dailyTotals.reduce((s, d) => s + d, 0),
    [dailyTotals]
  );

  // Week range display
  const weekRangeLabel = useMemo(() => {
    const startStr = format(weekStart, "d MMM", { locale: pl });
    const endStr = format(weekEnd, "d MMM yyyy", { locale: pl });
    return `${startStr} - ${endStr}`;
  }, [weekStart, weekEnd]);

  // Navigation
  const goToPreviousWeek = () => setCurrentDate((d) => subWeeks(d, 1));
  const goToNextWeek = () => setCurrentDate((d) => addWeeks(d, 1));
  const goToCurrentWeek = () => setCurrentDate(new Date());

  // Add time for a cell
  const handleAddTime = useCallback(
    async (projectId: string, date: string, minutes: number) => {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      const startTime = "09:00";
      const endH = 9 + hours;
      const endM = mins;
      const endTime = `${String(endH).padStart(2, "0")}:${String(endM).padStart(2, "0")}`;

      await create({
        projectId,
        description: "",
        date,
        startTime,
        endTime,
        durationMinutes: minutes,
        tagIds: [],
        billable: projectMap.get(projectId)?.billableByDefault ?? false,
      });

      toast.success("Czas dodany", {
        description: `${formatDuration(minutes)} do ${projectMap.get(projectId)?.name ?? "projekt"}`,
      });
    },
    [create, projectMap]
  );

  // Copy previous week
  const handleCopyPreviousWeek = useCallback(async () => {
    const prevWeekStart = subWeeks(weekStart, 1);
    const prevWeekEnd = subWeeks(weekEnd, 1);
    const prevEntries = entries.filter((e) => {
      const d = new Date(e.date + "T00:00:00");
      return isWithinInterval(d, { start: prevWeekStart, end: prevWeekEnd });
    });

    if (prevEntries.length === 0) {
      toast.info("Brak wpisow w poprzednim tygodniu do skopiowania");
      return;
    }

    let count = 0;
    for (const entry of prevEntries) {
      const entryDate = new Date(entry.date + "T00:00:00");
      const newDate = addWeeks(entryDate, 1);

      await create({
        projectId: entry.projectId,
        description: entry.description,
        date: formatDateISO(newDate),
        startTime: entry.startTime,
        endTime: entry.endTime,
        durationMinutes: entry.durationMinutes,
        tagIds: [...entry.tagIds],
        billable: entry.billable,
      });
      count++;
    }

    toast.success(`Skopiowano ${count} wpisow z poprzedniego tygodnia`);
  }, [entries, weekStart, weekEnd, create]);

  return (
    <PageTransition>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <CardTitle className="flex items-center gap-2 text-base">
                <CalendarDays className="h-5 w-5" />
                Grafik tygodniowy
              </CardTitle>
              {/* "Kopiuj poprzedni tydzien" button hidden */}
            </div>

            {/* Week navigation */}
            <div className="flex items-center gap-3 pt-2">
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={goToPreviousWeek}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={goToNextWeek}>
                <ChevronRight className="h-4 w-4" />
              </Button>
              {!isCurrentWeek && (
                <Button variant="ghost" size="sm" onClick={goToCurrentWeek}>
                  Ten tydzien
                </Button>
              )}
              <span className="text-sm font-medium">{weekRangeLabel}</span>
            </div>
          </CardHeader>

          <CardContent>
            {isLoading ? (
              <TableSkeleton rows={3} cols={9} />
            ) : rows.length === 0 ? (
              <EmptyState
                icon={CalendarDays}
                title="Brak wpisow w tym tygodniu"
                description="Dodaj wpisy czasu w trackerze lub skopiuj poprzedni tydzien."
              />
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[180px]">Projekt</TableHead>
                      {weekDays.map((day, i) => (
                        <TableHead key={i} className="w-[80px] text-center">
                          <div className="text-xs font-medium">{POLISH_DAY_ABBR[i]}</div>
                          <div className="text-[10px] text-muted-foreground">
                            {format(day, "d.MM")}
                          </div>
                        </TableHead>
                      ))}
                      <TableHead className="w-[80px] text-center font-semibold">
                        Razem
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((row) => (
                      <TableRow key={row.projectId}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span
                              className="h-2.5 w-2.5 shrink-0 rounded-full"
                              style={{ backgroundColor: row.project.color }}
                            />
                            <span className="truncate text-sm font-medium">
                              {row.project.name}
                            </span>
                          </div>
                        </TableCell>
                        {row.days.map((minutes, dayIdx) => (
                          <TableCell key={dayIdx} className="p-1 text-center">
                            <TimeInputPopover
                              projectId={row.projectId}
                              projectName={row.project.name}
                              date={weekDayStrings[dayIdx]}
                              currentMinutes={minutes}
                              onSave={handleAddTime}
                            />
                          </TableCell>
                        ))}
                        <TableCell className="text-center font-mono text-sm font-semibold tabular-nums">
                          {formatDuration(row.total)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                  <TableFooter>
                    <TableRow>
                      <TableCell className="font-semibold">Razem</TableCell>
                      {dailyTotals.map((total, i) => (
                        <TableCell
                          key={i}
                          className="text-center font-mono text-sm font-semibold tabular-nums"
                        >
                          {cellDisplay(total)}
                        </TableCell>
                      ))}
                      <TableCell className="text-center font-mono text-sm font-bold tabular-nums">
                        {formatDuration(grandTotal)}
                      </TableCell>
                    </TableRow>
                  </TableFooter>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PageTransition>
  );
}
