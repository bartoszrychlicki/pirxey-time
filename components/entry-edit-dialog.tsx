"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Tag as TagIcon, Wallet } from "lucide-react";

import type { TimeEntry } from "@/lib/types";
import { useTimeEntries } from "@/hooks/use-time-entries";
import { useProjects } from "@/hooks/use-projects";
import { useTags } from "@/hooks/use-tags";
import {
  formatDateTimeLocal,
  formatDuration,
  parseDurationInput,
  formatDateISO,
} from "@/lib/format";
import { SEED_IDS } from "@/lib/seed";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";

interface EntryEditDialogProps {
  entry: TimeEntry | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function durationToDisplayString(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}:${String(m).padStart(2, "0")}`;
}

export function EntryEditDialog({
  entry,
  open,
  onOpenChange,
}: EntryEditDialogProps) {
  const { update, remove } = useTimeEntries();
  const { projects } = useProjects();
  const { tags } = useTags();

  const [description, setDescription] = useState("");
  const [projectId, setProjectId] = useState("");
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [startValue, setStartValue] = useState("");
  const [endValue, setEndValue] = useState("");
  const [durationInput, setDurationInput] = useState("");
  const [billable, setBillable] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Populate form when entry changes
  useEffect(() => {
    if (!entry) return;
    setDescription(entry.description);
    setProjectId(entry.projectId ?? "");
    setSelectedTagIds([...entry.tagIds]);
    setBillable(entry.billable);
    setDurationInput(durationToDisplayString(entry.durationMinutes));

    // Build datetime-local values from date + time
    const startDt = new Date(`${entry.date}T${entry.startTime}`);
    const endDt = new Date(`${entry.date}T${entry.endTime}`);
    setStartValue(formatDateTimeLocal(startDt));
    setEndValue(formatDateTimeLocal(endDt));
  }, [entry]);

  const handleSave = async () => {
    if (!entry) return;
    setIsSaving(true);

    try {
      const startDate = new Date(startValue);
      const endDate = new Date(endValue);
      const date = formatDateISO(startDate);
      const startTime = `${String(startDate.getHours()).padStart(2, "0")}:${String(startDate.getMinutes()).padStart(2, "0")}`;
      const endTime = `${String(endDate.getHours()).padStart(2, "0")}:${String(endDate.getMinutes()).padStart(2, "0")}`;
      const durationMinutes = Math.max(
        0,
        Math.round((endDate.getTime() - startDate.getTime()) / 60000),
      );

      await update(entry.id, {
        description,
        projectId: projectId || null,
        tagIds: selectedTagIds,
        date,
        startTime,
        endTime,
        durationMinutes,
        billable,
      });
      toast.success("Wpis zaktualizowany");
      onOpenChange(false);
    } catch {
      toast.error("Blad podczas aktualizacji");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!entry) return;
    try {
      await remove(entry.id);
      toast.success("Wpis usuniety");
      onOpenChange(false);
    } catch {
      toast.error("Blad podczas usuwania");
    }
  };

  const handleDurationInput = (value: string) => {
    setDurationInput(value);
    const parsed = parseDurationInput(value);
    if (parsed !== null && parsed > 0) {
      const startDate = new Date(startValue);
      if (!isNaN(startDate.getTime())) {
        const newEnd = new Date(startDate.getTime() + parsed * 60000);
        setEndValue(formatDateTimeLocal(newEnd));
      }
    }
  };

  // Sync duration display from start/end
  useEffect(() => {
    const startDate = new Date(startValue);
    const endDate = new Date(endValue);
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) return;
    const mins = Math.max(0, Math.round((endDate.getTime() - startDate.getTime()) / 60000));
    setDurationInput(durationToDisplayString(mins));
  }, [startValue, endValue]);

  const selectedTags = tags.filter((t) => selectedTagIds.includes(t.id));
  const sortedProjects = [...projects].sort((a, b) =>
    a.name.localeCompare(b.name, "pl"),
  );
  const sortedTags = [...tags].sort((a, b) =>
    a.name.localeCompare(b.name, "pl"),
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edytuj wpis</DialogTitle>
          <DialogDescription>
            Zmien szczegoly wpisu czasu pracy.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Opis pracy</Label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Nad czym pracujesz?"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Projekt</Label>
              <Select value={projectId} onValueChange={setProjectId}>
                <SelectTrigger>
                  <SelectValue placeholder="Wybierz projekt" />
                </SelectTrigger>
                <SelectContent>
                  {sortedProjects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      <span className="flex items-center gap-2">
                        <span
                          className="inline-block h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: p.color }}
                        />
                        {p.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Tagi</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-between">
                    <span className="flex items-center gap-2">
                      <TagIcon className="h-4 w-4" />
                      {selectedTagIds.length
                        ? `Wybrane (${selectedTagIds.length})`
                        : "Wybierz tagi"}
                    </span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="start" className="w-56">
                  <div className="space-y-2">
                    {sortedTags.map((tag) => {
                      const checked = selectedTagIds.includes(tag.id);
                      return (
                        <label
                          key={tag.id}
                          className="flex items-center justify-between rounded-lg border border-border/70 px-3 py-2 text-sm"
                        >
                          <span className="flex items-center gap-2">
                            <span
                              className="h-2.5 w-2.5 rounded-full"
                              style={{ backgroundColor: tag.color }}
                            />
                            {tag.name}
                          </span>
                          <Checkbox
                            checked={checked}
                            onCheckedChange={(v) =>
                              setSelectedTagIds((prev) =>
                                v
                                  ? [...prev, tag.id]
                                  : prev.filter((id) => id !== tag.id),
                              )
                            }
                          />
                        </label>
                      );
                    })}
                  </div>
                </PopoverContent>
              </Popover>
              {selectedTags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {selectedTags.map((tag) => (
                    <Badge key={tag.id} variant="outline" className="gap-1 text-xs">
                      <span
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ backgroundColor: tag.color }}
                      />
                      {tag.name}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label>Start</Label>
              <Input
                type="datetime-local"
                value={startValue}
                onChange={(e) => setStartValue(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Koniec</Label>
              <Input
                type="datetime-local"
                value={endValue}
                onChange={(e) => setEndValue(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Czas trwania</Label>
              <Input
                value={durationInput}
                onChange={(e) => handleDurationInput(e.target.value)}
                placeholder="1:00"
              />
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm font-medium">
            <Switch checked={billable} onCheckedChange={setBillable} />
            <span className="flex items-center gap-1 text-muted-foreground">
              <Wallet className="h-4 w-4" /> Rozliczalne
            </span>
          </label>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-between">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm">
                Usun wpis
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Usunac wpis?</AlertDialogTitle>
                <AlertDialogDescription>
                  Ta operacja jest nieodwracalna. Wpis zostanie trwale usuniety.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Anuluj</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete}>
                  Usun
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Anuluj
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? "Zapisywanie..." : "Zapisz"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
