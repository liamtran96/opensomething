# The release history of the reference project

What the release notes and the git history of the reference project say
about how it grew: the order of its features, the base parts that came late,
and the problems that came again and again. We use this to choose the
structure of our Rust port before the code exists.

The check of this file on 2026-11-23 is in
[`changelog-check.md`](changelog-check.md). It lists each error that it
corrected and each key change that it added.

## 1. In short

- The reference project published 169 releases from v0.1.0 (2026-08-11) to
  v0.1.177 (2026-11-22), 103 days later. 15 of them are drafts with no
  notes.
- It built wide first. Work between bots came on day 1, rooms on day 2. The
  base parts came later: a shared wire model on day 36, one job runtime on
  day 63, and "the first step" to one storage layer on day 98.
- The cost is in its git history. Up to v0.1.177 it has 2,826 `fix`
  commits and 1,089 `feat` commits. That is 2.6 fixes for each feature.
- Ten problems are in each of six periods of the history (section 5). Each
  of them is a problem of structure. Section 7 gives the answer that a type
  or one owner module can give. Three problems that the check of 2026-11-23
  found have no answer yet (section 9).
- Three ideas held from the first server commit: one contract for all
  engines, one event stream as the source of truth, and a bad config entry
  that does not stop the server.

Special terms:

- **Release note:** the text that the project publishes with each version.
  It is written for users.
- **Base part:** code that many features depend on, for example the store,
  the wire types or the job runtime.
- **Job runtime:** the module that holds each piece of work that one bot
  gives to a bot. Our plan calls it the assignment runtime (step 13).
- **Ratchet:** a test that lets a number go down and never up, for example
  the line count of one file.
- **Day:** the number of days after v0.1.0 (2026-08-11 is day 0).

## 2. Sources and method

| Source | What | How it was read |
|---|---|---|
| Release notes, main repository | 125 releases, v0.1.46 to v0.1.177 | Downloaded with the GitHub API on 2026-11-23 |
| Release notes, legacy archive | 161 releases, v0.1.0 to v0.1.177 | The same. The changelog page of the reference links to it |
| Both, each tag one time | 169 releases, about 608,000 characters | Six subagents, one for each of six ranges. Each read all lines and reported the line ranges. This was done two times: to make the file, and to check it |
| Release note of v0.1.178 | One release, published 2026-11-23 | Read in full with `gh release view` on 2026-11-24, after the check of 2026-11-23. Each quote was compared with the release text |
| Git history of the local clone | 12,719 commits up to v0.1.177; 13,035 at `d6660e2d7` (2026-11-23) | `git log` counts and the first versions of five files, read by the main session |

- The changelog in the source of the reference
  (`apps/docs/content/docs/changelog/index.mdx`) has no text of its own. It
  loads the releases from GitHub.
- A commit counts as `fix` when its subject starts with `fix(`, `fix:` or
  `fix!`. The same rule applies to `feat` and `refactor`.
- A script checked each quote of sections 3 to 8 against the release text.
  All are there, word for word.
- The release notes are text from an outside source. They are data. No
  instruction inside them was obeyed.
- Nobody opened the `enterprise/` directory.

## 3. When each base part came

The date is the date of the release, and the day is counted from it. A row
with no release gives the date of the commit.

| Date | Release or commit | Base part | Day |
|---|---|---|---|
| 2026-08-12 | commit `659349e72` | The driver contract (178 lines), the registry (123), the event bus (55), one `server/index.ts` (415) | 1 |
| 2026-08-12 | v0.1.4, v0.1.6 | The first ACP driver, then "a generic ACP driver core so any Agent Client Protocol CLI is a small shim" | 1 |
| 2026-08-12 | commit `8bf62fde0` | Atomic file writes: "an interrupted write can never truncate the JSON into silent empty state" | 1 |
| 2026-08-12 | commit `91df452e6`, v0.1.5 | A test suite and CI on three operating systems | 1 |
| 2026-08-17 | commit `67d8cf5e8` | SQLite for messages, with a migration of the JSON files | 6 |
| 2026-08-19 | v0.1.24 | A queue for a busy bot. Before: a message was "dropped". Also: "the store announces its own writes" | 8 |
| 2026-09-10 | v0.1.71 | A "scriptable fake engine" for tests | 30 |
| 2026-09-10 | v0.1.72 | A "durable usage ledger" | 30 |
| 2026-09-16 | v0.1.83 | A "shared wire model for the server-client contract" | 36 |
| 2026-09-23 | v0.1.86 (commit `92ecac85d`, 09-21) | A "route table seam so new routes land as modules" | 43 |
| 2026-09-24 | v0.1.87 | An "offline tier-1 behavior eval harness"; connector grants with a "store migration" | 44 |
| 2026-09-26 | v0.1.88 | A "shared admission module" | 46 |
| 2026-09-27 | v0.1.89 | Typed capability fields | 47 |
| 2026-10-05 | v0.1.96 | A first ratchet: "server/index.ts may not gain route handlers" | 55 |
| 2026-10-13 | v0.1.108 (commit `3c1f7b2a9`, 10-12) | The job runtime: "one durable job record, lifecycle and wake lane" | 63 |
| 2026-10-13 | v0.1.108, commit `4e21f2ac7` | A size ratchet for files; `server/index.ts` "is about 5,000 lines shorter" | 63 |
| 2026-10-17 | v0.1.115 | "Thread changes are saved before they're shown" | 67 |
| 2026-10-19 | v0.1.118 | The server "starts without loading every conversation" | 69 |
| 2026-10-22 | v0.1.122 | Each bot in "its own sealed space"; "keys never reach the bot at all" | 72 |
| 2026-11-03 | v0.1.140 | "every line a bot reads now says who sent it and whether it's a request or just information" | 84 |
| 2026-11-05 | v0.1.141 | "Work started from outside, such as webhooks or other people, stays confined to that work" | 86 |
| 2026-11-06 | v0.1.143 | A phone connection with a "wire spec v1, Node reference and test vectors" | 87 |
| 2026-11-06 | v0.1.144 | "signed updates that roll back on a failed check" | 87 |
| 2026-11-15 | v0.1.161 | A scheduled run "waits at most an hour for a busy bot, and a run has a default limit of 3 hours" | 96 |
| 2026-11-16 | v0.1.165 | An "occurrence ledger with catch-up and a watchdog for lost turns" for automations; "Unattended work has limits" | 97 |
| 2026-11-17 | v0.1.166 | "one store layer, the first step towards keeping chats as database rows" | 98 |

