"use client";

import { useContext } from "react";
import {
  PermissionContext,
  type PermissionContextValue,
} from "@/lib/rbac/rbac-context";

export function usePermissions(): PermissionContextValue {
  const context = useContext(PermissionContext);
  if (!context) {
    throw new Error(
      "usePermissions musi byc uzywany wewnatrz PermissionProvider",
    );
  }
  return context;
}
