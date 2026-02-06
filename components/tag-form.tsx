"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { TAG_COLORS } from "@/lib/constants";
import type { Tag } from "@/lib/types";
import { cn } from "@/lib/utils";

const tagFormSchema = z.object({
  name: z.string().min(1, "Nazwa tagu jest wymagana."),
  color: z.string().min(1, "Kolor jest wymagany."),
});

export type TagFormValues = z.infer<typeof tagFormSchema>;

interface TagFormProps {
  tag?: Tag;
  onSubmit: (values: TagFormValues) => void;
  isPending?: boolean;
  submitLabel?: string;
}

export function TagForm({
  tag,
  onSubmit,
  isPending,
  submitLabel = "Zapisz",
}: TagFormProps) {
  const form = useForm<TagFormValues>({
    resolver: zodResolver(tagFormSchema),
    defaultValues: {
      name: tag?.name ?? "",
      color: tag?.color ?? TAG_COLORS[0].value,
    },
  });

  useEffect(() => {
    if (tag) {
      form.reset({
        name: tag.name,
        color: tag.color,
      });
    }
  }, [tag, form]);

  const selectedColor = form.watch("color");

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      {/* Name */}
      <div className="space-y-2">
        <Label htmlFor="tag-name">Nazwa</Label>
        <Input
          id="tag-name"
          placeholder="Nazwa tagu"
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
          {TAG_COLORS.map((c) => (
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

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? "Zapisywanie..." : submitLabel}
      </Button>
    </form>
  );
}