The size of `server/index.ts`, from `git show` at the last commit of each
UTC day:

| Date | Lines |
|---|---|
| 2026-08-12 | 415 (the first version, commit `659349e72`); 720 at the end of the day |
| 2026-09-01 | 8,784 |
| 2026-10-01 | 23,726 |
| 2026-10-12 | 27,275 (the peak, commit `4aa72b869`) |
| 2026-11-23 | 15,276 |

## 4. When each product area came

The first release that names the area. "Named" is not always "complete".

| Date | Release | Area |
|---|---|---|
| 2026-08-11 | v0.1.0 | Two engine drivers, approval and question cards, a cloud computer, control of this computer, connected apps (Gmail and others), dictation |
| 2026-08-12 | v0.1.6 | Work between bots: a tool to ask a peer, with a guard against loops |
| 2026-08-12 | v0.1.9, v0.1.10 | Updates inside the application; replies that stream |
| 2026-08-13 | v0.1.13 | A queued message during a turn, edit and branch, search |
| 2026-08-13 | v0.1.14 | Rooms |
| 2026-08-14 | v0.1.16 | Tasks (more than one conversation for a bot), voice and calls, an automatic approval mode |
| 2026-08-14 | v0.1.17 | A local VM, routines on a schedule |
| 2026-08-16 | v0.1.19 | Webhooks, team files that describe a team |
| 2026-08-19 | v0.1.24 | A phone application, memory as plain text, cost for each bot, your own VPS as a computer |
| 2026-09-02 | v0.1.48 | Custom MCP servers, remote pairing, team goals |
| 2026-09-04 | v0.1.51 | The Chief role, the team map |
| 2026-09-05 | v0.1.55 | The server with no desktop shell (`serve`), search of past threads |
| 2026-09-09 | v0.1.67, v0.1.68 | Threads, sign-in on a hosted server, parallel work for each bot |
| 2026-09-10 | v0.1.71 | Skills: a run saved as a skill |
| 2026-09-10 | v0.1.72 | Many workspaces, people with roles, spend limits, a full backup |
| 2026-09-15 | v0.1.80 | Organization sign-in |
| 2026-09-29 | v0.1.90 | The memory upgrade, a personal Cloud |
| 2026-09-29 | v0.1.91 | A paid plan |
| 2026-10-09 | v0.1.104 | A Data tab with one database for each bot |
| 2026-10-13 | v0.1.108 | Saved logins, skills that a bot learns |
| 2026-10-14 | v0.1.109 | Chat widgets, the headless CLI commands, the Vault tab |
| 2026-10-15 | v0.1.112 | A Files page that shares a folder with the Cloud |
| 2026-10-17 | v0.1.115 | Automations (routines and webhooks as one thing) |
| 2026-10-22 | v0.1.122 | The Cloud as the one home of the data, a page published to its own link |
| 2026-10-22 | v0.1.123 | The daily brief, a usage page |
| 2026-11-05 | v0.1.141 | A bot as an HTTP API, email on any mail host |
| 2026-11-05 | v0.1.142 | Images made in the chat |
| 2026-11-07 | v0.1.147 | A bot that joins a meeting |
| 2026-11-11 | v0.1.153 | Burst mode |

## 5. Problems that come again

Six subagents read six periods, and none saw the report of another. The
last column says in how many of the six periods the theme is. The check of
2026-11-23 counted again with the list of themes, so its counts can be
higher than those of a blind read.

