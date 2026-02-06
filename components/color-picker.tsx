"use client";

import { cn } from "@/lib/utils";
import type { ColorPreset } from "@/lib/constants";

interface ColorPickerProps {
  colors: ColorPreset[];
  value: string;
  onChange: (color: string) => void;
}

export function ColorPicker({ colors, value, onChange }: ColorPickerProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {colors.map((preset) => (
        <button
          key={preset.value}
          type="button"
          title={preset.name}
          onClick={() => onChange(preset.value)}
          className={cn(
            "h-7 w-7 rounded-full border-2 transition-transform hover:scale-110",
            value === preset.value
              ? "border-foreground scale-110"
              : "border-transparent",
          )}
          style={{ backgroundColor: preset.value }}
        />
      ))}
    </div>
  );
}
