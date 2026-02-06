"use client";

import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { Edit3, Copy, Clipboard, Trash2 } from "lucide-react";

interface TimeEntryContextMenuProps {
  children: React.ReactNode;
  onEdit: () => void;
  onDuplicate: () => void;
  onCopyDescription: () => void;
  onDelete: () => void;
}

export function TimeEntryContextMenu({
  children,
  onEdit,
  onDuplicate,
  onCopyDescription,
  onDelete,
}: TimeEntryContextMenuProps) {
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      <ContextMenuContent className="w-48">
        <ContextMenuItem onClick={onEdit}>
          <Edit3 className="mr-2 h-4 w-4" />
          Edytuj
          <ContextMenuShortcut>E</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuItem onClick={onDuplicate}>
          <Copy className="mr-2 h-4 w-4" />
          Duplikuj
          <ContextMenuShortcut>D</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuItem onClick={onCopyDescription}>
          <Clipboard className="mr-2 h-4 w-4" />
          Kopiuj opis
          <ContextMenuShortcut>C</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem
          onClick={onDelete}
          className="text-destructive focus:text-destructive"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Usun
          <ContextMenuShortcut>Del</ContextMenuShortcut>
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
