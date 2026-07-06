/* eslint-disable @typescript-eslint/no-explicit-any */
const DB_NAME = 'moneyflows_folder_sync';
const STORE_NAME = 'handles';
const HANDLE_KEY = 'moneyflows_folder_handle';
const SUBDIR = 'MoneyFlows';
const OLD_FILE = 'moneyflows.db';
const OLD_TMP = 'moneyflows.tmp';
const FILE_PREFIX = 'moneyflows-';
const MAX_FILES = 10;

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE_NAME);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function timestampName(): string {
  const n = new Date();
  const y = n.getFullYear().toString();
  const M = (n.getMonth() + 1).toString().padStart(2, '0');
  const d = n.getDate().toString().padStart(2, '0');
  const h = n.getHours().toString().padStart(2, '0');
  const m = n.getMinutes().toString().padStart(2, '0');
  const s = n.getSeconds().toString().padStart(2, '0');
  return `${FILE_PREFIX}${y}${M}${d}-${h}${m}${s}.db`;
}

export const isFsaSupported = typeof window !== 'undefined' && 'showDirectoryPicker' in window;

export class FolderSync {
  private handle: FileSystemDirectoryHandle | null = null;

  async setFolder(h: FileSystemDirectoryHandle): Promise<void> {
    this.handle = h;
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).put(h, HANDLE_KEY);
      tx.oncomplete = () => { db.close(); resolve(); };
      tx.onerror = () => { db.close(); reject(tx.error); };
    });
  }

  async getFolderHandle(): Promise<FileSystemDirectoryHandle | null> {
    if (this.handle) return this.handle;
    const db = await openDb();
    const handle = await new Promise<FileSystemDirectoryHandle | undefined>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const req = tx.objectStore(STORE_NAME).get(HANDLE_KEY);
      req.onsuccess = () => { db.close(); resolve(req.result); };
      req.onerror = () => { db.close(); reject(req.error); };
    });
    this.handle = handle ?? null;
    return this.handle;
  }

  async hasPermission(): Promise<boolean> {
    const h = await this.getFolderHandle();
    if (!h) return false;
    return (await (h as any).queryPermission({ mode: 'readwrite' })) === 'granted';
  }

  async requestPermission(): Promise<boolean> {
    const h = await this.getFolderHandle();
    if (!h) return false;
    return (await (h as any).requestPermission({ mode: 'readwrite' })) === 'granted';
  }

  async clearHandle(): Promise<void> {
    this.handle = null;
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).delete(HANDLE_KEY);
      tx.oncomplete = () => { db.close(); resolve(); };
      tx.onerror = () => { db.close(); reject(tx.error); };
    });
  }

  async sync(data: Uint8Array): Promise<void> {
    const h = await this.getFolderHandle();
    if (!h) return;
    const ok = await this.hasPermission();
    if (!ok) return;
    try {
      const dir = await h.getDirectoryHandle(SUBDIR, { create: true });
      const name = timestampName();
      const file = await dir.getFileHandle(name, { create: true });
      const stream = await file.createWritable({ keepExistingData: false });
      await (stream as any).write(data);
      await stream.close();
      await this._cleanup(dir);
    } catch { /* never block caller */ }
  }

  private async _cleanup(dir: FileSystemDirectoryHandle): Promise<void> {
    const entries: { name: string; handle: FileSystemFileHandle; mod: number }[] = [];
    for await (const [name, entry] of (dir as any).entries()) {
      if (entry.kind !== 'file') continue;
      if (name.startsWith(FILE_PREFIX) && name.endsWith('.db')) {
        const file = await (entry as FileSystemFileHandle).getFile();
        entries.push({ name, handle: entry as FileSystemFileHandle, mod: file.lastModified });
      }
    }
    /* Remove old single-file format */
    try { await dir.removeEntry(OLD_FILE); } catch { /* ok */ }
    try { await dir.removeEntry(OLD_TMP); } catch { /* ok */ }
    /* Keep newest MAX_FILES */
    if (entries.length <= MAX_FILES) return;
    entries.sort((a, b) => b.name.localeCompare(a.name));
    for (let i = MAX_FILES; i < entries.length; i++) {
      try { await dir.removeEntry(entries[i]!.name); } catch { /* best-effort */ }
    }
  }

  async listFiles(): Promise<{ name: string; lastModified: number }[]> {
    const h = await this.getFolderHandle();
    if (!h) return [];
    const ok = await this.hasPermission();
    if (!ok) return [];
    const result: { name: string; lastModified: number }[] = [];
    try {
      const dir = await h.getDirectoryHandle(SUBDIR);
      for await (const [name, entry] of (dir as any).entries()) {
        if (entry.kind !== 'file') continue;
        if (name.startsWith(FILE_PREFIX) && name.endsWith('.db')) {
          const file = await (entry as FileSystemFileHandle).getFile();
          result.push({ name, lastModified: file.lastModified });
        }
      }
      result.sort((a, b) => b.name.localeCompare(a.name));
    } catch { /* ignore */ }
    return result;
  }

  async loadFile(name: string): Promise<Uint8Array | null> {
    const h = await this.getFolderHandle();
    if (!h) return null;
    try {
      const dir = await h.getDirectoryHandle(SUBDIR);
      const file = await dir.getFileHandle(name);
      const blob = await file.getFile();
      return new Uint8Array(await blob.arrayBuffer());
    } catch { return null; }
  }

  async load(): Promise<Uint8Array | null> {
    const files = await this.listFiles();
    if (files.length > 0) {
      return this.loadFile(files[0]!.name);
    }
    /* Fallback: old single-file format */
    const h = await this.getFolderHandle();
    if (!h) return null;
    try {
      const dir = await h.getDirectoryHandle(SUBDIR);
      const file = await dir.getFileHandle(OLD_FILE);
      const blob = await file.getFile();
      return new Uint8Array(await blob.arrayBuffer());
    } catch { return null; }
  }
}

export const folderSync = new FolderSync();
