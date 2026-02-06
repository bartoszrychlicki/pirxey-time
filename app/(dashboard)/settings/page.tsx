"use client";

import { useEffect, useState } from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
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
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

import { PageTransition } from "@/components/motion";
import { useAuth } from "@/hooks/use-auth";
import { useSettings } from "@/hooks/use-settings";
import { useProjects } from "@/hooks/use-projects";
import { useTags } from "@/hooks/use-tags";
import { usePermissions } from "@/hooks/use-permissions";
import { RequirePermission } from "@/lib/rbac/guards";
import type { Theme } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
  const { user } = useAuth();
  const { settings, isLoading, update } = useSettings();
  const { projects } = useProjects();
  const { tags } = useTags();
  const { can } = usePermissions();
  const { theme, setTheme } = useTheme();

  // Local form state
  const [defaultProjectId, setDefaultProjectId] = useState<string | null>(null);
  const [defaultTagIds, setDefaultTagIds] = useState<string[]>([]);
  const [defaultDurationMinutes, setDefaultDurationMinutes] = useState(60);
  const [defaultStartTime, setDefaultStartTime] = useState("09:00");
  const [workspaceName, setWorkspaceName] = useState("");
  const [workspaceCurrency, setWorkspaceCurrency] = useState("PLN");
  const [workspaceTimezone, setWorkspaceTimezone] = useState("Europe/Warsaw");
  const [isPending, setIsPending] = useState(false);

  // Sync settings to local state
  useEffect(() => {
    if (settings) {
      setDefaultProjectId(settings.defaultProjectId ?? null);
      setDefaultTagIds(settings.defaultTagIds ?? []);
      setDefaultDurationMinutes(settings.defaultDurationMinutes ?? 60);
      setDefaultStartTime(settings.defaultStartTime ?? "09:00");
    }
  }, [settings]);

  const handleSave = async () => {
    setIsPending(true);
    try {
      await update({
        defaultProjectId,
        defaultTagIds,
        defaultDurationMinutes,
        defaultStartTime,
        theme: theme as Theme,
      });
      toast.success("Ustawienia zapisane.");
    } catch {
      toast.error("Nie udalo sie zapisac ustawien.");
    } finally {
      setIsPending(false);
    }
  };

  const handleTagToggle = (tagId: string) => {
    setDefaultTagIds((prev) =>
      prev.includes(tagId)
        ? prev.filter((id) => id !== tagId)
        : [...prev, tagId],
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-48" />
        <Skeleton className="h-48" />
      </div>
    );
  }

  return (
    <PageTransition>
    <div className="space-y-6 p-6 max-w-2xl">
      <h1 className="text-2xl font-bold">Ustawienia</h1>

      {/* Profile section */}
      <Card>
        <CardHeader>
          <CardTitle>Profil</CardTitle>
          <CardDescription>Twoje dane uzytkownika.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Imie i nazwisko</Label>
            <Input value={user?.name ?? ""} disabled />
          </div>
          <div className="space-y-2">
            <Label>E-mail</Label>
            <Input value={user?.email ?? ""} disabled />
          </div>
        </CardContent>
      </Card>

      {/* Default values section */}
      <Card>
        <CardHeader>
          <CardTitle>Domyslne wartosci</CardTitle>
          <CardDescription>
            Wartosci wstepnie ustawione przy tworzeniu nowych wpisow.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Default project */}
          <div className="space-y-2">
            <Label>Domyslny projekt</Label>
            <Select
              value={defaultProjectId ?? "__none__"}
              onValueChange={(v) =>
                setDefaultProjectId(v === "__none__" ? null : v)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Brak" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">Brak</SelectItem>
                {projects
                  .filter((p) => p.active)
                  .map((p) => (
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

          {/* Default tags */}
          <div className="space-y-2">
            <Label>Domyslne tagi</Label>
            <div className="flex flex-wrap gap-2">
              {tags
                .filter((t) => t.active)
                .map((tag) => {
                  const selected = defaultTagIds.includes(tag.id);
                  return (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => handleTagToggle(tag.id)}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                        selected
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border text-muted-foreground hover:bg-muted",
                      )}
                    >
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: tag.color }}
                      />
                      {tag.name}
                    </button>
                  );
                })}
              {tags.filter((t) => t.active).length === 0 && (
                <p className="text-sm text-muted-foreground">Brak dostepnych tagow.</p>
              )}
            </div>
          </div>

          {/* Default duration */}
          <div className="space-y-2">
            <Label htmlFor="default-duration">
              Domyslny czas trwania (minuty)
            </Label>
            <Input
              id="default-duration"
              type="number"
              min={1}
              value={defaultDurationMinutes}
              onChange={(e) =>
                setDefaultDurationMinutes(parseInt(e.target.value, 10) || 60)
              }
            />
          </div>

          {/* Default start time */}
          <div className="space-y-2">
            <Label htmlFor="default-start">
              Domyslna godzina rozpoczecia
            </Label>
            <Input
              id="default-start"
              type="time"
              value={defaultStartTime}
              onChange={(e) => setDefaultStartTime(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Appearance section */}
      <Card>
        <CardHeader>
          <CardTitle>Wyglad</CardTitle>
          <CardDescription>Motyw interfejsu.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Button
              variant={theme === "light" ? "default" : "outline"}
              onClick={() => setTheme("light")}
              className="flex-1"
            >
              <Sun className="mr-2 h-4 w-4" />
              Jasny
            </Button>
            <Button
              variant={theme === "dark" ? "default" : "outline"}
              onClick={() => setTheme("dark")}
              className="flex-1"
            >
              <Moon className="mr-2 h-4 w-4" />
              Ciemny
            </Button>
            <Button
              variant={theme === "system" ? "default" : "outline"}
              onClick={() => setTheme("system")}
              className="flex-1"
            >
              <Monitor className="mr-2 h-4 w-4" />
              System
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Workspace section (ADMIN only) */}
      <RequirePermission permission="settings:workspace">
        <Card>
          <CardHeader>
            <CardTitle>Workspace</CardTitle>
            <CardDescription>
              Ustawienia przestrzeni roboczej (tylko dla administratorow).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="ws-name">Nazwa workspace</Label>
              <Input
                id="ws-name"
                value={workspaceName}
                onChange={(e) => setWorkspaceName(e.target.value)}
                placeholder="Moja firma"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ws-currency">Waluta</Label>
              <Input
                id="ws-currency"
                value={workspaceCurrency}
                onChange={(e) => setWorkspaceCurrency(e.target.value)}
                placeholder="PLN"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ws-timezone">Strefa czasowa</Label>
              <Input
                id="ws-timezone"
                value={workspaceTimezone}
                onChange={(e) => setWorkspaceTimezone(e.target.value)}
                placeholder="Europe/Warsaw"
              />
            </div>
          </CardContent>
        </Card>
      </RequirePermission>

      {/* Save button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isPending}>
          {isPending ? "Zapisywanie..." : "Zapisz ustawienia"}
        </Button>
      </div>
    </div>
    </PageTransition>
  );
}
