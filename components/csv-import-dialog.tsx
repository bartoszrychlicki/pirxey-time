"use client";

import { useCallback, useRef, useState } from "react";
import { AlertCircle, Download, FileUp, Upload } from "lucide-react";
import { toast } from "sonner";
import { v4 as uuid } from "uuid";

import type { CreateTimeEntry, TimeEntry } from "@/lib/types";
import { parseCSV, downloadCSVTemplate } from "@/lib/csv";
import {
  validateCSVImport,
  validateCSVHeaders,
  type ImportValidationResult,
} from "@/lib/csv-import";
import { formatDuration } from "@/lib/format";
import { useProjects } from "@/hooks/use-projects";
import { useTags } from "@/hooks/use-tags";
import { useAuth } from "@/hooks/use-auth";
import { SEED_IDS } from "@/lib/seed";
import { getStorage } from "@/lib/storage";
import { COLLECTIONS } from "@/lib/constants";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

type Step = "upload" | "preview" | "errors";

interface CSVImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CSVImportDialog({ open, onOpenChange }: CSVImportDialogProps) {
  const { user } = useAuth();
  const { projects } = useProjects();
  const { tags } = useTags();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<Step>("upload");
  const [result, setResult] = useState<ImportValidationResult | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [fileName, setFileName] = useState("");

