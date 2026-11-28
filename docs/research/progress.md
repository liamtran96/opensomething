# Research progress, feature by feature

The unit of work is one row of [`reference-features.md`](reference-features.md): one feature, or
one document row that has several features. Each feature is analyzed in its
own worktree by one agent, with the prompt of [`README.md`](README.md). The
worktree is made with `orca worktree create`, so that it shows in the sidebar
of the Orca application. The features of a batch run at the same time.

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
   First run `gh pr list`: an open pull request can hold a batch that
   `main` does not show yet (`MEMORY.md`, 2026-11-28).
2. Read "What to do next" in `reference-features.md`, and the "Research" column of
   its table "What group 1 needs" (or the table of the next group).
3. Read sections 5, 6 and 7 of [`changelog.md`](changelog.md). Write down
   the problems of section 5 that each chosen feature can have. Each
   agent must check these problems in the code.
4. Look at our crates and at [`../plan/README.md`](../plan/README.md). Name the step,
   the crate and the module that get the port of each feature.
5. Choose three to six features. Give each one a short name. Its file is
   `features/<name>.md`.
6. Run the worktrees of a batch at the same time (the author, 2026-11-27).
   Before the approval, give the author the cost estimate of each plan and
   the total. Six workflows used the 5-hour limit before any reader
   finished in batch 6, so offer the cheaper plans when the total is much
   larger than an earlier batch.

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
   after the reset. A change of account does not reach a running agent: it
   keeps the account that it started with. After a change of account, quit
   the agent with `/exit` ("Exit and stop tasks"), and start it again with
   the `claude --resume <session id>` that it prints. Then tell it to resume
   its workflow, or to start again only the readers with no report file.
4. To get a notice when an agent stops, use the cross-session message
   tool with `notify_when_idle`.
5. To act when all worktrees are finished, start one background shell
   job (`run_in_background`) that loops every 3 minutes, with a limit of
   5 hours. For each worktree, it checks two things:
   - the file `docs/research/features/<name>.md` exists in the worktree;
   - the agent is idle: the last lines of
     `orca terminal read --terminal <handle> --json` do not contain
     "esc to interrupt".

   It prints one status line for each loop, and exits when one worktree
   is finished. The main session opens the pull request of that worktree,
   removes the worktree (not the branch), and starts the job again for
   the rest. Do not use `orca terminal wait --for tui-idle` alone: the
   agent is idle while its workflow runs in the background. If a line
   shows a usage limit, send `continue` after the reset (step 4.3).

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
   author decides. When the plan file is in a pull request, delete the
   proposals file of the agent: the plan file has all of its content.

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
- Pass the workflow script inline with the `script` input of the Workflow
  tool. Do not write a script file: its permission prompt blocks the
  agent, and nobody answers it.
- Each subagent writes its report to `.research/<group>.md` in the
  worktree, a part at a time: it makes the file with a list of its files
  first, and adds its notes after each file that it reads. Git does not
  track that folder. After a restart, a subagent reads its report and
  continues from the first file that is not done.
- Load the skill `anthropic-skills:asd-ste100` with the Skill tool before
  you write. If the Skill tool does not list it, read
  `~/.claude/skills/synced/*/asd-ste100/SKILL.md`. Apply it to the prose,
  not to code, paths or quotes.

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
| 1 | The `Driver` trait, capability flags, a fake driver | `bot-engine` | 3 | [`driver-contract`](features/driver-contract.md) | done, 2026-11-23, at commit `d6660e2` |

The main session checked six key claims at `d6660e2`. All six agree with
the code:

1. `interruptTurn` and `respondToRequest` are mandatory, and no flag is
   about streaming, interrupt or approvals (`server/contracts.ts:255-323`).
2. No code reads `sessionModelSwitch`, the only mandatory flag.
3. The fake driver returns `"fake-turn"` for each turn
   (`server/testing/fake-driver.ts:79`).
4. Only the chat driver checks the turn id at a stop
   (`server/drivers/openai-chat.ts:961-966`). Claude ignores it
   (`server/drivers/claude.ts:1963`).
5. Five drivers throw the same busy text (`pi.ts:413`,
   `openai-chat.ts:518`, `claude.ts:951`, `codex.ts:408`,
   `acp/core.ts:922`).
6. The ACP core copies all of `process.env` and deletes only known keys
   (`server/drivers/acp/core.ts:333-346`).

The proposals are in [`../plan/driver-contract.md`](../plan/driver-contract.md).

## Batch 4, started 2026-11-24

The author lifted the pause after batch 2 on 2026-11-24: "please start
analyze the next features". Step 2 of the plan was not complete. The batch
does the three open rows of group 1 and one theme for each of steps 8, 9
and 10 of group 2. The reference is at commit `ed8cb7278` (2026-11-24).

| # | Rows of `reference-features.md` | Group | Crate | Step | Name | State |
|---|---|---|---|---|---|---|
| 1 | `CONTRIBUTING.md`; part 4, the store and the data folder | 1, 2 | `bot-core` | 6, 8 | [`store-and-data-format`](features/store-and-data-format.md) | done, 2026-11-24, at commit `ed8cb7278` |
| 2 | `SECURITY.md`, `LICENSING.md` | 1 | `bot-core`, `bot-cli` | 6, 9 | [`security-model`](features/security-model.md) | done, 2026-11-24, at commit `ed8cb7278` |
| 3 | `server/host/README.md`, `server/routes/README.md` | 1 | `bot-cli`, `bot-desktop` | 7 | [`composition-root`](features/composition-root.md) | done, 2026-11-24, at commit `ed8cb7278` |
| 4 | A fake ACP CLI for protocol tests; part 7 | 2 | `bot-engine` | 9 | [`acp-core`](features/acp-core.md) | done, 2026-11-24, at commit `ed8cb7278` |
| 5 | `specs/steer-sigterm-audit.md`; the fix plans of 2026-08-18 | 2 | `bot-engine` | 9 | [`engine-process-lifecycle`](features/engine-process-lifecycle.md) | done, 2026-11-24, at commit `ed8cb7278` |
| 6 | `approval-levels.md`; the approval level of one thread | 2 | `bot-core`, `bot-engine`, `bot-desktop` | 10 | [`approval-levels`](features/approval-levels.md) | done, 2026-11-24, at commit `ed8cb7278` |

- The row "A model connection with no tools" needs no worktree.
  [`features/chat-streaming.md`](features/chat-streaming.md) names it as
  one of its rows.

The usage limit of one account stopped all subagents of the six agents. The
main session told each agent to start its failed subagents again, after a
change of account.

The main session checked 33 key claims at `ed8cb7278`. All 33 agree with
the code. Some of them:

1. `store-and-data-format`: since v0.1.178 the data format `writes` is 2,
   so an unreadable marker stops the start (`server/data-format.ts:13`,
   `:51-60`). The restart rule has a fourth branch, `restartCut`, from
   commit `01bcd69ed` (`server/runtime/runtime.ts:140-142`).
