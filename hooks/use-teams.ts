"use client";

import { useCallback, useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import type { Team, CreateTeam, UpdateTeam } from "@/lib/types";
import { COLLECTIONS, STORAGE_CHANGE_EVENT } from "@/lib/constants";
import { getStorage } from "@/lib/storage";
import { useAuth } from "@/hooks/use-auth";

export function useTeams() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  const load = useCallback(async () => {
    if (!user) return;
    const storage = getStorage();
    const all = await storage.getAll<Team>(COLLECTIONS.TEAMS);
    all.sort((a, b) => a.name.localeCompare(b.name, "pl"));
    setTeams(all);
    setIsLoading(false);
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.collection === COLLECTIONS.TEAMS) {
        load();
      }
    };
    window.addEventListener(STORAGE_CHANGE_EVENT, handler);
    return () => window.removeEventListener(STORAGE_CHANGE_EVENT, handler);
  }, [load]);

  const create = useCallback(async (data: CreateTeam) => {
    const now = new Date().toISOString();
    const team: Team = {
      ...data,
      id: uuidv4(),
      createdAt: now,
      updatedAt: now,
    };
    const storage = getStorage();
    await storage.create(COLLECTIONS.TEAMS, team);
    return team;
  }, []);

  const update = useCallback(async (id: string, data: UpdateTeam) => {
    const storage = getStorage();
    return storage.update<Team>(COLLECTIONS.TEAMS, id, {
      ...data,
      updatedAt: new Date().toISOString(),
    } as Partial<Team>);
  }, []);

  const remove = useCallback(async (id: string) => {
    const storage = getStorage();
    await storage.delete(COLLECTIONS.TEAMS, id);
  }, []);

  return { teams, isLoading, create, update, remove, refresh: load };
}
