"use client";

import { useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import {
  Clock,
  CalendarDays,
  BarChart3,
  FolderKanban,
  Building2,
  Tags,
  Users,
  Settings,
  Sun,
  Moon,
  Monitor,
  LogOut,
  Plus,
  Copy,
  Palette,
} from "lucide-react";

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { useAuth } from "@/hooks/use-auth";
import { usePermissions } from "@/hooks/use-permissions";
import { useProjects } from "@/hooks/use-projects";
import type { Permission } from "@/lib/rbac/permissions";
import { NAV_ITEMS } from "@/lib/constants";

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { can } = usePermissions();
  const { theme, setTheme } = useTheme();
  const { projects } = useProjects();

  const navigate = useCallback(
    (href: string) => {
      onOpenChange(false);
      router.push(href);
    },
    [router, onOpenChange],
  );

  const filteredNavItems = useMemo(
    () =>
      NAV_ITEMS.filter(
        (item) => !item.permission || can(item.permission as Permission),
      ),
    [can],
  );

  const handleLogout = useCallback(() => {
    onOpenChange(false);
    logout();
    router.push("/login");
  }, [logout, router, onOpenChange]);

  const handleTheme = useCallback(
    (newTheme: string) => {
      setTheme(newTheme);
      onOpenChange(false);
    },
    [setTheme, onOpenChange],
  );

  const handleNewEntry = useCallback(() => {
    onOpenChange(false);
    window.dispatchEvent(new CustomEvent("focus-new-entry"));
  }, [onOpenChange]);

  const handleDuplicateLastEntry = useCallback(() => {
    onOpenChange(false);
    window.dispatchEvent(new CustomEvent("duplicate-last-entry"));
  }, [onOpenChange]);

  const handleCycleTheme = useCallback(() => {
    if (theme === "light") setTheme("dark");
    else if (theme === "dark") setTheme("system");
    else setTheme("light");
    onOpenChange(false);
  }, [theme, setTheme, onOpenChange]);

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Wyszukaj strone, projekt, akcje..." />
      <CommandList>
        <CommandEmpty>Brak wynikow.</CommandEmpty>

        {/* Quick actions */}
        <CommandGroup heading="Akcje">
          <CommandItem onSelect={handleNewEntry}>
            <Plus className="mr-2 h-4 w-4" />
            Nowy wpis czasu
            <CommandShortcut>
              {typeof navigator !== "undefined" && /Mac/.test(navigator.userAgent) ? "\u2318" : "Ctrl+"}N
            </CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={handleDuplicateLastEntry}>
            <Copy className="mr-2 h-4 w-4" />
            Duplikuj ostatni wpis
            <CommandShortcut>
              {typeof navigator !== "undefined" && /Mac/.test(navigator.userAgent) ? "\u2318" : "Ctrl+"}D
            </CommandShortcut>
          </CommandItem>
          <CommandItem onSelect={handleCycleTheme}>
            <Palette className="mr-2 h-4 w-4" />
            Zmien motyw
            <CommandShortcut>
              {typeof navigator !== "undefined" && /Mac/.test(navigator.userAgent) ? "\u2318\u21E7" : "Ctrl+Shift+"}T
            </CommandShortcut>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        {/* Navigation */}
        <CommandGroup heading="Nawigacja">
          {filteredNavItems.map((item) => {
            const Icon = item.icon;
            return (
              <CommandItem key={item.href} onSelect={() => navigate(item.href)}>
                <Icon className="mr-2 h-4 w-4" />
                {item.label}
              </CommandItem>
            );
          })}
        </CommandGroup>

        <CommandSeparator />

        {/* Projects */}
        {projects.length > 0 && (
          <>
            <CommandGroup heading="Projekty">
              {projects.slice(0, 6).map((project) => (
                <CommandItem
                  key={project.id}
                  onSelect={() => navigate(`/projects`)}
                >
                  <span
                    className="mr-2 inline-block h-3 w-3 rounded-full"
                    style={{ backgroundColor: project.color }}
                  />
                  {project.name}
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
          </>
        )}

        {/* Theme */}
        <CommandGroup heading="Motyw">
          <CommandItem onSelect={() => handleTheme("light")}>
            <Sun className="mr-2 h-4 w-4" />
            Jasny
          </CommandItem>
          <CommandItem onSelect={() => handleTheme("dark")}>
            <Moon className="mr-2 h-4 w-4" />
            Ciemny
          </CommandItem>
          <CommandItem onSelect={() => handleTheme("system")}>
            <Monitor className="mr-2 h-4 w-4" />
            Systemowy
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        {/* Account */}
        <CommandGroup heading="Konto">
          <CommandItem onSelect={() => navigate("/settings")}>
            <Settings className="mr-2 h-4 w-4" />
            Ustawienia
          </CommandItem>
          <CommandItem onSelect={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Wyloguj
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
