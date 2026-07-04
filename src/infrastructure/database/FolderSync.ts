/* eslint-disable @typescript-eslint/no-explicit-any */
const DB_NAME = 'moneyflows_folder_sync';
const STORE_NAME = 'handles';
const HANDLE_KEY = 'moneyflows_folder_handle';
const SUBDIR = 'MoneyFlows';
const FILE_NAME = 'moneyflows.db';
const TMP_NAME = 'moneyflows.tmp';

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE_NAME);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
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
      const tmpFile = await dir.getFileHandle(TMP_NAME, { create: true });
      const tmpStream = await tmpFile.createWritable();
      await (tmpStream as any).write(data);
      await tmpStream.close();
      try { await dir.removeEntry(FILE_NAME); } catch { /* may not exist */ }
      const finalFile = await dir.getFileHandle(FILE_NAME, { create: true });
      const finalStream = await finalFile.createWritable();
      await (finalStream as any).write(data);
      await finalStream.close();
      try { await dir.removeEntry(TMP_NAME); } catch { /* best-effort cleanup */ }
    } catch { /* never block caller */ }
  }

  async load(): Promise<Uint8Array | null> {
    const h = await this.getFolderHandle();
    if (!h) return null;
    const ok = await this.hasPermission();
    if (!ok) return null;
    try {
      const dir = await h.getDirectoryHandle(SUBDIR);
      const file = await dir.getFileHandle(FILE_NAME);
      const blob = await file.getFile();
      return new Uint8Array(await blob.arrayBuffer());
    } catch { return null; }
  }
}

export const folderSync = new FolderSync();
