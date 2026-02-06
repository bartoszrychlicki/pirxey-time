"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import {
  Menu,
  Sun,
  Moon,
  Monitor,
  LogOut,
  Settings,
  ChevronDown,
  Search,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { NAV_ITEMS } from "@/lib/constants";
import { useAuth } from "@/hooks/use-auth";
import { usePermissions } from "@/hooks/use-permissions";
import { useGlobalShortcuts } from "@/hooks/use-keyboard-shortcuts";
import type { Permission } from "@/lib/rbac/permissions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CommandPalette } from "@/components/command-palette";

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function roleBadgeLabel(role: string): string {
  switch (role) {
    case "ADMIN":
      return "Admin";
    case "MANAGER":
      return "Manager";
    default:
      return "Pracownik";
  }
}

function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const cycle = () => {
    if (theme === "light") setTheme("dark");
    else if (theme === "dark") setTheme("system");
    else setTheme("light");
  };

  return (
    <Button variant="ghost" size="icon" onClick={cycle} aria-label="Zmien motyw">
      {theme === "dark" ? (
        <Moon className="h-4 w-4" />
      ) : theme === "light" ? (
        <Sun className="h-4 w-4" />
      ) : (
        <Monitor className="h-4 w-4" />
      )}
    </Button>
  );
}

function SidebarNav({ onItemClick }: { onItemClick?: () => void }) {
  const pathname = usePathname();
  const { can } = usePermissions();

  return (
    <nav className="space-y-1">
      {NAV_ITEMS.map((item) => {
        if (item.permission && !can(item.permission as Permission)) {
          return null;
        }
        const active = pathname === item.href || pathname.startsWith(item.href + "/");
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onItemClick}
            className={cn(
              "flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors",
              active
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

function SidebarContent({ onItemClick }: { onItemClick?: () => void }) {
  return (
    <div className="flex h-full flex-col">
      <div className="mb-6 px-4">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
          Workspace
        </p>
        <h1 className="font-serif text-2xl text-foreground">Pirxey Time</h1>
        <p className="text-sm text-muted-foreground">Manualne logowanie czasu</p>
      </div>

      <SidebarNav onItemClick={onItemClick} />

      <div className="mt-auto rounded-xl border border-border/70 bg-muted/40 p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Status MVP
        </p>
        <p className="mt-1 text-sm font-medium">
          Wersja manualna
        </p>
        <p className="text-xs text-muted-foreground">
          Focus: projekty, klienci, raporty.
        </p>
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [commandOpen, setCommandOpen] = React.useState(false);

  const currentLabel =
    NAV_ITEMS.find(
      (item) => pathname === item.href || pathname.startsWith(item.href + "/"),
    )?.label ?? "Panel";

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  // Global keyboard shortcuts
  useGlobalShortcuts({
    toggleCommandPalette: () => setCommandOpen((prev) => !prev),
    focusNewEntry: () => {
      window.dispatchEvent(new CustomEvent("focus-new-entry"));
    },
    duplicateLastEntry: () => {
      window.dispatchEvent(new CustomEvent("duplicate-last-entry"));
    },
    cycleTheme: () => {
      if (theme === "light") setTheme("dark");
      else if (theme === "dark") setTheme("system");
      else setTheme("light");
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <CommandPalette open={commandOpen} onOpenChange={setCommandOpen} />
      <div className="relative flex min-h-screen">
        {/* Desktop sidebar */}
        <aside className="hidden w-64 shrink-0 flex-col border-r border-border/60 bg-background/80 px-4 pb-6 pt-8 backdrop-blur lg:flex">
          <SidebarContent />
        </aside>

        <div className="flex min-h-screen flex-1 flex-col">
          {/* Header */}
          <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 px-4 py-3 backdrop-blur sm:px-6">
            <div className="mx-auto flex w-full max-w-6xl items-center justify-between">
              <div className="flex items-center gap-3">
                {/* Mobile menu */}
                <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" className="lg:hidden">
                      <Menu className="h-5 w-5" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-64 p-4 pt-8">
                    <SheetHeader className="sr-only">
                      <SheetTitle>Nawigacja</SheetTitle>
                    </SheetHeader>
                    <SidebarContent onItemClick={() => setMobileOpen(false)} />
                  </SheetContent>
                </Sheet>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                    Panel
                  </p>
                  <h2 className="font-serif text-xl sm:text-2xl">{currentLabel}</h2>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="hidden gap-1.5 text-xs text-muted-foreground sm:inline-flex"
                  onClick={() => setCommandOpen(true)}
                >
                  <Search className="h-3.5 w-3.5" />
                  Szukaj...
                  <Badge variant="secondary" className="ml-1 px-1 py-0 text-[10px]">
                    {typeof navigator !== "undefined" && /Mac/.test(navigator.userAgent)
                      ? "\u2318K"
                      : "Ctrl+K"}
                  </Badge>
                </Button>

                <ThemeToggle />

                {user && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="gap-2 px-2">
                        <Avatar className="h-7 w-7">
                          <AvatarFallback className="text-xs">
                            {getInitials(user.name)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="hidden text-sm sm:inline">{user.name}</span>
                        <ChevronDown className="h-3 w-3 text-muted-foreground" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <div className="px-2 py-1.5">
                        <p className="text-sm font-medium">{user.name}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                        <Badge variant="secondary" className="mt-1 text-xs">
                          {roleBadgeLabel(user.role)}
                        </Badge>
                      </div>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href="/settings" className="cursor-pointer">
                          <Settings className="mr-2 h-4 w-4" />
                          Ustawienia
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={handleLogout}
                        className="cursor-pointer text-destructive focus:text-destructive"
                      >
                        <LogOut className="mr-2 h-4 w-4" />
                        Wyloguj
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </div>
          </header>

          {/* Main content */}
          <main className="flex-1 px-4 py-6 sm:px-6 sm:py-8">
            <div className="mx-auto w-full max-w-6xl">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
}
