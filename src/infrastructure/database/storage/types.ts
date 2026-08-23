/** Persistence adapter contracts for the storage layer (see docs/plans/STORAGE_OPFS_MIGRATION.md). */

export interface SnapshotRecord {
  data: Uint8Array;
  hash: string;
  time: string;
}

export interface StorageUsage {
  usage: number;
  quota: number;
}

export type StorageBackend = 'opfs' | 'localStorage';

export class StorageCorruptError extends Error {
  constructor(detail: string) {
    super(`Stored data is unreadable: ${detail}`);
    this.name = 'StorageCorruptError';
  }
}

export class StorageWriteError extends Error {
  constructor(detail: string) {
    super(`Could not persist data: ${detail}`);
    this.name = 'StorageWriteError';
  }
}

export interface IPersistenceAdapter {
  readonly backend: StorageBackend;
  init(): Promise<void>;
  /** Returns null when nothing has been stored yet (fresh install). Throws StorageCorruptError on undecodable data. */
  readMain(): Promise<Uint8Array | null>;
  writeMain(data: Uint8Array): Promise<void>;
  clearAll(): Promise<void>;
  readSnapshot(index: number): Promise<SnapshotRecord | null>;
  writeSnapshot(index: number, record: SnapshotRecord): Promise<void>;
  deleteSnapshot(index: number): Promise<void>;
  usageEstimate(): Promise<StorageUsage | null>;
}
