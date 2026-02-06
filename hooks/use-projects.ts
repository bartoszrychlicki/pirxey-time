"use client";

import { useCallback, useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import type { Project, CreateProject, UpdateProject } from "@/lib/types";
import { COLLECTIONS, STORAGE_CHANGE_EVENT } from "@/lib/constants";
import { getStorage } from "@/lib/storage";
import { useAuth } from "@/hooks/use-auth";
import { usePermissions } from "@/hooks/use-permissions";

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const { can } = usePermissions();

  const load = useCallback(async () => {
    if (!user) return;
    const storage = getStorage();
    let all = await storage.getAll<Project>(COLLECTIONS.PROJECTS);

    // RBAC: ADMIN sees all, others see only assigned projects
    if (!can("time_entries:all:read")) {
      all = all.filter(
        (p) => p.isPublic || p.assignedMemberIds.includes(user.id),
      );
    }

    // Sort by name
    all.sort((a, b) => a.name.localeCompare(b.name, "pl"));
    setProjects(all);
    setIsLoading(false);
  }, [user, can]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.collection === COLLECTIONS.PROJECTS) {
        load();
      }
    };
    window.addEventListener(STORAGE_CHANGE_EVENT, handler);
    return () => window.removeEventListener(STORAGE_CHANGE_EVENT, handler);
  }, [load]);

  const create = useCallback(
    async (data: CreateProject) => {
      const now = new Date().toISOString();
      const project: Project = {
        ...data,
        id: uuidv4(),
        createdAt: now,
        updatedAt: now,
      };
      const storage = getStorage();
      await storage.create(COLLECTIONS.PROJECTS, project);
      return project;
    },
    [],
  );

  const update = useCallback(
    async (id: string, data: UpdateProject) => {
      const storage = getStorage();
      return storage.update<Project>(COLLECTIONS.PROJECTS, id, {
        ...data,
        updatedAt: new Date().toISOString(),
      } as Partial<Project>);
    },
    [],
  );

  const remove = useCallback(async (id: string) => {
    const storage = getStorage();
    await storage.delete(COLLECTIONS.PROJECTS, id);
  }, []);

  return { projects, isLoading, create, update, remove, refresh: load };
}
