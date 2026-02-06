"use client";

import { useMemo, useState } from "react";
import {
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Tags as TagsIcon,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
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
import { useTags } from "@/hooks/use-tags";
import { useTimeEntries } from "@/hooks/use-time-entries";
import { usePermissions } from "@/hooks/use-permissions";
import { RequirePermission } from "@/lib/rbac/guards";
import { TagForm, type TagFormValues } from "@/components/tag-form";
import { SEED_IDS } from "@/lib/seed";
import type { Tag } from "@/lib/types";

export default function TagsPage() {
  const { tags, isLoading, create, update, remove } = useTags();
  const { entries } = useTimeEntries();
  const { can } = usePermissions();

  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [editTag, setEditTag] = useState<Tag | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  const canWrite = can("tags:write");

  // Count entries per tag
  const usageCounts = useMemo(() => {
    const map = new Map<string, number>();
    entries.forEach((e) => {
      e.tagIds.forEach((tagId) => {
        map.set(tagId, (map.get(tagId) ?? 0) + 1);
      });
    });
    return map;
  }, [entries]);

  const filtered = useMemo(() => {
    if (!search.trim()) return tags;
    const q = search.toLowerCase();
    return tags.filter((t) => t.name.toLowerCase().includes(q));
  }, [tags, search]);

  const handleCreate = async (values: TagFormValues) => {
    setIsPending(true);
    try {
      await create({
        workspaceId: SEED_IDS.WORKSPACE_ID,
        name: values.name,
        color: values.color,
        active: true,
      });
      toast.success("Tag utworzony.");
      setCreateOpen(false);
    } catch {
      toast.error("Nie udalo sie utworzyc tagu.");
    } finally {
      setIsPending(false);
    }
  };

  const handleEdit = async (values: TagFormValues) => {
    if (!editTag) return;
    setIsPending(true);
    try {
      await update(editTag.id, {
        name: values.name,
        color: values.color,
      });
      toast.success("Tag zaktualizowany.");
      setEditTag(null);
    } catch {
      toast.error("Nie udalo sie zaktualizowac tagu.");
    } finally {
      setIsPending(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await remove(deleteId);
      toast.success("Tag usuniety.");
    } catch {
      toast.error("Nie udalo sie usunac tagu.");
    } finally {
      setDeleteId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-10 w-48" />
        <CardGridSkeleton count={8} />
      </div>
    );
  }

  return (
    <PageTransition>
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Tagi</h1>
        <RequirePermission permission="tags:write">
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nowy tag
          </Button>
        </RequirePermission>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Szukaj tagow..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Grid or empty state */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={TagsIcon}
          title={search ? "Nie znaleziono tagow" : "Brak tagow"}
          description={
            search
              ? "Sprobuj zmienic fraze wyszukiwania."
              : "Utworz pierwszy tag, aby zaczac."
          }
          action={
            !search && canWrite ? (
              <Button variant="outline" onClick={() => setCreateOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Nowy tag
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {filtered.map((tag) => (
            <Card key={tag.id} className="group">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="flex items-center gap-2">
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: tag.color }}
                  />
                  <span className="font-medium text-sm">{tag.name}</span>
                </div>
                {canWrite && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setEditTag(tag)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Edytuj
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => setDeleteId(tag.id)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Usun
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    {usageCounts.get(tag.id) ?? 0} wpisow
                  </span>
                  <Badge
                    variant={tag.active ? "default" : "secondary"}
                    className="text-xs"
                  >
                    {tag.active ? "Aktywny" : "Nieaktywny"}
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
            <DialogTitle>Nowy tag</DialogTitle>
          </DialogHeader>
          <TagForm
            onSubmit={handleCreate}
            isPending={isPending}
            submitLabel="Utworz tag"
          />
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog
        open={!!editTag}
        onOpenChange={(open) => !open && setEditTag(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edytuj tag</DialogTitle>
          </DialogHeader>
          {editTag && (
            <TagForm
              tag={editTag}
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
            <AlertDialogTitle>Usunac tag?</AlertDialogTitle>
            <AlertDialogDescription>
              Ta operacja jest nieodwracalna. Tag zostanie trwale usuniety.
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