2. `security-model`: an unset `OMB_LOOPBACK_TRUST` gives `owner`, except on
   a hosted workspace (`server/request-auth.ts:88-111`). A credential that
   is not valid gives 401 and never falls back to loopback (`:707-711`).
3. `composition-root`: no file of `server/host/` (209 source files) or
   `server/routes/` (133 source files) imports `server/index.ts`. The
   desktop waits 9.5 s for the server to stop (`electron/main.mjs:293`).
4. `acp-core`: the environment of an ACP engine still starts from all of
   `process.env` and removes only listed keys
   (`server/drivers/acp/core.ts:339-354`).
5. `engine-process-lifecycle`: a stop sends SIGTERM to the group, waits
   5 s, then sends SIGKILL and waits 1 s (`server/procs.ts:604-668`).
6. `approval-levels`: the load of the store deletes an `approvalMode` that
   is not valid (`server/store.ts:351-354`, `:521-524`). The default level
   then applies, and it is Full (`packages/phone-protocol/src/approval-mode.ts:74`).
   So an unknown stored level becomes Full, not the Ask that the comment
   at `:85-86` says.

The proposals are in `../plan/<name>.md` of each feature.


## Batch 5, started 2026-11-24

The author chose all six open core rows of groups 1 and 2: "All six". After
this batch, group 1 has no open rows, and group 2 has no open core rows. The
reference is at commit `ad27f0716` (2026-11-24). The prompts give each
agent its scope, the earlier files to build on and the border with the other
five features.

| # | Rows of `reference-features.md` | Group | Crate | Step | Name | State |
|---|---|---|---|---|---|---|
| 1 | `chat-ui.md` | 1 | `bot-desktop`, `bot-core` | 7 | [`chat-ui`](features/chat-ui.md) | done, 2026-11-24, at commit `ad27f0716` |
| 2 | Question cards | 2 | `bot-desktop`, `bot-protocol`, `bot-core` | 10 | [`question-cards`](features/question-cards.md) | done, 2026-11-24, at commit `ad27f0716` |
| 3 | Docs site: `features/approvals-and-inspector.mdx`, `security/` | 2 | `bot-protocol`, `bot-engine`, `bot-desktop` | 10 | [`approval-cards`](features/approval-cards.md) | done, 2026-11-24, at commit `ad27f0716` |
| 4 | `cursor.md` | 2 | `bot-engine` | 9 | [`acp-adapter`](features/acp-adapter.md) | done, 2026-11-24, at commit `ad27f0716` |
| 5 | Turn limits: 64 model steps and 200 tool calls | 2 | `bot-engine` | 5, 9 | [`turn-limits`](features/turn-limits.md) | done, 2026-11-24, at commit `ad27f0716` |
| 6 | `plans/agent-harness-upgrades.md` and `-v2.md` | 2 | `bot-core` | 8 | [`harness-upgrades`](features/harness-upgrades.md) | done, 2026-11-24, at commit `ad27f0716` |

- Between `ed8cb7278` and `ad27f0716`, the ACP core got a new file,
  `server/drivers/acp/session-system.ts`, and the adapter hooks
  `skipsAuthenticate`, `processStarted` and `signInRefused`. The agent of
  `acp-adapter` lists the lines of `features/acp-core.md` that are now
  wrong.
- Two starting paths of the row names are in `docs/verification/`, not in
  `docs/`: `chat-ui.md` and `question-cards.md`.

The usage limit of one account stopped all six agents. A running agent keeps
the account that it started with, so `continue` did not help after a change
of account. The main session quit each agent and started it again with
`claude --resume <session id>`. Each agent kept its conversation. A reader
that finished before the limit came back from the journal of the old run. A
reader that did not finish ran again.

The main session checked 24 key claims at `ad27f0716`. All 24 agree with the
code. Some of them:

1. `turn-limits`: the chat driver has no limit of model steps now. The limit
   of 64 came in v0.1.96 (`e5da2fd3e`) and went in v0.1.166 (`d6788b49c`).
   A turn stops after 200 tool calls (`server/drivers/openai-chat.ts:143`,
   `:796`). One reply can have 32 calls
   (`server/drivers/openai-chat-protocol.ts:14`). A chat request has 128
   tools or fewer (`shared/tool-budget.ts:2`).
2. `question-cards`: only the answer of the person settles a question card
   (`packages/phone-protocol/src/ask-question.ts:63-65`). Handed-on work that
   waits on the person gets a reminder after one day and closes after three
   (`server/runtime-coordinator.ts:44-46`). A late answer has a fixed
   `sendId` (`server/person-replies.ts:123`).
3. `chat-ui`: streamed words go to the window with no masking
   (`server/harness/public-reply.ts:1-3`). The window masks the text when it
   draws it, and shows it up to the last space (`src/state/live-reply.ts:183-185`).
4. `approval-cards`: the start sweep closes three kinds of card only, so an
   engine permission card stays open after a restart
   (`server/index.ts:9461-9465`). The outbound rule reads only the tool name,
   so a saved shell command that sends runs with no question
   (`packages/phone-protocol/src/outbound.ts`, `server/auto-approve.ts:114-115`).
5. `acp-adapter`: the Cursor adapter is one `AcpSupport` object
   (`server/drivers/acp/cursor.ts:468-559`). The approval level becomes a
   flag: Full gives `--force`, Auto gives `--auto-review`
   (`cursor.ts:495-500`).
6. `harness-upgrades`: a thread keeps all versions of its messages as a
   tree. The visible path goes from the active leaf up through the parents
   (`server/store.ts:1109-1120`). An edit makes a new branch
   (`server/store.ts:1199-1224`).

The proposals are in `../plan/<name>.md` of each feature.

## Batch 6, started 2026-11-24

The author said: "start analyzing the remaining features". Groups 1 and 2
have no open core rows, so this batch starts group 3 (steps 11 to 16 of the
plan). It does one theme for each of steps 11 to 14 and the two themes of
step 15. The reference is at commit `eee23ebbe` (2026-11-24). Its version
is 0.1.179, which has no tag and no release. The next release, v0.1.180, is
three commits later (`5478065c4`): two commits of the thread tabs and the
version commit. Each agent reads the note of v0.1.180 for its feature, and
the agent of `threads` reads the two commits with `git show`.

