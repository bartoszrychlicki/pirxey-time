"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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

import { useMembers } from "@/hooks/use-members";
import type { UserRole } from "@/lib/types";

const inviteSchema = z.object({
  email: z.string().email("Nieprawidlowy adres e-mail."),
  name: z.string().min(1, "Imie i nazwisko jest wymagane."),
  role: z.enum(["ADMIN", "MANAGER", "EMPLOYEE"]),
});

type InviteFormValues = z.infer<typeof inviteSchema>;

interface TeamInviteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TeamInviteDialog({
  open,
  onOpenChange,
}: TeamInviteDialogProps) {
  const { inviteByEmail, update } = useMembers();
  const [isPending, setIsPending] = useState(false);

  const form = useForm<InviteFormValues>({
    resolver: zodResolver(inviteSchema),
    defaultValues: {
      email: "",
      name: "",
      role: "EMPLOYEE",
    },
  });

  const handleSubmit = async (values: InviteFormValues) => {
    setIsPending(true);
    try {
      const member = await inviteByEmail(values.email, values.name);
      // If role is not EMPLOYEE, update the role after creation
      if (values.role !== "EMPLOYEE" && member) {
        await update(member.id, { role: values.role as UserRole });
      }
      toast.success(`Zaproszono ${values.name} do zespolu.`);
      form.reset();
      onOpenChange(false);
    } catch {
      toast.error("Nie udalo sie wyslac zaproszenia.");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Zapros do zespolu</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={form.handleSubmit(handleSubmit)}
          className="space-y-4"
        >
          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="invite-email">E-mail</Label>
            <Input
              id="invite-email"
              type="email"
              placeholder="jan@firma.pl"
              {...form.register("email")}
            />
            {form.formState.errors.email && (
              <p className="text-sm text-destructive">
                {form.formState.errors.email.message}
              </p>
            )}
          </div>

          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="invite-name">Imie i nazwisko</Label>
            <Input
              id="invite-name"
              placeholder="Jan Kowalski"
              {...form.register("name")}
            />
            {form.formState.errors.name && (
              <p className="text-sm text-destructive">
                {form.formState.errors.name.message}
              </p>
            )}
          </div>

          {/* Role */}
          <div className="space-y-2">
            <Label>Rola</Label>
            <Select
              value={form.watch("role")}
              onValueChange={(v) =>
                form.setValue("role", v as "ADMIN" | "MANAGER" | "EMPLOYEE")
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="EMPLOYEE">Pracownik</SelectItem>
                <SelectItem value="MANAGER">Menedzer</SelectItem>
                <SelectItem value="ADMIN">Administrator</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "Zapraszanie..." : "Zapros"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
