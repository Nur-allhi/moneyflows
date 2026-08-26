# MoneyFlows — Versioning Rules (Agent-Enforceable)

**Source:** `package.json:4` `version` → injected as `__APP_VERSION__` `vite.config.ts:11` → read via `constants/appVersion.ts:6` `APP_VERSION` → shown in `SettingsModal` footer + `whatsNewFor()` `constants/whatsNew.ts:31` + `CHANGELOG.md` headings. One source, three consumers — keep them in sync or Settings lies.

## 1. Semver (strict)

`MAJOR.MINOR.PATCH` — `https://semver.org/spec/v2.0.0.html`

| Bump | When (at least one) | Examples in this repo |
|------|---------------------|-----------------------|
| **MAJOR** `x.0.0` | Breaking data or contract change that old installs cannot open, or a wholesale persistence/schema rewrite. | OPFS migration that drops the localStorage fallback, or a `transactions` CHECK that invalidates old rows. Requires migration note in `CHANGELOG` + `whatsNew` caveat. |
| **MINOR** `1.x.0` | New user-visible feature, new route, new capability. No break. | Search S-1..S-4 (`dashboard all + ledger-scoped + Highlight`), Tags `1.1.0` (T-109..T-112), Account edit `1.1.0`, Playwright harness is **not** user-visible → not minor. |
| **PATCH** `1.1.x` | Fix, polish, perf, layout, a11y, docs, or non-feature refactor. | Header/sidebar single-logo, splash logo match, dashboard duplicate date `txType` hide, gap `24→12`, lint/config. |

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
- [ ] typecheck + lint --max-warnings 0 + build + playwright 4/4 green
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
- **Never leave `whatsNew` behind.** If `package.json` says `1.2.0` but `whatsNew` latest is `1.1.0`, `whatsNewFor(1.2.0)` falls back to `1.1.0` and the modal lies — the checklist catches it.
- **No `style={{}}` for version strings** — use constants.

## 7. Examples from this repo

- `1.0.0 → 1.1.0` (2026-08-24): `feat` Tags + `feat` Account edit → `MINOR`.
- `1.1.0 → 1.2.0` (2026-08-26): `feat` Search S-1..S-4 → `MINOR` even though the same batch also had `fix(layout)` gap/duplicate-date and `style(splash)` logo — highest wins is `MINOR`.
- A pure gap fix with no `feat` would have been `1.1.1` `PATCH`.

---
*Keep this doc short enough that an agent can apply §2→§3 without re-reading the whole repo.*
