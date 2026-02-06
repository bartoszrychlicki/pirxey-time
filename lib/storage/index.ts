export type { StorageAdapter } from "./adapter";
export { LocalStorageAdapter } from "./local-storage-adapter";

import { LocalStorageAdapter } from "./local-storage-adapter";
import type { StorageAdapter } from "./adapter";

let instance: StorageAdapter | undefined;

export function getStorage(): StorageAdapter {
  if (!instance) {
    instance = new LocalStorageAdapter();
  }
  return instance;
}
