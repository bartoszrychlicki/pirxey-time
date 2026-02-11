"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  FolderKanban,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Archive,
  ArchiveRestore,
  Trash2,
  Users,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

import { EmptyState } from "@/components/empty-state";
import { CardGridSkeleton } from "@/components/loading-skeleton";
import { PageTransition } from "@/components/motion";
import { useProjects } from "@/hooks/use-projects";
import { useClients } from "@/hooks/use-clients";
import { usePermissions } from "@/hooks/use-permissions";
import { ProjectForm, type ProjectFormValues } from "@/components/project-form";
import { SEED_IDS } from "@/lib/seed";

export default function ProjectsPage() {
  const router = useRouter();
  const { projects, isLoading, create, update, remove } = useProjects();
  const { clients } = useClients();
  const { can } = usePermissions();

  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [editProject, setEditProject] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  const canWrite = can("projects:write");

  const clientMap = useMemo(() => {
    const map = new Map<string, string>();
    clients.forEach((c) => map.set(c.id, c.name));
    return map;
  }, [clients]);

  const filtered = useMemo(() => {
    if (!search.trim()) return projects;
    const q = search.toLowerCase();
    return projects.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.clientId && clientMap.get(p.clientId)?.toLowerCase().includes(q)),
    );
  }, [projects, search, clientMap]);

  const editingProject = useMemo(
    () => projects.find((p) => p.id === editProject),
    [projects, editProject],
  );

  const handleCreate = async (values: ProjectFormValues) => {
    setIsPending(true);
    try {
      await create({
        workspaceId: SEED_IDS.WORKSPACE_ID,
        name: values.name,
        color: values.color,
        clientId: values.clientId ?? null,
        billableByDefault: values.billableByDefault,
        billableRate: values.billableRate ?? null,
        estimateType: "NONE",
        estimateValue: null,
        active: true,
        isPublic: values.isPublic,
        assignedMemberIds: [],
      });
      toast.success("Projekt utworzony.");
      setCreateOpen(false);
    } catch {
      toast.error("Nie udalo sie utworzyc projektu.");
    } finally {
      setIsPending(false);
    }
  };

  const handleEdit = async (values: ProjectFormValues) => {
    if (!editProject) return;
    setIsPending(true);
    try {
      await update(editProject, {
        name: values.name,
        color: values.color,
        clientId: values.clientId ?? null,
        billableByDefault: values.billableByDefault,
        billableRate: values.billableRate ?? null,
        isPublic: values.isPublic,
      });
      toast.success("Projekt zaktualizowany.");
      setEditProject(null);
    } catch {
      toast.error("Nie udalo sie zaktualizowac projektu.");
    } finally {
      setIsPending(false);
    }
  };

  const handleToggleArchive = async (id: string, currentActive: boolean) => {
    try {
      await update(id, { active: !currentActive });
      toast.success(currentActive ? "Projekt zarchiwizowany." : "Projekt przywrocony.");
    } catch {
      toast.error("Nie udalo sie zmienic statusu.");
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await remove(deleteId);
      toast.success("Projekt usuniety.");
    } catch {
      toast.error("Nie udalo sie usunac projektu.");
    } finally {
      setDeleteId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-10 w-48" />
        <CardGridSkeleton count={6} />
      </div>
    );
  }

  return (
    <PageTransition>
    <div className="space-y-6 p-6">
      {/* Search and action button */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Szukaj projektow..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        {canWrite && (
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nowy projekt
          </Button>
        )}
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={FolderKanban}
          title={search ? "Nie znaleziono projektow" : "Brak projektow"}
          description={
            search
              ? "Sprobuj zmienic fraze wyszukiwania."
              : "Utworz pierwszy projekt, aby zaczac."
          }
          action={
            !search && canWrite ? (
              <Button variant="outline" onClick={() => setCreateOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Nowy projekt
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((project) => (
            <Card
              key={project.id}
              className="group cursor-pointer transition-shadow hover:shadow-md"
            >
              <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                <div
                  className="flex items-center gap-3 flex-1 min-w-0"
                  onClick={() => router.push(`/projects/${project.id}`)}
                >
                  <div
                    className="h-3 w-3 shrink-0 rounded-full"
                    style={{ backgroundColor: project.color }}
                  />
                  <CardTitle className="text-base truncate">
                    {project.name}
                  </CardTitle>
                </div>
                {canWrite && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => setEditProject(project.id)}
                      >
                        <Pencil className="mr-2 h-4 w-4" />
                        Edytuj
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() =>
                          handleToggleArchive(project.id, project.active)
                        }
                      >
                        {project.active ? (
                          <>
                            <Archive className="mr-2 h-4 w-4" />
                            Archiwizuj
                          </>
                        ) : (
                          <>
                            <ArchiveRestore className="mr-2 h-4 w-4" />
                            Przywroc
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => setDeleteId(project.id)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Usun
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </CardHeader>
              <CardContent
                onClick={() => router.push(`/projects/${project.id}`)}
              >
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  {project.clientId && clientMap.get(project.clientId) && (
                    <span>{clientMap.get(project.clientId)}</span>
                  )}
                  {project.clientId &&
                    clientMap.get(project.clientId) &&
                    project.assignedMemberIds.length > 0 && (
                      <span className="text-muted-foreground/40">|</span>
                    )}
                  {project.assignedMemberIds.length > 0 && (
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {project.assignedMemberIds.length}
                    </span>
                  )}
                </div>
                <div className="mt-2">
                  <Badge variant={project.active ? "default" : "secondary"}>
                    {project.active ? "Aktywny" : "Zarchiwizowany"}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nowy projekt</DialogTitle>
          </DialogHeader>
          <ProjectForm
            onSubmit={handleCreate}
            isPending={isPending}
            submitLabel="Utworz projekt"
          />
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog
        open={!!editProject}
        onOpenChange={(open) => !open && setEditProject(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edytuj projekt</DialogTitle>
          </DialogHeader>
          {editingProject && (
            <ProjectForm
              project={editingProject}
              onSubmit={handleEdit}
              isPending={isPending}
              submitLabel="Zapisz zmiany"
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Usunac projekt?</AlertDialogTitle>
            <AlertDialogDescription>
              Ta operacja jest nieodwracalna. Projekt zostanie trwale usuniety.
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
    </div>
    </PageTransition>
  );
}
