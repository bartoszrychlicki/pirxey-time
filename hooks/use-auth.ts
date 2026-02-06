"use client";

import { useContext } from "react";
import { AuthContext } from "@/lib/auth/auth-context";
import type { AuthContextValue } from "@/lib/auth/types";

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth musi byc uzywany wewnatrz AuthProvider");
  }
  return context;
}