| # | Rows of `reference-features.md` | Part | Crate | Step | Name | State |
|---|---|---|---|---|---|---|
| 1 | `threads.md`; `plans/2026-09-09-independent-threads.md`; `plans/2026-09-09-thread-aware-bots.md`; issue 1635 | 12 | `bot-core`, `bot-desktop` | 11 | [`threads`](features/threads.md) | done, 2026-11-25, at commit `eee23ebbe` |
| 2 | `agents-tool-bridge.md`; `tool-results.md`; the tool directory past 128 tools; `list_bots` | 13 | `bot-engine` | 12 | [`agent-tools`](features/agent-tools.md) | done, 2026-11-25, at commit `eee23ebbe` |
| 3 | `runtime-contract.md`; the limits of the runtime; recovery after a restart; Stop ends the request | 14 | `bot-core` | 13 | `assignment-runtime` | running |
| 4 | `room-coordination.md`; `channels.md`; `handoff-status.md`; `specs/aside-injection-seams.md`; `plans/2026-09-02-bot-concurrency.md`; the delegation plans; issue 1641 | 15 | `bot-core`, `bot-engine` | 14 | [`bot-coordination`](features/bot-coordination.md) | done, 2026-11-25, at commit `eee23ebbe` |
| 5 | `memory.md`; `memory-layer.md`; `plans/2026-09-25-memory-layer.md`; the two memory plans of 2026-08-31 | 16 | `bot-core` | 15 | [`memory`](features/memory.md) | done, 2026-11-25, at commit `eee23ebbe` |
| 6 | `routine-schedules.md`; `proactive-routines.md`; `routines.md`; `check-backs.md`; `waits.md`; `automation-reports.md`; `interval-restrictions.md`; docs site `features/automation.mdx` | 18 | `bot-core` | 15 | `automations` | running |

- The 5-hour limit stopped all six agents at about 22:30 on 2026-11-24,
  and the weekly limit of the first model stopped them again after the
  reset. About 55 readers ran at the same time. Each reader saved its
  report only at its end, so 2 reports were complete
  (`assignment-runtime`: `runtime-tests.md`; `automations`:
  `scheduler-tests.md`). All other readers start again.
- On 2026-11-25 the author changed the model of the agents to Opus 5.5 and
  said: "keep the two running, pause the other four". `assignment-runtime`
  and `automations` run. After those two, the author said: "after 2
  starting one by one". The other four continue one at a time, in the
  order of the plan steps: `threads`, `agent-tools`, `bot-coordination`,
  `memory`.
- All six files are done. The main session checked six to eight key
  claims of each file at `eee23ebbe`, and all agree with the code. The
  research pull requests are #53, #55, #57, #59, #61 and #63, and the plan
  pull requests are #54, #56, #58, #60, #62 and #64 (P164 to P229).
- A permission prompt for a workflow script outside the worktree blocked
  `threads` for about 11 hours, and no session can answer it. The agent
  of a worktree passes its workflow script inline with the `script` input
  of the Workflow tool, and does not write a script file.
- Open themes of group 3 after this batch: context (part 17: compaction,
  summaries, the engine switch) and outside tools (part 20: custom MCP
  servers, connected apps, step 16). They are for batch 7.

## Batch 7, started 2026-11-25

The author chose four features: the two open themes of group 3 and the
open rows of part 15. Later the same day, the author added three more
(rows 5 to 7). The reference is at commit `96ff84455`
(2026-11-25), 127 commits after batch 6. No release came after v0.1.180.
The author said: "wait start one by one". One workflow runs at a time, in
the order of this table.

| # | Rows of `reference-features.md` | Part | Crate | Step | Name | State |
|---|---|---|---|---|---|---|
| 1 | `custom-mcp-servers.md`; `verification/mcp-sign-in.md`; the MCP registry, sign-in, per-bot tool scoping and MCP-in-chat plans; the MCP call timeout specification | 20 | `bot-engine` | 16 | [`custom-mcp-servers`](features/custom-mcp-servers.md) | done, 2026-11-25, at commit `96ff84455`: research #66, plan #68 (P230 to P245) |
| 2 | `verification/context-compaction.md`; the engine switch with a replay | 17 | `bot-core` | none yet | [`context`](features/context.md) | done, 2026-11-25, at commit `96ff84455`: research #67, plan #69 (P246 to P255) |
| 3 | `composio.md`; `plans/2026-08-31-04-connector-scopes.md`; `verification/connected-apps-oauth.md`; docs site `connected-apps/`; `cloudflare/composio-broker/README.md` | 20 | `bot-engine` | 16 | [`connected-apps`](features/connected-apps.md) | done, 2026-11-26, at commit `96ff84455`: research #71, plan #82 |
| 4 | `plans/2026-08-31-07-delegation-task-board.md`; `verification/team-setup.md`; `verification/team-access.md`; `verification/full-access.md`; `verification/own-home.md` | 15 | `bot-core`, `bot-engine` | 14 | [`team-structure`](features/team-structure.md) | done, 2026-11-26, at commit `96ff84455`: research #74, plan #83 |
| 5 | `app-settings.md`; `specs/2026-11-12-app-settings-tool-design.md` | 13, 61 | `bot-engine` | 12 | [`app-settings`](features/app-settings.md) | done, 2026-11-26, at commit `96ff84455`: research #70, plan #84 |
| 6 | `evidence/bot-attach-file/README.md`; docs site `features/attachments-and-search.mdx` | 13, 30 | `bot-engine`, `bot-desktop` | 12 | [`bot-attachments`](features/bot-attachments.md) | done, 2026-11-26, at commit `96ff84455`: research #73, plan #85 |
| 7 | Notifications and the unread badge; the notification tools of the helper bot; `notification-and-proactivity-qa.md` | 50 | `bot-desktop`, `bot-core` | none yet | [`notifications`](features/notifications.md) | done, 2026-11-26, at commit `96ff84455`: research #72, plan #86 |
| 8 | Mentions: the picker, colours for each bot, `@everyone` (`verification/mentions.md`) | 23 | `bot-desktop`, `bot-core` | 14 | [`mentions`](features/mentions.md) | done, 2026-11-26, at commit `96ff84455`: research #76, plan #87 |
| 9 | `verification/bot-contact-cards.md`; the sign-in of `verification/whop.md` | 20, 35 | `bot-engine` | 16 | [`bot-contact-cards`](features/bot-contact-cards.md) | done, 2026-11-26, at commit `96ff84455`: research #75, plan #88 |
| 10 | Docs site `features/chat-and-teams.mdx`, the features that no research file covers | 23, 55, 15, 48, 64 | `bot-core`, `bot-desktop` | 14 and others | `chat-and-teams-site` | done, 2026-11-26, at commit `96ff84455`: research #81, plan #89 |
| 11 | `verification/postiz.md`; `verification/whop.md` | 20 | `bot-engine` | 16 | [`hosted-app-connections`](features/hosted-app-connections.md) | done, 2026-11-26, at commit `96ff84455`: research #79, plan #90 |
| 12 | `plans/2026-08-31-01-usage-accounting-and-budgets.md` | 21 | `bot-core` | none yet | [`usage-and-budgets`](features/usage-and-budgets.md) | done, 2026-11-26, at commit `96ff84455`: research #80, plan #91 |
| 13 | `verification/safety-floor.md`; the decision log of `plans/2026-08-31-00-control-plane-roadmap.md` | 10, 11 | `bot-core`, `bot-engine` | 10 | [`safety-floor`](features/safety-floor.md) | done, 2026-11-26, at commit `96ff84455`: research #77, plan #92 |
| 14 | `plans/2026-10-13-chat-widgets.md`; `verification/proposal-cards.md`; `verification/shared-workspace-trust.md` | 48, 51 | `bot-desktop`, `bot-core` | none yet | [`chat-widgets-and-proposals`](features/chat-widgets-and-proposals.md) | done, 2026-11-26, at commit `96ff84455`: research #78, plan #93 |