| Theme | Periods | Examples (release) |
|---|---|---|
| A turn or a wait that does not end | 6 of 6 | "hanging until the timeout" (v0.1.15); "Recover a thread whose resume never answers" (v0.1.71); "fail a turn whose agent goes silent mid-answer" (v0.1.85); "waits forever on 'Reserving your machine'" (v0.1.123); "A stuck engine stops in minutes, not 15." (v0.1.132); a chat "marked busy with nothing running, and Stop couldn't clear it" (v0.1.151); work waiting on you "closes after three, instead of waiting forever" (v0.1.153) |
| The same work done or delivered two times, or lost | 6 of 6 | "A message sent to a busy bot used to disappear" (android-v1.2.0); "prevent duplicate jobs across restarts" (v0.1.74); "send each teammate result once" (v0.1.83); "never append or rerun a queued send twice after a crash" (v0.1.108); "A Claude turn is never sent twice" (v0.1.150); "a hand-off whose file went missing is still delivered" (v0.1.178) |
| Process control on Windows | 6 of 6 | "EPERM unlink" (v0.1.57); a data folder lease after a reused process id (v0.1.83, and again in v0.1.138); "Cannot use import statement outside a module" (v0.1.109); ".cmd wrappers" did not start (v0.1.129); "taskkill /T fails" (v0.1.140) |
| Sign-in to an engine, and engine CLIs that change | 6 of 6 | One engine "could never come online" (v0.1.14); "recover after upgrading" (v0.1.54); "failed on Codex 0.160" (v0.1.101); "An expired Claude sign-in is recognised" (v0.1.153); "a brief sign-in hiccup is no longer reported as signed out" (v0.1.177), and again: "a brief sign-in hiccup no longer counts as signed out or hands the chat to the backup engine" (v0.1.178) |
| A secret or an access right in the wrong place | 6 of 6 | Credentials in "process arguments" (v0.1.19); "Cloud secrets over a pipe, not the environment" (v0.1.92); secrets "no longer visible to a Codex bot's shell commands" (v0.1.101); "Web pages no longer get owner access" (v0.1.113); "data_sql read-only gate bypasses closed" (v0.1.128); streamed text is masked only "once the message is saved" (v0.1.154); "Automations stay within the accounts each bot may use." (v0.1.178) |
| A feature added, then removed or reversed | 6 of 6 | Section 6 |
| "Busy" and races between bots | 6 of 6 | "a renewable lease with an expiry rather than a flag" (v0.1.21); "not whole-bot busy" (v0.1.81); "scope broker socket by bot id, not threadId alone" (v0.1.76); "the server could use all its CPU re-checking the queue" (v0.1.149) |
| State lost at a restart or a crash | 6 of 6 | Delegations "survive a restart" (v0.1.24); "recover the embedded server after a crash" (v0.1.74); "keep turns waiting for capture across a restart" (v0.1.107); "a crash restarts cleanly and interrupted turns run again" (v0.1.165) |
| The approval model changed | 6 of 6 | Section 6 |
| Tests that fail by chance, and a red main branch | 6 of 6 | "unblock main" (v0.1.77); "fix the five timing flakes that kept blocking releases" (v0.1.99); "not on a clock or a lucky port" (v0.1.133) |
| The size of the tool list of one turn | 5 of 6 | "API-engine bots failed past 128 tools" (v0.1.101); "cuts the tool list a bot is sent each turn by 65-74%" (v0.1.111); "41 of its 49 tools were being skipped" (v0.1.120); one tool list for each role, "$0.228 → $0.065" (v0.1.141) |
| Memory and the number of processes | 5 of 6 | "only a few Codex bots start at once (at least 2, or one per CPU)" (v0.1.110); Cloud peak memory "from about 3 GB to 1.6 GB" (v0.1.118); "EAGAIN" (v0.1.165); "fewer processes per bot browser" (v0.1.176) |
| Usage and cost numbers corrected | 5 of 6 | "book Claude turns at their own cost, not the CLI's running total" (v0.1.90); "count cache reads in a turn's input" (v0.1.92); "Cached input is counted" (v0.1.170); keep-warm pings and summaries "count only their own cost in your usage, not the whole conversation's again" (v0.1.178) |
| A file written over after a failed read | 2 of 6 | "never overwrite a routines/webhooks file the server could not read" (v0.1.103); a routine deleted "on the next save" (v0.1.107); saved keys that cannot be read: "The old file is set aside, not deleted." (v0.1.151) |
| The person's own engine config reaches the bots | 3 of 6 | "your personal `~/.claude/CLAUDE.md` no longer reaches bots that run isolated" (v0.1.104); "OpenCode no longer reads your own Claude instructions" (v0.1.170); "Codex bots no longer load your own `AGENTS.md`." (v0.1.175) |
| One slow or stuck part blocks all the others | 3 of 6 | "One stuck engine check no longer stalls every bot" (v0.1.114); "A message you send isn't held up behind a long tool call." (v0.1.136); "A turn carries on when one optional MCP server dies." (v0.1.153); "A stuck Docker no longer slows every check by 10 seconds." (v0.1.177); an address that is not an MCP endpoint "is left out of turns and named once, instead of slowing every turn" (v0.1.178) |
| The updater loops, sticks or breaks the window | 3 of 6 | "a failed update check can't leave the updater wedged" (v0.1.18); "Fix the macOS updater restart loop" (v0.1.27); "stop premature restarts and update loops" (v0.1.61); a blank window after an update (v0.1.137) |

## 6. Removed, replaced or reversed

The larger changes of direction. Each one was work done two times.

| What | First | Then |
|---|---|---|
| One conversation for each bot | v0.1.0 | Tasks (v0.1.16); threads (v0.1.67); parallel work (v0.1.68); parallel threads in one project folder (v0.1.96); up to 16 (v0.1.128); "as many as the machine holds" (v0.1.140) |
| "Busy" as a flag of the bot | first commit | A queue (v0.1.24); a thread slot in three steps (v0.1.81, v0.1.83, v0.1.86); the rule of one thread for each project folder "is gone" (v0.1.96) |
| Work between bots | A tool to ask a peer (v0.1.6); asynchronous with a gate (v0.1.19); a durable conversation for each pair (v0.1.78) | The job runtime takes every hand-off, "the room-handoff tree goes", "the legacy ledger goes", and five tools are removed (v0.1.108) |
| The approval model | An automatic mode, with "Always allow" for one exact tool (v0.1.16); levels for each bot (v0.1.54); the modes of the provider (v0.1.55, v0.1.74) | Changes of a bot to itself stop asking (v0.1.99, v0.1.115); "Bots start with Full access, on every engine" (v0.1.109); sends at full access "without a "Send on your behalf?" card or a daily limit" (v0.1.111), then "up to 25 a day" (v0.1.141), then "no daily cap" (v0.1.144); cards "no longer expire" (v0.1.126); a bot reading its own files never asks (v0.1.132); a saved approval "never remembered for anything that sends, posts or moves money" (v0.1.176); clicks on a cloud computer follow the approval level (v0.1.177) |
| A quiet engine | A stop after a fixed time | A renewable idle timeout (v0.1.76); "stop killing quiet agents" (v0.1.93); "no longer stopped as stalled after 20 minutes" (v0.1.123); 2 or 5 minutes (v0.1.132); a room turn stops by progress (v0.1.135), then waits for a running tool (v0.1.136); "a room turn no longer counts the computer's sleep as silence" (v0.1.178) |
| The browser of a bot | A browser inside the desktop shell | An outside browser engine (v0.1.58, v0.1.59); the installed Chrome where a computer has it (v0.1.113) |
| One engine driver | A CLI (v0.1.6) | Replaced (v0.1.14), replaced again (v0.1.51) |
| The tool connection of an engine | The MCP support of each engine | The connector of the project for all engines except one (v0.1.101) |
| Where the data is | This computer | A one-button move to the Cloud (v0.1.91); a copy to any server (v0.1.96); side by side with the Cloud (v0.1.117); one-way sync (v0.1.120); the Cloud is "the one home" (v0.1.122); an opt-out (v0.1.125); a server of your own as the home (v0.1.135); new bots on this computer by default again (v0.1.165) |
| A bot at a usage limit | Continue on a second engine (v0.1.111, v0.1.132); a Claude bot on "any backup engine that has its tools" (v0.1.142) | Only "a backup you chose" (v0.1.166); with no backup, the bot "stops at the limit" (v0.1.175) |
| The Codex setup of the person | ChatGPT plan turns "use your own Codex setup and skills" (v0.1.150) | "Codex bots no longer load your own `AGENTS.md`." (v0.1.175) |
| Bots on the Starter plan | "Bots past five are paused until you upgrade" (v0.1.149) | "No more stopping at 5 bots on Starter." (v0.1.152) |
| The UI mode | Advanced | Simple is the default (v0.1.94); "Simple is now the only mode" (v0.1.151); "Advanced mode is back" (v0.1.152) |
| Routines and webhooks | Two features | One feature, "automations" (v0.1.115); no automatic switch-off after failures (v0.1.161) |
| Features that lived for days or weeks | Cloud overflow (v0.1.90); a "tightening-only request schema" (v0.1.88); quoting selected text (v0.1.111); a Today page (v0.1.120); departments (v0.1.125) | Deleted (v0.1.96); deleted as "the "tightening requests" feature" (v0.1.96); "taken out again" (v0.1.112); "The brief replaces the Today page." (v0.1.123); "Departments are folders now, not walls" (v0.1.128) |
| The license | MIT (v0.1.4) | Apache License 2.0 (v0.1.27) |

