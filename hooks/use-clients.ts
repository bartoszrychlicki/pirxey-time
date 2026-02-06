"use client";

import { useCallback, useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import type { Client, CreateClient, UpdateClient } from "@/lib/types";
import { COLLECTIONS, STORAGE_CHANGE_EVENT } from "@/lib/constants";
import { getStorage } from "@/lib/storage";
import { useAuth } from "@/hooks/use-auth";

export function useClients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  const load = useCallback(async () => {
    if (!user) return;
    const storage = getStorage();
    const all = await storage.getAll<Client>(COLLECTIONS.CLIENTS);
    all.sort((a, b) => a.name.localeCompare(b.name, "pl"));
    setClients(all);
    setIsLoading(false);
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.collection === COLLECTIONS.CLIENTS) {
        load();
      }
    };
    window.addEventListener(STORAGE_CHANGE_EVENT, handler);
    return () => window.removeEventListener(STORAGE_CHANGE_EVENT, handler);
  }, [load]);

  const create = useCallback(async (data: CreateClient) => {
    const now = new Date().toISOString();
    const client: Client = {
      ...data,
      id: uuidv4(),
      createdAt: now,
      updatedAt: now,
    };
    const storage = getStorage();
    await storage.create(COLLECTIONS.CLIENTS, client);
    return client;
  }, []);

  const update = useCallback(async (id: string, data: UpdateClient) => {
    const storage = getStorage();
    return storage.update<Client>(COLLECTIONS.CLIENTS, id, {
      ...data,
      updatedAt: new Date().toISOString(),
    } as Partial<Client>);
  }, []);

  const remove = useCallback(async (id: string) => {
    const storage = getStorage();
    await storage.delete(COLLECTIONS.CLIENTS, id);
  }, []);

  return { clients, isLoading, create, update, remove, refresh: load };
}
