"use client";

import { v4 as uuidv4 } from "uuid";
import type {
  User,
  Workspace,
  Client,
  Project,
  Tag,
  TimeEntry,
  UserSettings,
} from "@/lib/types";
import { COLLECTIONS } from "@/lib/constants";
import { getStorage } from "@/lib/storage";
import { formatDateISO } from "@/lib/format";

// ─── Fixed IDs for deterministic seed ────────────────────────────────────────

const WORKSPACE_ID = "ws-pirxey-001";

const USER_IDS = {
  alicja: "usr-alicja-001",
  mateusz: "usr-mateusz-002",
  julia: "usr-julia-003",
};

const CLIENT_IDS = {
  nordic: "cli-nordic-001",
  aurora: "cli-aurora-002",
};

const PROJECT_IDS = {
  dashboard: "prj-dashboard-001",
  mobile: "prj-mobile-002",
  internal: "prj-internal-003",
};

const TAG_IDS = {
  spotkanie: "tag-spotkanie-001",
  coding: "tag-coding-002",
  planning: "tag-planning-003",
};

// ─── Workspace ───────────────────────────────────────────────────────────────

const workspace: Workspace = {
  id: WORKSPACE_ID,
  name: "Pirxey Time",
  currency: "PLN",
  timezone: "Europe/Warsaw",
  weekStartsOn: 1,
  createdAt: "2025-01-01T00:00:00.000Z",
  updatedAt: "2025-01-01T00:00:00.000Z",
};

// ─── Users ───────────────────────────────────────────────────────────────────

const users: User[] = [
  {
    id: USER_IDS.alicja,
    name: "Alicja Nowak",
    email: "alicja@gmail.com",
    role: "ADMIN",
    avatarUrl: null,
    createdAt: "2025-01-01T00:00:00.000Z",
    updatedAt: "2025-01-01T00:00:00.000Z",
  },
  {
    id: USER_IDS.mateusz,
    name: "Mateusz Zielinski",
    email: "mateusz@gmail.com",
    role: "MANAGER",
    avatarUrl: null,
    createdAt: "2025-01-02T00:00:00.000Z",
    updatedAt: "2025-01-02T00:00:00.000Z",
  },
  {
    id: USER_IDS.julia,
    name: "Julia Szymanska",
    email: "julia@gmail.com",
    role: "EMPLOYEE",
    avatarUrl: null,
    createdAt: "2025-01-03T00:00:00.000Z",
    updatedAt: "2025-01-03T00:00:00.000Z",
  },
];

// ─── Clients ─────────────────────────────────────────────────────────────────

const clients: Client[] = [
  {
    id: CLIENT_IDS.nordic,
    workspaceId: WORKSPACE_ID,
    name: "Nordic Labs",
    address: "ul. Nowa 15, Warszawa",
    currency: "PLN",
    active: true,
    note: "Glowny klient - projekty dashboardowe",
    createdAt: "2025-01-05T00:00:00.000Z",
    updatedAt: "2025-01-05T00:00:00.000Z",
  },
  {
    id: CLIENT_IDS.aurora,
    workspaceId: WORKSPACE_ID,
    name: "Aurora Studio",
    address: "ul. Kwiatowa 8, Krakow",
    currency: "PLN",
    active: true,
    note: null,
    createdAt: "2025-01-06T00:00:00.000Z",
    updatedAt: "2025-01-06T00:00:00.000Z",
  },
];

// ─── Projects ────────────────────────────────────────────────────────────────

