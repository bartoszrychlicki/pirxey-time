"use client";

import { useMemo, useState } from "react";
import {
  FolderTree,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
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
import { useCategories } from "@/hooks/use-categories";
import { useTimeEntries } from "@/hooks/use-time-entries";
import { usePermissions } from "@/hooks/use-permissions";
import { RequirePermission } from "@/lib/rbac/guards";
import { CategoryForm, type CategoryFormValues } from "@/components/category-form";
import { SEED_IDS } from "@/lib/seed";
import type { Category } from "@/lib/types";

export default function CategoriesPage() {
  const { categories, isLoading, create, update, remove } = useCategories();
  const { entries } = useTimeEntries();
  const { can } = usePermissions();

  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [editCategory, setEditCategory] = useState<Category | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  const canWrite = can("categories:write");

  // Count entries per category
  const usageCounts = useMemo(() => {
    const map = new Map<string, number>();
    entries.forEach((e) => {
      if (e.categoryId) {
        map.set(e.categoryId, (map.get(e.categoryId) ?? 0) + 1);
      }
    });
    return map;
  }, [entries]);

  const filtered = useMemo(() => {
    if (!search.trim()) return categories;
    const q = search.toLowerCase();
    return categories.filter((c) => c.name.toLowerCase().includes(q));
  }, [categories, search]);

  const handleCreate = async (values: CategoryFormValues) => {
    setIsPending(true);
    try {
      await create({
        workspaceId: SEED_IDS.WORKSPACE_ID,
        name: values.name,
        color: values.color,
        active: true,
      });
      toast.success("Kategoria utworzona.");
      setCreateOpen(false);
    } catch {
      toast.error("Nie udalo sie utworzyc kategorii.");
    } finally {
      setIsPending(false);
    }
  };

  const handleEdit = async (values: CategoryFormValues) => {
    if (!editCategory) return;
    setIsPending(true);
    try {
      await update(editCategory.id, {
        name: values.name,
        color: values.color,
      });
      toast.success("Kategoria zaktualizowana.");
      setEditCategory(null);
    } catch {
      toast.error("Nie udalo sie zaktualizowac kategorii.");
    } finally {
      setIsPending(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await remove(deleteId);
      toast.success("Kategoria usunieta.");
    } catch {
      toast.error("Nie udalo sie usunac kategorii.");
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
    <RequirePermission
      permission="categories:write"
      fallback={
        <div className="flex flex-col items-center justify-center p-12 text-center">
          <FolderTree className="h-12 w-12 text-muted-foreground/50" />
          <p className="mt-4 text-lg font-medium text-muted-foreground">
            Brak uprawnien
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Nie masz uprawnien do zarzadzania kategoriami.
          </p>
        </div>
      }
    >
      <PageTransition>
        <div className="space-y-6 p-6">
          {/* Search and action button */}
          <div className="flex items-center justify-between gap-4">
            <div className="relative max-w-sm flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Szukaj kategorii..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Nowa kategoria
            </Button>
          </div>

          {/* Grid or empty state */}
          {filtered.length === 0 ? (
            <EmptyState
              icon={FolderTree}
              title={search ? "Nie znaleziono kategorii" : "Brak kategorii"}
              description={
                search
                  ? "Sprobuj zmienic fraze wyszukiwania."
                  : "Utworz pierwsza kategorie, aby zaczac."
              }
              action={
                !search && canWrite ? (
                  <Button variant="outline" onClick={() => setCreateOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Nowa kategoria
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {filtered.map((category) => (
                <Card key={category.id} className="group">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <div className="flex items-center gap-2">
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: category.color }}
                      />
                      <span className="font-medium text-sm">{category.name}</span>
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
                          <DropdownMenuItem onClick={() => setEditCategory(category)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Edytuj
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => setDeleteId(category.id)}
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
                        {usageCounts.get(category.id) ?? 0} wpisow
                      </span>
                      <Badge
                        variant={category.active ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {category.active ? "Aktywna" : "Nieaktywna"}
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
                <DialogTitle>Nowa kategoria</DialogTitle>
              </DialogHeader>
              <CategoryForm
                onSubmit={handleCreate}
                isPending={isPending}
                submitLabel="Utworz kategorie"
              />
            </DialogContent>
          </Dialog>

          {/* Edit dialog */}
          <Dialog
            open={!!editCategory}
            onOpenChange={(open) => !open && setEditCategory(null)}
          >
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edytuj kategorie</DialogTitle>
              </DialogHeader>
              {editCategory && (
                <CategoryForm
                  category={editCategory}
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
                <AlertDialogTitle>Usunac kategorie?</AlertDialogTitle>
                <AlertDialogDescription>
                  Ta operacja jest nieodwracalna. Kategoria zostanie trwale usunieta.
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
    </RequirePermission>
  );
}
