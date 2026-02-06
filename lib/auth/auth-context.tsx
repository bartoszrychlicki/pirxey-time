"use client";

import React, { createContext, useCallback, useEffect, useState } from "react";
import type { User } from "@/lib/types";
import type { AuthContextValue, LoginCredentials, RegisterCredentials } from "./types";
import {
  login as authLogin,
  register as authRegister,
  logout as authLogout,
  getUserFromSession,
} from "./mock-auth";

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const existingUser = getUserFromSession();
    if (existingUser) {
      setUser(existingUser);
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(async (credentials: LoginCredentials) => {
    const loggedInUser = await authLogin(credentials);
    setUser(loggedInUser);
    return loggedInUser;
  }, []);

  const register = useCallback(async (credentials: RegisterCredentials) => {
    const newUser = await authRegister(credentials);
    setUser(newUser);
    return newUser;
  }, []);

  const logout = useCallback(() => {
    authLogout();
    setUser(null);
  }, []);

  const value: AuthContextValue = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
