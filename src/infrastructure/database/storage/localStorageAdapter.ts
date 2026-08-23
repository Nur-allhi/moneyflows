import type { IPersistenceAdapter, SnapshotRecord, StorageBackend, StorageUsage } from './types';
import { StorageCorruptError, StorageWriteError } from './types';
import { fromBase64, toBase64 } from './bytes';

export interface LocalStorageAdapterConfig {
  mainKey: string;
  snapshotPrefix: string;
  maxSnapshots: number;
}

function isQuotaError(e: unknown): boolean {
  return e instanceof DOMException && (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED');
}

/** Hardened version of the original localStorage persistence (BUG-7 fixes). */
export class LocalStorageAdapter implements IPersistenceAdapter {
  readonly backend: StorageBackend = 'localStorage';

  constructor(private readonly config: LocalStorageAdapterConfig) {}

  async init(): Promise<void> { /* nothing to prepare */ }

  private snapshotKey(index: number): string {
    return `${this.config.snapshotPrefix}${index}`;
  }

  async readMain(): Promise<Uint8Array | null> {
    const saved = localStorage.getItem(this.config.mainKey);
    if (saved == null) return null;
    return fromBase64(saved, 'main database record');
  }

  async writeMain(data: Uint8Array): Promise<void> {
    const encoded = toBase64(data);
    try {
      localStorage.setItem(this.config.mainKey, encoded);
    } catch (e) {
      if (isQuotaError(e)) throw new StorageWriteError('storage quota exceeded');
      throw new StorageWriteError(e instanceof Error ? e.message : String(e));
    }
  }

  async clearAll(): Promise<void> {
    localStorage.removeItem(this.config.mainKey);
    for (let i = 0; i < this.config.maxSnapshots; i++) {
      localStorage.removeItem(this.snapshotKey(i));
    }
  }

  async readSnapshot(index: number): Promise<SnapshotRecord | null> {
    const raw = localStorage.getItem(this.snapshotKey(index));
    if (raw == null) return null;
    let parsed: { data?: string; hash?: string; time?: string };
    try {
      parsed = JSON.parse(raw);
    } catch {
      throw new StorageCorruptError(`snapshot ${index} is not valid JSON`);
    }
    if (!parsed?.data || !parsed?.hash || !parsed?.time) {
      throw new StorageCorruptError(`snapshot ${index} is missing fields`);
    }
    return { data: fromBase64(parsed.data, `snapshot ${index}`), hash: parsed.hash, time: parsed.time };
  }

  async writeSnapshot(index: number, record: SnapshotRecord): Promise<void> {
    const payload = JSON.stringify({
      data: toBase64(record.data),
      hash: record.hash,
      time: record.time,
    });
    try {
      localStorage.setItem(this.snapshotKey(index), payload);
    } catch (e) {
      if (isQuotaError(e)) throw new StorageWriteError(`snapshot slot ${index}: storage quota exceeded`);
      throw new StorageWriteError(e instanceof Error ? e.message : String(e));
    }
  }

  async deleteSnapshot(index: number): Promise<void> {
    localStorage.removeItem(this.snapshotKey(index));
  }

  async usageEstimate(): Promise<StorageUsage | null> {
    if (typeof navigator === 'undefined' || !navigator.storage?.estimate) return null;
    const est = await navigator.storage.estimate();
    if (!est) return null;
    return { usage: est.usage ?? 0, quota: est.quota ?? 0 };
  }
}
