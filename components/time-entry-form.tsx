"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Check,
  ChevronDown,
  FolderDot,
  Plus,
  Tag as TagIcon,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";

import { useTimeEntries } from "@/hooks/use-time-entries";
import { useProjects } from "@/hooks/use-projects";
import { useTags } from "@/hooks/use-tags";
import { useSettings } from "@/hooks/use-settings";
import {
  formatDateISO,
  formatDateTimeLocal,
  formatDuration,
  parseDurationInput,
} from "@/lib/format";
import { createTimeEntrySchema } from "@/lib/validation";
import { SEED_IDS } from "@/lib/seed";
import { useAuth } from "@/hooks/use-auth";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

const DURATION_PRESETS = [15, 30, 45, 60, 90, 120, 480];

function getDefaultTimes(durationMinutes = 60) {
  const now = new Date();
  const start = new Date(now.getTime() - durationMinutes * 60000);
  return {
    start: formatDateTimeLocal(start),
    end: formatDateTimeLocal(now),
    durationMinutes,
  };
}

function durationToDisplayString(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}:${String(m).padStart(2, "0")}`;
}

function presetLabel(minutes: number): string {
  if (minutes >= 60) {
    const h = minutes / 60;
    return `${h}h`;
  }
  return `${minutes}m`;
}

export function TimeEntryForm() {
  const { user } = useAuth();
  const { entries, create } = useTimeEntries();
  const { projects } = useProjects();
  const { tags } = useTags();
  const { settings } = useSettings();

  const descriptionRef = useRef<HTMLInputElement>(null);
  const [description, setDescription] = useState("");
  const [projectId, setProjectId] = useState<string>("");
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [dateValue, setDateValue] = useState(() => formatDateISO(new Date()));
  const [startValue, setStartValue] = useState(() => getDefaultTimes().start);
  const [endValue, setEndValue] = useState(() => getDefaultTimes().end);
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [durationInput, setDurationInput] = useState("1:00");
  const [billable, setBillable] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tagsOpen, setTagsOpen] = useState(false);
  const [showAdvancedTime, setShowAdvancedTime] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Apply defaults from settings on first load
  const settingsApplied = useRef(false);
  useEffect(() => {
    if (settings && !settingsApplied.current) {
      settingsApplied.current = true;
      if (settings.defaultProjectId) {
        setProjectId(settings.defaultProjectId);
      }
      if (settings.defaultTagIds.length > 0) {
        setSelectedTagIds(settings.defaultTagIds);
      }
      if (settings.defaultDurationMinutes) {
        const defaults = getDefaultTimes(settings.defaultDurationMinutes);
        setStartValue(defaults.start);
        setEndValue(defaults.end);
        setDurationMinutes(settings.defaultDurationMinutes);
        setDurationInput(durationToDisplayString(settings.defaultDurationMinutes));
      }
    }
  }, [settings]);

  // Auto focus on mount
  useEffect(() => {
    descriptionRef.current?.focus();
  }, []);

  // Listen for global "focus-new-entry" event (from Cmd+N / command palette)
  useEffect(() => {
    const handler = () => {
      descriptionRef.current?.focus();
      descriptionRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    };
    window.addEventListener("focus-new-entry", handler);
    return () => window.removeEventListener("focus-new-entry", handler);
  }, []);

  // Sync duration from start/end
  useEffect(() => {
    const startDate = new Date(startValue);
    const endDate = new Date(endValue);
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) return;
    const mins = Math.max(0, Math.round((endDate.getTime() - startDate.getTime()) / 60000));
    setDurationMinutes(mins);
    setDurationInput(durationToDisplayString(mins));
  }, [startValue, endValue]);

  // Set billable from project
  useEffect(() => {
    const project = projects.find((p) => p.id === projectId);
    if (project) {
      setBillable(project.billableByDefault);
    }
  }, [projectId, projects]);

  // Recent descriptions (unique, last 5)
  const recentDescriptions = useMemo(() => {
    const seen = new Set<string>();
    const result: string[] = [];
    for (const e of entries) {
      if (e.description && !seen.has(e.description)) {
        seen.add(e.description);
        result.push(e.description);
        if (result.length >= 5) break;
      }
    }
    return result;
  }, [entries]);

  // Recent project IDs
  const recentProjectIds = useMemo(() => {
    const seen = new Set<string>();
    const result: string[] = [];
    for (const e of entries) {
      if (e.projectId && !seen.has(e.projectId)) {
        seen.add(e.projectId);
        result.push(e.projectId);
        if (result.length >= 4) break;
      }
    }
    return result;
  }, [entries]);

  const recentProjectSet = useMemo(() => new Set(recentProjectIds), [recentProjectIds]);
  const recentProjects = useMemo(
    () => projects.filter((p) => recentProjectIds.includes(p.id)),
    [projects, recentProjectIds],
  );
  const sortedProjects = useMemo(
    () => [...projects].sort((a, b) => a.name.localeCompare(b.name, "pl")),
    [projects],
  );

  // Recent tag IDs
  const recentTagIds = useMemo(() => {
    const seen = new Set<string>();
    const result: string[] = [];
    for (const e of entries) {
      for (const tid of e.tagIds) {
        if (!seen.has(tid)) {
          seen.add(tid);
          result.push(tid);
          if (result.length >= 4) break;
        }
      }
      if (result.length >= 4) break;
    }
    return result;
  }, [entries]);

  const recentTagSet = useMemo(() => new Set(recentTagIds), [recentTagIds]);
  const recentTags = useMemo(
    () => tags.filter((t) => recentTagIds.includes(t.id)),
    [tags, recentTagIds],
  );
  const sortedTags = useMemo(
    () => [...tags].sort((a, b) => a.name.localeCompare(b.name, "pl")),
    [tags],
  );

  const selectedTags = useMemo(
    () => tags.filter((t) => selectedTagIds.includes(t.id)),
    [tags, selectedTagIds],
  );

  const selectedProject = useMemo(
    () => projects.find((p) => p.id === projectId),
    [projects, projectId],
  );

  const applyDurationMinutes = useCallback(
    (minutes: number) => {
      const startDate = new Date(startValue);
      if (isNaN(startDate.getTime())) return;
      const newEnd = new Date(startDate.getTime() + minutes * 60000);
      setEndValue(formatDateTimeLocal(newEnd));
      setDurationMinutes(minutes);
      setDurationInput(durationToDisplayString(minutes));
    },
    [startValue],
  );

  const handleDurationInput = (value: string) => {
    setDurationInput(value);
    const parsed = parseDurationInput(value);
    if (parsed !== null && parsed > 0) {
      applyDurationMinutes(parsed);
    }
  };

  const resetForm = (keepDefaults: boolean) => {
    setDescription("");
    setErrors({});
    setDateValue(formatDateISO(new Date()));
    if (!keepDefaults) {
      const dur = settings?.defaultDurationMinutes ?? 60;
      const defaults = getDefaultTimes(dur);
      setStartValue(defaults.start);
      setEndValue(defaults.end);
      setDurationMinutes(dur);
      setDurationInput(durationToDisplayString(dur));
    } else {
      const defaults = getDefaultTimes(durationMinutes);
      setStartValue(defaults.start);
      setEndValue(defaults.end);
    }
    descriptionRef.current?.focus();
  };

  const handleSubmit = async (addAnother: boolean) => {
    if (!user) return;
    setErrors({});

    let date: string;
    let startTime: string;
    let endTime: string;

    if (showAdvancedTime) {
      // Use detailed start/end times
      const startDate = new Date(startValue);
      const endDate = new Date(endValue);
      date = formatDateISO(startDate);
      startTime = `${String(startDate.getHours()).padStart(2, "0")}:${String(startDate.getMinutes()).padStart(2, "0")}`;
      endTime = `${String(endDate.getHours()).padStart(2, "0")}:${String(endDate.getMinutes()).padStart(2, "0")}`;
    } else {
      // Use simplified date + duration
      date = dateValue;
      // Use default start time from settings, or 9:00 as fallback
      const defaultStart = settings?.defaultStartTime || "09:00";
      const [startHour, startMin] = defaultStart.split(":").map(Number);
      startTime = defaultStart;

      // Calculate end time from duration
      const endMinutes = startMin + durationMinutes;
      const endHour = startHour + Math.floor(endMinutes / 60);
      const endMin = endMinutes % 60;
      endTime = `${String(endHour).padStart(2, "0")}:${String(endMin).padStart(2, "0")}`;
    }

    const payload = {
      workspaceId: SEED_IDS.WORKSPACE_ID,
      userId: user.id,
      projectId: projectId || null,
      description,
      date,
      startTime,
      endTime,
      durationMinutes,
      tagIds: selectedTagIds,
      billable,
    };

    const result = createTimeEntrySchema.safeParse(payload);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0]?.toString() ?? "form";
        if (!fieldErrors[key]) {
          fieldErrors[key] = issue.message;
        }
      }
      setErrors(fieldErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      const entry = await create(payload);
      if (entry) {
        toast.success("Wpis zapisany", {
          description: `${description} - ${formatDuration(durationMinutes)}`,
          action: {
            label: "Cofnij",
            onClick: async () => {
              const { getStorage } = await import("@/lib/storage");
              const { COLLECTIONS } = await import("@/lib/constants");
              await getStorage().delete(COLLECTIONS.TIME_ENTRIES, entry.id);
              window.dispatchEvent(
                new CustomEvent("pirxey_storage_change", {
                  detail: { collection: "time_entries" },
                }),
              );
              toast.info("Wpis cofniety");
            },
          },
        });
        resetForm(addAnother);
      }
    } catch {
      toast.error("Blad podczas zapisywania wpisu");
    } finally {
      setIsSubmitting(false);
    }
  };

  const duplicateLastEntry = () => {
    if (!entries.length) return;
    const last = entries[0];
    setDescription(last.description);
    setProjectId(last.projectId ?? "");
    setSelectedTagIds([...last.tagIds]);
    setBillable(last.billable);
    applyDurationMinutes(last.durationMinutes || 60);
  };

  // Cmd+Enter to submit
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        handleSubmit(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  });

  const hasErrors = Object.values(errors).some(Boolean);

  return (
    <div className="space-y-2">
      {/* ── Main bar ─────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 rounded-xl border border-border/80 bg-card p-2 shadow-sm">
        {/* Description */}
        <Input
          ref={descriptionRef}
          value={description}
          onChange={(e) => {
            setDescription(e.target.value);
            if (errors.description) {
              setErrors((prev) => ({ ...prev, description: undefined as unknown as string }));
            }
          }}
          placeholder="Nad czym pracujesz?"
          className={cn(
            "min-w-0 flex-1 border-0 bg-transparent shadow-none focus-visible:ring-0",
            errors.description && "placeholder:text-destructive",
          )}
        />

        {/* Project selector (compact) */}
        <Select value={projectId} onValueChange={setProjectId}>
          <SelectTrigger className="h-9 w-auto min-w-[140px] max-w-[200px] gap-1.5 border-0 bg-muted/50 text-xs">
            {selectedProject ? (
              <span className="flex items-center gap-1.5 truncate">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: selectedProject.color }}
                />
                <span className="truncate">{selectedProject.name}</span>
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <FolderDot className="h-3.5 w-3.5" />
                Projekt
              </span>
            )}
          </SelectTrigger>
          <SelectContent>
            {recentProjects.length > 0 && (
              <>
                <div className="px-3 py-1.5 text-xs font-semibold text-muted-foreground">
                  Ostatnio uzywane
                </div>
                {recentProjects.map((p) => (
                  <SelectItem key={`recent-${p.id}`} value={p.id}>
                    <span className="flex items-center gap-2">
                      <span
                        className="inline-block h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: p.color }}
                      />
                      {p.name}
                    </span>
                  </SelectItem>
                ))}
                <div className="mx-2 my-1.5 h-px bg-border" />
              </>
            )}
            {sortedProjects.map((p) => {
              if (recentProjectSet.has(p.id)) return null;
              return (
                <SelectItem key={p.id} value={p.id}>
                  <span className="flex items-center gap-2">
                    <span
                      className="inline-block h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: p.color }}
                    />
                    {p.name}
                  </span>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>

        {/* Tag multi-select (compact) */}
        <Popover open={tagsOpen} onOpenChange={setTagsOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "h-9 gap-1.5 bg-muted/50 px-2.5 text-xs",
                selectedTagIds.length > 0
                  ? "text-foreground"
                  : "text-muted-foreground",
              )}
            >
              <TagIcon className="h-3.5 w-3.5" />
              {selectedTagIds.length > 0 ? (
                <span className="flex items-center gap-1">
                  {selectedTags.slice(0, 2).map((t) => (
                    <span key={t.id} className="flex items-center gap-1">
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: t.color }}
                      />
                      <span className="max-w-[60px] truncate">{t.name}</span>
                    </span>
                  ))}
                  {selectedTagIds.length > 2 && (
                    <span className="text-muted-foreground">
                      +{selectedTagIds.length - 2}
                    </span>
                  )}
                </span>
              ) : (
                "Tagi"
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent
            align="end"
            className="w-56 p-0"
            onFocusOutside={(e) => e.preventDefault()}
            onCloseAutoFocus={(e) => e.preventDefault()}
          >
            <Command>
              <CommandInput placeholder="Szukaj tagu..." className="h-8 text-xs" />
              <CommandList>
                {recentTags.length > 0 && (
                  <>
                    <CommandGroup heading="Ostatnio uzywane">
                      {recentTags.map((tag) => {
                        const checked = selectedTagIds.includes(tag.id);
                        return (
                          <CommandItem
                            key={tag.id}
                            value={tag.name}
                            onSelect={() =>
                              setSelectedTagIds((prev) =>
                                checked
                                  ? prev.filter((id) => id !== tag.id)
                                  : [...prev, tag.id],
                              )
                            }
                          >
                            <span
                              className="h-2.5 w-2.5 shrink-0 rounded-full"
                              style={{ backgroundColor: tag.color }}
                            />
                            <span className="flex-1">{tag.name}</span>
                            {checked && <Check className="h-4 w-4 shrink-0" />}
                          </CommandItem>
                        );
                      })}
                    </CommandGroup>
                    <CommandSeparator />
                  </>
                )}
                <CommandGroup heading={recentTags.length > 0 ? "Wszystkie" : undefined}>
                  {sortedTags.map((tag) => {
                    if (recentTagSet.has(tag.id)) return null;
                    const checked = selectedTagIds.includes(tag.id);
                    return (
                      <CommandItem
                        key={tag.id}
                        value={tag.name}
                        onSelect={() =>
                          setSelectedTagIds((prev) =>
                            checked
                              ? prev.filter((id) => id !== tag.id)
                              : [...prev, tag.id],
                          )
                        }
                      >
                        <span
                          className="h-2.5 w-2.5 shrink-0 rounded-full"
                          style={{ backgroundColor: tag.color }}
                        />
                        <span className="flex-1">{tag.name}</span>
                        {checked && <Check className="h-4 w-4 shrink-0" />}
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
                <CommandEmpty>Brak tagow</CommandEmpty>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        {/* Separator */}
        <div className="h-6 w-px bg-border/60" />

        {/* Simplified: Date only */}
        {!showAdvancedTime ? (
          <Input
            type="date"
            value={dateValue}
            onChange={(e) => setDateValue(e.target.value)}
            className="h-9 w-[150px] shrink-0 border-0 bg-muted/50 text-xs shadow-none"
          />
        ) : (
          <>
            {/* Advanced: Start/End datetimes */}
            <Input
              type="datetime-local"
              value={startValue}
              onChange={(e) => {
                setStartValue(e.target.value);
                if (errors.startTime || errors.endTime) {
                  setErrors((prev) => ({
                    ...prev,
                    startTime: undefined as unknown as string,
                    endTime: undefined as unknown as string,
                  }));
                }
              }}
              className="h-9 w-[155px] shrink-0 border-0 bg-muted/50 text-xs shadow-none"
            />
            <span className="text-xs text-muted-foreground">-</span>
            <Input
              type="datetime-local"
              value={endValue}
              onChange={(e) => {
                setEndValue(e.target.value);
                if (errors.endTime) {
                  setErrors((prev) => ({
                    ...prev,
                    endTime: undefined as unknown as string,
                  }));
                }
              }}
              className="h-9 w-[155px] shrink-0 border-0 bg-muted/50 text-xs shadow-none"
            />
          </>
        )}

        {/* Toggle advanced time button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-9 w-9 shrink-0 text-muted-foreground"
              onClick={() => setShowAdvancedTime(!showAdvancedTime)}
            >
              <ChevronDown
                className={cn(
                  "h-4 w-4 transition-transform",
                  showAdvancedTime && "rotate-180",
                )}
              />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>{showAdvancedTime ? "Ukryj dokładny czas" : "Pokaż dokładny czas"}</p>
          </TooltipContent>
        </Tooltip>

        {/* Separator */}
        <div className="h-6 w-px bg-border/60" />

        {/* Duration */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Input
              value={durationInput}
              onChange={(e) => handleDurationInput(e.target.value)}
              className="h-9 w-[65px] shrink-0 border-0 bg-muted/50 text-center font-mono text-sm font-semibold shadow-none"
            />
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>Wpisz czas: 1:30, 90m, 1.5h</p>
          </TooltipContent>
        </Tooltip>

        {/* Billable toggle */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className={cn(
                "h-9 w-9 shrink-0",
                billable
                  ? "text-primary"
                  : "text-muted-foreground/50",
              )}
              onClick={() => setBillable(!billable)}
            >
              <Wallet className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>{billable ? "Rozliczalne" : "Nierozliczalne"}</p>
          </TooltipContent>
        </Tooltip>

        {/* Submit button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="icon"
              className="h-9 w-9 shrink-0"
              disabled={isSubmitting}
              onClick={() => handleSubmit(false)}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>Dodaj wpis (Cmd+Enter)</p>
          </TooltipContent>
        </Tooltip>
      </div>

      {/* ── Secondary row: recent, presets, shortcut ─────────────── */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 px-2 text-xs">
        {/* Errors */}
        {hasErrors && (
          <div className="flex gap-2 text-destructive">
            {Object.entries(errors)
              .filter(([, v]) => v)
              .map(([k, v]) => (
                <span key={k}>{v}</span>
              ))}
          </div>
        )}

        {/* Recent descriptions (first) */}
        {recentDescriptions.length > 0 && (
          <div className="flex items-center gap-1 text-muted-foreground">
            <span>Ostatnie:</span>
            {recentDescriptions.slice(0, 3).map((d) => (
              <button
                key={d}
                type="button"
                className="max-w-[120px] truncate rounded px-1.5 py-0.5 transition-colors hover:bg-muted hover:text-foreground"
                onClick={() => setDescription(d)}
              >
                {d}
              </button>
            ))}
          </div>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Duration presets (right-aligned, under date fields) */}
        <div className="flex items-center gap-1 text-muted-foreground">
          {DURATION_PRESETS.map((mins) => (
            <button
              key={mins}
              type="button"
              className={cn(
                "rounded px-1.5 py-0.5 transition-colors hover:bg-muted hover:text-foreground",
                durationMinutes === mins && "bg-muted text-foreground font-medium",
              )}
              onClick={() => applyDurationMinutes(mins)}
            >
              {presetLabel(mins)}
            </button>
          ))}
        </div>

        <span className="text-muted-foreground/50">Cmd+Enter</span>
      </div>
    </div>
  );
}