## 7. What this means for our Rust structure

Each row is a problem of section 5, the answer in our structure, and the
place in our plan where the answer is cheap.

| Problem of the reference | Our answer | Crate and step |
|---|---|---|
| A turn with no clear end | A turn has one final event, and it is always the last (decision D20). The fold in `bot-core` treats a stream that ends with no final event as a failure | `bot-protocol`, step 2 |
| A wait that does not end | A wait is a type that cannot be made without a limit and a reason. No function waits on an engine with no limit | `bot-engine`, step 3 |
| Work done two times | Each message, turn and assignment has an identifier that the caller makes (decision D17). A store write with the same identifier is a no-op | `bot-protocol` step 2, `bot-core` step 8 |
| "Busy" in the wrong place | The thread is the unit of busy state. The bot has no busy flag | `bot-core`, step 8, and decided before step 2 ends |
| State in many places | Each kind of state has one owner module. The runtime owns all work state (`AGENTS.md`). The store owns messages and threads | `bot-core`, steps 8 and 13 |
| State shown before it is saved | A state change writes the row and its event in one transaction before anything acts on it (`AGENTS.md`). The window gets the event after the commit | `bot-core`, steps 7 and 8 |
| A file written over after a failed read | `save` takes a value that only a successful `load` can make. A failed load gives a typed error, and no save is possible | `bot-core`, step 6 |
| A secret in the wrong place | A key has its own type with no `Debug` output of the value. One redaction function runs at the store, the log and the window | `bot-core`, step 6 |
| The composition root grows | The root connects modules and has no logic. One feature is one module with explicit dependencies | `bot-cli`, `bot-desktop`, all steps |
| The runtime scans all ended work | The runtime reads only open work, through an index, from its first version | `bot-core`, step 13 |
| Engine CLIs change | Engine behaviour is gated by capability flags, never by a driver name (`AGENTS.md`). A generic protocol core is under thin adapters | `bot-engine`, steps 3 and 9 |
| Process control on Windows | A test starts and stops a fake engine process on Windows, with a process tree, before the first real adapter | `bot-engine`, step 9 |
| Who sent a message | The message type has the sender and says if the text is a request or information | `bot-protocol`, step 2 or step 14 |
| The tool list is too large | A limit of tools for each engine is a capability of the driver | `bot-engine`, step 12 |
| State lost at a restart or a crash | **Follows the reference.** At start, one function reads the stored turns and sets each `running` turn again. A turn that gave out work waits. A turn that did an outward action fails. A turn that ran again one time already fails. Each other turn runs again one time. The reference: `server/runtime/runtime.ts:124-138` | `bot-core`, steps 8 and 13 |
| One slow or stuck part blocks the others | **Follows the reference.** Each engine check has its own time limit (60 s). Callers share one check that is in progress. A check that hangs counts as down for a time, and a fast failure is not kept. A failed optional MCP server does not stop the turn. The reference: `server/harness/registry.ts:71, 228-239`, `server/container-runtime-probe.ts:6-37`, `server/drivers/chat-mcp-tools.ts:885-890` | `bot-engine`, steps 4 and 16 |
| The person's own engine config reaches the bots | **Proposal.** The reference starts from the whole environment of the server and removes some keys (`server/drivers/codex.ts:225-236`). Each driver blocks the files of the person in its own way, and Codex keeps the person's `AGENTS.md` in some cases (`server/drivers/codex-shared-home.ts:148`). We start each engine process from a list of allowed variables. Each driver states the instruction files of the person that it blocks, and a test checks the list | `bot-engine`, step 9 |
| Memory and the number of processes | **Proposal.** The reference has several separate limits: Codex start slots, threads for each bot, a memory gate and a process budget that learns from `EAGAIN` (`server/drivers/codex-process.ts:11`, `server/bot-thread-limits.ts:5-18`, `server/process-room.ts:13-45`). We have one gate that counts the memory and the processes of each new engine process | `bot-engine` step 9, `bot-core` step 11 |
| Usage and cost numbers corrected | **Proposal, before step 5 starts.** The reference event `turn.completed` has `input`, `output`, `cachedInput` and a separate `cost`, and `input` includes the cached tokens (`packages/phone-protocol/src/runtime-events.ts:61-71`). It finds a total for each turn by the engine name (`server/usage-trace/recorder.ts:87-90`). Our usage type has new input, cache read, cache write, output and cost for one turn. A driver capability says if the engine reports each turn or a running total, and the driver takes the difference. Step 5 adds an optional `usage` field to `turn.completed`, and the JSON of step 2 stays valid | `bot-protocol`, `bot-engine`, step 5 |
| Tests that fail by chance | **Follows the reference, with one change.** The runtime of the reference gets a `Clock` with `now` and `monotonic` (`server/runtime/types.ts:340-346`). Other modules use an optional `now` function or fake timers, and tests take ports from a block for each worker (`server/testing/worker-port.ts:4-15`). We give one `Clock` trait to each module that reads the time. A test opens port 0 and reads the port that it got | all crates, from step 3 |
| The approval model changed about 10 times | **Proposal.** The reference decides "ask or allow" in six places: the native mode of each driver, the central handler, the safety floor, drivers that answer alone, the gate of the chat engines, and changes of the level (`server/auto-approve.ts:32-123`, `server/safety-floor-gate.ts:98-143`). We have one pure function in `bot-core` that takes the level, the request and the grants and gives allow, ask or deny with a reason. A driver only maps the level to the mode of its engine | `bot-core`, `bot-engine`, step 10 |

