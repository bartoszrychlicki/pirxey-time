"use client";

import { forwardRef } from "react";
import type { TimeEntry, Project, Tag } from "@/lib/types";
import { formatDuration } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface TimeEntryRowProps {
  entry: TimeEntry;
  project?: Project | null;
  tags: Tag[];
  onClick?: () => void;
}

export const TimeEntryRow = forwardRef<HTMLDivElement, TimeEntryRowProps>(
  function TimeEntryRow({ entry, project, tags, onClick, ...rest }, ref) {
  const entryTags = tags.filter((t) => entry.tagIds.includes(t.id));

  return (
    <div
      ref={ref}
      onClick={onClick}
      {...rest}
      className={cn(
        "group flex cursor-pointer items-center gap-3 rounded-lg border border-transparent px-3 py-2.5 transition-colors hover:border-border/60 hover:bg-muted/50",
      )}
    >
      {/* Project color dot */}
      <span
        className="h-3 w-3 shrink-0 rounded-full"
        style={{ backgroundColor: project?.color ?? "#6B7280" }}
      />

      {/* Description + project name */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">
          {entry.description || <span className="italic text-muted-foreground">Bez opisu</span>}
        </p>
        {project && (
          <p className="truncate text-xs text-muted-foreground">
            {project.name}
          </p>
        )}
      </div>

      {/* Tags */}
      {entryTags.length > 0 && (
        <div className="hidden flex-wrap gap-1 sm:flex">
          {entryTags.map((tag) => (
            <Badge key={tag.id} variant="outline" className="gap-1 text-xs">
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: tag.color }}
              />
              {tag.name}
            </Badge>
          ))}
        </div>
      )}

      {/* Billable indicator */}
      {entry.billable && (
        <span className="hidden text-xs text-muted-foreground sm:inline" title="Rozliczalne">
          $
        </span>
      )}

      {/* Time range */}
      <span className="shrink-0 text-xs text-muted-foreground">
        {entry.startTime} - {entry.endTime}
      </span>

      {/* Duration */}
      <span className="shrink-0 font-mono text-sm font-medium tabular-nums">
        {formatDuration(entry.durationMinutes)}
      </span>
    </div>
  );
});
