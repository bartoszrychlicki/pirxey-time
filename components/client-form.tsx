"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import type { Client } from "@/lib/types";

const clientFormSchema = z.object({
  name: z.string().min(1, "Nazwa klienta jest wymagana."),
  address: z.string().optional(),
  currency: z.string().min(1, "Waluta jest wymagana."),
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
      address: client?.address ?? "",
      currency: client?.currency ?? "PLN",
      note: client?.note ?? "",
    },
  });

  useEffect(() => {
    if (client) {
      form.reset({
        name: client.name,
        address: client.address ?? "",
        currency: client.currency,
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

      {/* Address */}
      <div className="space-y-2">
        <Label htmlFor="client-address">Adres</Label>
        <Input
          id="client-address"
          placeholder="Adres (opcjonalnie)"
          {...form.register("address")}
        />
      </div>

      {/* Currency */}
      <div className="space-y-2">
        <Label htmlFor="client-currency">Waluta</Label>
        <Input
          id="client-currency"
          placeholder="PLN"
          {...form.register("currency")}
        />
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
