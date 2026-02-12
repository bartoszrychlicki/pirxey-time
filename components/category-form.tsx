"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { TAG_COLORS } from "@/lib/constants";
import type { Category } from "@/lib/types";
import { cn } from "@/lib/utils";

const categoryFormSchema = z.object({
  name: z.string().min(1, "Nazwa kategorii jest wymagana."),
  color: z.string().min(1, "Kolor jest wymagany."),
});

export type CategoryFormValues = z.infer<typeof categoryFormSchema>;

interface CategoryFormProps {
  category?: Category;
  onSubmit: (values: CategoryFormValues) => void;
  isPending?: boolean;
  submitLabel?: string;
}

export function CategoryForm({
  category,
  onSubmit,
  isPending,
  submitLabel = "Zapisz",
}: CategoryFormProps) {
  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      name: category?.name ?? "",
      color: category?.color ?? TAG_COLORS[0].value,
    },
  });

  useEffect(() => {
    if (category) {
      form.reset({
        name: category.name,
        color: category.color,
      });
    }
  }, [category, form]);

  const selectedColor = form.watch("color");

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      {/* Name */}
      <div className="space-y-2">
        <Label htmlFor="category-name">Nazwa</Label>
        <Input
          id="category-name"
          placeholder="Nazwa kategorii"
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
