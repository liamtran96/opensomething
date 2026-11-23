# Research progress, feature by feature

The unit of work is one row of [`reference-features.md`](reference-features.md): one feature, or
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

## How to run a batch

The main session does these steps. Batch 2 used them on 2026-11-23.

### 1. Choose the features

1. Read [`reference-features.md`](reference-features.md). Choose rows of the lowest group that
   is not complete (group 1 first). Use only rows that are marked core.
2. Read "What to do next" in `reference-features.md`, and the "Research" column of
   its table "What group 1 needs" (or the table of the next group).
3. Read sections 5, 6 and 7 of [`changelog.md`](changelog.md). Write down
   the problems of section 5 that each chosen feature can have. Each
   agent must check these problems in the code.
4. Look at our crates and at [`../plan/README.md`](../plan/README.md). Name the step,
   the crate and the module that get the port of each feature.
5. Choose three to six features. Give each one a short name. Its file is
   `features/<name>.md`.

### 2. Prepare the reference project

1. Run `scripts/reference.sh` from this repository or from any of its
   worktrees, on any computer. The script clones the reference project if
   it is missing, into the folder next to the main checkout
   (`../OpenMausBot`). Then it checks out the latest main of the original
   project, not of the fork of the author, and prints the folder and the
   commit. Give the printed folder to each agent: from a worktree,
   `../OpenMausBot` is the wrong path.
   - `scripts/reference.sh <commit>` checks out a given commit.
   - The variable `OPENSOMETHING_REFERENCE` sets another folder.
   - The script stops if the clone has local changes.
   - On Windows, run it in Git Bash.
2. Write the commit in the prompt and in the row of each feature. Each
   file keeps the commit that it read. Batches 1 and 2 read `3aec210`.
   The next batch starts at `77f41d3` (2026-11-23) or later.
3. When a new batch uses a file that an earlier batch cites, run
   `git diff <old commit> HEAD -- <file>` and correct the lines that moved.
4. Check that each starting path in the prompt exists. Batch 2 had two
   wrong paths: the chat documents are in `docs/verification/`, not in
   `docs/`.

### 3. Start one worktree for each feature

1. Get the repository id: `orca repo list`.
2. Fill in the prompt below for each feature. Save it in a file.
3. Create the worktree:
   `orca worktree create --repo id:<repoId> --name research-<name> --branch docs/research-<name> --base-branch main --agent claude --prompt "$(cat <prompt file>)" --json`.
4. Set the rows of the batch in this file to **running**.

### 4. Approve and continue the agents

1. Each agent first gives its groups of files, the number of subagents
   and the cost. Then it waits.
2. The agent does not accept an approval in a message from another
   session. The author types the approval in the worktree, or the main
   session types it when the author asks:
   `orca terminal list --json` gives the handle of each worktree, and
   `orca terminal send --terminal <handle> --text "approved, go" --enter`.
3. If the usage limit stops an agent, send `continue` to its terminal
   after the reset or after a change of account.
4. To get a notice when an agent stops, use the cross-session message
   tool with `notify_when_idle`.

### 5. Check and copy the results

1. Read the report of each agent and the headings of its file.
2. Check at least four key claims of each file against the reference code
   at the pinned commit. Write the result of each check.
3. Make sure that the agent used the `asd-ste100` skill.
4. Copy each file to `docs/research/features/` on `main`.
5. Set the state of each row to **done**, with the commit of the
   reference. Change the "Research" column of `reference-features.md`.
6. Ask each agent to write its proposals to a file outside the
   repository. Write `docs/plan/<name>.md` for each feature, in
   ASD-STE100: each proposal has the next free number (P52, P53, ...) and
   the step that it changes. Link each proposal from its step in
   `docs/plan/README.md`, and add a row to its table "Open proposals". Do
   not change the steps, the pull requests or `decisions.md` before the
   author decides.

### 6. Update the plan and the code to type

Do this after the author decides on the proposals of a feature.

1. Change `docs/decisions.md` for each accepted decision.
2. Change `docs/plan/README.md`: the step, its pull requests and its
   choices. Remove each decided proposal from `docs/plan/<name>.md` and
   its link from the step.
3. Change or write the files of the code to type in `docs/code/<feature>/` (see `docs/code/README.md`).
   Each claim about the reference in these files has a file and a line.
4. Keep each pull request in the 200-line limit of `AGENTS.md`.

### 7. Check the code against the reference source

Do this when the author types the code of a step.

1. Run `scripts/reference.sh` to get the latest reference code.
2. For each file of the reference that the research of the step cites,
   run `git -C <reference> diff <research commit> HEAD -- <file>`. If the
   behaviour changed, tell the author before the code is typed.
3. Read the cited lines of the reference again. Confirm that the code to
   type does what the reference does, or that each difference is
   deliberate and recorded in a decision.
