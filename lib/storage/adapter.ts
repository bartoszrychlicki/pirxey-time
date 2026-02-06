export interface StorageAdapter {
  getAll<T>(collection: string): Promise<T[]>;
  getById<T>(collection: string, id: string): Promise<T | null>;
  create<T extends { id: string }>(collection: string, item: T): Promise<T>;
  update<T extends { id: string }>(
    collection: string,
    id: string,
    updates: Partial<T>,
  ): Promise<T>;
  delete(collection: string, id: string): Promise<void>;
  query<T>(
    collection: string,
    predicate: (item: T) => boolean,
  ): Promise<T[]>;
  bulkCreate<T extends { id: string }>(
    collection: string,
    items: T[],
  ): Promise<T[]>;
  clear(): Promise<void>;
}
