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
