# MoneyFlows — Repository Management Rules

**Target Skill:** `gitnexus` (enforces) · `code-reviewer` (verifies before merge)
**Version:** 1.0 · 2026-08-23
**Repo reality:** default branch is `master`; integration branch is `dev`. Wherever generic rules say "main", read `master`.

These rules govern every commit, branch, and merge for the lifetime of this project.

---

## 1. Branch Strategy

| Branch | Purpose | Rules |
|--------|---------|-------|
| `master` | always deployable, always green | **No direct commits, ever.** Merge to master requires explicit user approval (AGENTS.md §3.8). |
| `dev` | integration branch — all work lands here first | current working branch |
| `feature/<short-name>` | new functionality | e.g. `feature/csv-export` |
| `fix/<short-name>` | bug fixes | e.g. `fix/null-balance-crash` |
| `hotfix/<short-name>` | urgent patches, branched from `master`, merged back into **both** `master` and `dev` | rare; needs approval |

Naming: lowercase, hyphen-separated, self-explanatory. No ticket-number-only names (`fix/t-086` ❌ → `fix/edit-modal-hooks-crash` ✅).

## 2. Commit Messages — Conventional Commits

```
<type>(<scope>): <description>
```

- Types: `feat`, `fix`, `refactor`, `docs`, `test`, `chore`, `style`, `perf`
- Example: `feat(loans): add PDF ledger export`
- One logical change per commit. No `wip`, `stuff`, `fix2`, `asdf`.
- Optional body explains **why**, not what — the diff shows what.
- Recent history follows this convention (e.g. `fix(loan-ledger): exclude orphan legacy types from running balance`) — keep it that way.

## 3. Merge Rules

1. `feature/*` and `fix/*` → PR into `dev`. Never directly into `master`.
2. `dev` → `master` only when: batch tickets complete, README/CHANGELOG updated, no known regressions — **and the user explicitly approves the merge**.
3. Squash-merge feature branches into `dev`; delete the branch after merge.
4. Every merge carries a one-line summary of what changed and why.
5. Before any commit: run `detect_changes()` (GitNexus) and confirm only expected symbols/flows changed. Before merge: typecheck + lint + build green.

## 4. README.md

- Must reflect current setup steps, env vars, and run commands.
- Update in the **same commit/PR** as any change affecting them (new dependency, new script, config change).
- A stale README means the PR is not done — it is not a follow-up task.
- Current required commands: `npm install`, `npm run dev`, `npm run build`, `npm run lint`, `npm run typecheck` (+ `npm test` once T-091 lands).

## 5. CHANGELOG.md

- "Keep a Changelog" format: `Added / Changed / Fixed / Removed` under version headings.
- Update on every merge to `dev` under `[Unreleased]`; move entries under a semver heading when tagged.
- Curated human-readable subset of `session_log.md` (which stays the full internal record). Never duplicate one into the other.

## 6. Versioning

- Tag releases on `master`: semver `v0.1.0`, `v0.2.0`, …
- Tag message summarizes the CHANGELOG entries it covers.
- Pre-1.0: breaking-ish changes bump minor; fixes bump patch.

## 7. Housekeeping

1. `.gitignore` covers env files, build artifacts (`dist/`), dependency folders, editor configs — **plus project-specific data artifacts**: `USER_DATA/`, `db_b64.txt`, debug dump scripts (see SECURITY.md §5; audit found gaps → T-085).
2. No secrets or credentials committed, ever. If one slips in: rotate it — deleting from history is not enough.
3. `master` must build and pass checks on a fresh clone. A broken `master` is the highest-priority fix, above any feature work.
4. Session logging after every change goes to `session_log.md` per AGENTS.md §3.7 — not to CHANGELOG.

## 8. Enforcement Checklist (`code-reviewer`, pre-merge)

- [ ] Branch named per §1; PR targets `dev`
- [ ] Commits conventional, atomic, descriptive
- [ ] `detect_changes()` output reviewed; blast radius explained
- [ ] Typecheck + lint (`--max-warnings 0`) + build green
- [ ] README updated iff setup/deps/scripts/config changed
- [ ] CHANGELOG `[Unreleased]` entry present
- [ ] No data files, secrets, or `.gitignore` gaps introduced
