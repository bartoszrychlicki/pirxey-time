"use client";

import { useMemo, useState } from "react";
import {
  Building2,
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { TableSkeleton } from "@/components/loading-skeleton";
import { PageTransition } from "@/components/motion";
import { useClients } from "@/hooks/use-clients";
import { useProjects } from "@/hooks/use-projects";
import { usePermissions } from "@/hooks/use-permissions";
import { RequirePermission } from "@/lib/rbac/guards";
import { ClientForm, type ClientFormValues } from "@/components/client-form";
import { SEED_IDS } from "@/lib/seed";
import type { Client } from "@/lib/types";

export default function ClientsPage() {
  const { clients, isLoading, create, update, remove } = useClients();
  const { projects } = useProjects();
  const { can } = usePermissions();

  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [editClient, setEditClient] = useState<Client | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  const canWrite = can("clients:write");

  // Count projects per client
  const projectCounts = useMemo(() => {
    const map = new Map<string, number>();
    projects.forEach((p) => {
      if (p.clientId) {
        map.set(p.clientId, (map.get(p.clientId) ?? 0) + 1);
      }
    });
    return map;
  }, [projects]);

  const filtered = useMemo(() => {
    if (!search.trim()) return clients;
    const q = search.toLowerCase();
    return clients.filter((c) => c.name.toLowerCase().includes(q));
  }, [clients, search]);

  const handleCreate = async (values: ClientFormValues) => {
    setIsPending(true);
    try {
      await create({
        workspaceId: SEED_IDS.WORKSPACE_ID,
        name: values.name,
        address: null,
        currency: values.currency,
        active: true,
        note: values.note || null,
      });
      toast.success("Klient utworzony.");
      setCreateOpen(false);
    } catch {
      toast.error("Nie udalo sie utworzyc klienta.");
    } finally {
      setIsPending(false);
    }
  };

  const handleEdit = async (values: ClientFormValues) => {
    if (!editClient) return;
    setIsPending(true);
    try {
      await update(editClient.id, {
        name: values.name,
        address: null,
        currency: values.currency,
        note: values.note || null,
      });
      toast.success("Klient zaktualizowany.");
      setEditClient(null);
    } catch {
      toast.error("Nie udalo sie zaktualizowac klienta.");
    } finally {
      setIsPending(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await remove(deleteId);
      toast.success("Klient usuniety.");
    } catch {
      toast.error("Nie udalo sie usunac klienta.");
    } finally {
      setDeleteId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-10 w-48" />
        <TableSkeleton rows={4} cols={4} />
      </div>
    );
  }

  return (
    <PageTransition>
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Klienci</h1>
        <RequirePermission permission="clients:write">
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nowy klient
          </Button>
        </RequirePermission>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Szukaj klientow..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Table or empty state */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={Building2}
          title={search ? "Nie znaleziono klientow" : "Brak klientow"}
          description={
            search
              ? "Sprobuj zmienic fraze wyszukiwania."
              : "Dodaj pierwszego klienta, aby zaczac."
          }
          action={
            !search && canWrite ? (
              <Button variant="outline" onClick={() => setCreateOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Nowy klient
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nazwa</TableHead>
                <TableHead className="text-center">Projekty</TableHead>
                <TableHead className="text-center">Status</TableHead>
                {canWrite && <TableHead className="w-12" />}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((client) => (
                <TableRow key={client.id}>
                  <TableCell className="font-medium">{client.name}</TableCell>
                  <TableCell className="text-center">
                    {projectCounts.get(client.id) ?? 0}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge
                      variant={client.active ? "default" : "secondary"}
                    >
                      {client.active ? "Aktywny" : "Zarchiwizowany"}
                    </Badge>
                  </TableCell>
                  {canWrite && (
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => setEditClient(client)}
                          >
                            <Pencil className="mr-2 h-4 w-4" />
                            Edytuj
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => setDeleteId(client.id)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Usun
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Create dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nowy klient</DialogTitle>
          </DialogHeader>
          <ClientForm
            onSubmit={handleCreate}
            isPending={isPending}
            submitLabel="Utworz klienta"
          />
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog
        open={!!editClient}
        onOpenChange={(open) => !open && setEditClient(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edytuj klienta</DialogTitle>
          </DialogHeader>
          {editClient && (
            <ClientForm
              client={editClient}
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
            <AlertDialogTitle>Usunac klienta?</AlertDialogTitle>
            <AlertDialogDescription>
              Ta operacja jest nieodwracalna. Klient zostanie trwale usuniety.
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
