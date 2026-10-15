/**
 * Google sign-in for Drive appDataFolder sync (Phase 19, T-145).
 *
 * - Google Identity Services loads lazily (no npm dep, memoized like storage init).
 * - The access token lives in memory only; IndexedDB keeps { clientId, email,
 *   expiresAtMs } so silent refresh can run without persisted secrets.
 * - Minimal scopes: drive.appdata (+ openid email, needed to display the account).
 * - Every method degrades to null/no-op offline or unsigned-in — never throws
 *   into persistence callers.
 */

const GIS_SCRIPT_URL = 'https://accounts.google.com/gsi/client';
export const DRIVE_APPDATA_SCOPE = 'https://www.googleapis.com/auth/drive.appdata';
const SCOPES = `${DRIVE_APPDATA_SCOPE} openid email`;
/** Refresh proactively this far before expiry — no per-flush auth roundtrip. */
const REFRESH_SKEW_MS = 60_000;
const USERINFO_URL = 'https://www.googleapis.com/oauth2/v3/userinfo';

const IDB_DB = 'moneyflows_google_auth';
const IDB_STORE = 'auth';
const IDB_KEY = 'google_auth_state';

interface GisTokenResponse {
  access_token: string;
  expires_in: number;
  error?: string;
}

interface GisTokenClient {
  requestAccessToken: (opts?: { prompt: string }) => void;
}

interface GisOauth2 {
  initTokenClient: (config: {
    client_id: string;
    scope: string;
    callback: (response: GisTokenResponse) => void;
  }) => GisTokenClient;
  revoke: (token: string, done?: () => void) => void;
}

interface GisNamespace {
  accounts: { oauth2: GisOauth2 };
}

interface PersistedAuth {
  clientId: string;
  email: string;
  expiresAtMs: number;
}

function getGis(): GisNamespace | null {
  const g = (globalThis as unknown as { google?: GisNamespace }).google;
  return g?.accounts?.oauth2 ? g : null;
}

/** Memoized GIS script load; resolves immediately when already present (tests). */
let gisPromise: Promise<void> | null = null;
export function loadGis(): Promise<void> {
  if (getGis()) return Promise.resolve();
  if (gisPromise) return gisPromise;
  gisPromise = new Promise<void>((resolve, reject) => {
    if (typeof document === 'undefined') {
      reject(new Error('GIS unavailable: no document'));
      return;
    }
    const el = document.createElement('script');
    el.src = GIS_SCRIPT_URL;
    el.async = true;
    el.defer = true;
    el.onload = () => (getGis() ? resolve() : reject(new Error('GIS script loaded but api missing')));
    el.onerror = () => reject(new Error('GIS script failed to load'));
    document.head.appendChild(el);
  });
  gisPromise.catch(() => { gisPromise = null; });
  return gisPromise;
}

/** Test hook — resets the loader memo. */
export function resetGisLoaderForTests(): void {
  gisPromise = null;
}

/* IndexedDB with in-memory fallback (private mode, node tests). */
const memoryFallback = new Map<string, PersistedAuth>();

