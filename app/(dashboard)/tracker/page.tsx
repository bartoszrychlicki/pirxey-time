"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Clock, Plus, Upload } from "lucide-react";
import { toast } from "sonner";

import type { TimeEntry } from "@/lib/types";
import { useTimeEntries } from "@/hooks/use-time-entries";
import { useProjects } from "@/hooks/use-projects";
import { useTags } from "@/hooks/use-tags";
import { formatDuration, durationToString } from "@/lib/format";
import { TimeEntryForm } from "@/components/time-entry-form";
import { TimeEntryRow } from "@/components/time-entry-row";
import { TimeEntryContextMenu } from "@/components/time-entry-context-menu";
import { EntryEditDialog } from "@/components/entry-edit-dialog";
import { CSVImportDialog } from "@/components/csv-import-dialog";
import { EmptyState } from "@/components/empty-state";
import { TimeEntryListSkeleton, TimeEntryFormSkeleton } from "@/components/loading-skeleton";
import { PageTransition } from "@/components/motion";
import { Button } from "@/components/ui/button";

// ─── Polish day names for date header ────────────────────────────────────────

const POLISH_DAYS = [
  "Niedziela",
  "Poniedzialek",
  "Wtorek",
  "Sroda",
  "Czwartek",
  "Piatek",
  "Sobota",
];

const POLISH_MONTHS = [
  "stycznia",
  "lutego",
  "marca",
  "kwietnia",
  "maja",
  "czerwca",
  "lipca",
  "sierpnia",
  "wrzesnia",
  "pazdziernika",
  "listopada",
  "grudnia",
];

const POLISH_MONTHS_NOM = [
  "Styczen",
  "Luty",
  "Marzec",
  "Kwiecien",
  "Maj",
  "Czerwiec",
  "Lipiec",
  "Sierpien",
  "Wrzesien",
  "Pazdziernik",
  "Listopad",
  "Grudzien",
];

function formatDateHeader(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00");
  const dayName = POLISH_DAYS[date.getDay()];
  const day = date.getDate();
  const month = POLISH_MONTHS[date.getMonth()];
  const year = date.getFullYear();
  return `${dayName}, ${day} ${month} ${year}`;
}

// ─── Group entries by date ──────────────────────────────────────────────────

interface DateGroup {
  date: string;
  entries: TimeEntry[];
  totalMinutes: number;
}

function groupEntriesByDate(entries: TimeEntry[]): DateGroup[] {
  const groups = new Map<string, TimeEntry[]>();
  for (const entry of entries) {
    const existing = groups.get(entry.date) || [];
    existing.push(entry);
    groups.set(entry.date, existing);
  }
  return Array.from(groups.entries())
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([date, dateEntries]) => ({
      date,
      entries: dateEntries.sort((a, b) => b.startTime.localeCompare(a.startTime)),
      totalMinutes: dateEntries.reduce((sum, e) => sum + e.durationMinutes, 0),
    }));
}

// ─── Page component ─────────────────────────────────────────────────────────