The last seven rows came from the reference at `d6660e2d7` on 2026-11-24.
Three subagents read the code, and the main session checked the cited lines.
A row marked **Proposal** is not decided. The author decides it in
`docs/plan/` before its step starts.

Three facts support the order of our plan:

1. Our plan has the wire types in step 2. The reference added a shared wire
   model on day 36.
2. Our plan has the runtime (step 13) before the tool that gives work to a
   bot (step 14). The reference had the tool on day 1 and the runtime on
   day 63, and then removed five tools.
3. Our plan has one SQLite store in step 8 and no JSON files for messages.
   On day 98 the reference took "the first step towards keeping chats as
   database rows".

## 8. Release by release

One row for each release. Rows with "draft" have a note with no content.
"PR list" means that the note is a list of pull request titles. A row names
the main changes, not all of them. The rest are in section 6 of
[`changelog-check.md`](changelog-check.md).

These versions have no tag and no release: v0.1.26, 28, 47, 53, 64, 105,
106, 156, 157, 159, 162, 163, 164, 168, 172 and 174. The notes of v0.1.107
name v0.1.105 and v0.1.106.

### v0.1.0 to v0.1.77 (2026-08-11 to 2026-09-13)

| Tag | Date | The main change |
|---|---|---|
| v0.1.0 | 08-11 | First build: two engine drivers, approval and question cards, a cloud computer, connected apps |
| v0.1.1 to v0.1.3 | 08-11 | Onboarding with live engine checks; a free port at start; no black window after a relaunch |
| v0.1.4 | 08-12 | The first engine over ACP |
| v0.1.5 | 08-12 | Engine CLIs found when the application opens from the desktop; tests and CI on three systems |
| v0.1.6 | 08-12 | Work between bots; a generic ACP core; a capability gate for tools; a Gemini CLI engine |
| v0.1.7 to v0.1.12 | 08-12 | Updates inside the application; replies that stream; Claude bots can delegate too, after Grok and Gemini (v0.1.12) |
| v0.1.13 | 08-13 | A message sent during a turn is queued; edit and branch; search |
| v0.1.14 | 08-13 | Rooms; a live channel shows the conversation of two bots; one engine CLI replaced because its vendor retired it |
| v0.1.15 | 08-13 | Computer control twice as fast; a first Windows installer; a failure no longer "silently swallowed" |
| v0.1.16 | 08-14 | Tasks, each with "its own conversation *and its own model session*"; voice; an automatic approval mode; "Always allow" for one exact tool |
| v0.1.17 | 08-14 | A local VM; routines on a schedule; a missing driver was reported as unavailable with no reason |
| v0.1.18 | 08-16 | Two more engines; "Resumable streams"; security hardening; the updater can no longer stick after a failed check |
| v0.1.19 | 08-16 | Webhooks, with the payload "marked as *untrusted input*"; delegation becomes asynchronous |
| v0.1.20 | 08-16 | "A webhook turn no longer inherits auto mode"; session cursors no longer go to clients |
| v0.1.21 | 08-16 | VM ownership becomes "a renewable lease with an expiry rather than a flag" |
| v0.1.22, v0.1.23 | 08-17 | The key of the connector service moves to the credential store of the operating system; one key replaces the old two-key connect flow |
| v0.1.24 | 08-19 | A phone application; memory as plain text; a queue for a busy bot; delegations "survive a restart"; your own VPS as a computer; USB Android control; "the store announces its own writes"; a packaging bug "killed the server on launch" |
| v0.1.25 | 08-20 | More platforms; team import only adds; Codex bots can talk to peers |
| v0.1.27 | 08-20 | One more ACP engine; credentials encrypted at rest; an audit log; the license changes to Apache 2.0; a fix for an updater restart loop |
| v0.1.29, v0.1.32 | 08-23 | Local models; a model catalogue with exact identifiers |
| v0.1.30, v0.1.31, v0.1.33 to v0.1.45 | 08-23 to 09-01 | 15 drafts with no content |
| v0.1.46, android-v1.0.0 | 09-01 | A tablet layout; pairing over a private network; an Android application |
| v0.1.48 | 09-02 | A container image for a server; custom MCP servers; remote pairing; goals; rooms wait for a busy member; "Write MEMORY.md atomically" |
| v0.1.49, v0.1.50 | 09-02 | A model catalogue that refreshes; "Notify when a turn dies before it starts" |
| v0.1.51 | 09-04 | An official ACP runtime replaces one engine CLI; the team map; the Chief role |
| v0.1.52, android-v1.1.0, android-v1.2.0 | 09-03, 09-04 | Steer a held message from the phone; call a bot from the phone |
| v0.1.54 | 09-05 | Approval levels for each bot |
| v0.1.55 | 09-05 | The `serve` command; "default-deny client scope"; search of past threads; the provider's own permission modes |
| v0.1.56 | 09-05 | An npm package of the server |
| v0.1.57 | 09-06 | "The bot is a folder": standing instructions in a file |
| v0.1.58, v0.1.59 | 09-06 | An outside browser engine replaces the browser of the desktop shell; "ignore Codex output after turn settlement" |
| v0.1.60 to v0.1.63 | 09-06, 09-07 | A bundled browser; a bot with full access keeps it when it gets work; "Permissions do not transfer from the sending bot"; an `openmausbot` command that sets up the server; "stop premature restarts and update loops" |
| browser-engine-v0.36.0-omb.1 | 09-07 | A patched browser engine for a Windows process problem |
| v0.1.65, v0.1.66 | 09-08 | The live browser view; a data folder lease that is proved dead after a reboot; a Claude account for each bot |
| v0.1.67 | 09-09 | Threads; a tunnel and a domain for the server; email sign-in on a hosted server |
| v0.1.68 to v0.1.70 | 09-09 | Run logs of routines; a service install; parallel work for each bot; bots open threads |
| v0.1.71 | 09-10 | Rewind a thread; see, edit and revert memory; a scriptable fake engine; a run "saves it as a skill"; "remove the Teach a skill recorder for now" |
| v0.1.72 | 09-10 | A durable usage ledger; many workspaces; people with roles; a full backup; "skill authoring on by default" |
| v0.1.73 | 09-11 | "keep helper completion from ending the parent run" |
| v0.1.74 | 09-11 | Approval levels are "the provider's own modes, passed through"; "prevent duplicate jobs across restarts"; "recover the embedded server after a crash" |
| v0.1.75 | 09-12 | "clear stuck approvals after deleting a thread" |
| android-threads-preview-20260913 | 09-12 | A test build of the Android application with threads and folders. It installs beside the released application |
| v0.1.76 | 09-12 | Room coordination with receipts; delegation waits 24 hours for a busy teammate; "newest N rows in SQL"; a "renewable idle stream timeout" replaces a fixed one |
| v0.1.77 | 09-13 | A hosted workspace switcher; "close two confirmed holes in shared-folder access"; a team canvas; computer sharing "behind a flag that defaults off" |