  const reset = useCallback(() => {
    setStep("upload");
    setResult(null);
    setFileName("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  const handleClose = (open: boolean) => {
    if (!open) reset();
    onOpenChange(open);
  };

  const handleFileSelect = async (file: File) => {
    if (!user) return;
    setFileName(file.name);

    const text = await file.text();

    // Check headers first
    const lines = text.replace(/^\uFEFF/, "").split(/\r?\n/).filter((l) => l.trim());
    if (lines.length === 0) {
      toast.error("Plik jest pusty");
      return;
    }

    const headerErrors = validateCSVHeaders(lines[0]);
    if (headerErrors.length > 0) {
      setResult({
        valid: false,
        entries: [],
        errors: headerErrors.map((msg, i) => ({ row: 1, field: "Naglowek", message: msg })),
        summary: { totalEntries: 0, totalMinutes: 0, byProject: [] },
      });
      setStep("errors");
      return;
    }

    const rows = parseCSV(text);
    if (rows.length === 0) {
      toast.error("Plik nie zawiera danych (tylko naglowki)");
      return;
    }

    const validation = validateCSVImport(
      rows,
      projects,
      tags,
      user.id,
      SEED_IDS.WORKSPACE_ID,
    );

    setResult(validation);
    setStep(validation.valid ? "preview" : "errors");
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.name.endsWith(".csv")) {
      handleFileSelect(file);
    } else {
      toast.error("Wybierz plik CSV");
    }
  };

  const handleImport = async () => {
    if (!result || !result.valid || !user) return;
    setIsImporting(true);

    try {
      const now = new Date().toISOString();
      const storage = getStorage();
      const entries: TimeEntry[] = result.entries.map((e) => ({
        ...e,
        id: uuid(),
        createdAt: now,
        updatedAt: now,
      }));

      await storage.bulkCreate(COLLECTIONS.TIME_ENTRIES, entries);

      // Emit storage change event to refresh UI
      window.dispatchEvent(
        new CustomEvent("pirxey_storage_change", {
          detail: { collection: "time_entries" },
        }),
      );

      toast.success(`Zaimportowano ${entries.length} wpisow`, {
        description: `Laczny czas: ${formatDuration(result.summary.totalMinutes)}`,
      });

      handleClose(false);
    } catch {
      toast.error("Blad podczas importu");
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {step === "upload" && "Importuj wpisy z CSV"}
            {step === "preview" && "Podsumowanie importu"}
            {step === "errors" && "Bledy w pliku CSV"}
          </DialogTitle>
        </DialogHeader>

        {/* ── Step 1: Upload ──────────────────────────────────────── */}
        {step === "upload" && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Pobierz szablon CSV, wypelnij go swoimi danymi, a nastepnie
              zaimportuj wpisy.
            </p>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={downloadCSVTemplate}
              >
                <Download className="h-4 w-4" />
                Pobierz szablon CSV
              </Button>
              <a
                href="/csv-import-instrukcja.md"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-primary underline-offset-4 hover:underline"
              >
                Instrukcje jak wypelniac szablon
              </a>
            </div>

            <p className="text-xs text-muted-foreground">
              Mozesz uzyc AI (np. ChatGPT, Claude) do wypelnienia szablonu
              &mdash; po prostu wyslij mu{" "}
              <a
                href="/csv-import-instrukcja.md"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline-offset-4 hover:underline"
              >
                instrukcje
              </a>{" "}
              razem z opisem swoich wpisow.
            </p>

            <div
              className={cn(
                "flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-border/80 p-8 text-center transition-colors",
                "hover:border-primary/50 hover:bg-muted/30",
              )}
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  fileInputRef.current?.click();
                }
              }}
            >
              <FileUp className="h-8 w-8 text-muted-foreground/60" />
              <div>
                <p className="text-sm font-medium">
                  Przeciagnij plik CSV lub kliknij, aby wybrac
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Wymagane kolumny: Opis, Projekt, Data, Start, Koniec
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileSelect(file);
                }}
              />
            </div>
          </div>
        )}

        {/* ── Step 2a: Errors ─────────────────────────────────────── */}
        {step === "errors" && result && (
          <div className="space-y-4">
            <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
              <div className="text-sm">
                <p className="font-medium text-destructive">
                  Znaleziono {result.errors.length} {result.errors.length === 1 ? "blad" : "bledow"} w pliku
                  {fileName && <> &quot;{fileName}&quot;</>}
                </p>
                <p className="mt-1 text-muted-foreground">
                  Popraw plik i sprobuj ponownie. Zaden wpis nie zostal zaimportowany.
                </p>
              </div>
            </div>

            <ScrollArea className="max-h-[300px]">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs text-muted-foreground">
                    <th className="pb-2 pr-3">Wiersz</th>
                    <th className="pb-2 pr-3">Pole</th>
                    <th className="pb-2">Blad</th>
                  </tr>
                </thead>
                <tbody>
                  {result.errors.map((err, i) => (
                    <tr key={i} className="border-b border-border/40">
                      <td className="py-2 pr-3 font-mono text-xs">{err.row}</td>
                      <td className="py-2 pr-3 font-medium">{err.field}</td>
                      <td className="py-2 text-muted-foreground">{err.message}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </ScrollArea>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={reset}>
                Wybierz inny plik
              </Button>
            </div>
          </div>
        )}

        {/* ── Step 2b: Preview ────────────────────────────────────── */}
        {step === "preview" && result && (
          <div className="space-y-4">
            {/* Summary cards */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border bg-muted/30 p-3 text-center">
                <p className="text-2xl font-semibold">
                  {result.summary.totalEntries}
                </p>
                <p className="text-xs text-muted-foreground">
                  {result.summary.totalEntries === 1 ? "wpis" : "wpisow"}
                </p>
              </div>
              <div className="rounded-lg border bg-muted/30 p-3 text-center">
                <p className="font-mono text-2xl font-semibold">
                  {formatDuration(result.summary.totalMinutes)}
                </p>
                <p className="text-xs text-muted-foreground">laczny czas</p>
              </div>
            </div>

            {/* Project breakdown */}
            {result.summary.byProject.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-xs font-semibold text-muted-foreground">
                  Podzial na projekty
                </p>
                {result.summary.byProject.map((p) => (
                  <div
                    key={p.name}
                    className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
                  >
                    <span className="flex items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: p.color }}
                      />
                      {p.name}
                      <span className="text-xs text-muted-foreground">
                        ({p.count} {p.count === 1 ? "wpis" : "wpisow"})
                      </span>
                    </span>
                    <span className="font-mono text-sm font-medium">
                      {formatDuration(p.minutes)}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Entry list preview */}
            <ScrollArea className="max-h-[200px]">
              <div className="space-y-1">
                {result.entries.map((entry, i) => {
                  const project = projects.find((p) => p.id === entry.projectId);
                  return (
                    <div
                      key={i}
                      className="flex items-center gap-2 rounded px-2 py-1.5 text-xs"
                    >
                      <span
                        className="h-2 w-2 shrink-0 rounded-full"
                        style={{ backgroundColor: project?.color ?? "#6B7280" }}
                      />
                      <span className="min-w-0 flex-1 truncate">
                        {entry.description}
                      </span>
                      <span className="shrink-0 text-muted-foreground">
                        {entry.date}
                      </span>
                      <span className="shrink-0 text-muted-foreground">
                        {entry.startTime}-{entry.endTime}
                      </span>
                      <span className="shrink-0 font-mono font-medium">
                        {formatDuration(entry.durationMinutes)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>

            {/* Actions */}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={reset}>
                Anuluj
              </Button>
              <Button
                className="gap-2"
                disabled={isImporting}
                onClick={handleImport}
              >
                <Upload className="h-4 w-4" />
                {isImporting ? "Importowanie..." : "Importuj"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