const projects: Project[] = [
  {
    id: PROJECT_IDS.dashboard,
    workspaceId: WORKSPACE_ID,
    clientId: CLIENT_IDS.nordic,
    name: "Pirxey Dashboard",
    color: "#3B82F6",
    billableByDefault: true,
    billableRate: 150,
    estimateType: "TIME",
    estimateValue: 2400,
    active: true,
    isPublic: true,
    assignedMemberIds: [USER_IDS.alicja, USER_IDS.mateusz, USER_IDS.julia],
    createdAt: "2025-01-10T00:00:00.000Z",
    updatedAt: "2025-01-10T00:00:00.000Z",
  },
  {
    id: PROJECT_IDS.mobile,
    workspaceId: WORKSPACE_ID,
    clientId: CLIENT_IDS.aurora,
    name: "Aurora Mobile App",
    color: "#8B5CF6",
    billableByDefault: true,
    billableRate: 120,
    estimateType: "BUDGET",
    estimateValue: 50000,
    active: true,
    isPublic: true,
    assignedMemberIds: [USER_IDS.mateusz, USER_IDS.julia],
    createdAt: "2025-01-12T00:00:00.000Z",
    updatedAt: "2025-01-12T00:00:00.000Z",
  },
  {
    id: PROJECT_IDS.internal,
    workspaceId: WORKSPACE_ID,
    clientId: null,
    name: "Internal Tools",
    color: "#22C55E",
    billableByDefault: false,
    billableRate: null,
    estimateType: "NONE",
    estimateValue: null,
    active: true,
    isPublic: false,
    assignedMemberIds: [USER_IDS.alicja],
    createdAt: "2025-01-15T00:00:00.000Z",
    updatedAt: "2025-01-15T00:00:00.000Z",
  },
];

// ─── Tags ────────────────────────────────────────────────────────────────────

const tags: Tag[] = [
  {
    id: TAG_IDS.spotkanie,
    workspaceId: WORKSPACE_ID,
    name: "spotkanie",
    color: "#3B82F6",
    active: true,
    createdAt: "2025-01-10T00:00:00.000Z",
    updatedAt: "2025-01-10T00:00:00.000Z",
  },
  {
    id: TAG_IDS.coding,
    workspaceId: WORKSPACE_ID,
    name: "coding",
    color: "#22C55E",
    active: true,
    createdAt: "2025-01-10T00:00:00.000Z",
    updatedAt: "2025-01-10T00:00:00.000Z",
  },
  {
    id: TAG_IDS.planning,
    workspaceId: WORKSPACE_ID,
    name: "planning",
    color: "#EAB308",
    active: true,
    createdAt: "2025-01-10T00:00:00.000Z",
    updatedAt: "2025-01-10T00:00:00.000Z",
  },
];

// ─── Time entries ────────────────────────────────────────────────────────────

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return formatDateISO(d);
}

