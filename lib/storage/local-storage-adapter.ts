"use client";

import { STORAGE_PREFIX, STORAGE_CHANGE_EVENT } from "@/lib/constants";
import type { StorageAdapter } from "./adapter";

function storageKey(collection: string): string {
  return `${STORAGE_PREFIX}${collection}`;
}

function emitChange(collection: string) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent(STORAGE_CHANGE_EVENT, { detail: { collection } }),
    );
  }
}

export class LocalStorageAdapter implements StorageAdapter {
  private read<T>(collection: string): T[] {
    try {
      const raw = localStorage.getItem(storageKey(collection));
      return raw ? (JSON.parse(raw) as T[]) : [];
    } catch {
      return [];
    }
  }

  private write<T>(collection: string, items: T[]): void {
    try {
      localStorage.setItem(storageKey(collection), JSON.stringify(items));
      emitChange(collection);
    } catch (e) {
      console.error(`[LocalStorageAdapter] write error for ${collection}:`, e);
    }
  }

  async getAll<T>(collection: string): Promise<T[]> {
    return this.read<T>(collection);
  }

  async getById<T>(
    collection: string,
    id: string,
  ): Promise<T | null> {
    const items = this.read<T>(collection);
    return items.find((item) => (item as { id: string }).id === id) ?? null;
  }

  async create<T extends { id: string }>(
    collection: string,
    item: T,
  ): Promise<T> {
    const items = this.read<T>(collection);
    items.push(item);
    this.write(collection, items);
    return item;
  }

  async update<T extends { id: string }>(
    collection: string,
    id: string,
    updates: Partial<T>,
  ): Promise<T> {
    const items = this.read<T>(collection);
    const index = items.findIndex((item) => item.id === id);
    if (index === -1) {
      throw new Error(`Element o id "${id}" nie zostal znaleziony w ${collection}`);
    }
    const updated = { ...items[index], ...updates } as T;
    items[index] = updated;
    this.write(collection, items);
    return updated;
  }

  async delete(collection: string, id: string): Promise<void> {
    const items = this.read<{ id: string }>(collection);
    const filtered = items.filter((item) => item.id !== id);
    this.write(collection, filtered);
  }

  async query<T>(
    collection: string,
    predicate: (item: T) => boolean,
  ): Promise<T[]> {
    const items = this.read<T>(collection);
    return items.filter(predicate);
  }

  async bulkCreate<T extends { id: string }>(
    collection: string,
    newItems: T[],
  ): Promise<T[]> {
    const items = this.read<T>(collection);
    items.push(...newItems);
    this.write(collection, items);
    return newItems;
  }

  async clear(): Promise<void> {
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(STORAGE_PREFIX)) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach((key) => localStorage.removeItem(key));
    } catch (e) {
      console.error("[LocalStorageAdapter] clear error:", e);
    }
  }
}
