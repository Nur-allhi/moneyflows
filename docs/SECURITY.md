# MoneyFlows — Security & Access Document

**Target Skills:** `senior-backend` (design) & `code-reviewer` (enforcement)
**Version:** 3.0 · 2026-08-24

---

## 1. Threat Model

Single-device, offline-first, client-only app holding real family financial data (~1.14M BDT scope). No server, no network I/O, no telemetry.

| Threat | Vector | Mitigation |
|--------|--------|------------|
| Data loss/corruption | bad write, quota exhaustion, browser eviction, disk failure | OPFS primary storage, ring-buffer restore points, integrity digests, folder sync |
| Accidental destruction | user deletes tx/account/member | soft-delete + Recycle Bin + 30-day auto-purge |
| Boot hang / invisible dialogs | corrupt storage meets blocking UI | watchdog (15 s) + typed errors → visible recovery screen (BUG-7 lesson) |
| Privacy leak via git | exports/dumps committed | §5 guardrails (violated once historically — commit `68f3771`) |
| Remote attack | nothing worth stealing remotely — no auth, cookies, tokens | N/A |

## 2. Authentication & Authorization

**None by design.** Single-admin local app; device unlock = access. No passwords/tokens/sessions/secrets exist. Do not add any without a PRD change. Cloud sync, if approved, mandates auth + RLS → this doc gets v4.

## 3. Data Guardrails

1. **Soft delete everywhere** (`deleted_at`). Hard delete only via Recycle Bin purge or `purgeExpiredItems(30)`.
2. **Restore-before-destroy**: flush writes main DB; snapshots rotate on cooldown with per-slot guards; a failed write prunes snapshots and retries before surfacing an error — never silently gives up.
3. **Balance invariants** (TAD §4): running balance from full history; loan `outstanding` re-synced on edit/delete.
4. **Amount validation**: `amount > 0` at DB level; wizard warns non-blocking on insufficient balance.
5. **No blocking dialogs anywhere on boot/mutation paths** — all failures surface through the Database Error screen or store error state.

## 4. Input Handling & Storage

- All SQL parameterized (`$named` params via prepared statements); string-concatenated SQL is rejected in review.
- React escapes by default; `dangerouslySetInnerHTML` banned.
- File System Access API: user explicitly grants directory; `FolderSync` writes only its own db files.
- **Digest caveat**: on insecure origins (LAN http) integrity uses FNV fingerprint (`f:` prefix) — detects accidental corruption but is NOT collision-resistant. Accepted because plain-http transport is already outside the threat model. Do not rely on it for tamper evidence.

## 5. Repository Privacy Guardrails (CRITICAL)

This repo contains a real product with **real financial data**. Enforced by `code-reviewer` on every PR:

1. `.gitignore` MUST cover `USER_DATA/`, `db_b64.txt`, debug dump scripts, `*.db`, env files. *(Hardened in Phase 10 after near-miss.)*
2. Never commit: exported PDFs, base64/db dumps, screenshots with names/amounts, real spreadsheet seed data (fixtures use fake names).
3. If sensitive data lands in history: treat as leaked — purge via filter-repo + coordinated force-push, then re-audit `.gitignore`.
4. `master` must build and pass tests on a fresh clone with zero user data required.
5. Docs must not contain real person names tied to financial figures (scrub on sight).

## 6. Review Checklist Additions (`code-reviewer`)

- [ ] No direct `sql.js`/adapter imports outside infrastructure
- [ ] No `(db as any)` casts bypassing the port
- [ ] Mutating ops await `flush()`; no new silent-catch around persistence
- [ ] Balance math uses full-history computation via shared utils
- [ ] Destructive flows reversible (soft-delete/restore point)
- [ ] Diff touches no data files; `.gitignore` updated when new artifact types appear
- [ ] Bug fixes update BUGS.md status + CHANGELOG in the same commit
