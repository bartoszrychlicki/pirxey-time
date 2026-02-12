"use client";

import { useCallback, useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import type { Category, CreateCategory, UpdateCategory } from "@/lib/types";
import { COLLECTIONS, STORAGE_CHANGE_EVENT } from "@/lib/constants";
import { getStorage } from "@/lib/storage";
import { useAuth } from "@/hooks/use-auth";

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  const load = useCallback(async () => {
    if (!user) return;
    const storage = getStorage();
    const all = await storage.getAll<Category>(COLLECTIONS.CATEGORIES);
    all.sort((a, b) => a.name.localeCompare(b.name, "pl"));
    setCategories(all);
    setIsLoading(false);
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.collection === COLLECTIONS.CATEGORIES) {
        load();
      }
    };
    window.addEventListener(STORAGE_CHANGE_EVENT, handler);
    return () => window.removeEventListener(STORAGE_CHANGE_EVENT, handler);
  }, [load]);

  const create = useCallback(async (data: CreateCategory) => {
    const now = new Date().toISOString();
    const category: Category = {
      ...data,
      id: uuidv4(),
      createdAt: now,
      updatedAt: now,
    };
    const storage = getStorage();
    await storage.create(COLLECTIONS.CATEGORIES, category);
    return category;
  }, []);

  const update = useCallback(async (id: string, data: UpdateCategory) => {
    const storage = getStorage();
    return storage.update<Category>(COLLECTIONS.CATEGORIES, id, {
      ...data,
      updatedAt: new Date().toISOString(),
    } as Partial<Category>);
  }, []);

  const remove = useCallback(async (id: string) => {
    const storage = getStorage();
    await storage.delete(COLLECTIONS.CATEGORIES, id);
  }, []);

  return { categories, isLoading, create, update, remove, refresh: load };
}
