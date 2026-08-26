# MoneyFlows — Repository Management Rules

**Target Skill:** `gitnexus` (enforces) · `code-reviewer` (verifies pre-merge)
**Version:** 2.0 · 2026-08-24
**Repo reality:** default branch is `master`; integration branch is `dev`. Wherever generic rules say "main", read `master`.

These rules govern every commit, branch, and merge for the lifetime of this project.

---

## 1. Branch Strategy

| Branch | Purpose | Rules |
|--------|---------|-------|
| `master` | always deployable, always green | No direct commits, ever. Merge requires explicit user approval (AGENTS.md §3.12). |
| `dev` | integration branch — all work lands here first | current working branch |
| `feature/<short-name>` | new functionality | e.g. `feature/csv-export` |
| `fix/<short-name>` | bug fixes | e.g. `fix/edit-modal-hooks-crash` |
| `hotfix/<short-name>` | urgent patches from `master`, merged into both `master` and `dev` | rare; needs approval |

Naming: lowercase, hyphenated, self-explanatory. No ticket-number-only names.

## 2. Commit Messages — Conventional Commits

`<type>(<scope>): <description>` — types: `feat`, `fix`, `refactor`, `docs`, `test`, `chore`, `style`, `perf`. One logical change per commit; no `wip`/`stuff`/`fix2`. Optional body explains why, not what.

## 3. Merge Rules

1. `feature/*`, `fix/*` → merge into `dev`. Never directly into `master`.
2. `dev` → `master` eligible only when: batch tickets complete, README/CHANGELOG updated, no known regressions.
3. **Eligible ≠ approved** — every merge into `dev` or `master` requires the user's explicit confirmation at merge time (AGENTS.md §3.12). Before requesting it, summarize: what's merging, tickets closed, README/CHANGELOG updates included.
4. Prefer squash-merge for feature branches into `dev`; keep or delete branch per user preference at that time.
5. Every merge carries a one-line what-and-why summary.
6. Before commit: run gates + `detect_changes()`; before merge to master: full gate suite on the target result.

## 4. README.md

Reflects current setup, env vars, run commands. Updated in the SAME commit/PR as any affecting change. A stale README means the PR is not done. Current commands: `npm install`, `npm run dev`, `npm run build`, `npm run test`, `npm run lint`, `npm run typecheck`.

## 5. CHANGELOG.md

Keep-a-Changelog format (`Added / Changed / Fixed / Removed`) under version headings; update on every merge to `dev` under `[Unreleased]`; move under semver heading when tagged. Curated human subset of `session_log.md` — never duplicates it.

## 6. Bug-Fix Tie-in

A merged bug fix updates, in the SAME commit: CHANGELOG entry under `Fixed`, and the bug's `BUGS.md` entry Status→`fixed` + Resolved date/reference. See AGENTS.md §3.11 and `docs/BUGS.md`.

## 7. Versioning

`docs/VERSIONING.md` is the agent-enforceable single source for when and how to bump `package.json:4` → `__APP_VERSION__` → `Settings` + `whatsNew.ts` + `CHANGELOG.md`. Tag releases on `master` (semver). Tag message summarizes covered CHANGELOG entries.

## 8. Housekeeping

1. `.gitignore` covers env files, build artifacts, dependency folders, editor configs — plus data artifacts: `USER_DATA/`, `db_b64.txt`, debug dump scripts (SECURITY.md §5).
2. No secrets committed, ever; rotate leaked credentials — history deletion is not enough.
3. Broken `master` = highest-priority fix, above feature work.
4. Session logging → `session_log.md` per AGENTS.md §3.7 after every change.

## 9. Enforcement Checklist (`code-reviewer`, pre-merge)

Branch named per §1 targeting correct base · conventional atomic commits · `detect_changes()` reviewed with blast radius explained · typecheck + lint (`--max-warnings 0`) + tests + build green · README updated iff needed · CHANGELOG `[Unreleased]` present · BUGS.md updated iff a bug closed · no data files, secrets, or gitignore gaps introduced · **user merge confirmation obtained**.
