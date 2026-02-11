"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Trash2, Users } from "lucide-react";
import { toast } from "sonner";

import { useTeams } from "@/hooks/use-teams";
import { useMembers } from "@/hooks/use-members";
import { SEED_IDS } from "@/lib/seed";
import { RequirePermission } from "@/lib/rbac/guards";
import { PageTransition } from "@/components/motion";
import { EmptyState } from "@/components/empty-state";
import { TableSkeleton } from "@/components/loading-skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
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
} from "@/components/ui/alert-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function TeamsPage() {
  const { teams, isLoading: teamsLoading, create, remove } = useTeams();
  const { members, isLoading: membersLoading, update } = useMembers();

  const [createOpen, setCreateOpen] = useState(false);
  const [teamName, setTeamName] = useState("");

  const [manageTeamId, setManageTeamId] = useState<string | null>(null);
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [isSavingMembers, setIsSavingMembers] = useState(false);

  const [deleteId, setDeleteId] = useState<string | null>(null);

  const loading = teamsLoading || membersLoading;

  const membersByTeam = useMemo(() => {
    const map = new Map<string, typeof members>();
    for (const team of teams) {
      map.set(
        team.id,
        members.filter((member) => member.teamIds.includes(team.id)),
      );
    }
    return map;
  }, [teams, members]);

  const manageTeam = useMemo(
    () => teams.find((team) => team.id === manageTeamId) ?? null,
    [teams, manageTeamId],
  );

  useEffect(() => {
    if (!manageTeam) return;
    const assignedIds = members
      .filter((member) => member.teamIds.includes(manageTeam.id))
      .map((member) => member.id);
    setSelectedMemberIds(assignedIds);
  }, [manageTeam, members]);

  const deleteTeam = useMemo(
    () => teams.find((team) => team.id === deleteId) ?? null,
    [teams, deleteId],
  );

  const handleCreate = async () => {
    const normalized = teamName.trim();
    if (!normalized) {
      toast.error("Nazwa zespolu jest wymagana.");
      return;
    }
    if (teams.some((team) => team.name.toLowerCase() === normalized.toLowerCase())) {
      toast.error("Zespol o tej nazwie juz istnieje.");
      return;
    }

    try {
      await create({
        workspaceId: SEED_IDS.WORKSPACE_ID,
        name: normalized,
      });
      toast.success("Zespol zostal utworzony.");
      setTeamName("");
      setCreateOpen(false);
    } catch {
      toast.error("Nie udalo sie utworzyc zespolu.");
    }
  };

  const toggleMember = (memberId: string, checked: boolean) => {
    setSelectedMemberIds((current) => {
      if (checked) {
        return current.includes(memberId) ? current : [...current, memberId];
      }
      return current.filter((id) => id !== memberId);
    });
  };

  const saveMembers = async () => {
    if (!manageTeam) return;
    setIsSavingMembers(true);
    try {
      const updates = members
        .map((member) => {
          const hasTeam = member.teamIds.includes(manageTeam.id);
          const shouldHaveTeam = selectedMemberIds.includes(member.id);
          if (hasTeam === shouldHaveTeam) return null;

          const nextTeamIds = shouldHaveTeam
            ? [...member.teamIds, manageTeam.id]
            : member.teamIds.filter((id) => id !== manageTeam.id);

          return update(member.id, { teamIds: nextTeamIds });
        })
        .filter(Boolean);

      await Promise.all(updates);
      toast.success("Sklad zespolu zostal zapisany.");
      setManageTeamId(null);
    } catch {
      toast.error("Nie udalo sie zapisac zmian skladu.");
    } finally {
      setIsSavingMembers(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTeam) return;
    const membersInTeam = membersByTeam.get(deleteTeam.id) ?? [];
    if (membersInTeam.length > 0) {
      toast.error("Najpierw usun wszystkich ludzi z zespolu.");
      setDeleteId(null);
      return;
    }

    try {
      await remove(deleteTeam.id);
      toast.success("Zespol zostal usuniety.");
    } catch {
      toast.error("Nie udalo sie usunac zespolu.");
    } finally {
      setDeleteId(null);
    }
  };

  return (
    <RequirePermission
      permission="settings:workspace"
      fallback={
        <div className="flex flex-col items-center justify-center p-12 text-center">
          <Users className="h-12 w-12 text-muted-foreground/50" />
          <p className="mt-4 text-lg font-medium text-muted-foreground">
            Brak uprawnien
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Tylko administrator moze zarzadzac zespolami.
          </p>
        </div>
      }
    >
      <PageTransition>
        <div className="space-y-6 p-6">
          {/* Loading */}
          {loading ? (
            <TableSkeleton rows={4} cols={4} />
          ) : teams.length === 0 ? (
            <EmptyState
              icon={Users}
              title="Brak zespolow"
              description="Utworz pierwszy zespol, aby przypisywac ludzi."
              action={
                <>
                  <Button variant="outline" onClick={() => setCreateOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Dodaj zespol
                  </Button>
                </>
              }
            />
          ) : (
            <>
              <div className="flex justify-end">
                <Button onClick={() => setCreateOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Nowy zespol
                </Button>
              </div>
              <div className="rounded-lg border">
                <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Zespol</TableHead>
                    <TableHead>Liczba osob</TableHead>
                    <TableHead>Czlonkowie</TableHead>
                    <TableHead className="w-[260px]">Akcje</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {teams.map((team) => {
                    const teamMembers = membersByTeam.get(team.id) ?? [];
                    return (
                      <TableRow key={team.id}>
                        <TableCell className="font-medium">{team.name}</TableCell>
                        <TableCell className="tabular-nums">
                          {teamMembers.length}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {teamMembers.length > 0
                            ? teamMembers.map((member) => member.name).join(", ")
                            : "Brak"}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setManageTeamId(team.id)}
                            >
                              Zarzadzaj skladem
                            </Button>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span tabIndex={0}>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-destructive hover:text-destructive"
                                    disabled={teamMembers.length > 0}
                                    onClick={() => setDeleteId(team.id)}
                                  >
                                    <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                                    Usun
                                  </Button>
                                </span>
                              </TooltipTrigger>
                              {teamMembers.length > 0 && (
                                <TooltipContent>
                                  <p>Najpierw usun wszystkich ludzi z zespolu ({teamMembers.length})</p>
                                </TooltipContent>
                              )}
                            </Tooltip>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
            </>
          )}
        </div>

        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nowy zespol</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="team-name">Nazwa zespolu</Label>
                <Input
                  id="team-name"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  placeholder="Np. Frontend"
                />
              </div>
              <Button className="w-full" onClick={handleCreate}>
                Utworz zespol
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog
          open={!!manageTeamId}
          onOpenChange={(open) => !open && setManageTeamId(null)}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {manageTeam ? `Sklad: ${manageTeam.name}` : "Sklad zespolu"}
              </DialogTitle>
            </DialogHeader>
            <div className="max-h-[360px] space-y-3 overflow-y-auto pr-1">
              {members.map((member) => {
                const checked = selectedMemberIds.includes(member.id);
                return (
                  <label
                    key={member.id}
                    className="flex items-center justify-between rounded-md border px-3 py-2"
                  >
                    <div>
                      <p className="text-sm font-medium">{member.name}</p>
                      <p className="text-xs text-muted-foreground">{member.email}</p>
                    </div>
                    <Checkbox
                      checked={checked}
                      onCheckedChange={(value) => toggleMember(member.id, value === true)}
                    />
                  </label>
                );
              })}
            </div>
            <Button onClick={saveMembers} disabled={isSavingMembers}>
              {isSavingMembers ? "Zapisywanie..." : "Zapisz sklad"}
            </Button>
          </DialogContent>
        </Dialog>

        <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Usunac zespol?</AlertDialogTitle>
              <AlertDialogDescription>
                {deleteTeam
                  ? `Czy na pewno chcesz usunac zespol "${deleteTeam.name}"?`
                  : "Ta operacja jest nieodwracalna."}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Anuluj</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete}>Usun</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </PageTransition>
    </RequirePermission>
  );
}
