"use client";

import { formatDuration } from "@/lib/format";

interface DateGroupHeaderProps {
  dateLabel: string;
  totalMinutes: number;
  entryCount: number;
}

export function DateGroupHeader({
  dateLabel,
  totalMinutes,
  entryCount,
}: DateGroupHeaderProps) {
  return (
    <div className="flex items-center justify-between border-b border-border/50 pb-2 pt-4">
      <div className="flex items-center gap-3">
        <h3 className="text-sm font-semibold">{dateLabel}</h3>
        <span className="text-xs text-muted-foreground">
          {entryCount} {entryCount === 1 ? "wpis" : entryCount < 5 ? "wpisy" : "wpisow"}
        </span>
      </div>
      <span className="font-mono text-sm font-medium tabular-nums text-muted-foreground">
        {formatDuration(totalMinutes)}
      </span>
    </div>
  );
}
