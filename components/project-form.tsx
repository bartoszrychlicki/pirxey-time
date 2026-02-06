"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { PROJECT_COLORS } from "@/lib/constants";
import { useClients } from "@/hooks/use-clients";
import type { Project } from "@/lib/types";
import { cn } from "@/lib/utils";

const projectFormSchema = z.object({
  name: z.string().min(1, "Nazwa projektu jest wymagana."),
  color: z.string().min(1, "Kolor jest wymagany."),
  clientId: z.string().nullable().optional(),
  billableByDefault: z.boolean(),
  billableRate: z.coerce.number().min(0).nullable().optional(),
  isPublic: z.boolean(),
});

export type ProjectFormValues = z.infer<typeof projectFormSchema>;

interface ProjectFormProps {
  defaultValues?: Partial<ProjectFormValues>;
  project?: Project;
  onSubmit: (values: ProjectFormValues) => void;
  isPending?: boolean;
  submitLabel?: string;
}

export function ProjectForm({
  defaultValues,
  project,
  onSubmit,
  isPending,
  submitLabel = "Zapisz",
}: ProjectFormProps) {
  const { clients } = useClients();

  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: {
      name: project?.name ?? defaultValues?.name ?? "",
      color: project?.color ?? defaultValues?.color ?? PROJECT_COLORS[0].value,
      clientId: project?.clientId ?? defaultValues?.clientId ?? null,
      billableByDefault:
        project?.billableByDefault ?? defaultValues?.billableByDefault ?? false,
      billableRate:
        project?.billableRate ?? defaultValues?.billableRate ?? null,
      isPublic: project?.isPublic ?? defaultValues?.isPublic ?? true,
    },
  });

  useEffect(() => {
    if (project) {
      form.reset({
        name: project.name,
        color: project.color,
        clientId: project.clientId ?? null,
        billableByDefault: project.billableByDefault,
        billableRate: project.billableRate ?? null,
        isPublic: project.isPublic,
      });
    }
  }, [project, form]);

  const selectedColor = form.watch("color");
  const billable = form.watch("billableByDefault");

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      {/* Name */}
      <div className="space-y-2">
        <Label htmlFor="project-name">Nazwa</Label>
        <Input
          id="project-name"
          placeholder="Nazwa projektu"
          {...form.register("name")}
        />
        {form.formState.errors.name && (
          <p className="text-sm text-destructive">
            {form.formState.errors.name.message}
          </p>
        )}
      </div>

      {/* Color picker */}
      <div className="space-y-2">
        <Label>Kolor</Label>
        <div className="flex flex-wrap gap-2">
          {PROJECT_COLORS.map((c) => (
            <button
              key={c.value}
              type="button"
              className={cn(
                "h-8 w-8 rounded-full border-2 transition-all",
                selectedColor === c.value
                  ? "border-foreground scale-110"
                  : "border-transparent hover:border-muted-foreground/50",
              )}
              style={{ backgroundColor: c.value }}
              onClick={() => form.setValue("color", c.value)}
              title={c.name}
            />
          ))}
        </div>
      </div>

      {/* Client selector */}
      <div className="space-y-2">
        <Label>Klient</Label>
        <Select
          value={form.watch("clientId") ?? "__none__"}
          onValueChange={(v) =>
            form.setValue("clientId", v === "__none__" ? null : v)
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Brak klienta" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__none__">Brak klienta</SelectItem>
            {clients
              .filter((c) => c.active)
              .map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      </div>

      {/* Billable toggle */}
      <div className="flex items-center justify-between">
        <Label htmlFor="billable-toggle">Domyslnie rozliczalny</Label>
        <Switch
          id="billable-toggle"
          checked={billable}
          onCheckedChange={(checked) =>
            form.setValue("billableByDefault", checked)
          }
        />
      </div>

      {/* Rate input (only if billable) */}
      {billable && (
        <div className="space-y-2">
          <Label htmlFor="rate">Stawka (PLN/godz)</Label>
          <Input
            id="rate"
            type="number"
            min={0}
            step={0.01}
            placeholder="0.00"
            {...form.register("billableRate", { valueAsNumber: true })}
          />
        </div>
      )}

      {/* Public toggle */}
      <div className="flex items-center justify-between">
        <Label htmlFor="public-toggle">Publiczny</Label>
        <Switch
          id="public-toggle"
          checked={form.watch("isPublic")}
          onCheckedChange={(checked) => form.setValue("isPublic", checked)}
        />
      </div>

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? "Zapisywanie..." : submitLabel}
      </Button>
    </form>
  );
}
