"use client";

import { useEffect, useCallback } from "react";

export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  meta?: boolean;
  shift?: boolean;
  alt?: boolean;
  handler: () => void;
  description: string;
  /** If true, fires even when the user is typing in an input/textarea */
  alwaysFire?: boolean;
}

function matchesShortcut(e: KeyboardEvent, s: KeyboardShortcut): boolean {
  const keyMatch = e.key.toLowerCase() === s.key.toLowerCase();
  const ctrlMatch = s.ctrl ? e.ctrlKey : !e.ctrlKey;
  const metaMatch = s.meta ? e.metaKey : !e.metaKey;
  const shiftMatch = s.shift ? e.shiftKey : !e.shiftKey;
  const altMatch = s.alt ? e.altKey : !e.altKey;
  return keyMatch && ctrlMatch && metaMatch && shiftMatch && altMatch;
}

/**
 * Register a set of keyboard shortcuts. Shortcuts that require
 * modifier keys won't fire while the user is typing in an input/textarea,
 * unless `alwaysFire` is set to true.
 */
export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]) {
  useEffect(() => {
    if (shortcuts.length === 0) return;

    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable;

      for (const shortcut of shortcuts) {
        if (matchesShortcut(e, shortcut)) {
          if (isInput && !shortcut.alwaysFire) {
            const hasModifier = shortcut.ctrl || shortcut.meta || shortcut.alt;
            if (!hasModifier) continue;
          }

          e.preventDefault();
          shortcut.handler();
          return;
        }
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [shortcuts]);
}

/**
 * Common shortcuts for the entire app. The caller provides callbacks
 * and this hook registers the standard set.
 */
export function useGlobalShortcuts(callbacks: {
  toggleCommandPalette: () => void;
  focusNewEntry: () => void;
  duplicateLastEntry: () => void;
  cycleTheme: () => void;
}) {
  const isMac = typeof navigator !== "undefined" && /Mac/.test(navigator.userAgent);

  const modKey = isMac ? { meta: true } : { ctrl: true };

  useKeyboardShortcuts([
    // Cmd/Ctrl + K -> Toggle command palette (always fires, even in inputs)
    {
      key: "k",
      ...modKey,
      handler: callbacks.toggleCommandPalette,
      description: "Otworz palete komend",
      alwaysFire: true,
    },
    // Cmd/Ctrl + N -> Focus new entry description field
    {
      key: "n",
      ...modKey,
      handler: callbacks.focusNewEntry,
      description: "Nowy wpis czasu",
    },
    // Cmd/Ctrl + D -> Duplicate last entry
    {
      key: "d",
      ...modKey,
      handler: callbacks.duplicateLastEntry,
      description: "Duplikuj ostatni wpis",
    },
    // Cmd/Ctrl + Shift + T -> Cycle theme (light -> dark -> system)
    {
      key: "t",
      ...modKey,
      shift: true,
      handler: callbacks.cycleTheme,
      description: "Zmien motyw",
    },
  ]);
}
