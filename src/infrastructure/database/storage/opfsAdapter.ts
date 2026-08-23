import type { IPersistenceAdapter, SnapshotRecord, StorageBackend, StorageUsage } from './types';

export interface OpfsAdapterOptions {
  mainFileName?: string;
  snapshotDirName?: string;
  maxSnapshots: number;
}

/**
 * OPFS backend: stores the database as a real binary file plus a snapshots/
 * directory. Writes are exclusive-locked by the browser, quota is the normal
 * disk pool instead of the tiny localStorage budget.
 *
 * The optional transition mirror is OFF until `enableMirror()` is called after
 * a verified legacy import — so fresh installs or recovery flushes can never
 * overwrite the untouched localStorage copy with empty data.
 */
export class OpfsAdapter implements IPersistenceAdapter {
  readonly backend: StorageBackend = 'opfs';
  private root: FileSystemDirectoryHandle | null = null;
  private snapshotsDir: FileSystemDirectoryHandle | null = null;
  private mirrorAdapter: IPersistenceAdapter | null = null;

  constructor(private readonly options: OpfsAdapterOptions) {}

  static supported(): boolean {
    return typeof navigator !== 'undefined'
      && !!navigator.storage
      && typeof navigator.storage.getDirectory === 'function';
  }

  async init(): Promise<void> {
    this.root = await navigator.storage.getDirectory();
    this.snapshotsDir = await this.root.getDirectoryHandle(this.options.snapshotDirName ?? 'snapshots', { create: true });
    try {
      // Reduce the chance of the browser evicting our storage under pressure.
      await navigator.storage.persist();
    } catch { /* best effort */ }
  }

  private async mainFile(): Promise<FileSystemFileHandle> {
    return this.root!.getFileHandle(this.options.mainFileName ?? 'money_flows.db', { create: true });
  }

  async readMain(): Promise<Uint8Array | null> {
    try {
      const handle = await this.mainFile();
      const file = await handle.getFile();
      const buffer = await file.arrayBuffer();
      // A freshly-created handle reports a 0-byte file — treat as fresh install.
      if (buffer.byteLength === 0) return null;
      return new Uint8Array(buffer);
    } catch (e) {
      if (e instanceof DOMException && e.name === 'NotFoundError') return null;
      throw e;
    }
  }

  /** Activate the localStorage transition mirror (after verified legacy import/load). */
  enableMirror(adapter: IPersistenceAdapter): void {
    this.mirrorAdapter = adapter;
  }

  private async mirrorWrite(data: Uint8Array): Promise<void> {
    if (!this.mirrorAdapter) return;
    try { await this.mirrorAdapter.writeMain(data); } catch { /* best-effort */ }
  }

  async writeMain(data: Uint8Array): Promise<void> {
    const handle = await this.mainFile();
    const writable = await handle.createWritable({ keepExistingData: false });
    try {
      await writable.write(data as unknown as BufferSource);
      await writable.close();
    } catch (e) {
      try { await writable.abort(); } catch { /* already closed */ }
      throw e;
    }
    await this.mirrorWrite(data);
  }

  async clearAll(): Promise<void> {
    for (let i = 0; i < this.options.maxSnapshots; i++) {
      await this.deleteSnapshot(i);
    }
    await this.root!.removeEntry(this.options.mainFileName ?? 'money_flows.db').catch(() => {});
  }

  private async openExistingSnapshot(index: number, ext: string): Promise<FileSystemFileHandle | null> {
    try {
      return await this.snapshotsDir!.getFileHandle(`${index}${ext}`);
    } catch (e) {
      if (e instanceof DOMException && e.name === 'NotFoundError') return null;
      throw e;
    }
  }

  private async createSnapshotFile(index: number, ext: string): Promise<FileSystemFileHandle> {
    return this.snapshotsDir!.getFileHandle(`${index}${ext}`, { create: true });
  }

  async readSnapshot(index: number): Promise<SnapshotRecord | null> {
    const binHandle = await this.openExistingSnapshot(index, '.db');
    if (!binHandle) return null;
    const metaHandle = await this.openExistingSnapshot(index, '.json');
    if (!metaHandle) return null;
    const bytes = new Uint8Array(await (await binHandle.getFile()).arrayBuffer());
    const meta = JSON.parse(await (await metaHandle.getFile()).text()) as { hash: string; time: string };
    return { data: bytes, hash: meta.hash, time: meta.time };
  }

  async writeSnapshot(index: number, record: SnapshotRecord): Promise<void> {
    const binHandle = await this.createSnapshotFile(index, '.db');
    const w1 = await binHandle.createWritable({ keepExistingData: false });
    await w1.write(record.data as unknown as BufferSource);
    await w1.close();
    const metaHandle = await this.createSnapshotFile(index, '.json');
    const w2 = await metaHandle.createWritable({ keepExistingData: false });
    await w2.write(JSON.stringify({ hash: record.hash, time: record.time }));
    await w2.close();
  }

  async deleteSnapshot(index: number): Promise<void> {
    await this.snapshotsDir!.removeEntry(`${index}.db`).catch(() => {});
    await this.snapshotsDir!.removeEntry(`${index}.json`).catch(() => {});
  }

  async usageEstimate(): Promise<StorageUsage | null> {
    const est = await navigator.storage.estimate();
    if (!est) return null;
    return { usage: est.usage ?? 0, quota: est.quota ?? 0 };
  }
}
