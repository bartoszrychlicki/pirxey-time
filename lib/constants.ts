import {
  Clock,
  CalendarDays,
  BarChart3,
  FolderKanban,
  Building2,
  Tags,
  Users,
  Settings,
  type LucideIcon,
} from "lucide-react";

// ─── Navigation ──────────────────────────────────────────────────────────────

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  permission?: string;
}

export const NAV_ITEMS: NavItem[] = [
  { label: "Tracker", href: "/tracker", icon: Clock },
  { label: "Grafik", href: "/timesheet", icon: CalendarDays },
  { label: "Raporty", href: "/reports", icon: BarChart3 },
  { label: "Projekty", href: "/projects", icon: FolderKanban, permission: "projects:read" },
  { label: "Klienci", href: "/clients", icon: Building2, permission: "clients:read" },
  { label: "Tagi", href: "/tags", icon: Tags, permission: "tags:read" },
  { label: "Zespol", href: "/team", icon: Users, permission: "team:read" },
  { label: "Ustawienia", href: "/settings", icon: Settings },
];

// ─── Color presets ───────────────────────────────────────────────────────────

export interface ColorPreset {
  name: string;
  value: string;
}

export const PROJECT_COLORS: ColorPreset[] = [
  { name: "Niebieski", value: "#3B82F6" },
  { name: "Fioletowy", value: "#8B5CF6" },
  { name: "Zielony", value: "#22C55E" },
  { name: "Czerwony", value: "#EF4444" },
  { name: "Pomaranczowy", value: "#F97316" },
  { name: "Zolty", value: "#EAB308" },
  { name: "Rozowy", value: "#EC4899" },
  { name: "Turkusowy", value: "#06B6D4" },
  { name: "Indygo", value: "#6366F1" },
  { name: "Szary", value: "#6B7280" },
];

export const TAG_COLORS: ColorPreset[] = [
  { name: "Niebieski", value: "#3B82F6" },
  { name: "Zielony", value: "#22C55E" },
  { name: "Zolty", value: "#EAB308" },
  { name: "Czerwony", value: "#EF4444" },
  { name: "Fioletowy", value: "#8B5CF6" },
  { name: "Pomaranczowy", value: "#F97316" },
  { name: "Rozowy", value: "#EC4899" },
  { name: "Szary", value: "#6B7280" },
];

// ─── Storage keys ────────────────────────────────────────────────────────────

export const STORAGE_PREFIX = "pirxey_";

export const COLLECTIONS = {
  USERS: "users",
  WORKSPACES: "workspaces",
  CLIENTS: "clients",
  PROJECTS: "projects",
  TAGS: "tags",
  TIME_ENTRIES: "time_entries",
  USER_SETTINGS: "user_settings",
} as const;

export const SESSION_KEY = `${STORAGE_PREFIX}session`;

// ─── Defaults ────────────────────────────────────────────────────────────────

export const DEFAULT_CURRENCY = "PLN";
export const DEFAULT_TIMEZONE = "Europe/Warsaw";
export const DEFAULT_WEEK_STARTS_ON = 1; // Monday
export const DEFAULT_DURATION_MINUTES = 60;
export const DEFAULT_START_TIME = "09:00";

// ─── Misc ────────────────────────────────────────────────────────────────────

export const STORAGE_CHANGE_EVENT = "pirxey_storage_change";
