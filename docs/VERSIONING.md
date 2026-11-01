# MoneyFlows — Versioning Rules (Agent-Enforceable)

**Source:** `package.json:4` `version` → injected as `__APP_VERSION__` `vite.config.ts:11` → read via `constants/appVersion.ts:6` `APP_VERSION` → shown in `SettingsModal` footer + `whatsNewFor()` `constants/whatsNew.ts:31` + `CHANGELOG.md` headings. One source, three consumers — keep them in sync or Settings lies.

> **Stable line: v2.x.** `v2.0.0` was stamped 2026-10-31 as the new app generation — it carries the calculation-audit fixes (BUG-21..BUG-47), the M-01..M-09 mobile refinements, and every 1.x capability. All future updates number from **2.0.x**. The 1.x examples are retired; they live in git history.

## 1. Semver (strict)

`MAJOR.MINOR.PATCH` — `https://semver.org/spec/v2.0.0.html`

| Bump | When (at least one) | Examples in this repo (v2.x line) |
|------|---------------------|-----------------------------------|
| **MAJOR** `x.0.0` | Breaking data or contract change that old installs cannot open, or a wholesale persistence/schema rewrite. | A future OPFS/backend change that drops an install-supported fallback, or a `transactions` CHECK that invalidates old rows. Requires migration note in `CHANGELOG` + `whatsNew` caveat. |
| **MINOR** `2.x.0` | New user-visible feature, new route, new capability. No break. | Tags overview sorting T-174 (`feat:` → **v2.1.0**). The v2.0.0 generation itself (audit + M-01..M-09 batch) was numbered MINOR by user call. A Playwright harness change is **not** user-visible → not minor. |
| **PATCH** `2.0.x` | Fix, polish, perf, layout, a11y, docs, or non-feature refactor. | BUG-48 tags search shape (**v2.0.1**), BUG-44 Playwright gate (`fullyParallel: false` / `workers: 1`). |

**Pre-1.0 exception retired** (`REPO_RULES.md §7` `Pre-1.0: breaking→minor` no longer applies post `1.0.0`).

## 2. When to Bump (agent decision table)

For every batch about to merge `dev → master` (or any user-visible batch on `dev`), pick the **highest** row that matches:

1. **Any `MAJOR` signal?** → `MAJOR`. Else
2. **Any `feat:` commit or new `Added` CHANGELOG section?** → `MINOR`. Else
3. **Any `fix:`/`perf:`/`style:` affecting UI/behavior?** → `PATCH`. Else
4. **Only `docs`/`chore`/`test`/`refactor` with no user-visible change?** → no bump; stays on `[Unreleased]`.

**Rule of one bump per merge.** A batch with `feat(search)` + `fix(layout)` is `MINOR`, not `MINOR+PATCH`.

**Agent mapping from commits → CHANGELOG sections → bump:**

| Commit prefix | CHANGELOG section | Bump |
|---------------|-------------------|------|
| `feat` | `Added` | `MINOR` (unless breaking → `MAJOR`) |
| `fix`, `perf` | `Fixed`/`Changed` | `PATCH` |
| `refactor`, `style` | `Changed` | `PATCH` if visible, else none |
| `docs`, `chore`, `test` | — | none |

## 3. What the Agent MUST Do on a Bump (atomic commit)

All four touch in **one commit** (otherwise `AGENTS.md §3.4` Settings shows wrong version):

1. **`package.json:4`** `"version": "a.b.c"` → `"a.b'.c'"` (`npm version --no-git-tag-version <next>` is ok, but manual edit is fine — never `npm version` with git tag in this repo; tags are on `master` only per `REPO_RULES.md §7`).
2. **`src/presentation/constants/whatsNew.ts:8`** — prepend entry `{ version: 'a.b.c', items: ["Plain, simple English — one bullet per user-visible change."] }` newest-first. Keep items short, no jargon (`feat:` bodies are input, but copy is user language).
3. **`CHANGELOG.md:8`** — move current `[Unreleased]` content under new heading `## [a.b.c] - YYYY-MM-DD` (date = today UTC), leave fresh `## [Unreleased]` `Placeholder` on top. Preserve `Keep-a-Changelog` `Added/Changed/Fixed` buckets.
4. **No `session_log.md` version bump** — log is history, not release metadata.

**Do not** edit `appVersion.ts` — it reads the define. Do not hand-write `__APP_VERSION__`.

## 4. Automation Checklist (agent pastes this into every version-bump PR)

```
- [ ] Bump chosen per §2 table (highest wins): MAJOR/MINOR/PATCH = ___
- [ ] package.json:4 bumped a.b.c → a.b'.c'
- [ ] whatsNew.ts:8 new entry a.b'.c' added (newest first, plain English)
- [ ] CHANGELOG.md:8 Unreleased → [a.b'.c] - YYYY-MM-DD (Added/Changed/Fixed buckets)
- [ ] typecheck + lint --max-warnings 0 + build + full Playwright suite green (currently 31/0)
- [ ] Settings footer shows new version (manual spot-check: open / → ⚙ → footer)
- [ ] Whats New modal shows new bullets once after reload (lastSeenVersion gate)
```

A failing box blocks merge per `REPO_RULES.md §9`.

## 5. Tagging (master only, after user approval)

Per `REPO_RULES.md §3` + `AGENTS.md §3.12`: agent never tags alone. When the user says `merge dev to master`:

1. `dev` already has the bump commit (this doc's §3).
2. Merge `dev → master` (no-ff `--no-ff -m "Merge dev: …"`).
3. Immediately `git tag -a v<a.b.c> -m "v<a.b.c> — $(head -1 CHANGELOG.md new section)"` on `master` + `git push origin master --follow-tags`.
4. `dev` fast-forward to `master`.

## 6. Guardrails

- **Never bump on `master` directly** (`REPO_RULES.md §1` `No direct commits, ever`).
- **Never bump twice in one batch.** One batch = one version.
- **Never leave `whatsNew` behind.** If `package.json` says `2.1.0` but `whatsNew` latest is `2.0.1`, `whatsNewFor(2.1.0)` falls back to `2.0.1` and the modal lies — the checklist catches it.
- **No `style={{}}` for version strings** — use constants.

## 7. Examples from this repo (v2.x line)

- `2.0.0` (2026-10-31): the interim `1.18.2` batch — calculation audit (BUG-21..BUG-47) + mobile refinements M-01..M-09 — **renamed** to `2.0.0` by user call ("new app generation", no migration needed). A renumber is not a second bump: same content, same atomic-commit shape (`c50fa8e`).
- `2.0.0 → 2.0.1` (2026-10-31): BUG-48 UI-shape fix → `PATCH`, versioned on `beta_v2.0` then merged to `dev` and released on `master` (`b241159`).
- `2.0.1 → 2.1.0` (2026-11-01): a single `feat(tags)` commit (T-174) in one batch is already `MINOR` — highest wins, even without a second feature (release `dbf4c47`, swept to `master` as `463652e`).
- A pure gap fix with no `feat` would have been a `PATCH` instead.
- Pre-2.x case law (Tags T-109..T-112 `1.1.0`, Search S-1..S-4 `1.2.0`, calculation audit `1.18.0` MINOR) lives in git history; the same §2 table drove it.

---
*Keep this doc short enough that an agent can apply §2→§3 without re-reading the whole repo.*
