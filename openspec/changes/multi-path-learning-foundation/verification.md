# Foundation verification record

## Baseline

- Foundation base commit: `e59969f7f402650aa196cb008ff8b3af7d5b519f`
- `landing-page` archived at `openspec/changes/archive/2026-08-31-landing-page/`.
- `visual-polish` archived at `openspec/changes/archive/2026-08-31-visual-polish/`.
- Archive changes were still uncommitted when foundation implementation started; they are treated as protected user changes.

## Production database read-only baseline

Captured before applying the foundation migration. No DDL, seed, or data mutation was executed against the production Neon database.

| Relation | Rows before migration |
| --- | ---: |
| `unit` | 2 |
| `lesson` | 24 |
| `user_lesson_mastery` | 3 |
| `weakness_record` | 2 |
| `lesson_session` | 3 |
| `practice_session` | 2 |
| `review_session` | 0 |

- Lesson slug count: 24
- Sorted lesson slug SHA-256: `cb6ffe90daca1ea168284677bb651b839034693a5b6f529d151280e25849dae3`

Read-only row fingerprints produced by `src/db/verify-multi-path-migration.ts`:

| Relation | MD5 fingerprint |
| --- | --- |
| `unit` | `cb9f745d82541a4e699add7b4e2490d9` |
| `lesson` | `388fbf14e6d044611052a5aa9b75e714` |
| `user_lesson_mastery` | `cce5d0c53438e1745f83f3ab3758beff` |
| `weakness_record` | `ae6a52919ef367b6178c5d1b5afd444a` |
| `lesson_session` | `8cc640523ba3421e6711acc7d420f496` |
| `practice_session` | `df0ed3194affeebe6c026d325600954b` |
| `review_session` | `d41d8cd98f00b204e9800998ecf8427e` |

Post-migration verification must reproduce these counts and the slug digest, plus one published `react-junior-mid` path whose two units contain all 24 lessons. This record does not claim that the production migration has been applied.

## Pyodide cold-load decision

Pinned runtime: `v0.27.7`, jsDelivr CDN. Measured from the development environment on 2026-08-31 with a cold `curl` download:

| Core asset | Downloaded bytes | Time |
| --- | ---: | ---: |
| `pyodide.mjs` | 13,931 | 0.20s |
| `pyodide-lock.json` | 112,205 | 0.11s |
| `pyodide.asm.wasm` | 10,105,545 | 9.36s |
| `python_stdlib.zip` | 2,360,737 | 1.56s |
| **Total** | **12,592,418 (12.01 MiB)** | **11.22s sequential** |

Decision: keep the pinned CDN build. It is excluded from the application bundle and fetched only after the user runs a Python practice fixture; the UI exposes a dedicated initialization state and the browser/CDN can cache subsequent runs. Self-hosting would not reduce the 12.01 MiB payload and would move bandwidth to the application deployment. Revisit if browser acceptance on the deployment exceeds 15 seconds on the target network or CSP blocks jsDelivr.

## Automated browser coverage

Run against `next start` production output at a 390×844 viewport:

- `react-ts`, `vanilla-ts`, and `vanilla-js` fixtures each reached normalized “所有測試通過”.
- Python fixture executed through the real pinned Pyodide worker.
- Replacing the Python entry with an infinite loop produced the 5-second terminate/rebuild result; restoring the original multi-file solution and running again passed in the recreated worker.
- The runtime preview document `scrollWidth` did not exceed the viewport width.

The authenticated `/tree` directory, migrated React progress, path-scoped 404, and cross-path DB isolation were not browser-tested because the production database migration was intentionally not applied from this implementation workspace.