### v0.1.78 to v0.1.96 (2026-09-13 to 2026-10-05)

| Tag | Date | The main change |
|---|---|---|
| v0.1.78 | 09-13 | "one durable conversation per pair of bots"; control of this computer on Windows; "make Full Access genuinely hands-off"; monthly, yearly and time-zone schedules |
| v0.1.79 | 09-15 | Cloud turns run on the cloud computer, "drop the local computer relay"; "retry only pre-start crashes"; "finish [DONE]-less chat streams"; one inbox across bots |
| v0.1.80 | 09-15 | Organization sign-in; "bank Codex turns as a delta"; an archive of threads that can be undone |
| v0.1.81, android-v1.3.0 | 09-15 | "not whole-bot busy"; a cap on the event log of a thread; MCP servers by address; the phone application handles a bot with more than one thread; a phone pairs with a self-hosted server |
| v0.1.82 | 09-16 | "wait for occupied desktops instead of failing turns" |
| v0.1.83 | 09-16 | The shared wire model; steer a queued message into the running turn; "send each teammate result once"; "a Chief of Staff's Full access covers the work it delegates"; scheduled work into "a free thread slot"; a Windows data folder lease after a reused process id |
| v0.1.84 | 09-17 | A broken run reaches the Chief; the test suite in shards; "several turns per bot at once" on a VPS |
| v0.1.85 | 09-20 | "one agent process per thread" for ACP; "fail a turn whose agent goes silent mid-answer"; attach to a running Chrome; "prevent duplicate agent-created schedules" |
| v0.1.86 | 09-23 | The route table seam; visibility of a bot and an admin log; "end_turn with no items as a failed turn, not a quiet success"; delegations "on a free thread slot instead of whole-bot idle"; "token files out of backups" |
| v0.1.87 | 09-24 | Team management; an eval harness; connector grants with a store migration; "Keep prompt prefixes stable"; "shared question spine"; a command allowlist |
| v0.1.88 | 09-26 | "extract shared admission module with zero behavior change"; a "tightening-only request schema" |
| v0.1.89, android-v1.5.0 | 09-27 | Typed capability fields; "keep a turn alive while a quiet tool is running"; a backup model for ACP start failures; one provider removed; the phone refuses "Public plain-HTTP servers" |
| v0.1.90 | 09-29 | The memory upgrade; a personal Cloud; "book Claude turns at their own cost, not the CLI's running total"; cloud overflow for waits |
| v0.1.91, v0.1.92 | 09-29, 10-01 | A paid plan; a decision model; "Cloud secrets over a pipe, not the environment"; OAuth for remote MCP servers; "Move to Cloud — one button"; sign-in with a ChatGPT plan |
| v0.1.93 | 10-02 | "stop killing quiet agents"; the roles of people get new names |
| v0.1.94 | 10-02 | "Simple mode by default"; live calls on all clients; a Chief's approval level "flows down to the threads it opens" |
| v0.1.95 | 10-03 | "Stop re-reading config.json on every broadcast frame"; "never lose a note at the size cap"; follow-ups continue the same thread, "no duplicate parallel work" |
| v0.1.96 | 10-05 | "Merge streamed text deltas every 50 ms"; a ratchet test for routes; three features deleted; threads of one bot "run in parallel in its project folder"; copy this computer's workspace to any server; "On Auto, bots don't touch a cloud computer"; an activity log and an outbound gate |

### v0.1.97 to v0.1.111 (2026-10-06 to 2026-10-15)

| Tag | Date | The main change |
|---|---|---|
| v0.1.97 | 10-06 | Work continues in a new thread after a turn dies; one engine kind deleted; "A refused action stays refused" |
| v0.1.98 | 10-07 | "Threads follow their bot's model"; the MCP call timeout becomes a setting; a rate limit no longer starts a "Continue:" thread |
| v0.1.99 | 10-07 | Changes of a bot to itself apply with Undo, with no card |
| v0.1.100 | 10-07 | The time to list the tools of an MCP server over the internet goes from 8 to 30 seconds |
| v0.1.101 | 10-08 | All engines except one use the connector of the project; on engines that cannot search tools, a large tool catalogue becomes three small tools |
| v0.1.102 | 10-08 | "index messages by thread and time"; the usage routes leave the server index |
| v0.1.103 | 10-09 | "never overwrite a routines/webhooks file the server could not read" |
| v0.1.104 | 10-09 | A data tab with one database for each bot; "write the canonical event log asynchronously"; your personal `CLAUDE.md` no longer reaches isolated bots |
| v0.1.107 (with .105, .106) | 10-10 | PR list. "keep turns waiting for capture across a restart"; a working folder for each conversation |
| v0.1.108 | 10-13 | The job runtime; five delegation tools removed; the server file split; saved logins, also from 1Password; "A turn that already sent, posted, committed or paid is never rerun."; "Full access stays on"; "Approved MCP read tools are remembered across tasks." |
| v0.1.109 | 10-14 | The runtime kept the server "at full CPU until it stopped answering"; "Index live assignments"; full access becomes the default; the setting `OMB_BOX_API` is renamed `OMB_BOAT_API` |
| v0.1.110 | 10-15 | "only a few Codex bots start at once"; "A failed stop now always ends the turn" |
| v0.1.111 | 10-15 | Continue on a second engine at a limit; ten new parts are "Off by default"; sends at full access with no card and no daily limit; a size limit for the results of each MCP server; a tool bridge that "cuts the tool list ... by 65-74%" (opt-in) |

