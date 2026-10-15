import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CloudSync, CLOUD_DB_FILE, CLOUD_HASH_FILE, decideSyncAction, effectiveHasLocal } from '../CloudSync';
import { digestHex } from '../storage/sha256';

const enc = (s: string) => new TextEncoder().encode(s);

/** Queued fetch mock: each entry is a responder for one call, in order. */
type Responder = (url: string, init?: RequestInit) => Response | Promise<Response>;
const queue: Responder[] = [];
const calls: { url: string; init?: RequestInit }[] = [];

function jsonBody(obj: unknown, status = 200): Response {
  return new Response(JSON.stringify(obj), { status });
}

function installFetchMock() {
  vi.stubGlobal('fetch', vi.fn(async (url: string, init?: RequestInit) => {
    calls.push({ url, init });
    const next = queue.shift();
    if (!next) throw new Error(`unexpected fetch: ${url}`);
    return next(url, init);
  }));
}

const listEmpty = () => jsonBody({ files: [] });
const listOne = (id: string) => jsonBody({ files: [{ id }] });

beforeEach(() => {
  queue.length = 0;
  calls.length = 0;
  installFetchMock();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('CloudSync (T-146)', () => {
  it('sync creates DB + sidecar when remote is empty', async () => {
    const data = enc('fake-sqlite-bytes');
    const hash = await digestHex(data);
    queue.push(
      async () => listEmpty(), // find DB
      async () => jsonBody({ id: 'db-id' }), // create DB
      async () => listEmpty(), // find sidecar
      async () => jsonBody({ id: 'hash-id' }), // create sidecar
    );
    await expect(new CloudSync().sync('tok', data, hash)).resolves.toBe(true);
    const urls = calls.map((c) => c.url);
    expect(urls.some((u) => u.includes('uploadType=multipart'))).toBe(true);
    // Authorization header present on every call.
    for (const c of calls) {
      expect((c.init?.headers as Record<string, string>).Authorization).toBe('Bearer tok');
    }
  });

  it('sync updates existing files instead of creating', async () => {
    const data = enc('v2-bytes');
    queue.push(
      async () => listOne('db-id'),
      async () => new Response('', { status: 200 }), // PATCH db
      async () => listOne('hash-id'),
      async () => new Response('', { status: 200 }), // PATCH sidecar
    );
    await expect(new CloudSync().sync('tok', data, 'h')).resolves.toBe(true);
    expect(calls.some((c) => c.url.includes('/db-id?uploadType=media') && c.init?.method === 'PATCH')).toBe(true);
  });

  it('sync returns false (never throws) when offline', async () => {
    queue.push(async () => { throw new TypeError('offline'); });
    await expect(new CloudSync().sync('tok', enc('x'), 'h')).resolves.toBe(false);
  });

  it('remoteHash reads the sidecar without downloading the DB', async () => {
    queue.push(
      async () => listOne('hash-id'),
      async () => new Response('  abc123\n', { status: 200 }),
    );
    await expect(new CloudSync().remoteHash('tok')).resolves.toBe('abc123');
    expect(calls).toHaveLength(2);
    expect(calls.every((c) => !c.url.includes(CLOUD_DB_FILE) || c.url.includes('name%3D'))).toBe(true);
  });

  it('remoteHash returns null when never synced', async () => {
    queue.push(async () => listEmpty());
    await expect(new CloudSync().remoteHash('tok')).resolves.toBeNull();
  });

  it('download verifies bytes against the sidecar', async () => {
    const data = enc('real-db-bytes');
    const hash = await digestHex(data);
    queue.push(
      async () => listOne('db-id'), // find DB
      async () => listOne('hash-id'), // find sidecar
      async () => new Response(hash, { status: 200 }), // sidecar content
      async () => new Response(data as unknown as BodyInit, { status: 200 }), // db bytes
    );
    const dl = await new CloudSync().download('tok');
    expect(dl?.hash).toBe(hash);
    expect(new TextDecoder().decode(dl?.data)).toBe('real-db-bytes');
  });

  it('download returns null on hash mismatch (corrupt remote skipped)', async () => {
    const data = enc('tampered-bytes');
    queue.push(
      async () => listOne('db-id'),
      async () => listOne('hash-id'),
      async () => new Response('different-hash', { status: 200 }),
      async () => new Response(data as unknown as BodyInit, { status: 200 }),
    );
    await expect(new CloudSync().download('tok')).resolves.toBeNull();
  });

  it('download returns null when offline and never throws', async () => {
    queue.push(async () => { throw new TypeError('offline'); });
    await expect(new CloudSync().download('tok')).resolves.toBeNull();
    await expect(new CloudSync().remoteHash('tok')).resolves.toBeNull();
  });

  it('uses the expected remote filenames', () => {
    expect(CLOUD_DB_FILE).toBe('moneyflows.db');
    expect(CLOUD_HASH_FILE).toBe('moneyflows.db.sha256');
  });
});

describe('decideSyncAction (T-147, Guards 2 + 4)', () => {
  it('fresh device pulls when remote exists, idles otherwise (empty never seeds)', () => {
    expect(decideSyncAction({ hasLocal: false, localHash: 'e', remoteHash: 'r' })).toBe('pull');
    expect(decideSyncAction({ hasLocal: false, localHash: 'e', remoteHash: null })).toBe('idle');
  });

  it('clean local pulls a newer remote, idles when in sync', () => {
    expect(decideSyncAction({ hasLocal: true, localHash: 'a', remoteHash: 'b', lastSyncHash: 'a' })).toBe('pull');
    expect(decideSyncAction({ hasLocal: true, localHash: 'a', remoteHash: 'a', lastSyncHash: 'a' })).toBe('idle');
    expect(decideSyncAction({ hasLocal: true, localHash: 'a', remoteHash: null, lastSyncHash: 'a' })).toBe('idle');
  });

  it('changed local uploads when remote is untouched', () => {
    expect(decideSyncAction({ hasLocal: true, localHash: 'b', remoteHash: 'a', lastSyncHash: 'a' })).toBe('upload');
    expect(decideSyncAction({ hasLocal: true, localHash: 'b', remoteHash: null, lastSyncHash: 'a' })).toBe('upload');
  });

  it('both sides moved → conflict, never auto-win', () => {
    expect(decideSyncAction({ hasLocal: true, localHash: 'b', remoteHash: 'c', lastSyncHash: 'a' })).toBe('conflict');
  });

  it('never synced + remote exists + local changed → conflict', () => {
    expect(decideSyncAction({ hasLocal: true, localHash: 'b', remoteHash: 'r' })).toBe('conflict');
  });

  it('never synced + no remote → upload (first backup)', () => {
    expect(decideSyncAction({ hasLocal: true, localHash: 'b', remoteHash: null })).toBe('upload');
  });
});

describe('effectiveHasLocal (T-152 fresh-device rule)', () => {
  it('empty + never synced counts as no local side → auto-pull, never conflict', () => {
    expect(effectiveHasLocal(true)).toBe(false);
    expect(decideSyncAction({ hasLocal: effectiveHasLocal(true), localHash: 'e', remoteHash: 'r' })).toBe('pull');
    expect(decideSyncAction({ hasLocal: effectiveHasLocal(true), localHash: 'e', remoteHash: null })).toBe('idle');
  });

  it('emptied after syncing stays a real local side → conflict, not silent pull', () => {
    expect(effectiveHasLocal(true, 'old')).toBe(true);
    expect(decideSyncAction({ hasLocal: effectiveHasLocal(true, 'old'), localHash: 'e', remoteHash: 'r', lastSyncHash: 'old' })).toBe('conflict');
  });

  it('non-empty local is always a real local side', () => {
    expect(effectiveHasLocal(false)).toBe(true);
    expect(effectiveHasLocal(false, 'old')).toBe(true);
  });
});
