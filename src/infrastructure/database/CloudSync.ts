/**
 * Drive appDataFolder I/O for online sync (Phase 19, T-146).
 *
 * Mirrors the FolderSync shape: every method degrades to a caller-safe
 * null/false — nothing here ever throws into persistence callers.
 * Remote layout: `moneyflows.db` + `moneyflows.db.sha256` sidecar.
 */
import { digestHex } from './storage/sha256';

const DRIVE_FILES = 'https://www.googleapis.com/drive/v3/files';
const DRIVE_UPLOAD = 'https://www.googleapis.com/upload/drive/v3/files';
const APPDATA = 'appDataFolder';

export const CLOUD_DB_FILE = 'moneyflows.db';
export const CLOUD_HASH_FILE = 'moneyflows.db.sha256';

export interface CloudDownload {
  data: Uint8Array;
  hash: string;
}

/**
 * Pure sync-direction decision (Guards 2 + 4). `lastSyncHash` is the DB hash at
 * the last successful upload (undefined = never synced).
 * - local unchanged since sync → pull only when remote moved, else idle.
 * - local changed → upload, unless remote also moved → conflict (never auto-win).
 * - fresh device → pull when remote exists, else idle (empty schema never seeds).
 */
export type CloudAction = 'idle' | 'upload' | 'pull' | 'conflict';

export function decideSyncAction(args: {
  hasLocal: boolean;
  localHash: string;
  remoteHash: string | null;
  lastSyncHash?: string;
}): CloudAction {
  const { hasLocal, localHash, remoteHash, lastSyncHash } = args;
  if (!hasLocal) return remoteHash ? 'pull' : 'idle';
  const localChanged = lastSyncHash === undefined ? true : localHash !== lastSyncHash;
  const remoteChanged = remoteHash !== null && remoteHash !== lastSyncHash;
  if (!localChanged) return remoteChanged ? 'pull' : 'idle';
  if (!remoteChanged) return 'upload';
  return 'conflict';
}

interface CloudMeta {
  hash: string;
  at: number;
}

const META_DB = 'moneyflows_cloud_sync';
const META_STORE = 'meta';
const META_KEY = 'sync_meta';
const metaMemory = new Map<string, CloudMeta>();

function openMetaDb(): Promise<IDBDatabase | null> {
  if (typeof indexedDB === 'undefined') return Promise.resolve(null);
  return new Promise((resolve) => {
    try {
      const req = indexedDB.open(META_DB, 1);
      req.onupgradeneeded = () => req.result.createObjectStore(META_STORE);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

/** Hash of the DB at the last successful upload (undefined = never synced). */
export async function getLastSyncMeta(): Promise<CloudMeta | null> {
  const mem = metaMemory.get(META_KEY);
  if (mem) return mem;
  const db = await openMetaDb();
  if (!db) return null;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(META_STORE, 'readonly');
      const req = tx.objectStore(META_STORE).get(META_KEY);
      req.onsuccess = () => { db.close(); resolve((req.result as CloudMeta | undefined) ?? null); };
      req.onerror = () => { db.close(); resolve(null); };
    } catch {
      db.close();
      resolve(null);
    }
  });
}

export async function setLastSyncMeta(meta: CloudMeta): Promise<void> {
  metaMemory.set(META_KEY, meta);
  const db = await openMetaDb();
  if (!db) return;
  await new Promise<void>((resolve) => {
    try {
      const tx = db.transaction(META_STORE, 'readwrite');
      tx.objectStore(META_STORE).put(meta, META_KEY);
      tx.oncomplete = () => { db.close(); resolve(); };
      tx.onerror = () => { db.close(); resolve(); };
    } catch {
      db.close();
      resolve();
    }
  });
}

/** Test hook — clears the in-memory meta (IDB persists across reloads by design). */
export function resetCloudMetaForTests(): void {
  metaMemory.delete(META_KEY);
}

interface DriveFileEntry {
  id: string;
}

function authHeaders(token: string): Record<string, string> {
  return { Authorization: `Bearer ${token}` };
}

async function findFileId(token: string, name: string): Promise<string | null> {
  const q = encodeURIComponent(`'${APPDATA}' in parents and name='${name}' and trashed=false`);
  const res = await fetch(`${DRIVE_FILES}?q=${q}&spaces=${APPDATA}&fields=files(id)`, {
    headers: authHeaders(token),
  });
  if (!res.ok) throw new Error(`drive list ${res.status}`);
  const body = (await res.json()) as { files?: DriveFileEntry[] };
  return body.files?.[0]?.id ?? null;
}

async function uploadNew(token: string, name: string, mime: string, bytes: Uint8Array): Promise<void> {
  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify({ name, parents: [APPDATA] })], { type: 'application/json' }));
  form.append('media', new Blob([bytes as unknown as BlobPart], { type: mime }));
  const res = await fetch(`${DRIVE_UPLOAD}?uploadType=multipart`, {
    method: 'POST',
    headers: authHeaders(token),
    body: form,
  });
  if (!res.ok) throw new Error(`drive upload ${res.status}`);
}

async function updateFile(token: string, id: string, mime: string, bytes: Uint8Array): Promise<void> {
  const res = await fetch(`${DRIVE_UPLOAD}/${id}?uploadType=media`, {
    method: 'PATCH',
    headers: { ...authHeaders(token), 'Content-Type': mime },
    body: bytes as unknown as BodyInit,
  });
  if (!res.ok) throw new Error(`drive update ${res.status}`);
}

async function upsert(token: string, name: string, mime: string, bytes: Uint8Array): Promise<void> {
  const id = await findFileId(token, name);
  if (id) await updateFile(token, id, mime, bytes);
  else await uploadNew(token, name, mime, bytes);
}

const textEncoder = (s: string): Uint8Array => new TextEncoder().encode(s);

export class CloudSync {
  /** Uploads DB + hash sidecar. True on success; false on any failure. */
  async sync(token: string, data: Uint8Array, hash: string): Promise<boolean> {
    try {
      await upsert(token, CLOUD_DB_FILE, 'application/x-sqlite3', data);
      await upsert(token, CLOUD_HASH_FILE, 'text/plain', textEncoder(hash));
      return true;
    } catch {
      return false;
    }
  }

  /** Metadata-only remote hash (bytes, not the full DB). Null when absent/offline. */
  async remoteHash(token: string): Promise<string | null> {
    try {
      const id = await findFileId(token, CLOUD_HASH_FILE);
      if (!id) return null;
      const res = await fetch(`${DRIVE_FILES}/${id}?alt=media`, { headers: authHeaders(token) });
      if (!res.ok) return null;
      const text = (await res.text()).trim();
      return text || null;
    } catch {
      return null;
    }
  }

  /** Verified download: bytes whose digest matches the remote sidecar. */
  async download(token: string): Promise<CloudDownload | null> {
    try {
      const [id, hash] = await Promise.all([findFileId(token, CLOUD_DB_FILE), this.remoteHash(token)]);
      if (!id || !hash) return null;
      const res = await fetch(`${DRIVE_FILES}/${id}?alt=media`, { headers: authHeaders(token) });
      if (!res.ok) return null;
      const data = new Uint8Array(await res.arrayBuffer());
      if ((await digestHex(data)) !== hash) return null;
      return { data, hash };
    } catch {
      return null;
    }
  }
}

export const cloudSync = new CloudSync();