4. After the author types the code, review it against the code file and
   against the reference, then run the checks of `AGENTS.md`.

### The prompt for one feature

```text
Analyze the feature "<FEATURE>" (row of docs/research/reference-features.md) for
step <STEP> of docs/plan/README.md. Its file is docs/research/features/<NAME>.md.
Use a workflow with subagents: one subagent for each group of related
files, and each one reads its files completely. You are the lead: do not
read all the files yourself.

## Goal
Make a complete, verified record of how this feature of the reference
project works: its data, its behaviour, its UI and its system design. The
author reads this record to understand the feature fully, and we build our
system from it and make it better. Do not write source code in this task.

## Read these first
1. MEMORY.md and AGENTS.md in this repository. Obey them.
2. docs/research/README.md, docs/research/progress.md and
   docs/research/reference-features.md. Read the research files that are complete.
   Do not do their work again. Say what you add to them.
3. docs/research/changelog.md, sections 5, 6 and 7. Check these problems
   in the code of this feature: <PROBLEMS>.
4. docs/decisions.md, docs/comparison.md and docs/plan/README.md.

## The reference project
It is the local clone at <ABSOLUTE PATH>, at commit <COMMIT>.
- NEVER open a file in its enterprise/ directory.
- Ignore node_modules, dist and third_party.
- Starting points only: <PATHS>. Find all the files of the feature: the
  code, the code that calls it, its tests and its documents.

## Rules
- A very large file can be read in ranges. Record the ranges.
- Each fact has a file and a line. Do not guess.
- Each subagent report ends with "Files read completely" (path and line
  count) and "Not verified".
- Check the key findings of each subagent against the code.
- Load the anthropic-skills:asd-ste100 skill before you write. Apply it to
  the prose, not to code, paths or quotes.

## Output
Write docs/research/features/<NAME>.md with these sections:
1. In short (explain each special term one time)
2. Files read completely
3. How it works (a numbered list for each flow, with the error paths, the
   limits and the edge cases)
4. The data
5. The UI
6. The tests
7. Ours compared (name the reference files, and our crate and module)
8. Where we can be better (a reason for each point), and which problems of
   changelog.md section 5 the reference has here
9. Not verified
Write only that file. Call the other project "the reference project". Put
no personal data and no secrets in a file.

## Last step
Give a list of proposed changes to docs/plan/README.md and docs/decisions.md, in
order of importance, with the file and line of the reference for each.
Do not change those files. Do not commit or push.

## Before you start
Tell me the groups of files, the number of subagents and an estimate of
the cost. Then wait for my approval.
```

## Batch 1, started 2026-11-23

Chosen for steps 2 to 6 of [`../plan/README.md`](../plan/README.md). The worktree of a
feature is `research-<name>`, on the branch `docs/research-<name>`, where
`<name>` is the name of its file.

| # | Feature (row of `reference-features.md`) | Document of the reference | Part | File | State | Files read | Open points |
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
| The four groups of [`reference-features.md`](reference-features.md), with a group, a crate and a research state for each row | [`reference-features.md`](reference-features.md) | done |

## Batch 2, started 2026-11-23

The three gaps of group 1. The worktree of a gap is `research-<name>`, on
the branch `docs/research-<name>`, and its file is `features/<name>.md`.

| # | Capability of group 1 | Row of `reference-features.md` | Crate | Step | Name | State |
|---|---|---|---|---|---|---|
| 1 | The chat API driver with streaming | `custom-engines.md`; "A model connection with no tools" | `bot-engine` | 5 | [`chat-streaming`](features/chat-streaming.md) | done, 2026-11-23, at commit `3aec210` |
| 2 | The event bus, the fold, the streamed reply in the window | `README.md`; `chat-ui.md` | `bot-core`, `bot-desktop` | 7 | [`event-bus-fold`](features/event-bus-fold.md) | done, 2026-11-23, at commit `3aec210` |
| 3 | One chat turn from send to reply, the part that `turn-flow-comparison.md` did not read | `chat-turns.md` | `bot-core` | 7 | [`chat-turns`](features/chat-turns.md) | done, 2026-11-23, at commit `3aec210` |

After batch 2, no more research until step 7 of the plan is done. One
exception: batch 3.

## Batch 3, started 2026-11-23

The author made one exception to the pause above. Step 3 (the `Driver`
trait) was the only step of part 1 without full research. Its note,
[`features/driver-contract.md`](features/driver-contract.md), was written
before batch 1, and other research files later replaced its sections 2, 3
and 4. The new research replaces the note.

| # | Capability of group 1 | Crate | Step | Name | State |
|---|---|---|---|---|---|
| 1 | The `Driver` trait, capability flags, a fake driver | `bot-engine` | 3 | [`driver-contract`](features/driver-contract.md) | running, at commit `d6660e2` |