- The worktrees of rows 1 and 2 exist. The agent of row 2 gets its
  approval only after row 1 is done.
- Row 3 started on 2026-11-25 in the worktree `research-connected-apps`,
  after rows 1 and 2 were done. Its prompt gives the borders with
  `custom-mcp-servers`, `automations`, `approval-cards`,
  `approval-levels` and `agent-tools`. Its first proposal number is P256.
- On 2026-11-25 the author said "start 3 more analyzing features" and
  chose rows 4 to 7. The main session asked how to approve them, because
  of the rule of one workflow at a time. The author chose "All four now",
  so rows 4 to 7 started together while row 3 read its last group. Their
  plans estimate about 4 to 5.5M tokens together.
- On 2026-11-26 the author said "start 2 more feature analyzing" and chose
  rows 8 to 10. The author first chose to approve them when rows 3 to 7 are
  done. Then the author said "start the remaing worktree pleaes", so rows
  8 to 10 started while rows 3 to 7 still ran. In scope for row 10: the
  team inbox, people in the sidebar and the assistant; the paid plans and
  billing are not.
- On 2026-11-26 the author said "start 2 more feature analyzing" and
  chose rows 11 to 14. Rows 11 and 12 are group 3; rows 13 and 14 are group
  later. Most of the safety floor is already in `approval-levels.md`, so
  row 13 analyzes only what that file does not cover. The author approved
  rows 11 to 14 when rows 4 to 10 still ran.
- Later on 2026-11-26 the author said "please pending 2 worktrees with
  many agent is running". The two with the most readers (7 each) were
  paused: `chat-and-teams-site` with "p" in its workflow panel, and
  `usage-and-budgets` with TaskStop. To resume, send "resume" (or "p" in
  the panel): each agent starts only the readers with no complete report. Their agents number the proposals T1, T2, ..., and the main
  session gives the P-numbers. Their prompts tell the agents not to run
  `git checkout` in the shared clone of the reference project.
- Most starting documents of these rows are in `docs/verification/`, not
  in `docs/`.
- The main session checked nine key claims of each done file at
  `96ff84455`, and all agree with the code. #67 is stacked on #66, and #69
  on #68, because each pair changes the same tables.

## Batch 8, started 2026-11-26

Group 3 has no open rows now. The 25 rows of group 3 that
`reference-features.md` still marks "open" are in the files of batch 7. The
author said "start the next analyzing features" and chose four features of
the group "later". The reference is at commit `83d18e3af` (2026-11-26).
Its version is 0.1.181: v0.1.181 is the first release after
`changelog.md`, so each agent reads its note for its feature. The agents number their
proposals T1, T2, ..., and the main session gives the P-numbers from P406.
The author approved all four at the same time: "aprroved all". A
background job sent the approval to each agent when it waited at its plan.

| # | Rows of `reference-features.md` | Crate | Step | Name | State |
|---|---|---|---|---|---|
| 1 | `2026-08-31-02-bot-profile.md`; `bot-settings.md`; `bot-continuity.md`; `presets.md`; `specs/2026-09-05-bot-folder-and-self-setup-design.md` | `bot-core`, `bot-desktop` | none yet | [`bot-profile`](features/bot-profile.md) | done, 2026-11-26, at commit `83d18e3af`: research #94 |
| 2 | Docs site `features/skills.mdx`; `skill-approval-lifecycle.md`; the skill parts of `2026-08-31-06-memory-review-loop.md`; `skills/` | `bot-core`, `bot-engine` | none yet | [`skills`](features/skills.md) | done, 2026-11-26, at commit `83d18e3af`: research #95 |
| 3 | `2026-09-30-per-bot-tool-scoping.md`; `tool-selection.md` | `bot-engine`, `bot-core` | none yet | [`tool-selection`](features/tool-selection.md) | done, 2026-11-26, at commit `83d18e3af`: research #96 |
| 4 | `automatic-recovery.md`; `provider-recovery.md`; `pausing-bots.md`; `team-incidents.md` | `bot-engine`, `bot-core` | none yet | [`recovery-and-pausing`](features/recovery-and-pausing.md) | done, 2026-11-26, at commit `83d18e3af`: research #97 |

- All four agents finished between 20:25 and 20:36. The main session
  checked four or five key claims of each file at `83d18e3af`, and all
  agree with the code. Two line numbers of `skills.md` were wrong
  (`PendingApproval.tsx:167`, `:236`); the main session corrected them to
  `:168` and `:273-283` before the pull request.
- The worktrees are removed and the branches are kept. The proposals of
  each agent are in `docs/plan/<name>.md`, with P-numbers from P406.
- The batch also adds v0.1.181 to `changelog.md`, and points the 25 rows
  of group 3 that still said "open" to their batch 7 files.

## Batch 9, started 2026-11-26

The author said "start the next analyzing features" and chose two
features: the last open row of group 3, and one new document of the group
"later". The author first chose "One by one", then said "start 1 one
feature" and "it mean 3 worktree run in parralle". So the batch has a third
feature, which the main session chose, and all three run at the same time.
The reference is at commit `140172d88` (2026-11-26), the tag of v0.1.182.
`changelog.md` has the row of v0.1.182 now. The agents number their
proposals T1, T2, ..., and the main session gives the P-numbers from P471.

| # | Rows of `reference-features.md` | Group | Crate | Step | Name | State |
|---|---|---|---|---|---|---|
| 1 | Docs site `connected-apps/github-sign-in.mdx` | 3 | `bot-engine` | 16 | [`github-sign-in`](features/github-sign-in.md) | done, 2026-11-26, at commit `140172d88`: research #113 |
| 2 | `team-board.md`; `verification/team-board.md` | later | `bot-core`, `bot-engine` | none yet | [`team-board`](features/team-board.md) | done, 2026-11-26, at commit `140172d88`: research #114 |
| 3 | `engines.md`, `engines-ui.md`; `chatgpt-plan.md`, `claude-account.md`, `codex-account.md`; the device code of `server-settings.md`; the default model of `onboarding.md`; docs site `providers/` | later | `bot-engine` | 4, 9 | [`engines-and-accounts`](features/engines-and-accounts.md) | done, 2026-11-26, at commit `140172d88`: research #115 |

- The prompts give each agent its borders with the files that are done.
  `github-sign-in` reads only `broker-github.ts` of the bot box, which is
  an open row. `team-board` does not analyze the delegation task board
  plan again: `team-structure.md` has it. `engines-and-accounts` leaves
  the detail of each ACP engine and the onboarding flow to later features,
  and has a limit of 8 groups of files.
