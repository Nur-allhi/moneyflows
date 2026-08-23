import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { digestHex, fastFingerprint, subtleReady } from '../sha256';
import { toBase64 } from '../bytes';
import { LocalStorageAdapter } from '../localStorageAdapter';
import { StorageCorruptError, StorageWriteError } from '../types';

const enc = (s: string) => new TextEncoder().encode(s);

describe('digest', () => {
  it('is deterministic for identical input', async () => {
    const bytes = enc('MoneyFlows integrity sample');
    expect(await digestHex(bytes)).toBe(await digestHex(bytes.slice()));
  });

  it('differs for different inputs', async () => {
    expect(await digestHex(enc('a'))).not.toBe(await digestHex(enc('b')));
  });

  it('fastFingerprint is stable and length-prefixed-safe', () => {
    expect(fastFingerprint(enc('abc'))).toBe(fastFingerprint(enc('abc')));
    expect(fastFingerprint(enc('abc'))).toMatch(/^f:[0-9a-f]{16}$/);
    expect(fastFingerprint(enc('abcd'))).not.toBe(fastFingerprint(enc('abc')));
  });

  it('uses real SHA-256 when crypto.subtle is available', async () => {
    if (!subtleReady()) return; // insecure-origin CI would take the FNV path
    const hex = await digestHex(enc('abc'));
    expect(hex).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
  });
});

type Store = Record<string, string>;
function installFakeLocalStorage(store: Store, failWrites?: () => boolean) {
  const shim = {
    getItem: (k: string) => (k in store ? store[k] : null),
    setItem: (k: string, v: string) => {
      if (failWrites?.()) throw new DOMException('quota', 'QuotaExceededError');
      store[k] = v;
    },
    removeItem: (k: string) => { delete store[k]; },
    clear: () => { for (const k of Object.keys(store)) delete store[k]; },
  };
  vi.stubGlobal('localStorage', shim);
  return store;
}

const CONFIG = { mainKey: 'mf_test_db', snapshotPrefix: 'mf_test_snap_', maxSnapshots: 5 };

describe('LocalStorageAdapter', () => {
  beforeEach(() => { vi.unstubAllGlobals(); });
  afterEach(() => { vi.unstubAllGlobals(); });

  it('readMain returns null on fresh storage and roundtrips bytes', async () => {
    const store = installFakeLocalStorage({});
    const a = new LocalStorageAdapter(CONFIG);
    await a.init();
    expect(await a.readMain()).toBeNull();
    const bytes = enc('hello db');
    await a.writeMain(bytes);
    expect(await a.readMain()).toEqual(bytes);
    expect(store[CONFIG.mainKey]).toBe(toBase64(bytes));
  });

  it('throws StorageCorruptError on undecodable main record', async () => {
    installFakeLocalStorage({ [CONFIG.mainKey]: '!!!not-base64!!!' });
    const a = new LocalStorageAdapter(CONFIG);
    await expect(a.readMain()).rejects.toBeInstanceOf(StorageCorruptError);
  });

  it('wraps quota failures in StorageWriteError', async () => {
    let failing = false;
    installFakeLocalStorage({}, () => failing);
    const a = new LocalStorageAdapter(CONFIG);
    failing = true;
    await expect(a.writeMain(enc('data'))).rejects.toBeInstanceOf(StorageWriteError);
  });

  it('roundtrips snapshots and flags damaged ones', async () => {
    installFakeLocalStorage({});
    const a = new LocalStorageAdapter(CONFIG);
    const rec = { data: enc('snapshot-0'), hash: 'deadbeef', time: '2026-08-23T00:00:00Z' };
    await a.writeSnapshot(0, rec);
    expect(await a.readSnapshot(0)).toEqual(rec);
    await a.deleteSnapshot(0);
    expect(await a.readSnapshot(0)).toBeNull();

    installFakeLocalStorage({ [CONFIG.snapshotPrefix + '0']: JSON.stringify({ time: rec.time }) });
    await expect(a.readSnapshot(0)).rejects.toBeInstanceOf(StorageCorruptError);
  });

  it('clearAll removes main and every snapshot slot', async () => {
    const store = installFakeLocalStorage({});
    const a = new LocalStorageAdapter(CONFIG);
    await a.writeMain(enc('db'));
    for (let i = 0; i < CONFIG.maxSnapshots; i++) {
      await a.writeSnapshot(i, { data: enc(`s${i}`), hash: 'h', time: 't' });
    }
    await a.clearAll();
    expect(Object.keys(store)).toHaveLength(0);
  });
});
