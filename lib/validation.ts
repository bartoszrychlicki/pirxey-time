import { z } from "zod";

// ─── Shared ──────────────────────────────────────────────────────────────────

const timeRegex = /^\d{2}:\d{2}$/;
const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
const hexColorRegex = /^#[0-9A-Fa-f]{6}$/;

// ─── User ────────────────────────────────────────────────────────────────────

export const createUserSchema = z.object({
  name: z.string().min(1, "Imie i nazwisko jest wymagane."),
  email: z.string().email("Nieprawidlowy adres e-mail."),
  role: z.enum(["ADMIN", "MANAGER", "EMPLOYEE"]),
  teamIds: z.array(z.string()).default([]),
  avatarUrl: z.string().url().nullable().optional(),
});

export const updateUserSchema = createUserSchema.partial();

// ─── Workspace ───────────────────────────────────────────────────────────────

export const createWorkspaceSchema = z.object({
  name: z.string().min(1, "Nazwa przestrzeni jest wymagana."),
  currency: z.string().min(1, "Waluta jest wymagana."),
  timezone: z.string().min(1, "Strefa czasowa jest wymagana."),
  weekStartsOn: z.number().int().min(0).max(6),
});

export const updateWorkspaceSchema = createWorkspaceSchema.partial();

// ─── Client ──────────────────────────────────────────────────────────────────

export const createClientSchema = z.object({
  workspaceId: z.string().min(1),
  name: z.string().min(1, "Nazwa klienta jest wymagana."),
  address: z.string().nullable().optional(),
  currency: z.string().min(1, "Waluta jest wymagana."),
  active: z.boolean().default(true),
  note: z.string().nullable().optional(),
});

export const updateClientSchema = createClientSchema.partial();

// ─── Project ─────────────────────────────────────────────────────────────────

export const createProjectSchema = z.object({
  workspaceId: z.string().min(1),
  clientId: z.string().nullable().optional(),
  name: z.string().min(1, "Nazwa projektu jest wymagana."),
  color: z.string().regex(hexColorRegex, "Nieprawidlowy kolor."),
  billableByDefault: z.boolean().default(false),
  billableRate: z.number().min(0).nullable().optional(),
  estimateType: z.enum(["NONE", "TIME", "BUDGET"]).default("NONE"),
  estimateValue: z.number().min(0).nullable().optional(),
  active: z.boolean().default(true),
  isPublic: z.boolean().default(true),
  assignedMemberIds: z.array(z.string()).default([]),
});

export const updateProjectSchema = createProjectSchema.partial();

// ─── Tag ─────────────────────────────────────────────────────────────────────

export const createTagSchema = z.object({
  workspaceId: z.string().min(1),
  name: z.string().min(1, "Nazwa tagu jest wymagana."),
  color: z.string().regex(hexColorRegex, "Nieprawidlowy kolor."),
  active: z.boolean().default(true),
});

export const updateTagSchema = createTagSchema.partial();

// ─── TimeEntry ───────────────────────────────────────────────────────────────

export const createTimeEntrySchema = z.object({
  workspaceId: z.string().min(1),
  userId: z.string().min(1),
  projectId: z.string().nullable().optional(),
  description: z.string().min(1, "Opis jest wymagany."),
  date: z.string().regex(dateRegex, "Nieprawidlowy format daty (YYYY-MM-DD)."),
  startTime: z
    .string()
    .regex(timeRegex, "Nieprawidlowy format godziny (HH:mm)."),
  endTime: z
    .string()
    .regex(timeRegex, "Nieprawidlowy format godziny (HH:mm)."),
  durationMinutes: z.number().int().min(1, "Czas trwania musi byc wiekszy niz 0."),
  tagIds: z.array(z.string()).default([]),
  billable: z.boolean().default(false),
});

export const updateTimeEntrySchema = z.object({
  workspaceId: z.string().min(1).optional(),
  userId: z.string().min(1).optional(),
  projectId: z.string().nullable().optional(),
  description: z.string().min(1, "Opis jest wymagany.").optional(),
  date: z
    .string()
    .regex(dateRegex, "Nieprawidlowy format daty (YYYY-MM-DD).")
    .optional(),
  startTime: z
    .string()
    .regex(timeRegex, "Nieprawidlowy format godziny (HH:mm).")
    .optional(),
  endTime: z
    .string()
    .regex(timeRegex, "Nieprawidlowy format godziny (HH:mm).")
    .optional(),
  durationMinutes: z.number().int().min(1).optional(),
  tagIds: z.array(z.string()).optional(),
  billable: z.boolean().optional(),
});

// ─── UserSettings ────────────────────────────────────────────────────────────

export const createUserSettingsSchema = z.object({
  userId: z.string().min(1),
  defaultProjectId: z.string().nullable().optional(),
  defaultTagIds: z.array(z.string()).default([]),
  defaultDurationMinutes: z.number().int().min(1).default(60),
  defaultStartTime: z
    .string()
    .regex(timeRegex, "Nieprawidlowy format godziny (HH:mm).")
    .default("09:00"),
  theme: z.enum(["light", "dark", "system"]).default("system"),
});

export const updateUserSettingsSchema = createUserSettingsSchema
  .omit({ userId: true })
  .partial();

// ─── Auth ────────────────────────────────────────────────────────────────────

export const loginSchema = z.object({
  email: z.string().email("Nieprawidlowy adres e-mail."),
  password: z.string().min(1, "Haslo jest wymagane."),
});

export const registerSchema = z.object({
  name: z.string().min(1, "Imie i nazwisko jest wymagane."),
  email: z.string().email("Nieprawidlowy adres e-mail."),
  password: z.string().min(6, "Haslo musi miec co najmniej 6 znakow."),
});