export default function TrackerPage() {
  const { entries, isLoading, duplicate, remove } = useTimeEntries();
  const { projects } = useProjects();
  const { tags } = useTags();

  const [editingEntry, setEditingEntry] = useState<TimeEntry | null>(null);
  const [csvImportOpen, setCsvImportOpen] = useState(false);

  // Month pagination state (year-month)
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });

  const isCurrentMonth =
    currentMonth.year === new Date().getFullYear() &&
    currentMonth.month === new Date().getMonth();

  const monthLabel = `${POLISH_MONTHS_NOM[currentMonth.month]} ${currentMonth.year}`;

  const goToPrevMonth = () =>
    setCurrentMonth((prev) => {
      const m = prev.month - 1;
      return m < 0
        ? { year: prev.year - 1, month: 11 }
        : { year: prev.year, month: m };
    });

  const goToNextMonth = () =>
    setCurrentMonth((prev) => {
      const m = prev.month + 1;
      return m > 11
        ? { year: prev.year + 1, month: 0 }
        : { year: prev.year, month: m };
    });

  const goToCurrentMonth = () => {
    const now = new Date();
    setCurrentMonth({ year: now.getFullYear(), month: now.getMonth() });
  };

  // Filter entries for selected month
  const monthEntries = useMemo(() => {
    const prefix = `${currentMonth.year}-${String(currentMonth.month + 1).padStart(2, "0")}`;
    return entries.filter((e) => e.date.startsWith(prefix));
  }, [entries, currentMonth]);

  const dateGroups = useMemo(() => groupEntriesByDate(monthEntries), [monthEntries]);

  const monthTotalMinutes = useMemo(
    () => monthEntries.reduce((sum, e) => sum + e.durationMinutes, 0),
    [monthEntries],
  );

  const projectMap = useMemo(() => {
    const map = new Map(projects.map((p) => [p.id, p]));
    return map;
  }, [projects]);

  // Listen for "duplicate-last-entry" custom event (from Cmd+D / command palette)
  useEffect(() => {
    const handler = () => {
      if (entries.length === 0) {
        toast.info("Brak wpisow do zduplikowania");
        return;
      }
      // Find most recent entry
      const sorted = [...entries].sort((a, b) => {
        const dateCompare = b.date.localeCompare(a.date);
        if (dateCompare !== 0) return dateCompare;
        return b.startTime.localeCompare(a.startTime);
      });
      handleDuplicate(sorted[0]);
    };
    window.addEventListener("duplicate-last-entry", handler);
    return () => window.removeEventListener("duplicate-last-entry", handler);
  }, [entries]);

  const handleEdit = (entry: TimeEntry) => {
    setEditingEntry(entry);
  };

  const handleDuplicate = async (entry: TimeEntry) => {
    const newEntry = await duplicate(entry);
    if (newEntry) {
      toast.success("Wpis zduplikowany", {
        description: entry.description || "Bez opisu",
      });
    }
  };

  const handleCopyDescription = (entry: TimeEntry) => {
    navigator.clipboard.writeText(entry.description).then(() => {
      toast.success("Opis skopiowany do schowka");
    });
  };

  const handleDelete = async (entry: TimeEntry) => {
    await remove(entry.id);
    toast.success("Wpis usuniety", {
      description: entry.description || "Bez opisu",
    });
  };

  return (
    <PageTransition>
      <div className="space-y-6">
        <TimeEntryForm />

        {/* Month navigation + CSV import */}
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={goToPrevMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={goToNextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            {!isCurrentMonth && (
              <Button variant="ghost" size="sm" onClick={goToCurrentMonth}>
                Biezacy miesiac
              </Button>
            )}
            <span className="text-sm font-medium">{monthLabel}</span>
            {monthEntries.length > 0 && (
              <span className="text-xs text-muted-foreground">
                ({durationToString(monthTotalMinutes)})
              </span>
            )}
          </div>
          <button
            type="button"
            className="flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
            onClick={() => setCsvImportOpen(true)}
          >
            <Upload className="h-3 w-3" />
            Importuj CSV
          </button>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            <TimeEntryListSkeleton count={5} />
          </div>
        ) : monthEntries.length === 0 ? (
          <EmptyState
            icon={Clock}
            title="Brak wpisow czasu"
            description="Zacznij od dodania pierwszego wpisu uzywajac formularza powyzej."
            action={
              <Button
                variant="outline"
                className="gap-2"
                onClick={() => {
                  window.dispatchEvent(new CustomEvent("focus-new-entry"));
                }}
              >
                <Plus className="h-4 w-4" />
                Dodaj wpis
              </Button>
            }
          />
        ) : (
          <div className="space-y-6">
            {dateGroups.map((group) => (
              <div key={group.date}>
                {/* Date header */}
                <div className="mb-2 flex items-center justify-between border-b border-border/60 pb-2">
                  <h3 className="text-sm font-semibold text-foreground">
                    {formatDateHeader(group.date)}
                  </h3>
                  <span className="font-mono text-sm font-medium text-muted-foreground tabular-nums">
                    {durationToString(group.totalMinutes)}
                    {" "}
                    <span className="text-xs">({formatDuration(group.totalMinutes)})</span>
                  </span>
                </div>

                {/* Entries */}
                <div className="space-y-0.5">
                  {group.entries.map((entry) => (
                    <TimeEntryContextMenu
                      key={entry.id}
                      onEdit={() => handleEdit(entry)}
                      onDuplicate={() => handleDuplicate(entry)}
                      onCopyDescription={() => handleCopyDescription(entry)}
                      onDelete={() => handleDelete(entry)}
                    >
                      <TimeEntryRow
                        entry={entry}
                        project={entry.projectId ? projectMap.get(entry.projectId) : null}
                        tags={tags}
                        onClick={() => handleEdit(entry)}
                      />
                    </TimeEntryContextMenu>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        <EntryEditDialog
          entry={editingEntry}
          open={editingEntry !== null}
          onOpenChange={(open) => {
            if (!open) setEditingEntry(null);
          }}
        />

        <CSVImportDialog
          open={csvImportOpen}
          onOpenChange={setCsvImportOpen}
        />
      </div>
    </PageTransition>
  );
}
