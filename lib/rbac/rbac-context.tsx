"use client";

import React, { createContext, useMemo } from "react";
import { useAuth } from "@/hooks/use-auth";
import {
  getPermissionsForRole,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  type Permission,
} from "./permissions";

export interface PermissionContextValue {
  permissions: Permission[];
  can: (permission: Permission) => boolean;
  canAny: (permissions: Permission[]) => boolean;
  canAll: (permissions: Permission[]) => boolean;
}

export const PermissionContext = createContext<PermissionContextValue | null>(
  null,
);

export function PermissionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuth();

  const value = useMemo<PermissionContextValue>(() => {
    const role = user?.role ?? "EMPLOYEE";
    return {
      permissions: getPermissionsForRole(role),
      can: (permission: Permission) => hasPermission(role, permission),
      canAny: (perms: Permission[]) => hasAnyPermission(role, perms),
      canAll: (perms: Permission[]) => hasAllPermissions(role, perms),
    };
  }, [user?.role]);

  return (
    <PermissionContext.Provider value={value}>
      {children}
    </PermissionContext.Provider>
  );
}
