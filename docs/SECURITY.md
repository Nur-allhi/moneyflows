# MoneyFlows — Security & Access Document

**Target Skills:** `senior-backend` (design) & `code-reviewer` (enforcement)
**Version:** 2.0 · 2026-08-23

---

## 1. Threat Model

MoneyFlows is a **single-device, offline-first, client-only** app holding real family financial data (~1.14M BDT scope). There is no server, no network I/O, no telemetry. The realistic threats are:

| Threat | Vector | Mitigation |
|--------|--------|------------|
| Data loss / corruption | bad write, browser eviction, disk failure | ring-buffer restore points, SHA-256 integrity hash, folder sync |
| Accidental destruction | user deletes tx/account/member | soft-delete + Recycle Bin + 30-day auto-purge |
| Privacy leak via git | exports/dumps committed to repo | §5 guardrails (already violated once — see audit) |
| Malicious web page interference | none meaningful — no auth, no cookies, no tokens; nothing worth stealing remotely | N/A |

## 2. Authentication & Authorization

- **None by design.** Single-admin local app; whoever unlocks the device has full access.
- No passwords, tokens, sessions, or secrets exist in the codebase. Do not add any without a PRD change.
- If cloud sync (Supabase) is ever approved, auth + RLS policies become mandatory and this document gets a v3.

## 3. Data Guardrails

1. **Soft delete everywhere** (`deleted_at` on members, accounts, transactions, loans). Hard delete only via Recycle Bin purge or `purgeExpiredItems(30)`.
2. **Restore before destroy**: `save()` writes a restore point first; integrity hash verified before load. A corrupt DB never silently overwrites a good one.
3. **Balance invariants** (see TAD §4): running balance from full history; loan `outstanding` re-synced on edit/delete of linked transactions.
4. **Amount validation**: `amount > 0` at DB level; wizard warns (not blocks) on insufficient balance per product decision (3e2ab85).

## 4. Input Handling

- All SQL parameterized (`$named` params through sql.js prepared statements) — no string interpolation into SQL anywhere. `code-reviewer` rejects any concatenation.
- PDF export runs client-side via jspdf; no external fetches. HTML sanitization not applicable (React escapes by default; no `dangerouslySetInnerHTML` permitted).
- File System Access API: user explicitly grants a directory; `FolderSync` only writes the db file it manages.

## 5. Repository Privacy Guardrails (CRITICAL)

This repo contains a real product with **real financial data**. Enforced by `code-reviewer` on every PR:

1. `.gitignore` MUST cover: `USER_DATA/`, `db_b64.txt`, `*.db`, env files, debug dump scripts. *(Gap found in audit 2026-08-23 — fix ticketed as HYG-1/T-086.)*
2. Never commit: exported PDFs, base64/db dumps, screenshots containing names/amounts, seed data from the real spreadsheet (use fixtures with fake names).
3. If sensitive data lands in history: rotate/remove is impossible for personal data — treat as leaked, purge via filter-repo AND force-push coordination, then re-audit `.gitignore`. Precedent: commit `68f3771`.
4. `main`/`master` must always build green from a fresh clone with no user data required to run.

## 6. Review Checklist Additions (`code-reviewer`)

- [ ] No new direct `sql.js` imports outside infrastructure
- [ ] No `(db as any)` casts bypassing the port
- [ ] New destructive flows write a restore point first
- [ ] Balance math uses full-history computation
- [ ] Diff touches no data files; `.gitignore` updated if new artifact types introduced
