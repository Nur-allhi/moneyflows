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

import { fetchWithTimeout } from './CloudSync';

const GIS_SCRIPT_URL = 'https://accounts.google.com/gsi/client';
export const DRIVE_APPDATA_SCOPE = 'https://www.googleapis.com/auth/drive.appdata';
const SCOPES = `${DRIVE_APPDATA_SCOPE} openid email profile`;
/** Refresh proactively this far before expiry — no per-flush auth roundtrip. */
const REFRESH_SKEW_MS = 60_000;
const USERINFO_URL = 'https://www.googleapis.com/oauth2/v3/userinfo';

const IDB_DB = 'moneyflows_google_auth';
const IDB_STORE = 'auth';
const IDB_KEY = 'google_auth_state';

/**
 * Per-session silent-renewal backoff (BUG-15): GIS opens a real popup even for
 * prompt:'none', so background retries outside user gestures are killed by
 * popup blockers — and a dead session can never succeed either. Once silent
 * renewal fails, background callers stop trying until an explicit sign-in
 * succeeds; explicit taps always attempt (they carry activation).
 */
let silentRenewalDead = false;

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
  /** Display name from the profile scope (may be absent on old records). */
  name?: string;
  /** Photo URL from the profile scope (never logged, shown in sidebar only). */
  photo?: string;
  /**
   * Access token (T-159): same-origin IndexedDB, cleared on sign-out, ~1h
   * lifetime. Lets sessions survive reloads; silent refresh renews it while
   * the Google session lives.
   */
  token?: string;
  expiresAtMs: number;
}

export interface GoogleProfile {
  email: string;
  name: string | null;
  photo: string | null;
}

function getGis(): GisNamespace | null {
  const g = (globalThis as unknown as { google?: GisNamespace }).google;
  return g?.accounts?.oauth2 ? g : null;
}

/**
 * GIS wait budget (BUG-16): the token popup sometimes dies without ever
 * invoking its callback (unauthorized origin, blocker/FedCM kill), and the
 * GIS script itself can stall. Unbounded awaits would hang the Settings
 * progress bar forever, so every wait races against a timer. Interactive
 * budgets stay generous (a human picks an account); silent ones stay short.
 */
export const GIS_SCRIPT_TIMEOUT_MS = 15_000;
export const GIS_SILENT_TOKEN_TIMEOUT_MS = 10_000;
export const GIS_INTERACTIVE_TOKEN_TIMEOUT_MS = 60_000;

