"use client";

import { useCallback, useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import type { Tag, CreateTag, UpdateTag } from "@/lib/types";
import { COLLECTIONS, STORAGE_CHANGE_EVENT } from "@/lib/constants";
import { getStorage } from "@/lib/storage";
import { useAuth } from "@/hooks/use-auth";

export function useTags() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  const load = useCallback(async () => {
    if (!user) return;
    const storage = getStorage();
    const all = await storage.getAll<Tag>(COLLECTIONS.TAGS);
    all.sort((a, b) => a.name.localeCompare(b.name, "pl"));
    setTags(all);
    setIsLoading(false);
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.collection === COLLECTIONS.TAGS) {
        load();
      }
    };
    window.addEventListener(STORAGE_CHANGE_EVENT, handler);
    return () => window.removeEventListener(STORAGE_CHANGE_EVENT, handler);
  }, [load]);

  const create = useCallback(async (data: CreateTag) => {
    const now = new Date().toISOString();
    const tag: Tag = {
      ...data,
      id: uuidv4(),
      createdAt: now,
      updatedAt: now,
    };
    const storage = getStorage();
    await storage.create(COLLECTIONS.TAGS, tag);
    return tag;
  }, []);

  const update = useCallback(async (id: string, data: UpdateTag) => {
    const storage = getStorage();
    return storage.update<Tag>(COLLECTIONS.TAGS, id, {
      ...data,
      updatedAt: new Date().toISOString(),
    } as Partial<Tag>);
  }, []);

  const remove = useCallback(async (id: string) => {
    const storage = getStorage();
    await storage.delete(COLLECTIONS.TAGS, id);
  }, []);

  return { tags, isLoading, create, update, remove, refresh: load };
}
