import { LocalStorageAdapter } from './localStorageAdapter';
import { OpfsAdapter } from './opfsAdapter';
import type { IPersistenceAdapter, SnapshotRecord } from './types';
import { digestHex } from './sha256';

export * from './types';
export { digestHex, fastFingerprint, subtleReady } from './sha256';
export { LocalStorageAdapter } from './localStorageAdapter';
export { OpfsAdapter } from './opfsAdapter';

const STORAGE_VERSION_FLAG = 'moneyflows_storage';

interface LockManagerCompat {
  request?: (name: string, callback: () => Promise<unknown>) => Promise<unknown>;
}

/** Single-writer guard across tabs when the Web Locks API is available. */
export function withStorageLock<T>(fn: () => Promise<T>): Promise<T> {
  const locks = (typeof navigator !== 'undefined' ? (navigator as unknown as { locks?: LockManagerCompat }).locks : undefined);
  if (locks?.request) {
    return locks.request('moneyflows-db-write', fn) as Promise<T>;
  }
  return fn();
}

export interface StorageInitResult {
  adapter: IPersistenceAdapter;
  backend: IPersistenceAdapter['backend'];
  migratedFromLocalStorage: boolean;
}

function localStorageSupported(): boolean {
  try {
    return typeof localStorage !== 'undefined';
  } catch {
    return false;
  }
}

/**
 * Picks the best available backend and performs the one-time migration
 * localStorage -> OPFS (main DB + newest verifiable snapshot). The localStorage
 * copy is left untouched and mirrored into afterwards (transition safety net).
 */
export async function createStorageAdapter(config: {
  mainKey: string;
  snapshotPrefix: string;
  maxSnapshots: number;
}): Promise<StorageInitResult> {
  if (OpfsAdapter.supported()) {
    try {
      const local = new LocalStorageAdapter(config);
      const opfs = new OpfsAdapter({ maxSnapshots: config.maxSnapshots });
      await opfs.init();

      let migrated = false;
      const existing = await opfs.readMain();
      if (!existing && localStorageSupported()) {
        try {
          const legacy = await local.readMain();
          if (legacy) {
            await opfs.writeMain(legacy);
            migrated = true;
            const newest = await findNewestValidSnapshot(local, config.maxSnapshots);
            if (newest) {
              await opfs.writeSnapshot(0, newest);
              for (let i = 1; i < config.maxSnapshots; i++) await opfs.deleteSnapshot(i);
            }
          }
        } catch {
          // Legacy copy unreadable: start fresh on OPFS, leave LS untouched for manual recovery.
        }
      }
      // Mirror only when the legacy copy still holds decodable data — protects it
      // from being clobbered by fresh/recovery flushes.
      if (localStorageSupported()) {
        try {
          if (await local.readMain()) opfs.enableMirror(local);
        } catch { /* leave mirror off */ }
      }
      try { localStorage.setItem(STORAGE_VERSION_FLAG, 'v2-opfs'); } catch { /* private mode etc. */ }
      return { adapter: opfs, backend: 'opfs', migratedFromLocalStorage: migrated };
    } catch {
      // OPFS init failed unexpectedly -> fall through to localStorage.
    }
  }
  const adapter = new LocalStorageAdapter(config);
  await adapter.init();
  return { adapter, backend: 'localStorage', migratedFromLocalStorage: false };
}

async function findNewestValidSnapshot(adapter: IPersistenceAdapter, max: number): Promise<SnapshotRecord | null> {
  for (let i = 0; i < max; i++) {
    try {
      const rec = await adapter.readSnapshot(i);
      if (!rec) continue;
      if ((await digestHex(rec.data)) === rec.hash) return rec;
    } catch { /* skip damaged slot */ }
  }
  return null;
}