/** Token request that always settles: callback, sync throw, or timeout. */
function requestToken(
  gis: GisNamespace,
  clientId: string,
  prompt: string,
  timeoutMs: number,
  callbackError: (resp: GisTokenResponse) => Error,
): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    let settled = false;
    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      reject(new Error('Google sign-in timed out: popup closed with no response'));
    }, timeoutMs);
    const client = gis.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: SCOPES,
      callback: (resp) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        if (resp.error || !resp.access_token) {
          reject(callbackError(resp));
          return;
        }
        resolve(resp.access_token);
      },
    });
    try {
      client.requestAccessToken({ prompt });
    } catch (e) {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      reject(e instanceof Error ? e : new Error(String(e)));
    }
  });
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
    // BUG-16: a stalled script must fail, never hang sign-in/sync callers.
    const timer = setTimeout(() => reject(new Error('GIS script timed out')), GIS_SCRIPT_TIMEOUT_MS);
    const el = document.createElement('script');
    el.src = GIS_SCRIPT_URL;
    el.async = true;
    el.defer = true;
    el.onload = () => {
      clearTimeout(timer);
      if (getGis()) resolve();
      else reject(new Error('GIS script loaded but api missing'));
    };
    el.onerror = () => {
      clearTimeout(timer);
      reject(new Error('GIS script failed to load'));
    };
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
  private name: string | null = null;
  private photo: string | null = null;
  private clientId: string | null = null;

  /** Last signed-in email (from persisted state); null when never signed in. */
  async getAccountEmail(): Promise<string | null> {
    const profile = await this.getProfile().catch(() => null);
    return profile?.email ?? null;
  }

  /** Display profile (memory first, persisted fallback). Null when signed out. */
  async getProfile(): Promise<GoogleProfile | null> {
    if (this.email) {
      return { email: this.email, name: this.name, photo: this.photo };
    }
    const saved = await idbGet().catch(() => null);
    if (!saved?.email) return null;
    this.email = saved.email;
    this.name = saved.name ?? null;
    this.photo = saved.photo ?? null;
    this.clientId = saved.clientId ?? this.clientId;
    return { email: this.email, name: this.name, photo: this.photo };
  }

  /** Interactive sign-in. Resolves the access token; rejects when GIS fails. */
  async signIn(clientId: string): Promise<string> {
    await loadGis();
    const gis = getGis();
    if (!gis) throw new Error('Google Identity Services unavailable');
    // Explicit user tap: always offer the account chooser. prompt:''
    // fails closed (popup opens then auto-closes) when no Google session
    // can be silently reused — e.g. the morning after sign-in (BUG-14).
    // BUG-16: bounded — a popup that dies with no callback rejects instead
    // of hanging the caller forever.
    const token = await requestToken(
      gis,
      clientId,
      'select_account',
      GIS_INTERACTIVE_TOKEN_TIMEOUT_MS,
      (resp) => new Error(`Google sign-in failed: ${resp.error ?? 'no token'}`),
    );
    const profile = await this.fetchProfile(token).catch(() => null);
    this.token = token;
    this.expiresAtMs = Date.now() + 3600_000;
    this.email = profile?.email || null;
    this.name = profile?.name ?? null;
    this.photo = profile?.photo ?? null;
    this.clientId = clientId;
    await idbSet({
      clientId,
      email: this.email ?? '',
      name: this.name ?? '',
      photo: this.photo ?? '',
      token,
      expiresAtMs: this.expiresAtMs,
    });
    silentRenewalDead = false;
    return token;
  }

  /**
   * Usable token or null (T-159). Order: live memory → persisted record →
   * silent `prompt:'none'` renewal (no UI while the Google session lives).
   * Never throws and never shows UI — background callers (flush, boot, polls)
   * can call this freely; a dead session simply yields null ('reconnect').
   */
  async getValidToken(): Promise<string | null> {
    if (this.token && Date.now() < this.expiresAtMs - REFRESH_SKEW_MS) return this.token;
    const saved = await idbGet().catch(() => null);
    if (saved?.token && Date.now() < saved.expiresAtMs - REFRESH_SKEW_MS) {
      this.token = saved.token;
      this.expiresAtMs = saved.expiresAtMs;
      this.email = saved.email || null;
      this.name = saved.name ?? null;
      this.photo = saved.photo ?? null;
      this.clientId = saved.clientId ?? this.clientId;
      return this.token;
    }
    const clientId = this.clientId ?? saved?.clientId;
    if (!clientId) return null;
    // Backoff: a failed silent renewal stays failed this session (blocked
    // popup or dead session) — background callers return null immediately
    // instead of opening another doomed popup on every flush/poll.
    if (silentRenewalDead) return null;
    try {
      await loadGis();
    } catch {
      return null;
    }
    const gis = getGis();
    if (!gis) return null;
    try {
      // 'none' = renew silently (GIS still opens a popup window for it, so
      // background retries outside user gestures are killed by popup
      // blockers — the session backoff above stops the retry spam).
      // BUG-16: bounded — a killed popup settles as a silent failure (null),
      // never a hang.
      const token = await requestToken(
        gis,
        clientId,
        'none',
        GIS_SILENT_TOKEN_TIMEOUT_MS,
        (resp) => new Error(resp.error ?? 'silent refresh needs UI'),
      );
      this.token = token;
      this.expiresAtMs = Date.now() + 3600_000;
      this.clientId = clientId;
      const email = this.email ?? saved?.email ?? '';
      const name = this.name ?? saved?.name ?? '';
      const photo = this.photo ?? saved?.photo ?? '';
      await idbSet({ clientId, email, name, photo, token, expiresAtMs: this.expiresAtMs });
      return token;
    } catch {
      silentRenewalDead = true;
      return null;
    }
  }

  /**
   * Explicit-tap refresh (T-159): shows the Google popup to re-authorize.
   * Call only from direct user actions (Sync-now fallback) — never from
   * background paths. Null when the user cancels or is offline.
   */
  async refreshInteractive(): Promise<string | null> {
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
      // BUG-16: bounded like signIn — a dead popup returns null (caller
      // shows the reconnect message) instead of hanging the progress bar.
      const token = await requestToken(
        gis,
        clientId,
        'select_account',
        GIS_INTERACTIVE_TOKEN_TIMEOUT_MS,
        (resp) => new Error(resp.error ?? 'interactive refresh cancelled'),
      );
      this.token = token;
      this.expiresAtMs = Date.now() + 3600_000;
      this.clientId = clientId;
      const email = this.email ?? saved?.email ?? '';
      const name = this.name ?? saved?.name ?? '';
      const photo = this.photo ?? saved?.photo ?? '';
      await idbSet({ clientId, email, name, photo, token, expiresAtMs: this.expiresAtMs });
      silentRenewalDead = false;
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
    this.name = null;
    this.photo = null;
    this.clientId = null;
    silentRenewalDead = false;
    await idbClear();
  }

  private async fetchProfile(token: string): Promise<{ email: string; name: string | null; photo: string | null }> {
    const res = await fetchWithTimeout(USERINFO_URL, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) throw new Error(`userinfo ${res.status}`);
    const body = (await res.json()) as { email?: string; name?: string; picture?: string };
    if (!body.email) throw new Error('userinfo missing email');
    return { email: body.email, name: body.name ?? null, photo: body.picture ?? null };
  }
}

export const googleAuth = new GoogleAuth();
