"use client";

import React from "react";
import { usePermissions } from "@/hooks/use-permissions";
import type { Permission } from "./permissions";

interface RequirePermissionProps {
  permission?: Permission;
  permissions?: Permission[];
  mode?: "any" | "all";
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export function RequirePermission({
  permission,
  permissions,
  mode = "any",
  fallback = null,
  children,
}: RequirePermissionProps) {
  const { can, canAny, canAll } = usePermissions();

  let allowed = false;

  if (permission) {
    allowed = can(permission);
  } else if (permissions && permissions.length > 0) {
    allowed = mode === "all" ? canAll(permissions) : canAny(permissions);
  } else {
    allowed = true;
  }

  if (!allowed) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
