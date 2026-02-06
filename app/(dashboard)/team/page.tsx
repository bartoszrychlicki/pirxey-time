"use client";

import { useMemo, useState } from "react";
import {
  MoreHorizontal,
  Trash2,
  UserPlus,
  Users,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { EmptyState } from "@/components/empty-state";
import { TableSkeleton } from "@/components/loading-skeleton";
import { PageTransition } from "@/components/motion";
import { useMembers } from "@/hooks/use-members";
import { useProjects } from "@/hooks/use-projects";
import { useAuth } from "@/hooks/use-auth";
import { usePermissions } from "@/hooks/use-permissions";
import { RequirePermission } from "@/lib/rbac/guards";
import { TeamInviteDialog } from "@/components/team-invite-dialog";
import type { UserRole } from "@/lib/types";

const ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: "Administrator",
  MANAGER: "Menedzer",
  EMPLOYEE: "Pracownik",
};

const ROLE_VARIANTS: Record<UserRole, "default" | "secondary" | "outline"> = {
  ADMIN: "default",
  MANAGER: "secondary",
  EMPLOYEE: "outline",
};

export default function TeamPage() {
  const { members, isLoading, update, remove } = useMembers();
  const { projects } = useProjects();
  const { user } = useAuth();
  const { can } = usePermissions();

  const [inviteOpen, setInviteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const canInvite = can("team:invite");
  const canChangeRole = can("team:change_role");

  // Count projects per member
  const projectCounts = useMemo(() => {
    const map = new Map<string, number>();
    projects.forEach((p) => {
      p.assignedMemberIds.forEach((memberId) => {
        map.set(memberId, (map.get(memberId) ?? 0) + 1);
      });
    });
    return map;
  }, [projects]);

  const handleRoleChange = async (memberId: string, newRole: UserRole) => {
    try {
      await update(memberId, { role: newRole });
      toast.success("Rola zmieniona.");
    } catch {
      toast.error("Nie udalo sie zmienic roli.");
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await remove(deleteId);
      toast.success("Czlonek usuniety z zespolu.");
    } catch {
      toast.error("Nie udalo sie usunac czlonka.");
    } finally {
      setDeleteId(null);
    }
  };

  const memberToDelete = useMemo(
    () => members.find((m) => m.id === deleteId),
    [members, deleteId],
  );

  return (
    <RequirePermission
      permission="team:read"
      fallback={
        <div className="flex flex-col items-center justify-center p-12 text-center">
          <Users className="h-12 w-12 text-muted-foreground/50" />
          <p className="mt-4 text-lg font-medium text-muted-foreground">
            Brak uprawnien
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Nie masz uprawnien do zarzadzania zespolem.
          </p>
        </div>
      }
    >
      <PageTransition>
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Zespol</h1>
          {canInvite && (
            <Button onClick={() => setInviteOpen(true)}>
              <UserPlus className="mr-2 h-4 w-4" />
              Zapros
            </Button>
          )}
        </div>

        {/* Loading */}
        {isLoading ? (
          <TableSkeleton rows={3} cols={5} />
        ) : members.length === 0 ? (
          <EmptyState
            icon={Users}
            title="Brak czlonkow zespolu"
            description="Zapros pierwszego czlonka do zespolu."
            action={
              canInvite ? (
                <Button variant="outline" onClick={() => setInviteOpen(true)}>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Zapros pierwszego czlonka
                </Button>
              ) : undefined
            }
          />
        ) : (
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Uzytkownik</TableHead>
                  <TableHead>E-mail</TableHead>
                  <TableHead className="text-center">Rola</TableHead>
                  <TableHead className="text-center">Projekty</TableHead>
                  {canChangeRole && <TableHead className="w-12" />}
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map((member) => {
                  const isSelf = member.id === user?.id;
                  return (
                    <TableRow key={member.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-medium">
                            {member.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .toUpperCase()
                              .slice(0, 2)}
                          </div>
                          <span className="font-medium">{member.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {member.email}
                      </TableCell>
                      <TableCell className="text-center">
                        {canChangeRole && !isSelf ? (
                          <Select
                            value={member.role}
                            onValueChange={(v) =>
                              handleRoleChange(member.id, v as UserRole)
                            }
                          >
                            <SelectTrigger className="w-[160px] mx-auto">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="ADMIN">
                                Administrator
                              </SelectItem>
                              <SelectItem value="MANAGER">
                                Menedzer
                              </SelectItem>
                              <SelectItem value="EMPLOYEE">
                                Pracownik
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <Badge variant={ROLE_VARIANTS[member.role]}>
                            {ROLE_LABELS[member.role]}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {projectCounts.get(member.id) ?? 0}
                      </TableCell>
                      {canChangeRole && (
                        <TableCell>
                          {!isSelf && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                >
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={() => setDeleteId(member.id)}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Usun z zespolu
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Invite dialog */}
        <TeamInviteDialog open={inviteOpen} onOpenChange={setInviteOpen} />

        {/* Delete confirmation */}
        <AlertDialog
          open={!!deleteId}
          onOpenChange={(open) => !open && setDeleteId(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Usunac z zespolu?</AlertDialogTitle>
              <AlertDialogDescription>
                {memberToDelete
                  ? `Czy na pewno chcesz usunac ${memberToDelete.name} z zespolu? Ta operacja jest nieodwracalna.`
                  : "Ta operacja jest nieodwracalna."}
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
