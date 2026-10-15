/**
 * App-owned Google OAuth client ID for Drive sync (Phase 19 follow-up).
 * Baked in at build time from `GOOGLE_CLIENT_ID` (real env or gitignored
 * `.env.local`) — users never paste anything, they just tap Sign in.
 * Empty string = sync not configured in this build (app stays fully local).
 */
export const GOOGLE_CLIENT_ID: string =
  typeof __GOOGLE_CLIENT_ID__ !== 'undefined' ? __GOOGLE_CLIENT_ID__ : '';

export function isGoogleSyncConfigured(): boolean {
  return GOOGLE_CLIENT_ID.length > 0;
}