- Two background jobs send the approval to each agent when it waits at its
  plan. Each job exits when a file exists and its agent is idle.
- At 22:02 the author said "please pending 2 of them". `github-sign-in`
  continues: 6 of its 9 readers were done. `team-board` stopped its
  workflow with TaskStop (one report of six was complete), and
  `engines-and-accounts` is paused with "p" in its workflow panel (no
  report was complete). To resume, send "resume" to `team-board` and "p" to
  the panel of `engines-and-accounts`. The account was at 92% of its 5-hour
  limit, which resets at 00:30.
- At about 22:40 the author changed the account and said "no need to
  wait". The main session quit the three agents ("Exit and stop tasks"),
  started each one again with `claude --resume <session id> --model
  claude-opus-5-5`, and told each one to start only the readers with no
  complete report, on Opus 5.5. All nine readers of `github-sign-in` were
  done, so it went on to its verifiers.
- All three agents finished between 22:55 and 23:48. The main session
  checked five or six key claims of each file at `140172d88`, and all
  agree with the code. The agents wrote T-numbers in sections 7 and 8;
  the main session changed them to P-numbers before the pull requests:
  `github-sign-in` has P471 to P483, `team-board` P484 to P498, and
  `engines-and-accounts` P499 to P514.
- The worktrees are removed and the branches are kept. The proposals of
  each agent are in `docs/plan/<name>.md`.
- The batch also adds v0.1.182 to `changelog.md`, corrects
  `acp-adapter.md` (an unboxed bot gets a secret for a credential helper,
  not the GitHub token), and adds a note to `team-structure.md` and
  `bot-coordination.md`: their "no board" is about the plan of 2026-08-31,
  not the Team Board.

## Batch 10, started 2026-11-27

The author said "start the next analyzing features" and chose four
features of the group "later". The reference is at commit `fcce0b6de`
(2026-11-26), 13 commits after the tag v0.1.182. No release came after
v0.1.182. The agents numbered their proposals T1, T2, ..., and the main
session gave the P-numbers from P515.

| # | Rows of `reference-features.md` | Crate | Step | Name | State |
|---|---|---|---|---|---|
| 1 | `digests.md`; `plans/2026-09-14-phase-0-foundation.md` | `bot-core` | none yet | [`work-digests`](features/work-digests.md) | done, 2026-11-27, at commit `fcce0b6de`: research #121 (P515 to P524) |
| 2 | Search of past sessions (`2026-08-31-06-memory-review-loop.md`); search in a worker (`persistence-performance.md`) | `bot-core` | none yet | [`session-search`](features/session-search.md) | done, 2026-11-27, at commit `fcce0b6de`: research #122 (P525 to P534) |
| 3 | `plans/2026-09-02-goal-mode-v2.md` | `bot-core`, `bot-protocol`, `bot-desktop` | none yet | [`goals`](features/goals.md) | done, 2026-11-27, at commit `fcce0b6de`: research #123 (P535 to P544) |
| 4 | `feature-flags.md`; `local-environments.md`; `plans/local-environments.md`; `plans/2026-10-07-local-environments.md` | `bot-core`, `bot-desktop` | none yet | [`environments-and-flags`](features/environments-and-flags.md) | done, 2026-11-27, at commit `fcce0b6de`: research #124 (P545 to P558) |

- The prompts gave each agent its border with the files that are done:
  `memory.md`, `event-bus-fold.md`, `context.md` and `safety-floor.md` for
  `work-digests`; `memory.md` and `skills.md` for `session-search`;
  `automations.md`, `chat-turns.md` and `bot-coordination.md` for `goals`;
  `store-and-data-format.md` for `environments-and-flags`.
- The author approved all four at the same time: "approved and go all".
  The four plans estimated about 5 to 7M tokens together.
- All four agents finished between 00:58 and 01:08 on 2026-11-27. The Orca
  application was not running for some hours after that, so the main
  session reached the agents only at about 20:45. The agents kept running
  in the background services of Orca, and no work was lost.
- The main session checked 7 to 10 key claims of each file at
  `fcce0b6de`, and all 33 agree with the code. The agent of `work-digests`
  corrected two claims of its readers before the main session saw the
  file: the hook token does not change each turn, and some lines of
  `server/index.ts` were off by 3 to 7.
- The author said "merge them all", and the four research pull requests
  were merged on 2026-11-27.
- The worktrees are removed and the branches are kept. The proposals of
  each agent are in `docs/plan/<name>.md`. The plan
  pull requests are #126 (`work-digests`), #127 (`session-search`), #128
  (`goals`), and #129 and #130 (`environments-and-flags`). They are
  stacked, because each one changes the same tables of
  `docs/plan/README.md`.
- This batch also marks the row "Docs site: `providers/`" of
  `reference-features.md` as done. Batch 9 read it for
  `engines-and-accounts.md`, but did not change its row.

## Batch 11, started 2026-11-27

The author said "start analyzing new features" and chose four features of
the group "later", all running at the same time. The reference is at commit
`42f86aefd` (2026-11-27), 231 commits after batch 10. It includes the
release v0.1.184, which this batch adds to `changelog.md`. v0.1.183 has a
version commit and no release. The agents numbered their proposals T1,
T2, ..., and the main session gave the P-numbers from P559.

| # | Rows of `reference-features.md` | Crate | Step | Name | State |
|---|---|---|---|---|---|
| 1 | `bot-box.md` | `bot-core`, `bot-engine` | none yet (9 and 11 for the allow list and the process gate) | [`bot-box`](features/bot-box.md) | done, 2026-11-27, at commit `42f86aefd`: research #131 (P576 to P588) |
| 2 | `claude-endpoint.md`, `claude-tool-lifecycle.md`; `codex-browser-routing.md`, `codex-helpers.md`, `codex-instructions.md` | `bot-engine` | 5, 9 | [`engine-turn-lifecycle`](features/engine-turn-lifecycle.md) | done, 2026-11-27, at commit `42f86aefd`: research #132 (P589 to P608) |
| 3 | The OpenCode Go plans and page; the DeepSeek plan; `opencode-variants.md`; `pi-shell-timeouts.md`; `qwen-models.md`; `cline.md`, `copilot-engine.md`, `custom-acp-models.md`, `kimi-models.md` and the steering engine; issue 1688 | `bot-engine` | 4, 9 | [`acp-engine-details`](features/acp-engine-details.md) | done, 2026-11-27, at commit `42f86aefd`: research #133 (P609 to P625) |
| 4 | `bitwarden.md` | `bot-core` | none yet | [`vault-bitwarden`](features/vault-bitwarden.md) | done, 2026-11-27, at commit `42f86aefd`: research #134 (P559 to P575) |

- The prompts gave each agent its rows and its borders. Inside the batch,
  steering into a running turn went to `engine-turn-lifecycle`, the
  credential broker to `bot-box`, and the `bw://` references to
  `vault-bitwarden`. `bot-box` added new facts to the two open proposals
  of `changelog.md` section 7 (the allow list and the process gate), and
  did not propose them again.
