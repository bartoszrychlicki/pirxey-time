"use client";

import { useCallback, useEffect, useState } from "react";
import type { UserSettings, UpdateUserSettings } from "@/lib/types";
import { COLLECTIONS, STORAGE_CHANGE_EVENT } from "@/lib/constants";
import { getStorage } from "@/lib/storage";
import { useAuth } from "@/hooks/use-auth";

export function useSettings() {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  const load = useCallback(async () => {
    if (!user) return;
    const storage = getStorage();
    const all = await storage.query<UserSettings>(
      COLLECTIONS.USER_SETTINGS,
      (s) => s.userId === user.id,
    );
    setSettings(all[0] ?? null);
    setIsLoading(false);
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.collection === COLLECTIONS.USER_SETTINGS) {
        load();
      }
    };
    window.addEventListener(STORAGE_CHANGE_EVENT, handler);
    return () => window.removeEventListener(STORAGE_CHANGE_EVENT, handler);
  }, [load]);

  const update = useCallback(
    async (data: UpdateUserSettings) => {
      if (!settings) return null;
      const storage = getStorage();
      const updated = await storage.update<UserSettings>(
        COLLECTIONS.USER_SETTINGS,
        settings.id,
        data as Partial<UserSettings>,
      );
      setSettings(updated);
      return updated;
    },
    [settings],
  );

  return { settings, isLoading, update, refresh: load };
}
