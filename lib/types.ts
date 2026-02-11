// ─── Role ────────────────────────────────────────────────────────────────────

export type UserRole = "ADMIN" | "MANAGER" | "EMPLOYEE";

export type EstimateType = "NONE" | "TIME" | "BUDGET";

export type WeekDay = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export type Theme = "light" | "dark" | "system";

// ─── Entities ────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  teamIds: string[];
  avatarUrl?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Workspace {
  id: string;
  name: string;
  currency: string;
  timezone: string;
  weekStartsOn: WeekDay;
  createdAt: string;
  updatedAt: string;
}

export interface Client {
  id: string;
  workspaceId: string;
  name: string;
  address?: string | null;
  currency: string;
  active: boolean;
  note?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  workspaceId: string;
  clientId?: string | null;
  name: string;
  color: string;
  billableByDefault: boolean;
  billableRate?: number | null;
  estimateType: EstimateType;
  estimateValue?: number | null;
  active: boolean;
  isPublic: boolean;
  assignedMemberIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Tag {
  id: string;
  workspaceId: string;
  name: string;
  color: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Team {
  id: string;
  workspaceId: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface TimeEntry {
  id: string;
  workspaceId: string;
  userId: string;
  projectId?: string | null;
  description: string;
  /** Format: YYYY-MM-DD */
  date: string;
  /** Format: HH:mm */
  startTime: string;
  /** Format: HH:mm */
  endTime: string;
  durationMinutes: number;
  tagIds: string[];
  billable: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserSettings {
  id: string;
  userId: string;
  defaultProjectId?: string | null;
  defaultTagIds: string[];
  defaultDurationMinutes: number;
  defaultStartTime: string;
  theme: Theme;
}

// ─── Create / Update variants ────────────────────────────────────────────────

export type CreateUser = Omit<User, "id" | "createdAt" | "updatedAt">;
export type UpdateUser = Partial<Omit<User, "id" | "createdAt" | "updatedAt">>;

export type CreateWorkspace = Omit<Workspace, "id" | "createdAt" | "updatedAt">;
export type UpdateWorkspace = Partial<Omit<Workspace, "id" | "createdAt" | "updatedAt">>;

export type CreateClient = Omit<Client, "id" | "createdAt" | "updatedAt">;
export type UpdateClient = Partial<Omit<Client, "id" | "createdAt" | "updatedAt">>;

export type CreateProject = Omit<Project, "id" | "createdAt" | "updatedAt">;
export type UpdateProject = Partial<Omit<Project, "id" | "createdAt" | "updatedAt">>;

export type CreateTag = Omit<Tag, "id" | "createdAt" | "updatedAt">;
export type UpdateTag = Partial<Omit<Tag, "id" | "createdAt" | "updatedAt">>;

export type CreateTeam = Omit<Team, "id" | "createdAt" | "updatedAt">;
export type UpdateTeam = Partial<Omit<Team, "id" | "createdAt" | "updatedAt">>;

export type CreateTimeEntry = Omit<TimeEntry, "id" | "createdAt" | "updatedAt">;
export type UpdateTimeEntry = Partial<Omit<TimeEntry, "id" | "createdAt" | "updatedAt">>;

export type CreateUserSettings = Omit<UserSettings, "id">;
export type UpdateUserSettings = Partial<Omit<UserSettings, "id" | "userId">>;