- The four plans estimated about 24 to 35M tokens together, most of them
  cache reads of the two engine features. The author approved all four as
  planned.
- All four agents finished between 21:44 and 21:57 on 2026-11-27, with no
  usage limit.
- The main session checked four or five key claims of each file at
  `42f86aefd`, and all 18 agree with the code. The two engine files found
  that the reference often chooses behaviour by a driver name, for example
  the approval levels (`server/drivers/acp/approval-mode.ts:22-26`), and
  that a Claude turn that streamed only reasoning can still be sent again
  (`server/drivers/claude.ts:1391-1392`).
- The worktrees are removed and the branches are kept. The proposals of
  each agent are in `docs/plan/<name>.md`. The plan pull requests are #136
  (`vault-bitwarden`), #137 (`bot-box`), #138 (`engine-turn-lifecycle`) and
  #139 (`acp-engine-details`). They are stacked, because each one changes
  the same tables of `docs/plan/README.md`. Each plan file keeps the full
  text of its proposals, so each pull request has more than 200 lines.
- The renumbering from T to P changed the name "T3 Code" (an MIT credit of
  the reference) to "P611 Code" in `acp-engine-details.md`. #133 corrects
  it. When you renumber, change only the T-numbers of the proposals list.

## Batch 12, started 2026-11-27

The author said "start next analyzing feature" and chose four features of
the group "later", all running at the same time. Later the author added two
more (rows 5 and 6). The reference is at commit
`42f86aefd` (2026-11-27), the same commit as batch 11. No release came
after v0.1.184. The agents number their proposals T1, T2, ..., and the main
session gives the P-numbers from P626.

| # | Rows of `reference-features.md` | Crate | Step | Name | State |
|---|---|---|---|---|---|
| 1 | `mausbot.md` (the default helper bot); `memory-layer.md` (the helper model) | `bot-core`, `bot-engine` | none yet (9 and 16 for the helper model) | [`helper-bot`](features/helper-bot.md) | done, 2026-11-27, at commit `42f86aefd`: research #142, plan #143 (P636 to P643) |
| 2 | `superpowers/specs/2026-10-14-chat-apps-design.md`; `rich-tables.md`; the open part of `chat-polish.md` | `bot-desktop`, `bot-engine` | none yet (16 for the MCP applications) | [`chat-apps-and-tables`](features/chat-apps-and-tables.md) | done, 2026-11-27, at commit `42f86aefd`: research #144, plan #145 (P644 to P659) |
| 3 | `onboarding.md`; `plans/2026-09-09-onboarding.md`; `first-hour.md`; `cli-onboarding.md`; docs site `getting-started/` | `bot-desktop`, `bot-core` | none yet | [`onboarding`](features/onboarding.md) | done, 2026-11-27, at commit `42f86aefd`: research #140, plan #141 (P626 to P635) |
| 4 | `startup-tray.md`; `desktop-server-connection.md`; `desktop-server-recovery.md`; `desktop-chat-links.md`; `linux-desktop.md`; the host adapter of `2026-08-31-05-headless-harness.md` | `bot-desktop`, `bot-cli` | none yet (7 for the start and stop of the server) | [`desktop-shell`](features/desktop-shell.md) | done, 2026-11-27, at commit `42f86aefd`: research #146, plan #147 (P660 to P668) |
| 5 | `bot-settings.md`; `bot-continuity.md` (the parts that `bot-profile.md` did not cover) | `bot-desktop`, `bot-core` | none yet | [`bot-settings-ui`](features/bot-settings-ui.md) | done, 2026-11-27, at commit `42f86aefd`: research #150, plan #151 (P680 to P688) |
| 6 | Bot to bot across servers (`bot-api.md`, `runtime-contract.md`) | `bot-core`, `bot-engine` | none yet (13 and 14) | [`remote-bots`](features/remote-bots.md) | done, 2026-11-27, at commit `42f86aefd`: research #148, plan #149 (P669 to P679) |

- Most starting documents are in `docs/verification/`. `cli-onboarding.md`,
  `desktop-chat-links.md` and `linux-desktop.md` are in `docs/`, and the
  onboarding plan is in `docs/plans/`, not in `docs/superpowers/plans/`.
- The prompts give each agent its borders with the files that are done:
  `notifications.md`, `memory.md`, `bot-profile.md` and
  `engines-and-accounts.md` for `helper-bot`; `chat-widgets-and-proposals.md`,
  `bot-attachments.md`, `chat-ui.md` and `custom-mcp-servers.md` for
  `chat-apps-and-tables`; `engines-and-accounts.md`, `skills.md`,
  `bot-profile.md` and `security-model.md` for `onboarding`;
  `composition-root.md`, `engine-process-lifecycle.md` and
  `security-model.md` for `desktop-shell`.
- The author approved rows 1 to 4 at the same time: "approved all, go".
  Their plans estimated about 21 to 29M tokens together. Then the author
  said "start 2 more features analyzing" and chose rows 5 and 6.
  `bot-settings-ui` starts from section 9 of `bot-profile.md`, and
  `remote-bots` builds on `agent-tools.md`, `bot-coordination.md` and
  `assignment-runtime.md`.
- All six agents finished between 23:07 and about 23:30 on 2026-11-27, with no
  usage limit. The account had 25% of its weekly limit left at the end.
- The main session checked five or six key claims of each file at
  `42f86aefd`, and all 31 agree with the code. Some of them:
  1. `onboarding`: the welcome opens the chat before it saves its end, and
     the `catch` of the save is empty
     (`src/components/onboarding/WelcomeFlow.tsx:96-102`).
  2. `helper-bot`: the cap gate of a side job passes no bot id
     (`server/index.ts:5054`), and a title books no usage
     (`server/thread-title-generate.ts:32`).
  3. `chat-apps-and-tables`: the row text of an MCP application is
     redacted, and the stored `toolResult` is not
     (`server/chat-apps-mcp.ts:220-225`, `:252-255`).
  4. `desktop-shell`: a file of environments that cannot be read gives an
     empty list, and the next save writes over it
     (`electron/environments-file.mjs:13-23`).
  5. `remote-bots`: an approval on the other server completes the hand-off
     as a success, and "Nothing more comes back"
     (`server/host/remote-teammate-handoff.ts:225-227`).
  6. `bot-settings-ui`: a field save waits 400 ms in memory
     (`src/state/bot-patch-queue.ts:160`), and Duplicate has no guard
     against a second click (`src/state/store.tsx:2497-2499`).
- The main session wrote the plan file of each feature right after its
  research pull request (`MEMORY.md`, 2026-11-27). The plan pull requests
  are stacked in this order, because each one changes the same tables of
  `docs/plan/README.md`: #141, #143, #145, #147, #149, #151.
- The worktrees are removed and the branches are kept. The proposals
  files of the agents are deleted: each plan file has all of their content.
