import type { UserRole } from "@/lib/types";

// ─── Permission definitions ─────────────────────────────────────────────────

export const PERMISSIONS = {
  // Time entries
  TIME_ENTRIES_OWN_READ: "time_entries:own:read",
  TIME_ENTRIES_OWN_WRITE: "time_entries:own:write",
  TIME_ENTRIES_ASSIGNED_PROJECTS_READ: "time_entries:assigned_projects:read",
  TIME_ENTRIES_ALL_READ: "time_entries:all:read",
  TIME_ENTRIES_ALL_WRITE: "time_entries:all:write",

  // Projects
  PROJECTS_READ: "projects:read",
  PROJECTS_WRITE: "projects:write",
  PROJECTS_DELETE: "projects:delete",
  PROJECTS_MANAGE_MEMBERS: "projects:manage_members",

  // Clients
  CLIENTS_READ: "clients:read",
  CLIENTS_WRITE: "clients:write",
  CLIENTS_DELETE: "clients:delete",

  // Tags
  TAGS_READ: "tags:read",
  TAGS_WRITE: "tags:write",
  TAGS_DELETE: "tags:delete",

  // Categories
  CATEGORIES_READ: "categories:read",
  CATEGORIES_WRITE: "categories:write",

  // Team
  TEAM_READ: "team:read",
  TEAM_WRITE: "team:write",
  TEAM_INVITE: "team:invite",
  TEAM_CHANGE_ROLE: "team:change_role",

  // Reports
  REPORTS_OWN: "reports:own",
  REPORTS_ASSIGNED_PROJECTS: "reports:assigned_projects",
  REPORTS_ALL: "reports:all",

  // Settings
  SETTINGS_OWN: "settings:own",
  SETTINGS_WORKSPACE: "settings:workspace",
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

// ─── Role → Permission matrix ───────────────────────────────────────────────

const ALL_PERMISSIONS = Object.values(PERMISSIONS);

const MANAGER_PERMISSIONS: Permission[] = [
  PERMISSIONS.TIME_ENTRIES_OWN_READ,
  PERMISSIONS.TIME_ENTRIES_OWN_WRITE,
  PERMISSIONS.TIME_ENTRIES_ASSIGNED_PROJECTS_READ,
  PERMISSIONS.PROJECTS_READ,
  PERMISSIONS.PROJECTS_MANAGE_MEMBERS,
  PERMISSIONS.CLIENTS_READ,
  PERMISSIONS.TAGS_READ,
  PERMISSIONS.CATEGORIES_READ,
  PERMISSIONS.TEAM_READ,
  PERMISSIONS.REPORTS_OWN,
  PERMISSIONS.REPORTS_ASSIGNED_PROJECTS,
  PERMISSIONS.SETTINGS_OWN,
];

const EMPLOYEE_PERMISSIONS: Permission[] = [
  PERMISSIONS.TIME_ENTRIES_OWN_READ,
  PERMISSIONS.TIME_ENTRIES_OWN_WRITE,
  PERMISSIONS.PROJECTS_READ,
  PERMISSIONS.TAGS_READ,
  PERMISSIONS.CATEGORIES_READ,
  PERMISSIONS.REPORTS_OWN,
  PERMISSIONS.SETTINGS_OWN,
];

const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  ADMIN: ALL_PERMISSIONS,
  MANAGER: MANAGER_PERMISSIONS,
  EMPLOYEE: EMPLOYEE_PERMISSIONS,
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function getPermissionsForRole(role: UserRole): Permission[] {
  return ROLE_PERMISSIONS[role] ?? [];
}

export function hasPermission(role: UserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function hasAnyPermission(
  role: UserRole,
  permissions: Permission[],
): boolean {
  const rolePerms = ROLE_PERMISSIONS[role] ?? [];
  return permissions.some((p) => rolePerms.includes(p));
}

export function hasAllPermissions(
  role: UserRole,
  permissions: Permission[],
): boolean {
  const rolePerms = ROLE_PERMISSIONS[role] ?? [];
  return permissions.every((p) => rolePerms.includes(p));
}