function entry(
  userId: string,
  projectId: string,
  description: string,
  date: string,
  startTime: string,
  endTime: string,
  tagIds: string[],
  billable: boolean,
): TimeEntry {
  const [sh, sm] = startTime.split(":").map(Number);
  const [eh, em] = endTime.split(":").map(Number);
  const durationMinutes = (eh * 60 + em) - (sh * 60 + sm);

  return {
    id: uuidv4(),
    workspaceId: WORKSPACE_ID,
    userId,
    projectId,
    description,
    date,
    startTime,
    endTime,
    durationMinutes,
    tagIds,
    billable,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

function monthAgo(months: number, day: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() - months);
  d.setDate(day);
  return formatDateISO(d);
}

function generateTimeEntries(): TimeEntry[] {
  return [
    // ── Current month (recent days) ──────────────────────────────────────
    // Alicja
    entry(USER_IDS.alicja, PROJECT_IDS.dashboard, "Implementacja widoku dashboard", daysAgo(1), "09:00", "12:30", [TAG_IDS.coding], true),
    entry(USER_IDS.alicja, PROJECT_IDS.dashboard, "Code review PR #42", daysAgo(1), "13:00", "14:30", [TAG_IDS.coding], true),
    entry(USER_IDS.alicja, PROJECT_IDS.internal, "Aktualizacja dokumentacji", daysAgo(2), "09:00", "11:00", [], false),
    entry(USER_IDS.alicja, PROJECT_IDS.dashboard, "Spotkanie z klientem Nordic Labs", daysAgo(3), "10:00", "11:30", [TAG_IDS.spotkanie], true),
    entry(USER_IDS.alicja, PROJECT_IDS.internal, "Konfiguracja CI/CD", daysAgo(5), "09:00", "12:00", [TAG_IDS.coding], false),
    // Mateusz
    entry(USER_IDS.mateusz, PROJECT_IDS.mobile, "Projektowanie ekranu logowania", daysAgo(1), "08:30", "12:00", [TAG_IDS.coding], true),
    entry(USER_IDS.mateusz, PROJECT_IDS.mobile, "Testy jednostkowe modulu auth", daysAgo(2), "09:00", "11:30", [TAG_IDS.coding], true),
    entry(USER_IDS.mateusz, PROJECT_IDS.dashboard, "Planowanie sprintu", daysAgo(3), "14:00", "15:30", [TAG_IDS.planning, TAG_IDS.spotkanie], true),
    entry(USER_IDS.mateusz, PROJECT_IDS.mobile, "Integracja API platnosci", daysAgo(4), "09:00", "13:00", [TAG_IDS.coding], true),
    entry(USER_IDS.mateusz, PROJECT_IDS.mobile, "Debugowanie nawigacji", daysAgo(7), "10:00", "12:30", [TAG_IDS.coding], true),
    // Julia
    entry(USER_IDS.julia, PROJECT_IDS.dashboard, "Stylowanie komponentow tabeli", daysAgo(1), "09:30", "12:00", [TAG_IDS.coding], true),
    entry(USER_IDS.julia, PROJECT_IDS.mobile, "Implementacja ekranu profilu", daysAgo(2), "09:00", "12:30", [TAG_IDS.coding], true),
    entry(USER_IDS.julia, PROJECT_IDS.dashboard, "Daily standup", daysAgo(3), "09:00", "09:30", [TAG_IDS.spotkanie], true),
    entry(USER_IDS.julia, PROJECT_IDS.mobile, "Responsywnosc widokow", daysAgo(4), "13:00", "16:00", [TAG_IDS.coding], true),
    entry(USER_IDS.julia, PROJECT_IDS.dashboard, "Analiza wymaganiami klienta", daysAgo(8), "10:00", "11:30", [TAG_IDS.planning], true),

    // ── 1 month ago ──────────────────────────────────────────────────────
    // Alicja
    entry(USER_IDS.alicja, PROJECT_IDS.dashboard, "Refaktoring modulu raportow", monthAgo(1, 3), "09:00", "13:00", [TAG_IDS.coding], true),
    entry(USER_IDS.alicja, PROJECT_IDS.dashboard, "Spotkanie retrospektywa", monthAgo(1, 5), "14:00", "15:30", [TAG_IDS.spotkanie], true),
    entry(USER_IDS.alicja, PROJECT_IDS.internal, "Setup monitoring Sentry", monthAgo(1, 8), "09:00", "11:30", [TAG_IDS.coding], false),
    entry(USER_IDS.alicja, PROJECT_IDS.dashboard, "Implementacja filtrowania tabel", monthAgo(1, 12), "09:00", "12:00", [TAG_IDS.coding], true),
    entry(USER_IDS.alicja, PROJECT_IDS.dashboard, "Demo dla klienta", monthAgo(1, 15), "10:00", "11:00", [TAG_IDS.spotkanie], true),
    entry(USER_IDS.alicja, PROJECT_IDS.internal, "Przeglad backlogu", monthAgo(1, 18), "13:00", "14:30", [TAG_IDS.planning], false),
    // Mateusz
    entry(USER_IDS.mateusz, PROJECT_IDS.mobile, "Implementacja push notyfikacji", monthAgo(1, 2), "09:00", "12:00", [TAG_IDS.coding], true),
    entry(USER_IDS.mateusz, PROJECT_IDS.mobile, "Testy E2E ekranu glownego", monthAgo(1, 6), "09:00", "11:00", [TAG_IDS.coding], true),
    entry(USER_IDS.mateusz, PROJECT_IDS.dashboard, "Code review PR #38", monthAgo(1, 10), "14:00", "15:30", [TAG_IDS.coding], true),
    entry(USER_IDS.mateusz, PROJECT_IDS.mobile, "Optymalizacja ladowania obrazow", monthAgo(1, 14), "09:00", "12:30", [TAG_IDS.coding], true),
    entry(USER_IDS.mateusz, PROJECT_IDS.mobile, "Spotkanie planowanie sprintu", monthAgo(1, 17), "10:00", "11:30", [TAG_IDS.planning, TAG_IDS.spotkanie], true),
    // Julia
    entry(USER_IDS.julia, PROJECT_IDS.dashboard, "Implementacja dark mode", monthAgo(1, 4), "09:00", "13:00", [TAG_IDS.coding], true),
    entry(USER_IDS.julia, PROJECT_IDS.mobile, "Design system komponentow", monthAgo(1, 7), "09:30", "12:00", [TAG_IDS.coding], true),
    entry(USER_IDS.julia, PROJECT_IDS.dashboard, "Daily standup", monthAgo(1, 9), "09:00", "09:30", [TAG_IDS.spotkanie], true),
    entry(USER_IDS.julia, PROJECT_IDS.mobile, "Animacje przejsc miedzy ekranami", monthAgo(1, 13), "09:00", "12:00", [TAG_IDS.coding], true),
    entry(USER_IDS.julia, PROJECT_IDS.dashboard, "Testy A/B strony glownej", monthAgo(1, 16), "13:00", "15:30", [TAG_IDS.coding], true),

    // ── 2 months ago ─────────────────────────────────────────────────────
    // Alicja
    entry(USER_IDS.alicja, PROJECT_IDS.dashboard, "Projektowanie architektury API", monthAgo(2, 2), "09:00", "12:00", [TAG_IDS.planning], true),
    entry(USER_IDS.alicja, PROJECT_IDS.dashboard, "Implementacja endpointow REST", monthAgo(2, 5), "09:00", "13:30", [TAG_IDS.coding], true),
    entry(USER_IDS.alicja, PROJECT_IDS.internal, "Migracja bazy danych", monthAgo(2, 9), "10:00", "12:00", [TAG_IDS.coding], false),
    entry(USER_IDS.alicja, PROJECT_IDS.dashboard, "Spotkanie z zespolem UX", monthAgo(2, 12), "14:00", "15:00", [TAG_IDS.spotkanie], true),
    entry(USER_IDS.alicja, PROJECT_IDS.dashboard, "Integracja z Stripe", monthAgo(2, 16), "09:00", "12:30", [TAG_IDS.coding], true),
    // Mateusz
    entry(USER_IDS.mateusz, PROJECT_IDS.mobile, "Setup projektu React Native", monthAgo(2, 3), "08:30", "12:00", [TAG_IDS.coding], true),
    entry(USER_IDS.mateusz, PROJECT_IDS.mobile, "Konfiguracja nawigacji", monthAgo(2, 7), "09:00", "11:30", [TAG_IDS.coding], true),
    entry(USER_IDS.mateusz, PROJECT_IDS.dashboard, "Analiza wymaganiami v2", monthAgo(2, 10), "10:00", "12:00", [TAG_IDS.planning], true),
    entry(USER_IDS.mateusz, PROJECT_IDS.mobile, "Implementacja ekranu listy", monthAgo(2, 14), "09:00", "13:00", [TAG_IDS.coding], true),
    // Julia
    entry(USER_IDS.julia, PROJECT_IDS.dashboard, "Prototypowanie w Figma", monthAgo(2, 4), "09:00", "12:30", [TAG_IDS.planning], true),
    entry(USER_IDS.julia, PROJECT_IDS.mobile, "Tworzenie komponentow UI", monthAgo(2, 8), "09:00", "12:00", [TAG_IDS.coding], true),
    entry(USER_IDS.julia, PROJECT_IDS.dashboard, "Spotkanie kickoff projektu", monthAgo(2, 11), "10:00", "11:30", [TAG_IDS.spotkanie], true),
    entry(USER_IDS.julia, PROJECT_IDS.mobile, "Stylowanie formularzy", monthAgo(2, 15), "13:00", "16:00", [TAG_IDS.coding], true),

    // ── 3 months ago ─────────────────────────────────────────────────────
    // Alicja
    entry(USER_IDS.alicja, PROJECT_IDS.internal, "Konfiguracja srodowiska dev", monthAgo(3, 3), "09:00", "12:00", [TAG_IDS.coding], false),
    entry(USER_IDS.alicja, PROJECT_IDS.dashboard, "Zbieranie wymagan od klienta", monthAgo(3, 6), "10:00", "12:30", [TAG_IDS.planning, TAG_IDS.spotkanie], true),
    entry(USER_IDS.alicja, PROJECT_IDS.dashboard, "Tworzenie user stories", monthAgo(3, 10), "09:00", "11:00", [TAG_IDS.planning], true),
    // Mateusz
    entry(USER_IDS.mateusz, PROJECT_IDS.mobile, "Analiza konkurencji", monthAgo(3, 4), "09:00", "12:00", [TAG_IDS.planning], true),
    entry(USER_IDS.mateusz, PROJECT_IDS.mobile, "Wireframing ekranow", monthAgo(3, 8), "09:00", "13:00", [TAG_IDS.planning], true),
    // Julia
    entry(USER_IDS.julia, PROJECT_IDS.dashboard, "Research technologii frontend", monthAgo(3, 5), "09:00", "12:00", [TAG_IDS.planning], true),
    entry(USER_IDS.julia, PROJECT_IDS.dashboard, "Konfiguracja Tailwind CSS", monthAgo(3, 9), "13:00", "15:30", [TAG_IDS.coding], true),
  ];
}

// ─── User settings ───────────────────────────────────────────────────────────

const userSettings: UserSettings[] = [
  {
    id: `settings-${USER_IDS.alicja}`,
    userId: USER_IDS.alicja,
    defaultProjectId: PROJECT_IDS.dashboard,
    defaultTagIds: [TAG_IDS.coding],
    defaultDurationMinutes: 60,
    defaultStartTime: "09:00",
    theme: "system",
  },
  {
    id: `settings-${USER_IDS.mateusz}`,
    userId: USER_IDS.mateusz,
    defaultProjectId: PROJECT_IDS.mobile,
    defaultTagIds: [],
    defaultDurationMinutes: 120,
    defaultStartTime: "08:30",
    theme: "dark",
  },
  {
    id: `settings-${USER_IDS.julia}`,
    userId: USER_IDS.julia,
    defaultProjectId: null,
    defaultTagIds: [],
    defaultDurationMinutes: 60,
    defaultStartTime: "09:00",
    theme: "light",
  },
];

// ─── Passwords (for mock auth) ──────────────────────────────────────────────

const PASSWORDS_KEY = "pirxey_passwords";

function seedPasswords(): void {
  const passwords: Record<string, string> = {
    [USER_IDS.alicja]: "admin123",
    [USER_IDS.mateusz]: "manager123",
    [USER_IDS.julia]: "employee123",
  };
  localStorage.setItem(PASSWORDS_KEY, JSON.stringify(passwords));
}

// ─── Seed function ───────────────────────────────────────────────────────────

export async function seedIfEmpty(): Promise<boolean> {
  const storage = getStorage();

  const existingUsers = await storage.getAll(COLLECTIONS.USERS);
  if (existingUsers.length > 0) {
    return false;
  }

  await storage.bulkCreate(COLLECTIONS.WORKSPACES, [workspace]);
  await storage.bulkCreate(COLLECTIONS.USERS, users);
  await storage.bulkCreate(COLLECTIONS.CLIENTS, clients);
  await storage.bulkCreate(COLLECTIONS.PROJECTS, projects);
  await storage.bulkCreate(COLLECTIONS.TAGS, tags);
  await storage.bulkCreate(COLLECTIONS.TIME_ENTRIES, generateTimeEntries());
  await storage.bulkCreate(COLLECTIONS.USER_SETTINGS, userSettings);

  seedPasswords();

  return true;
}

// ─── Exported IDs (for tests / convenience) ─────────────────────────────────

export const SEED_IDS = {
  WORKSPACE_ID,
  USER_IDS,
  CLIENT_IDS,
  PROJECT_IDS,
  TAG_IDS,
} as const;
