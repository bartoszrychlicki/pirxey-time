"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Clock,
  Hash,
  Plus,
  Trash2,
  UserPlus,
  Users,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";

import { useProjects } from "@/hooks/use-projects";
import { useClients } from "@/hooks/use-clients";
import { useMembers } from "@/hooks/use-members";
import { useTimeEntries } from "@/hooks/use-time-entries";
import { usePermissions } from "@/hooks/use-permissions";
import { useAuth } from "@/hooks/use-auth";
import { ProjectForm, type ProjectFormValues } from "@/components/project-form";
import { formatDuration } from "@/lib/format";
import type { Project } from "@/lib/types";

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const { projects, isLoading: projectsLoading, update } = useProjects();
  const { clients } = useClients();
  const { members } = useMembers();
  const { entries } = useTimeEntries();
  const { can } = usePermissions();
  const { user } = useAuth();

  const [isPending, setIsPending] = useState(false);
  const [memberToAdd, setMemberToAdd] = useState<string>("");
  const [memberToRemove, setMemberToRemove] = useState<string | null>(null);

  const isAdmin = can("team:write");

  const project = useMemo(
    () => projects.find((p) => p.id === projectId),
    [projects, projectId],
  );

  const clientName = useMemo(() => {
    if (!project?.clientId) return null;
    return clients.find((c) => c.id === project.clientId)?.name ?? null;
  }, [project, clients]);

  // Admin can manage all projects, manager only projects they're assigned to
  const canManageMembers = useMemo(() => {
    if (isAdmin) return true;
    if (!project || !user) return false;
    return can("projects:manage_members") && project.assignedMemberIds.includes(user.id);
  }, [isAdmin, project, user, can]);

  // Members assigned to this project
  const assignedMembers = useMemo(() => {
    if (!project) return [];
    return members.filter((m) => project.assignedMemberIds.includes(m.id));
  }, [project, members]);

  // Members NOT assigned (for the "add" dropdown)
  const availableMembers = useMemo(() => {
    if (!project) return [];
    const assigned = new Set(project.assignedMemberIds);
    return members.filter((m) => !assigned.has(m.id));
  }, [project, members]);

  // Stats
  const projectEntries = useMemo(
    () => entries.filter((e) => e.projectId === projectId),
    [entries, projectId],
  );

  const totalMinutes = useMemo(
    () => projectEntries.reduce((sum, e) => sum + e.durationMinutes, 0),
    [projectEntries],
  );

  const hoursPerMember = useMemo(() => {
    const map = new Map<string, number>();
    projectEntries.forEach((e) => {
      map.set(e.userId, (map.get(e.userId) ?? 0) + e.durationMinutes);
    });
    return Array.from(map.entries()).map(([userId, minutes]) => ({
      member: members.find((m) => m.id === userId),
      minutes,
    }));
  }, [projectEntries, members]);

  const handleAddMember = useCallback(async () => {
    if (!project || !memberToAdd) return;
    try {
      await update(project.id, {
        assignedMemberIds: [...project.assignedMemberIds, memberToAdd],
      });
      toast.success("Dodano czlonka do projektu.");
      setMemberToAdd("");
    } catch {
      toast.error("Nie udalo sie dodac czlonka.");
    }
  }, [project, memberToAdd, update]);

  const handleRemoveMember = useCallback(async () => {
    if (!project || !memberToRemove) return;
    try {
      await update(project.id, {
        assignedMemberIds: project.assignedMemberIds.filter(
          (id) => id !== memberToRemove,
        ),
      });
      toast.success("Usunieto czlonka z projektu.");
    } catch {
      toast.error("Nie udalo sie usunac czlonka.");
    } finally {
      setMemberToRemove(null);
    }
  }, [project, memberToRemove, update]);

  const handleSettingsSave = async (values: ProjectFormValues) => {
    if (!project) return;
    setIsPending(true);
    try {
      await update(project.id, {
        name: values.name,
        color: values.color,
        clientId: values.clientId ?? null,
        billableByDefault: values.billableByDefault,
        billableRate: values.billableRate ?? null,
        isPublic: values.isPublic,
      });
      toast.success("Ustawienia projektu zapisane.");
    } catch {
      toast.error("Nie udalo sie zapisac ustawien.");
    } finally {
      setIsPending(false);
    }
  };

  if (projectsLoading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <p className="text-lg font-medium text-muted-foreground">
          Projekt nie zostal znaleziony.
        </p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => router.push("/projects")}
        >
          Wroc do projektow
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Back + header */}
      <div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/projects")}
          className="mb-2"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Projekty
        </Button>

        <div className="flex items-center gap-3">
          <div
            className="h-4 w-4 rounded-full"
            style={{ backgroundColor: project.color }}
          />
          <h1 className="text-2xl font-bold">{project.name}</h1>
          <Badge variant={project.active ? "default" : "secondary"}>
            {project.active ? "Aktywny" : "Zarchiwizowany"}
          </Badge>
        </div>
        {clientName && (
          <p className="mt-1 text-sm text-muted-foreground">{clientName}</p>
        )}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="members">
        <TabsList>
          <TabsTrigger value="members">Czlonkowie</TabsTrigger>
          <TabsTrigger value="stats">Statystyki</TabsTrigger>
          <TabsTrigger value="settings">Ustawienia</TabsTrigger>
        </TabsList>

        {/* Members tab */}
        <TabsContent value="members" className="space-y-4 mt-4">
          {canManageMembers && availableMembers.length > 0 && (
            <div className="flex items-end gap-2">
              <div className="flex-1 max-w-xs">
                <Select
                  value={memberToAdd}
                  onValueChange={setMemberToAdd}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Wybierz czlonka..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableMembers.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.name} ({m.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleAddMember} disabled={!memberToAdd}>
                <UserPlus className="mr-2 h-4 w-4" />
                Dodaj
              </Button>
            </div>
          )}

          {assignedMembers.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-center">
              <Users className="h-10 w-10 text-muted-foreground/50" />
              <p className="mt-3 text-muted-foreground">
                Brak przypisanych czlonkow.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {assignedMembers.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-medium">
                      {member.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()
                        .slice(0, 2)}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{member.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {member.email}
                      </p>
                    </div>
                  </div>
                  {canManageMembers && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive"
                      onClick={() => setMemberToRemove(member.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Stats tab */}
        <TabsContent value="stats" className="space-y-4 mt-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center gap-2 space-y-0 pb-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-sm font-medium">
                  Laczny czas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  {formatDuration(totalMinutes)}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center gap-2 space-y-0 pb-2">
                <Hash className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-sm font-medium">
                  Liczba wpisow
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{projectEntries.length}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center gap-2 space-y-0 pb-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-sm font-medium">
                  Czlonkowie
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  {project.assignedMemberIds.length}
                </p>
              </CardContent>
            </Card>
          </div>

          {hoursPerMember.length > 0 && (
            <>
              <Separator />
              <h3 className="text-sm font-medium text-muted-foreground">
                Czas na czlonka
              </h3>
              <div className="space-y-2">
                {hoursPerMember
                  .sort((a, b) => b.minutes - a.minutes)
                  .map(({ member, minutes }) => (
                    <div
                      key={member?.id ?? "unknown"}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <span className="text-sm font-medium">
                        {member?.name ?? "Nieznany uzytkownik"}
                      </span>
                      <span className="text-sm text-muted-foreground font-mono">
                        {formatDuration(minutes)}
                      </span>
                    </div>
                  ))}
              </div>
            </>
          )}

          {projectEntries.length === 0 && (
            <div className="flex flex-col items-center py-12 text-center">
              <Clock className="h-10 w-10 text-muted-foreground/50" />
              <p className="mt-3 text-muted-foreground">
                Brak zarejestrowanego czasu dla tego projektu.
              </p>
            </div>
          )}
        </TabsContent>

        {/* Settings tab */}
        <TabsContent value="settings" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Ustawienia projektu</CardTitle>
            </CardHeader>
            <CardContent>
              <ProjectForm
                project={project}
                onSubmit={handleSettingsSave}
                isPending={isPending}
                submitLabel="Zapisz zmiany"
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Remove member confirmation */}
      <AlertDialog
        open={!!memberToRemove}
        onOpenChange={(open) => !open && setMemberToRemove(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Usunac czlonka z projektu?</AlertDialogTitle>
            <AlertDialogDescription>
              Czlonek zostanie usuniety z tego projektu. Moze zostac dodany
              ponownie pozniej.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Anuluj</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemoveMember}>
              Usun
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
