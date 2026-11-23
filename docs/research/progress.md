# Research progress, feature by feature

The unit of work is one row of [`features.md`](features.md): one feature, or
one document row that has several features. Each feature is analyzed in its
own worktree by one agent, with the prompt of [`README.md`](README.md). The
worktree is made with `orca worktree create`, so that it shows in the sidebar
of the Orca application. Five or six features run at the same time.

- A feature that is not in the table below is **open**.
- State: **running** (a subagent works on it), **to check** (the file is
  written, and the key findings are not yet checked against the code),
  **done** (a sample of the key findings is checked against the code, and
  the file is copied to `main`), **partial** (some files are not
  read; the open points say which).
- The file of a feature is `features/<name>.md` in this folder.
- Only the main session changes this file and the tables of `README.md`. A
  subagent writes only the file of its feature.

## Batch 1, started 2026-11-23

Chosen for steps 2 to 6 of [`../plan.md`](../plan.md). The worktree of a
feature is `research-<name>`, on the branch `docs/research-<name>`, where
`<name>` is the name of its file.

| # | Feature (row of `features.md`) | Document of the reference | Part | File | State | Files read | Open points |
|---|---|---|---|---|---|---|---|
| 1 | Enter queues a message, and a second Enter steers it into the running turn | `docs/specs/steer-vs-queue.md` | 1, 23 | `features/queue-and-steer.md` | done, 2026-11-23 | section 2 of the file | The steer specification disagrees with the code in three places |
| 2 | Tool calls for the chat API drivers, with approvals, deny and interrupt | `docs/verification/openai-tools.md` | 9, 10 | `features/chat-driver-tool-calls.md` | done, 2026-11-23 | section 2 of the file | The limit of 64 model steps is not in the code now |
| 3 | Rule: files with mode 0600, atomic writes, redaction of text that an agent wrote | `docs/superpowers/plans/2026-08-31-00-control-plane-roadmap.md` | 4, 11 | `features/file-modes-atomic-writes-redaction.md` | done, 2026-11-23 | section 2 of the file | Line 338 names one engine by its product name |
| 4 | Rule: secrets are write-only; the UI sees only "configured" | the same | 11 | `features/write-only-secrets.md` | done, 2026-11-23 | section 2 of the file | See section 9 of the file |
| 5 | Rule: a config from a newer version loads in an older version as "unavailable" | the same | 2 | `features/newer-config-unavailable.md` | done, 2026-11-23 | section 2 of the file | See section 9 of the file |

## Other research, 2026-11-23

| Work | File | State |
|---|---|---|
| The release history: 169 releases and the git history | [`changelog.md`](changelog.md) | done |
| The four groups of [`features.md`](features.md), with a group, a crate and a research state for each row | [`features.md`](features.md) | done |

## Batch 2, not started

The three gaps of group 1. Start it when the author approves.

| # | Capability of group 1 | Row of `features.md` | Crate | Step | State |
|---|---|---|---|---|---|
| 1 | The chat API driver with streaming | `custom-engines.md`; "A model connection with no tools" | `bot-engine` | 5 | open |
| 2 | The event bus, the fold, the streamed reply in the window | `README.md`; `chat-ui.md` | `bot-core`, `bot-desktop` | 7 | open |
| 3 | One chat turn from send to reply, the part that `turn-flow-comparison.md` did not read | `chat-turns.md` | `bot-core` | 7 | open |

After batch 2, no more research until step 7 of the plan is done.
