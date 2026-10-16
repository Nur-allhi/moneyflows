# Online Sync via Google Drive — Execution Plan (Path 1)

**Status:** approved for execution · **Branch:** `feature/online-sync-drive` (off `dev`)
**Goal:** sign in with Google → the app's SQLite file auto-syncs to the user's own
Drive `appDataFolder` → same data editable from mobile + desktop.
**Non-goals:** true realtime (seconds), multi-user co-editing, sharing with family
(those graduate to Supabase — Path 2 — later; the login button built here is reused).

## 1. Why this fits the existing setup (no data loss, no speed loss)

- `flush()` (`SQLiteDatabaseService.ts:295`) writes local OPFS first, then fires
  `_maybeSnapshot` / `_maybeFolderSync` as `void … .catch(() => {})`. Cloud upload
  becomes a **third line in that pattern**: it cannot throw into a save and is never
  awaited by mutating ops.
- Boot already has the "never clobber" precedent: fresh installs skip the initial
  flush (`:151-157`); OPFS migration imports only when OPFS is empty *and* the
  legacy copy decodes (`storage/index.ts:57-73`). Cloud pull follows the same rule.
- Hash verification exists (`SnapshotRecord.hash`, `digestHex`) — reused for the
  remote sidecar. Corrupt download = skipped, local untouched.
- No extra `db.export()` cost: the uploader reuses the buffer `flush()` already built.
- Boot pull + open-tab check are deferred/async — the 15s splash watchdog never
  sees network latency; offline skips silently.

## 2. Architecture

```
Google Identity Services (gsi/client script, no npm dep)
  → GoogleAuth.ts        token client, cached token + silent refresh,
                         sign-in/out, account email (persisted minimal state)
  → CloudSync.ts         appDataFolder: upload money_flows.db + .sha256 sidecar,
                         metadata/hash check, download + verify (mirrors FolderSync shape)
  → SQLiteDatabaseService._maybeCloudSync(data)   fire-and-forget, own cooldown
  → boot-pull            after local load+paint: remote newer → import (empty-local
                         rule); dirty local → upload wins, never overwrite
  → open-tab check       periodic hash-only poll → "New data available — Refresh"
  → conflict copy        mismatch + dirty local → remote into snapshot slot + user choice
  → Settings → Backup    sign-in row, status (email, last sync), Sync now, disconnect
```

- **Scope (minimal):** `drive.appdata` + `openid email` (email scope only to display
  the signed-in account; both documented in Settings empty-state).
- **Client ID (app-owned, baked in):** one Google OAuth client owned by the publisher,
  injected at build time from `GOOGLE_CLIENT_ID` (real env or gitignored `.env.local`)
  via `__GOOGLE_CLIENT_ID__` → `constants/googleClient.ts`. Users never paste anything —
  they tap **Sign in with Google**. The ID is public by design; per-user isolation comes
  from the per-account token + `appDataFolder`, not from the ID. Empty ID = sync section
  shows "not set up", app stays fully local.
- **Files in Drive:** `moneyflows.db` + `moneyflows.db.sha256` inside `appDataFolder`
  (hidden from the user's Drive UI, per-user automatic — the Google account *is*
  the database container; zero provisioning).
- **Local persists:** Google account email + last-sync time in `AppSettings`
  (deep-fill defaults, existing pattern); tokens in memory + IndexedDB handle-style
  store (never localStorage, never logged).

## 3. The 4 guards (review-enforceable, block merge if violated)

1. Upload is fire-and-forget — never `await`ed by `flush()` callers.
2. Pull only when local empty or clean; dirty local always wins the upload.
3. Hash-verify every download before opening.
4. Mismatch + dirty = conflict copy into snapshots + user choice, never auto-overwrite.

## 4. Setup (publisher one time — users just tap Sign in)

Publisher (once per build environment):

1. Google Cloud Console → new project → enable Google Drive API.
2. OAuth consent screen (External, Test mode for personal use; verification later
   for public rollout) → add test users while in test mode.
3. Credentials → OAuth client ID (Web) → authorized origins: dev
   `http://localhost:3000` + the production origin.
4. Put the ID in `.env.local` as `GOOGLE_CLIENT_ID=…apps.googleusercontent.com`
   (gitignored) or as a real env var at build time — no code change, no commit.

User flow (zero setup): Settings → Backup → Google Drive Sync → **Sign in with
Google** → Sync now (or automatic). Test-mode grants expire after 7 days →
re-tap Sign in; publishing + verification removes that.

## 5. Ticket breakdown (Phase 19 — full specs in `docs/TICKETS.md`)

| Ticket | Title | Effort | Depends |
|--------|-------|--------|---------|
| T-145 | `GoogleAuth.ts` — GIS loader, token client, cache/refresh, sign-in/out | M | — |
| T-146 | `CloudSync.ts` — appDataFolder upload/download/hash/conflict-copy I/O | M | T-145 |
| T-147 | Wire `_maybeCloudSync` into `flush()` + `pagehide` + boot-pull rule | M | T-146 |
| T-148 | Settings → Backup: sign-in row, status, Sync now, disconnect | M | T-145 |
| T-149 | Open-tab remote check + "New data available" prompt | S | T-147 |
| T-150 | Conflict-copy UX (snapshot slot + keep-mine/keep-remote choice) | M | T-147 |
| T-151 | Verification: gates, E2E, offline/corrupt-remote tests, docs | M | T-145–T-150 |

Dependency chain: `T-145 → T-146 → T-147 → (T-148 ∥ T-149 ∥ T-150) → T-151`.
Merge to `dev` only with user confirmation (`REPO_RULES.md §3`).

## 6. Verification (T-151)

- `typecheck` + `lint --max-warnings 0` + `build` + vitest green; `detect_changes()`
  LOW/MEDIUM as expected (storage + settings surfaces only).
- New tests: token-cache expiry, hash-mismatch skip, empty-local import,
  dirty-local-wins, corrupt-download skip, cooldown respected (upload count).
- E2E: sign-in mocked (no real Google in CI); offline boot with stale token.
- Manual: phone-save → desktop-boot shows row; revoke access → storage-health
  warning surfaces (existing T-100 row).
- Docs in same batch: `SECURITY.md` (token handling, scope), `TAD.md` (§2.2 sink),
  `CHANGELOG.md [Unreleased]` Added entry.

## 7. Release

One `MINOR` bump per `VERSIONING.md §2` (`feat` cloud sync → `Added`) when the
phase merges `dev → master`: `package.json` + `whatsNew.ts` + `CHANGELOG.md` in
one atomic commit, tag `vA.B.0` on `master` after user approval.