function openAuthDb(): Promise<IDBDatabase | null> {
  if (typeof indexedDB === 'undefined') return Promise.resolve(null);
  return new Promise((resolve) => {
    try {
      const req = indexedDB.open(IDB_DB, 1);
      req.onupgradeneeded = () => req.result.createObjectStore(IDB_STORE);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

async function idbGet(): Promise<PersistedAuth | null> {
  const mem = memoryFallback.get(IDB_KEY);
  if (mem) return mem;
  const db = await openAuthDb();
  if (!db) return null;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(IDB_STORE, 'readonly');
      const req = tx.objectStore(IDB_STORE).get(IDB_KEY);
      req.onsuccess = () => { db.close(); resolve((req.result as PersistedAuth | undefined) ?? null); };
      req.onerror = () => { db.close(); resolve(mem ?? null); };
    } catch {
      db.close();
      resolve(mem ?? null);
    }
  });
}

async function idbSet(state: PersistedAuth): Promise<void> {
  memoryFallback.set(IDB_KEY, state);
  const db = await openAuthDb();
  if (!db) return;
  await new Promise<void>((resolve) => {
    try {
      const tx = db.transaction(IDB_STORE, 'readwrite');
      tx.objectStore(IDB_STORE).put(state, IDB_KEY);
      tx.oncomplete = () => { db.close(); resolve(); };
      tx.onerror = () => { db.close(); resolve(); };
    } catch {
      db.close();
      resolve();
    }
  });
}

async function idbClear(): Promise<void> {
  memoryFallback.delete(IDB_KEY);
  const db = await openAuthDb();
  if (!db) return;
  await new Promise<void>((resolve) => {
    try {
      const tx = db.transaction(IDB_STORE, 'readwrite');
      tx.objectStore(IDB_STORE).delete(IDB_KEY);
      tx.oncomplete = () => { db.close(); resolve(); };
      tx.onerror = () => { db.close(); resolve(); };
    } catch {
      db.close();
      resolve();
    }
  });
}

export class GoogleAuth {
  private token: string | null = null;
  private expiresAtMs = 0;
  private email: string | null = null;
  private clientId: string | null = null;

  /** Last signed-in email (from persisted state); null when never signed in. */
  async getAccountEmail(): Promise<string | null> {
    if (this.email) return this.email;
    const saved = await idbGet().catch(() => null);
    this.email = saved?.email ?? null;
    this.clientId = saved?.clientId ?? this.clientId;
    return this.email;
  }

  /** Interactive sign-in. Resolves the access token; rejects when GIS fails. */
  async signIn(clientId: string): Promise<string> {
    await loadGis();
    const gis = getGis();
    if (!gis) throw new Error('Google Identity Services unavailable');
    const token = await new Promise<string>((resolve, reject) => {
      const client = gis.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: SCOPES,
        callback: (resp) => {
          if (resp.error || !resp.access_token) {
            reject(new Error(`Google sign-in failed: ${resp.error ?? 'no token'}`));
            return;
          }
          resolve(resp.access_token);
        },
      });
      try {
        client.requestAccessToken({ prompt: '' });
      } catch (e) {
        reject(e instanceof Error ? e : new Error(String(e)));
      }
    });
    const email = await this.fetchEmail(token).catch(() => '');
    this.token = token;
    this.expiresAtMs = Date.now() + 3600_000;
    this.email = email || null;
    this.clientId = clientId;
    await idbSet({ clientId, email: this.email ?? '', expiresAtMs: this.expiresAtMs });
    return token;
  }

  /**
   * Usable token or null. Refreshes silently when expired; null when signed
   * out, offline, or refresh needs UI (caller surfaces "Reconnect").
   */
  async getValidToken(): Promise<string | null> {
    if (this.token && Date.now() < this.expiresAtMs - REFRESH_SKEW_MS) return this.token;
    const saved = await idbGet().catch(() => null);
    const clientId = this.clientId ?? saved?.clientId;
    if (!clientId) return null;
    try {
      await loadGis();
    } catch {
      return null;
    }
    const gis = getGis();
    if (!gis) return null;
    try {
      const token = await new Promise<string>((resolve, reject) => {
        const client = gis.accounts.oauth2.initTokenClient({
          client_id: clientId,
          scope: SCOPES,
          callback: (resp) => {
            if (resp.error || !resp.access_token) {
              reject(new Error(resp.error ?? 'silent refresh needs UI'));
              return;
            }
            resolve(resp.access_token);
          },
        });
        client.requestAccessToken({ prompt: '' });
      });
      this.token = token;
      this.expiresAtMs = Date.now() + 3600_000;
      this.clientId = clientId;
      const email = this.email ?? saved?.email ?? '';
      await idbSet({ clientId, email, expiresAtMs: this.expiresAtMs });
      return token;
    } catch {
      return null;
    }
  }

  /** Revokes the token and clears persisted state. Local data is untouched. */
  async signOut(): Promise<void> {
    const gis = getGis();
    if (gis && this.token) {
      try { gis.accounts.oauth2.revoke(this.token); } catch { /* best-effort */ }
    }
    this.token = null;
    this.expiresAtMs = 0;
    this.email = null;
    this.clientId = null;
    await idbClear();
  }

  private async fetchEmail(token: string): Promise<string> {
    const res = await fetch(USERINFO_URL, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) throw new Error(`userinfo ${res.status}`);
    const body = (await res.json()) as { email?: string };
    if (!body.email) throw new Error('userinfo missing email');
    return body.email;
  }
}

export const googleAuth = new GoogleAuth();
