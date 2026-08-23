# Storage Layer Overhaul — OPFS Migration + Freeze-Fix Cluster

**Status:** Approved plan · **Phase:** 11 · **Branch:** `feature/opfs-storage`
**Source findings:** `docs/audit/FINDINGS.md` BUG-7 · **Created:** 2026-08-23

---

## 1 · Problem (BUG-7)

Deleting transactions can freeze the PWA on the splash screen permanently
(recoverable only by killing the tab). Root-cause cluster:

| # | Defect | Location |
|---|--------|----------|
| 1 | `run()` persists the entire DB on **every SQL statement** → heavy churn during deletes | `SQLiteDatabaseService.ts:343` |
| 2 | Quota exhaustion handled by **silent give-up**; snapshot shift-loop unguarded → partial/corrupt persisted state | `:204-213`, `:237-247` |
| 3 | Boot recovery calls blocking `window.confirm()` → invisible in standalone PWA → main thread blocked forever | `:114` |
| 4 | `crypto.subtle` missing on insecure origins → integrity layer silently broken | `:222` |

## 2 · Target Architecture

```
src/infrastructure/database/
├── SQLiteDatabaseService.ts     SQL logic only (shrinks; coalesced flush lifecycle)
└── storage/
    ├── types.ts                 IPersistenceAdapter, SnapshotRecord, typed errors
    ├── localStorageAdapter.ts   hardened parity fallback (primary today)
    ├── opfsAdapter.ts           OPFS backend (+ optional LS mirror during transition)
    ├── sha256.ts                crypto.subtle + pure-JS fallback
    └── index.ts                 createStorageAdapter(): pick backend + one-time migration
```

Adapter contract:

```ts
interface IPersistenceAdapter {
  readonly backend: 'opfs' | 'localStorage';
  readMain(): Promise<Uint8Array | null>;            // null = fresh install
  writeMain(data: Uint8Array): Promise<void>;        // NEVER silent-fails
  clearAll(): Promise<void>;
  readSnapshot(i): Promise<SnapshotRecord | null>;   // {data,hash,time}
  writeSnapshot(i, rec): Promise<void>;
  deleteSnapshot(i): Promise<void>;
  usageEstimate(): Promise<{usage:number; quota:number} | null>;
}
```

## 3 · Behavior Changes

| Area | Before | After |
|---|---|---|
| Writes | save-per-statement | dirty-flag + microtask-coalesced flush; explicit `await flush()` at end of every public mutating op; `pagehide`/`visibilitychange` best-effort flush |
| Quota errors | silent give-up | prune oldest snapshots → retry → throw `StorageWriteError` → health banner |
| Boot recovery | invisible `window.confirm` | throws `StorageCorruptError` → dbError screen with **Restore backup / Reload / Start Fresh**; **15 s splash watchdog** forces same screen on any boot hang |
| Integrity | crypto.subtle only | + pure-JS SHA-256 fallback (http origins) |
| Snapshots | base64 JSON in cramped LS | binary files in OPFS `snapshots/` (hardened JSON in LS adapter) |
| Migration | — | one-time: OPFS empty + LS has data → import → hash-verify → flag `moneyflows_storage=v2`; LS mirror kept for one release |

Port additions (`IDatabaseService`): `restoreNewestSnapshot(): Promise<boolean>`,
`resetStorage(): Promise<void>`, `getStorageHealth(): StorageHealth`.

## 4 · Tickets

| Ticket | Scope | Size |
|---|---|---|
| T-093 | This document + FINDINGS BUG-7 + CHANGELOG | S |
| T-094 | Adapter abstraction + hardened LocalStorageAdapter (pure refactor) | M |
| T-095 | OpfsAdapter + migration + version flag + LS mirror | M |
| T-096 | Write coalescing + flush lifecycle | M |
| T-097 | Recovery rework (typed errors, watchdog, dbError actions) | M |
| T-098 | SHA-256 fallback + vectors test | S |
| T-099 | Snapshot ring via adapters (shared rotation, per-slot guards) | S/M |
| T-100 | Storage-health UI in SettingsModal | S |
| T-101 | E2E verification: corrupt-boot no-hang, transfer-delete persist, gates green | M |

## 5 · Decisions (defaults approved by owner)

1. Web Locks-style single-writer guard: **included** (lightweight lock during flush).
2. LS mirror retained for **one release**, then removed.
3. PWA "update ready" toast: **deferred** to a later phase.
4. Migration safety: automatic pre-migration snapshot + LS mirror kept intact.
5. dbError screen copy: sensible defaults now, wording adjustable anytime.

## 6 · Risks & Mitigations

- Crash between mutation and flush → window ~ms; pagehide flush + FolderSync cover residual.
- Safari/iOS partial OPFS → automatic adapter fallback; availability never regresses.
- Multi-tab writers → flush guarded by `navigator.locks` when available.
- LOC rule → storage concerns extracted into `storage/`; service file net-shrinks.
  Full ≤300 LOC split of remaining SQL methods stays with deferred ticket T-092.

## 7 · Verification

Unit: sha256 vectors, adapter corruption/quota paths, flush-coalescing count.
E2E (Playwright): corrupt STORAGE_KEY + poisoned snapshots boots to error screen (never splash-hang); Restore works; transfer-delete survives reload; all gates green.