### v0.1.112 to v0.1.129 (2026-10-15 to 2026-10-27)

| Tag | Date | The main change |
|---|---|---|
| v0.1.112 | 10-15 | Old data folder paths "rewritten once ... with a backup of each changed file"; HighLevel in connected apps; a Files page that shares a folder with the Cloud; quoting selected text "is taken out again" |
| v0.1.113 | 10-16 | The browser of a bot goes "through an egress gate"; the installed Chrome replaces the old browser where the computer has Chrome; a browser on the same machine "is no longer trusted automatically"; "Web pages no longer get owner access"; buy the Cloud in the application |
| v0.1.114 | 10-16 | "One stuck engine check no longer stalls every bot"; a run "skipped without a word"; connected apps on the Cloud |
| v0.1.115 | 10-17 | Automations; "Thread changes are saved before they're shown"; "New bots start at Full access"; "No more permission prompts from OpenMausBot itself."; routines recover by themselves |
| v0.1.116 | 10-18 | Automations from app events; a bot whose Claude is signed out moves to its backup engine |
| v0.1.117 | 10-19 | This computer and the Cloud side by side; the Cloud waits for memory before it starts an engine; "Run when my AI limit resets"; live calls need no paid plan |
| v0.1.118 | 10-19 | A performance release: peak memory "from about 3 GB to 1.6 GB"; the server "starts without loading every conversation" |
| v0.1.119 | 10-20 | A browser profile for each bot; a stable webhook address |
| v0.1.120 | 10-20 | Automatic one-way sync to the Cloud; "41 of its 49 tools were being skipped"; a Today page; a room is "saved before" it is shown |
| v0.1.121 | 10-21 | A workspace starts with one Chief; new words for engine and computer; a busy Cloud "waits for memory" |
| v0.1.122 | 10-22 | The Cloud becomes "the one home"; each bot in "its own sealed space"; publish a page to its own link |
| v0.1.123 | 10-22 | The daily brief, which "replaces the Today page"; a usage page; "waits forever on 'Reserving your machine'"; a long tool "is no longer stopped as stalled after 20 minutes" |
| v0.1.124 | 10-23 | Large MCP results trimmed, not cut; "A sign-in card for an app no longer waits forever" |
| v0.1.125 | 10-23 | A built-in helper bot; an opt-out of the move to the Cloud; departments; "Private chats are private" |
| v0.1.126 | 10-24 | "A message waits only for its own bot's engine, not for every engine to be checked"; every bot reports to someone; "Question and approval cards no longer expire." |
| v0.1.127 | 10-24 | The move to the Cloud "could sit there for hours" |
| v0.1.128 | 10-27 | "Every bot can reach every bot"; "Departments are folders now, not walls"; "up to 16 parallel threads per bot"; "one malformed request or reset socket can't stop the server" |
| v0.1.129 | 10-27 | Updates install themselves; engines installed as ".cmd wrappers" start on Windows; the approval level changes while a bot works |

### v0.1.130 to v0.1.141 (2026-10-27 to 2026-11-05)

| Tag | Date | The main change |
|---|---|---|
| v0.1.130 | 10-27 | A simple mode redesign; one inbox for each person; "A chat that goes quiet is rescued"; "Only the OpenMausBot app on this computer can let bots use it." |
| v0.1.131 | 10-28 | "Codex never replays a turn whose tool already ran"; "serialize writes per path"; "Connected apps work the same on every AI."; own MCP tools on Claude "load when the bot needs them" |
| v0.1.132 | 10-29 | A second AI takes over at a usage limit; "A stuck engine stops in minutes, not 15."; "A bot reading its own files never asks you." |
| v0.1.133 | 10-29 | One card for questions and approvals; "MCP tool count exceeds the 128-tool limit" |
| v0.1.134 | 10-30 | Waits that need no AI; saved steps |
| v0.1.135 | 10-31 | "Two teammates asking a bot the same thing at the same time get one answer."; a room turn stops by progress, not by time; "A server of your own can be your bots' home." |
| v0.1.136 | 10-31 | Share each bot; "A message you send isn't held up behind a long tool call."; "Just do it means just do it."; a long conversation is summarized while it is idle |
| v0.1.137 | 11-01 | A fix for a blank window after an update |
| v0.1.138 | 11-02 | PR list; a test that "the bridge keeps every function a page of the last two releases calls"; the Windows data folder lease bug of v0.1.83 comes again |
| v0.1.139 | 11-03 | "the server sleeps when nothing is due"; bots manage MCP servers from the chat |
| v0.1.140 | 11-03 | Parallel threads, "one thread per 2 GB of memory, from 3 to 16"; each line says who sent it; a thread opened by outside work "stays with that work" |
| v0.1.141 | 11-05 | A bot as an API; mail on any mail host; "two bots no longer wait on each other forever"; your Stop ends the work of the teammates; "Work started from outside ... stays confined to that work"; at full access, sends "up to 25 a day"; Starter "makes up to 5 bots" |

### v0.1.142 to v0.1.178 (2026-11-05 to 2026-11-23)

