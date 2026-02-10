"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import type { Client } from "@/lib/types";

const CURRENCIES = ["PLN", "USD", "EUR"] as const;

const clientFormSchema = z.object({
  name: z.string().min(1, "Nazwa klienta jest wymagana."),
  currency: z.enum(CURRENCIES, { required_error: "Waluta jest wymagana." }),
  note: z.string().optional(),
});

export type ClientFormValues = z.infer<typeof clientFormSchema>;

interface ClientFormProps {
  client?: Client;
  onSubmit: (values: ClientFormValues) => void;
  isPending?: boolean;
  submitLabel?: string;
}

export function ClientForm({
  client,
  onSubmit,
  isPending,
  submitLabel = "Zapisz",
}: ClientFormProps) {
  const form = useForm<ClientFormValues>({
    resolver: zodResolver(clientFormSchema),
    defaultValues: {
      name: client?.name ?? "",
      currency: (client?.currency as (typeof CURRENCIES)[number]) ?? "PLN",
      note: client?.note ?? "",
    },
  });

  useEffect(() => {
    if (client) {
      form.reset({
        name: client.name,
        currency: client.currency as (typeof CURRENCIES)[number],
        note: client.note ?? "",
      });
    }
  }, [client, form]);

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      {/* Name */}
      <div className="space-y-2">
        <Label htmlFor="client-name">Nazwa</Label>
        <Input
          id="client-name"
          placeholder="Nazwa klienta"
          {...form.register("name")}
        />
        {form.formState.errors.name && (
          <p className="text-sm text-destructive">
            {form.formState.errors.name.message}
          </p>
        )}
      </div>

      {/* Currency */}
      <div className="space-y-2">
        <Label>Waluta</Label>
        <Select
          value={form.watch("currency")}
          onValueChange={(val) =>
            form.setValue("currency", val as (typeof CURRENCIES)[number], {
              shouldValidate: true,
            })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Wybierz walute" />
          </SelectTrigger>
          <SelectContent>
            {CURRENCIES.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {form.formState.errors.currency && (
          <p className="text-sm text-destructive">
            {form.formState.errors.currency.message}
          </p>
        )}
      </div>

      {/* Note */}
      <div className="space-y-2">
        <Label htmlFor="client-note">Notatka</Label>
        <Textarea
          id="client-note"
          placeholder="Notatka (opcjonalnie)"
          rows={3}
          {...form.register("note")}
        />
      </div>

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? "Zapisywanie..." : submitLabel}
      </Button>
    </form>
  );
}
