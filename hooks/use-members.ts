"use client";

import { useCallback, useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import type { User, CreateUser, UpdateUser } from "@/lib/types";
import { COLLECTIONS, STORAGE_CHANGE_EVENT } from "@/lib/constants";
import { getStorage } from "@/lib/storage";
import { useAuth } from "@/hooks/use-auth";

export function useMembers() {
  const [members, setMembers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  const load = useCallback(async () => {
    if (!user) return;
    const storage = getStorage();
    const all = await storage.getAll<User>(COLLECTIONS.USERS);
    all.sort((a, b) => a.name.localeCompare(b.name, "pl"));
    setMembers(all);
    setIsLoading(false);
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.collection === COLLECTIONS.USERS) {
        load();
      }
    };
    window.addEventListener(STORAGE_CHANGE_EVENT, handler);
    return () => window.removeEventListener(STORAGE_CHANGE_EVENT, handler);
  }, [load]);

  const create = useCallback(async (data: CreateUser) => {
    const now = new Date().toISOString();
    const member: User = {
      ...data,
      id: uuidv4(),
      createdAt: now,
      updatedAt: now,
    };
    const storage = getStorage();
    await storage.create(COLLECTIONS.USERS, member);
    return member;
  }, []);

  const update = useCallback(async (id: string, data: UpdateUser) => {
    const storage = getStorage();
    return storage.update<User>(COLLECTIONS.USERS, id, {
      ...data,
      updatedAt: new Date().toISOString(),
    } as Partial<User>);
  }, []);

  const remove = useCallback(async (id: string) => {
    const storage = getStorage();
    await storage.delete(COLLECTIONS.USERS, id);
  }, []);

  const inviteByEmail = useCallback(
    async (email: string, name: string) => {
      return create({
        name,
        email,
        role: "EMPLOYEE",
        avatarUrl: null,
      });
    },
    [create],
  );

  return { members, isLoading, create, update, remove, inviteByEmail, refresh: load };
}