- This record also corrects done files: a note of batch 12 in `context.md`,
  `memory.md` and `usage-and-budgets.md` (the lines of
  `server/side-jobs.ts` moved), in `threads.md` (the title prompt changed),
  in `assignment-runtime.md`, `agent-tools.md` and `chat-and-teams-site.md`
  (remote teammates), and one fact in the Bot API row of
  `docs/comparison.md`. Row 135 of `reference-features.md` (the host
  adapter) is done: the adapter was never built, and a grant over a private
  port does its job (`server/desktop-computer.ts:2-6`).

## Batch 13, started 2026-11-28

The author said "start next analyzing feature". The main session first
offered features that batch 12 had already done, because it did not look at
the open pull requests. The author said "please check the list pr as well".
The 13 pull requests of batch 12 (#140 to #152) were open. The author chose
two features of the group "later" and "Merge them first". The main session
merged #140 to #152, and then started the two worktrees from the new
`main`. The author also said: "dont ask me anything in this session do
it", so the main session approved the plans of the agents.

The reference is at commit `95f3c9f16` (2026-11-27), the version commit of
v0.1.185. It is one commit after `42f86aefd` and changes no document and no
code: only the version, two ratchet tests, `server/data-format-released.json`
and `src/locales/source-hashes.json`. On 2026-11-28 v0.1.185 has no release
(`gh release list` shows v0.1.184 as the latest), so `changelog.md` gets no
row yet. The agents numbered their proposals T1, T2, ..., and the main
session gave the P-numbers from P689.

| # | Rows of `reference-features.md` | Crate | Step | Name | State |
|---|---|---|---|---|---|
| 1 | `DESIGN.md`; docs site `features/themes.mdx`; `bidi.md`; `cloud-rail.md` (without the Cloud parts) | `bot-desktop` | none yet (6 and 8 for P690 and P691) | [`look-and-design`](features/look-and-design.md) | done, 2026-11-28, at commit `95f3c9f16`: research #153, plan #155 (P689 to P700) |
| 2 | `sidebar.md` (the sidebar and departments); `teams.md` (the sidebar part); docs site `features/bots-and-tasks.mdx` | `bot-desktop`, `bot-core` | none yet (6, 11 and 14 by P701 and P704) | [`sidebar-and-departments`](features/sidebar-and-departments.md) | done, 2026-11-28, at commit `95f3c9f16`: research #154, plan #156 (P701 to P709) |

- The prompts gave each agent its borders: `chat-ui.md`, `threads.md`,
  `bot-settings-ui.md`, `bot-profile.md`, `desktop-shell.md` and
  `environments-and-flags.md` for `look-and-design`; `notifications.md`,
  `team-structure.md`, `threads.md`, `chat-and-teams-site.md`,
  `recovery-and-pausing.md`, `bot-profile.md` and `bot-settings-ui.md` for
  `sidebar-and-departments`. Each one had a limit of 8 groups of files.
- The plans estimated about 2 to 3M tokens (`look-and-design`) and about 6
  to 11M tokens (`sidebar-and-departments`). Both agents finished at 00:59
  on 2026-11-28, with no usage limit. The usage limit of the main session
  stopped it before the pull requests, and it continued after the reset.
- The main session checked five or six key claims of each file at
  `95f3c9f16`, and all 11 agree with the code. Some of them:
  1. `look-and-design`: the checks of theme CSS block only loads
     (`shared/theme.ts:191-202`), and a theme change has the tier "safe",
     so it applies with no approval (`server/themes/tool.ts:77`,
     `server/app-settings/host.ts:144-150`).
  2. `look-and-design`: v0.1.151 deleted eight settings of Advanced mode
     (`src/lib/new-look.ts:17-18`, `:53`), and a look change is three
     separate writes (`server/themes/store.ts:178-184`).
  3. `sidebar-and-departments`: a drag across lists sends two writes
     (`src/components/SidebarBotDrag.tsx:84-85`), and the order route has
     no version check (`server/routes/bot-order.ts:35`).
  4. `sidebar-and-departments`: the window drops the time it saw when it
     marks a thread read (`src/state/read-visible.ts:10-13`), and the
     server marks read up to the newest message
     (`server/index.ts:4039-4042`).
- The plan pull requests are stacked: #156 on #155, because each one
  changes the same tables of `docs/plan/README.md`.
- This record also marks three rows "done" that said "partial" but were
  read completely in earlier batches: `custom-engines.md`
  (`driver-contract.md` read all 235 lines), the Connections Center UI
  (section 5.1 of `custom-mcp-servers.md`: the tabs are gone), and the
  state of a teammate (section 5 of `bot-coordination.md`: `peerStatus`).
  It adds a note of batch 13 to section 5.4 of `notifications.md` (the
  group "Unread" no longer shows since v0.1.182), and corrects section 12
  of `docs/comparison.md`.
- The agent of `sidebar-and-departments` said that the row of v0.1.182 in
  `changelog.md` does not have "rows keep their place". The row has it
  ("The sidebar keeps its order:"), so `changelog.md` does not change.
- After this batch, the group "later" has two open themes: the avatars and
  the mascot (six rows), and localization.

## Batch 14, started 2026-11-28

The author said "start next analyzing features". No pull request was open.
The group "later" had two open themes: the avatars and the mascot (six
rows), and localization (one row). The author chose three worktrees: the
avatar theme in two features, and localization. All three ran at the same
time.

The reference is at commit `e1cc6a290` (2026-11-28), 138 commits after
`95f3c9f16`. v0.1.186 (2026-11-27) is the latest release, with its tag at
`70eb44c1a`. v0.1.185 has no tag and no release. This record adds the row
of v0.1.186 to `changelog.md`. The agents numbered their proposals T1, T2,
..., and the main session gave the P-numbers from P710.

| # | Rows of `reference-features.md` | Crate | Step | Name | State |
|---|---|---|---|---|---|
| 1 | Ten mascot body shapes; the 25 face expressions, the gaze and the mouths (`2026-08-31-04-mascot-shape-catalog.md`); the vendored Open Bot Avatar engine | `bot-desktop`, `bot-protocol` | none yet (P726 adds one) | [`mascot`](features/mascot.md) | done, 2026-11-28, at commit `e1cc6a290`: research #160, plan #162 (P724 to P735, and D23) |
| 2 | `avatar-storage.md`; `avatar-providers.md`; the "Living" avatar | `bot-desktop`, `bot-core` | none yet (P710 adds one) | [`avatars`](features/avatars.md) | done, 2026-11-28, at commit `e1cc6a290`: research #158, plan #159 (P710 to P723) |
| 3 | `localization.md`, `localization-pt-br.md` | `bot-desktop`, `bot-core`, `bot-protocol` | none yet (P738 gives two parts; P736 is for PR 2.5) | [`localization`](features/localization.md) | done, 2026-11-28, at commit `e1cc6a290`: research #161, plan #163 (P736 to P747) |

- The prompts gave each agent its borders: `look-and-design.md`,
  `bot-settings-ui.md` and `bot-profile.md` for `mascot`;
  `bot-attachments.md`, `bot-profile.md`, `bot-settings-ui.md`,
  `onboarding.md` and `look-and-design.md` for `avatars`;
  `look-and-design.md`, `app-settings.md`, `chat-ui.md`, `helper-bot.md` and
  `threads.md` for `localization`. Each one had a limit of 8 groups of
  files. The localization agent read `en.json` (12,347 lines) in recorded
  ranges, and a script measured the key coverage of the other 15 packs.
- The plans estimated about 2 to 3M tokens (`mascot`), 1.5 to 2M
  (`avatars`) and 1.5 to 2.5M (`localization`). The status line showed 19%
  of the weekly limit at the start and 15% at the end. The author said
  "approved all". All three agents finished between 15:38 and 15:50, with
  no usage limit.
- During the work, the author said: "for the mastcot I want to make it like
  an ant". The main session sent this to the mascot agent, and section 7.4
  of `mascot.md` says how an ant fits each part of the reference design.
  The decision is D23 of `docs/decisions.md`. Its form (one ant, or ant
  variants) is P724.
- The author said "merge them all". The main session merged each research
  and plan pull request of the batch when it was open (#158 to #163).
- The main session checked four or five key claims of each file at
  `e1cc6a290`, and all 14 agree with the code. Some of them:
  1. `avatars`: the load of the store deletes an avatar value that it does
     not accept and saves the file (`server/store.ts:376-383`, `:534`), and
     the Living avatar was removed in `eb6fad2c0` before v0.1.48.
  2. `mascot`: the NOTICE of the reference names Open Bot Avatar 0.3.0 for
     0.4.0 code (`NOTICE:133-137`), and it does not name "Blob Studio"
     (`src/components/CursorAvatar.tsx:1`).
  3. `mascot`: an idle bot gets its face from English words in its name
     (`src/lib/mascot.ts:171-200`).
  4. `localization`: a missing `source-hashes.json` reads as empty
     (`scripts/generate-locale.mjs:164`), and the hashes are recorded only
     at the release (`.github/workflows/prepare-release.yml:113`).
  5. `localization`: a person-languages file that cannot be read is
     written over at the next save (`server/host/person-languages.ts:37-48`).
- The worktrees are removed and the branches are kept. The proposals files
  of the agents are deleted: each plan file has all of their content.
- This record also corrects the row "Mascot" of section 11.6 of
  `docs/comparison.md` (the generator face is for the `cursor` body only),
  and adds two v0.1.186 examples to section 5 of `changelog.md`.
- After this batch, the group "later" has no open row. The open rows are in
  the group "no" (not in our plan).

## The update to v0.1.186, started 2026-11-28

The author asked to read the newest code of the reference and to update the
research and the plan of each feature that the release v0.1.186 changed,
and only those. The reference is at commit `e1cc6a290` (2026-11-28), after
the tag v0.1.186 (`70eb44c1a`, 2026-11-27).

The main session chose the features from the release note and from a
`git diff` of the reference files that each research file cites. Apps,
templates, the Cloud, lending and the licence file changed too, but they
are not in our plan. Six Orca worktrees ran at the same time, on Opus 5.5.
Each agent read only the commits from the commit of its research file to
`e1cc6a290`, with four subagents at most.

| Worktree | Research and plan files | Read before at | Proposals | Pull request |
|---|---|---|---|---|
| `update-automations` | `automations` | `eee23ebbe` | P748 to P754, P805 | #166 |
| `update-custom-mcp-servers` | `custom-mcp-servers` | `96ff84455` | P755 to P764 | #167 |
| `update-safety-and-files` | `safety-floor`, `bot-attachments` | `ed8cb7278`, `96ff84455` | P765 to P771 | #168 |
| `update-chat-driver` | `chat-streaming`, `chat-driver-tool-calls` | `3aec210` | P772 to P777 | #169 |
| `update-engine-sessions` | `engine-turn-lifecycle`, `engines-and-accounts`, `recovery-and-pausing` | `42f86aefd`, `140172d88`, `83d18e3af` | P778 to P793 | #170 |
| `update-work-between-bots` | `assignment-runtime`, `bot-coordination`, `goals` | `eee23ebbe`, `eee23ebbe`, `fcce0b6de` | P794 to P804 | #171 |

- The agents numbered their proposals TA1, TB1, ..., and the main session
  gave the P-numbers. Two agents numbered from 1 in each plan file. The
  main session corrected the links between the files.
- The estimates were 9.4M to 14.4M tokens in total. The status line showed
  14% of the weekly limit left at the start and 5% at the end. The
  work-between-bots agent used about 0.9M of its 3M to 4.5M estimate.
- The main session checked three to five key claims of each worktree at
  `e1cc6a290`, and all agree with the code. Some of them:
  1. `automations`: a scheduled run is held while another run of its
     routine has a live turn (`server/routines.ts:1123-1124`).
  2. `custom-mcp-servers`: three timeouts in a row make a verdict
     (`server/mcp-health.ts:16-20`, `:81-86`).
  3. `safety-floor`: `echo ${X:-$(rm -rf /)}` is `delete-root`
     (`server/safety-floor.test.ts:152`).
  4. `chat-streaming`: at most 8 continuations of a cut reply in one turn
     (`server/drivers/openai-chat-protocol.ts:22-30`).
  5. `engines-and-accounts`: the Claude sign-in refuses the digits-only
     code that Claude emails (`server/drivers/claude-login-auth.ts:46-51`).
  6. `assignment-runtime`: only a `resume` reply is refused back to an
     ancestor (`server/runtime/runtime.ts:238-243`), after the tag.
- The author chose for P751 that "after the reply" follows the reference:
  after any assistant text of the turn.
- The author asked how Claude handles a refused tool call. A headless turn of
  the Claude Code CLI 2.1.332 showed it: the refused call is one failed step,
  the model reports it, and the run ends as `success` with the call in
  `permission_denials`. This gave P805, the other option of P751.
- This record links P748 to P805 in `docs/plan/README.md`, adds them to its
  table of reference problems, and adds four missing release lines to the
  v0.1.186 row of `changelog.md`.
- Not corrected yet, from the reports of the agents:
  - `docs/plan/custom-mcp-servers.md` cites `server/mcp-health.ts:15`,
    which is `:16` at `e1cc6a290`.
  - P537 and P538 of `docs/plan/goals.md` cite lines of
    `server/group-goal-run.ts` and `server/index.ts` that moved.
  - `docs/research/features/team-board.md` section 3.1 names the switch
    `features.teamBoard`, which is gone. `helper-bot.md` cites lines of
    `server/job-slots.ts` that moved by 5 after line 62.
  - The quote of v0.1.154 in section 5 of `changelog.md` comes from a block
    of the release notes that commit `6fa9e4dc7` removed from
    `announcements/releases.json`.
- The worktrees are removed and the branches are kept.

