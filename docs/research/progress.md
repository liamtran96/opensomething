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
6. Run at most two workflows at the same time. Start the next feature when
   one finishes. Six workflows at the same time used the usage limit
   before any reader finished (batch 6).

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
| 1 | `threads.md`; `plans/2026-09-09-independent-threads.md`; `plans/2026-09-09-thread-aware-bots.md`; issue 1635 | 12 | `bot-core`, `bot-desktop` | 11 | `threads` | paused, waits for its turn |
| 2 | `agents-tool-bridge.md`; `tool-results.md`; the tool directory past 128 tools; `list_bots` | 13 | `bot-engine` | 12 | `agent-tools` | paused, waits for its turn |
| 3 | `runtime-contract.md`; the limits of the runtime; recovery after a restart; Stop ends the request | 14 | `bot-core` | 13 | [`assignment-runtime`](features/assignment-runtime.md) | done, 2026-11-25, at commit `eee23ebbe` |
| 4 | `room-coordination.md`; `channels.md`; `handoff-status.md`; `specs/aside-injection-seams.md`; `plans/2026-09-02-bot-concurrency.md`; the delegation plans; issue 1641 | 15 | `bot-core`, `bot-engine` | 14 | `bot-coordination` | paused, waits for its turn |
| 5 | `memory.md`; `memory-layer.md`; `plans/2026-09-25-memory-layer.md`; the two memory plans of 2026-08-31 | 16 | `bot-core` | 15 | `memory` | paused, waits for its turn |
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
- The main session checked these key claims of `assignment-runtime` at
  `eee23ebbe`. All agree with the code:
  1. The product limits are depth 4, 64 requests and 96 turns for each
     root (`server/runtime-coordinator.ts:48-49`, `:180`), not the
     defaults 24 and 48 (`server/runtime/types.ts:374-386`). The defaults
     are merged under the options, so the 24-hour queue stays
     (`server/runtime/runtime.ts:100`).
  2. At a restart, a running row has five branches in this order: it gave
     out work, it did an outward action, it was cut two times, the host
     hook `restartCut`, else it runs again one time
     (`server/runtime/runtime.ts:109-158`).
  3. Stop cancels running children too (`server/runtime/runtime.ts:675-693`).
     The contract says that they "keep their process and still report"
     (`docs/runtime-contract.md:48`), so the contract is old.
  4. `checkInvariants` has checks for I1 to I9 only
     (`server/runtime/invariants.ts`).
  5. A brief is clipped to 12,000 characters (`server/runtime/runtime.ts:54`,
     `:224`).
  6. The partial index `assignments_live` reads only open rows
     (`server/runtime/store.ts:140`).
- Open themes of group 3 after this batch: context (part 17: compaction,
  summaries, the engine switch) and outside tools (part 20: custom MCP
  servers, connected apps, step 16). They are for batch 7.