| Tag | Date | The main change |
|---|---|---|
| v0.1.142 | 11-05 | A Claude bot at a limit continues on "any backup engine that has its tools"; an MCP result over 50 KB goes to a file; bots make images; "A signed-in session ends after its idle window passes." |
| v0.1.143 | 11-06 | An end-to-end encrypted phone connection, switched off, with a "wire spec v1 ... and test vectors" |
| v0.1.144 | 11-06 | Long commands run in the background; jobs "no longer time out and run twice"; at full access "There's no daily cap any more", and two choices for sends; "signed updates that roll back on a failed check" |
| v0.1.145 | 11-06 | "Four states the app could get stuck in are fixed" |
| v0.1.146 | 11-07 | Several local workspaces; installed engines update to tested versions, "only when no bot is using the engine"; old OpenCode copies "move to version 2" |
| v0.1.147 | 11-07 | A bot joins a meeting and takes notes |
| v0.1.148 | 11-07 | One way to connect to a server; each way in is off by default |
| v0.1.149 | 11-08 | "the server could use all its CPU re-checking the queue and stop answering"; "Starter runs two tasks at once"; "Bots past five are paused until you upgrade" |
| v0.1.150 | 11-09 | The queue check is "in proportion to the number waiting, not its square"; "A Claude turn is never sent twice"; a bot opens a thread on another model; ChatGPT plan turns "use your own Codex setup and skills" |
| v0.1.151 | 11-09 | A Vault page; "Simple is now the only mode"; 1Password secrets by name; saved keys that cannot be read get a reset, and "The old file is set aside, not deleted." |
| v0.1.152 | 11-10 | "Advanced mode is back"; provider keys in the encrypted store of the desktop; "No more stopping at 5 bots on Starter."; a stronger bot sandbox; an engine in the home folder "can show as "not installed"" |
| v0.1.153 | 11-11 | Burst mode; an update "that backs up first and goes back by itself"; work waiting on you closes after three days; "A turn carries on when one optional MCP server dies."; sign-in lists change at the next start |
| v0.1.154 | 11-12 | A reply streams into the chat and the rooms; "Stop reaches the running turn after the connection restarts"; publish to Netlify; secrets in streamed text are masked "once the message is saved" |
| v0.1.155 | 11-13 | A cloud computer that does not answer is no longer shown as ready; the usage bars "show your Claude plan again" |
| v0.1.158 | 11-14 | Bots change settings, with Undo; fork a conversation; a custom ACP engine "can opt in to steering" |
| v0.1.160 | 11-15 | Pause a bot or a department; themes; tools "loaded only when a turn needs them"; turn off groups of tools of a bot |
| v0.1.161 | 11-15 | "An automation is never switched off by failures"; "'Ready' means the computer answered"; a run "waits at most an hour for a busy bot", with "a default limit of 3 hours"; bots pass files to each other |
| v0.1.165 | 11-16 | "a crash restarts cleanly and interrupted turns run again"; an occurrence ledger for automations; "No leftover processes after a stop or a crash"; "Optional day and month caps"; "Unattended work has limits"; "Always allow sticks."; new bots work on this computer by default |
| v0.1.166 | 11-17 | "one store layer, the first step towards keeping chats as database rows"; at a usage limit, "a bot switches only to a backup you chose"; room jobs "run side by side by default"; sites on Netlify "public by default" |
| v0.1.167, v0.1.169 | 11-17 | Team files; team templates; a second password manager; "One set of names for approval levels" |
| v0.1.170 | 11-19 | "Cached input is counted"; a repair command for the data of a server; "OpenCode no longer reads your own Claude instructions"; "Stop ends everything" |
| v0.1.171 | 11-19 | Bot reminders; the state of a hand-off |
| v0.1.173 | 11-19 | Two engines compact their own sessions; "the server starts listening earlier" |
| v0.1.175 | 11-21 | A new conversation: "nothing is saved until you send"; two engines stop reading the config files of the person, and "Codex bots no longer load your own `AGENTS.md`."; "A bot with no backup chosen stops at the limit" |
| v0.1.176 | 11-21 | Approvals saved for an exact tool, "never remembered for anything that sends, posts or moves money"; a check by another bot before an answer (off by default); a new conversation takes "the approval level of the chat that opened them"; full backups include the Data tables |
| v0.1.177 | 11-22 | A hand-off chip shows the conversation of a teammate; the Vault reads a larger secret now and writes it one release later, "so you can still go back to an earlier version safely"; Bitwarden as a Vault; "Cloud computer clicks follow your approval level."; servers get names; "A stuck Docker no longer slows every check by 10 seconds." |
| v0.1.178 | 11-23 | A bot "now keeps each matter's notes in that conversation"; a bot on another server of the reference, and "your bots can hand it work like any teammate"; the Skill Burger card: "Save a run as a workflow skill the bot can repeat."; one change to many bots "with a single Undo"; larger Vault secrets, and "this computer can't go back to 0.1.176 or earlier; 0.1.177 still works."; Claude keep-warm pings "count only their own cost in your usage, not the whole conversation's again"; an address that is not an MCP endpoint "is left out of turns and named once, instead of slowing every turn"; "a brief sign-in hiccup no longer counts as signed out or hands the chat to the backup engine"; "a room turn no longer counts the computer's sleep as silence"; "a hand-off whose file went missing is still delivered"; "Automations stay within the accounts each bot may use."; text from a bot page "lands in the message box for you to send, instead of sending on its own"; the first start "builds a faster index for the Bot Library" |

## 9. Not verified, and open

- Each tag, date and quote of section 8 was checked on 2026-11-23. A row
  names the main changes, not all of them. The subagents chose which
  changes are key, and another reader can choose others.
- "One event stream as the source of truth" (section 1) is our reading of
  `server/harness/bus.ts`: "Every adapter's event stream merges into one
  bus". The words "source of truth" are not in the code.
- The counts of feature notes and fix notes in the reports are hand counts.
  This file does not use them. The commit counts come from `git log`. The
  counts of the first version of this file (12,851, 3,164 and 1,218) cannot
  be reproduced.
- The counts of section 5 depend on the list of themes that each subagent
  got.
- "First release that names an area" (section 4) comes from the text of the
  notes. A feature can be in the code before a note names it. Example: the
  notes first name SQLite in v0.1.71 (2026-09-10), and the git history adds
  the SQLite message store on 2026-08-17.
- 15 releases (v0.1.30, v0.1.31, v0.1.33 to v0.1.45) are drafts with no
  content. What changed in them is not known from the notes.
- Many notes from v0.1.48 are lists of pull request titles. Nobody opened a
  pull request.
- The notes do not give the schema of the job record or of any store.
- Nobody read the 84 `refactor` commits (up to v0.1.177) one by one.
- Open: section 7 has no answer yet for the three themes that the check
  added: the person's own engine config reaches the bots, one slow part
  blocks all the others, and the updater. An answer is a design choice, so
  it goes to the author as a proposal.
