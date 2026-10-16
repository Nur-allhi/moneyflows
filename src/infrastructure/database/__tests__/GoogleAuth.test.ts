import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GoogleAuth, loadGis, resetGisLoaderForTests } from '../GoogleAuth';

interface TokenResponse {
  access_token?: string;
  expires_in?: number;
  error?: string;
}

interface CapturedClient {
  client_id: string;
  scope: string;
  callback: (r: TokenResponse) => void;
}

const captured: CapturedClient[] = [];
const requestedPrompts: string[] = [];
let nextResponse: TokenResponse = { access_token: 'tok-1', expires_in: 3600 };
let revoked: string[] = [];

function installGisMock() {
  const g = {
    accounts: {
      oauth2: {
        initTokenClient: (cfg: CapturedClient) => {
          captured.push(cfg);
          return {
            requestAccessToken: (opts?: { prompt: string }) => {
              requestedPrompts.push(opts?.prompt ?? '');
              const resp = nextResponse;
              void Promise.resolve().then(() => cfg.callback(resp));
            },
          };
        },
        revoke: (token: string) => { revoked.push(token); },
      },
    },
  };
  (globalThis as unknown as { google?: unknown }).google = g;
}

function removeGisMock() {
  delete (globalThis as unknown as { google?: unknown }).google;
}

beforeEach(async () => {
  captured.length = 0;
  requestedPrompts.length = 0;
  revoked = [];
  nextResponse = { access_token: 'tok-1', expires_in: 3600 };
  resetGisLoaderForTests();
  installGisMock();
  vi.stubGlobal('fetch', vi.fn(async () => ({
    ok: true,
    json: async () => ({ email: 'user@gmail.com', name: 'Test User', picture: 'https://pic/x.jpg' }),
  })));
  // Clear the shared in-memory auth fallback between tests.
  await new GoogleAuth().signOut();
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  removeGisMock();
});

describe('GoogleAuth (T-145)', () => {
  it('loadGis resolves immediately when GIS already present', async () => {
    await expect(loadGis()).resolves.toBeUndefined();
    expect(captured).toHaveLength(0);
  });

  it('signIn returns a token and remembers the account email', async () => {
    const auth = new GoogleAuth();
    await expect(auth.signIn('client-123')).resolves.toBe('tok-1');
    await expect(auth.getAccountEmail()).resolves.toBe('user@gmail.com');
    expect(captured[0]).toMatchObject({ client_id: 'client-123' });
    expect(String(captured[0]?.scope)).toContain('drive.appdata');
    // Explicit tap offers the chooser (BUG-14: '' fails closed overnight).
    expect(requestedPrompts[requestedPrompts.length - 1]).toBe('select_account');
  });

  it('signIn persists the profile (name + photo) for the sidebar', async () => {
    const auth = new GoogleAuth();
    await auth.signIn('client-123');
    await expect(auth.getProfile()).resolves.toEqual({
      email: 'user@gmail.com',
      name: 'Test User',
      photo: 'https://pic/x.jpg',
    });
  });

  it('getValidToken serves the cached token without a new GIS call', async () => {
    const auth = new GoogleAuth();
    await auth.signIn('client-123');
    captured.length = 0;
    await expect(auth.getValidToken()).resolves.toBe('tok-1');
    expect(captured).toHaveLength(0);
  });

  it('getValidToken silently refreshes an expired token', async () => {
    const auth = new GoogleAuth();
    await auth.signIn('client-123');
    const later = Date.now() + 2 * 3600_000;
    vi.spyOn(Date, 'now').mockReturnValue(later);
    try {
      nextResponse = { access_token: 'tok-2', expires_in: 3600 };
      await expect(auth.getValidToken()).resolves.toBe('tok-2');
      expect(requestedPrompts[requestedPrompts.length - 1]).toBe('none');
    } finally {
      vi.restoreAllMocks();
    }
  });

  it('hydrates a persisted token across instances with zero GIS calls', async () => {
    await new GoogleAuth().signIn('client-123');
    captured.length = 0;
    requestedPrompts.length = 0;
    // Fresh instance = post-reload: memory empty, persisted record valid.
    await expect(new GoogleAuth().getValidToken()).resolves.toBe('tok-1');
    expect(captured).toHaveLength(0);
    expect(requestedPrompts).toHaveLength(0);
  });

  it('refreshInteractive uses a visible prompt for explicit taps', async () => {
    const auth = new GoogleAuth();
    await auth.signIn('client-123');
    const later = Date.now() + 2 * 3600_000;
    vi.spyOn(Date, 'now').mockReturnValue(later);
    try {
      nextResponse = { access_token: 'tok-3', expires_in: 3600 };
      await expect(auth.refreshInteractive()).resolves.toBe('tok-3');
      expect(requestedPrompts[requestedPrompts.length - 1]).toBe('select_account');
      await expect(auth.getValidToken()).resolves.toBe('tok-3');
    } finally {
      vi.restoreAllMocks();
    }
  });

  it('getValidToken returns null when silent refresh needs UI', async () => {
    const auth = new GoogleAuth();
    await auth.signIn('client-123');
    const later = Date.now() + 2 * 3600_000;
    vi.spyOn(Date, 'now').mockReturnValue(later);
    try {
      nextResponse = { error: 'interaction_required' };
      await expect(auth.getValidToken()).resolves.toBeNull();
    } finally {
      vi.restoreAllMocks();
    }
  });

  it('getValidToken returns null when never signed in', async () => {
    await expect(new GoogleAuth().getValidToken()).resolves.toBeNull();
  });

  it('signOut revokes and clears everything; token gone afterwards', async () => {
    const auth = new GoogleAuth();
    await auth.signIn('client-123');
    await auth.signOut();
    expect(revoked).toContain('tok-1');
    await expect(auth.getValidToken()).resolves.toBeNull();
    await expect(auth.getAccountEmail()).resolves.toBeNull();
    // Fresh instance (post-wipe): nothing hydrates, no GIS call happens.
    captured.length = 0;
    await expect(new GoogleAuth().getValidToken()).resolves.toBeNull();
    expect(captured).toHaveLength(0);
  });
});
