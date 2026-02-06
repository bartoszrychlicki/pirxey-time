"use client";

import { useCallback, useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import type { TimeEntry, CreateTimeEntry, UpdateTimeEntry } from "@/lib/types";
import { COLLECTIONS, STORAGE_CHANGE_EVENT } from "@/lib/constants";
import { getStorage } from "@/lib/storage";
import { useAuth } from "@/hooks/use-auth";
import { usePermissions } from "@/hooks/use-permissions";
import { SEED_IDS } from "@/lib/seed";

export function useTimeEntries() {
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const { can } = usePermissions();

  const load = useCallback(async () => {
    if (!user) return;
    const storage = getStorage();
    let all = await storage.getAll<TimeEntry>(COLLECTIONS.TIME_ENTRIES);

    // RBAC filtering
    if (can("time_entries:all:read")) {
      // ADMIN sees everything
    } else if (can("time_entries:assigned_projects:read")) {
      // MANAGER sees own entries + entries for assigned projects
      const projects = await storage.getAll<{ id: string; assignedMemberIds: string[] }>(COLLECTIONS.PROJECTS);
      const assignedProjectIds = new Set(
        projects
          .filter((p) => p.assignedMemberIds.includes(user.id))
          .map((p) => p.id),
      );
      all = all.filter(
        (e) => e.userId === user.id || (e.projectId && assignedProjectIds.has(e.projectId)),
      );
    } else {
      // EMPLOYEE sees only own
      all = all.filter((e) => e.userId === user.id);
    }

    // Sort by date desc, then startTime desc
    all.sort((a, b) => {
      const dateCmp = b.date.localeCompare(a.date);
      if (dateCmp !== 0) return dateCmp;
      return b.startTime.localeCompare(a.startTime);
    });

    setEntries(all);
    setIsLoading(false);
  }, [user, can]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.collection === COLLECTIONS.TIME_ENTRIES) {
        load();
      }
    };
    window.addEventListener(STORAGE_CHANGE_EVENT, handler);
    return () => window.removeEventListener(STORAGE_CHANGE_EVENT, handler);
  }, [load]);

  const create = useCallback(
    async (data: Omit<CreateTimeEntry, "workspaceId" | "userId" | "createdAt" | "updatedAt"> & { workspaceId?: string; userId?: string }) => {
      if (!user) return null;
      const now = new Date().toISOString();
      const entry: TimeEntry = {
        id: uuidv4(),
        workspaceId: data.workspaceId || SEED_IDS.WORKSPACE_ID,
        userId: data.userId || user.id,
        projectId: data.projectId ?? null,
        description: data.description,
        date: data.date,
        startTime: data.startTime,
        endTime: data.endTime,
        durationMinutes: data.durationMinutes,
        tagIds: data.tagIds ?? [],
        billable: data.billable ?? false,
        createdAt: now,
        updatedAt: now,
      };
      const storage = getStorage();
      await storage.create(COLLECTIONS.TIME_ENTRIES, entry);
      return entry;
    },
    [user],
  );

  const update = useCallback(
    async (id: string, data: UpdateTimeEntry) => {
      const storage = getStorage();
      const updated = await storage.update<TimeEntry>(COLLECTIONS.TIME_ENTRIES, id, {
        ...data,
        updatedAt: new Date().toISOString(),
      } as Partial<TimeEntry>);
      return updated;
    },
    [],
  );

  const remove = useCallback(async (id: string) => {
    const storage = getStorage();
    await storage.delete(COLLECTIONS.TIME_ENTRIES, id);
  }, []);

  const duplicate = useCallback(
    async (entry: TimeEntry) => {
      if (!user) return null;
      const now = new Date().toISOString();
      const newEntry: TimeEntry = {
        ...entry,
        id: uuidv4(),
        createdAt: now,
        updatedAt: now,
      };
      const storage = getStorage();
      await storage.create(COLLECTIONS.TIME_ENTRIES, newEntry);
      return newEntry;
    },
    [user],
  );

  const getByDateRange = useCallback(
    async (startDate: string, endDate: string) => {
      return entries.filter((e) => e.date >= startDate && e.date <= endDate);
    },
    [entries],
  );

  return {
    entries,
    isLoading,
    create,
    update,
    remove,
    duplicate,
    getByDateRange,
    refresh: load,
  };
}
