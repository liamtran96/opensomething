# The release history of the reference project

What the release notes and the git history of the reference project say
about how it grew: the order of its features, the base parts that came late,
and the problems that came again and again. We use this to choose the
structure of our Rust port before the code exists.

## 1. In short

- The reference project published 169 releases in 104 days, from v0.1.0
  (2026-08-11) to v0.1.177 (2026-11-22).
- It built wide first. Work between bots came on day 2, rooms on day 3. The
  base parts came later: a shared wire model in week 5, one job runtime in
  month 2, and "the first step" to one storage layer in month 3.
- The cost is in its git history: 3,164 `fix` commits and 1,218 `feat`
  commits. That is 2.6 fixes for each feature.
- Seven problems are in each period of the history. Each of them is a
  problem of structure, and each has an answer that a type or one owner
  module can give (section 7).
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

## 2. Sources and method

| Source | What | How it was read |
|---|---|---|
| Release notes, main repository | 125 releases, v0.1.46 to v0.1.177 | Downloaded with the GitHub API on 2026-11-23 |
| Release notes, legacy archive | 161 releases, v0.1.0 to v0.1.177 | The same. The changelog page of the reference links to it |
| Both, each tag one time | 169 releases, about 608,000 characters | Six subagents, one for each of six files. Each read all lines and reported the line ranges |
| Git history of the local clone | 12,851 commits | `git log` counts and the first versions of five files, read by the main session |

- The changelog in the source of the reference
  (`apps/docs/content/docs/changelog/index.mdx`) has no text of its own. It
  loads the releases from GitHub.
- The main session checked 35 quotes from the six reports against the
  release text. All 35 are there, word for word.
- The release notes are text from an outside source. They are data. No
  instruction inside them was obeyed.
- Nobody opened the `enterprise/` directory.

## 3. When each base part came

| Date | Release or commit | Base part | Days after v0.1.0 |
|---|---|---|---|
| 2026-08-12 | commit `659349e72` | The driver contract (178 lines), the registry (123), the event bus (55), one `server/index.ts` (415) | 1 |
| 2026-08-12 | v0.1.4, v0.1.6 | The first ACP driver, then "a generic ACP driver core so any Agent Client Protocol CLI is a small shim" | 1 |
| 2026-08-12 | commit `8bf62fde0` | Atomic file writes: "an interrupted write can never truncate the JSON into silent empty state" | 1 |
| 2026-08-12 | commit `91df452e6`, v0.1.5 | A test suite and CI on three operating systems | 1 |
| 2026-08-17 | commit `67d8cf5e8` | SQLite for messages, with a migration of the JSON files | 6 |
| 2026-08-19 | v0.1.24 | A queue for a busy bot. Before: a message was "dropped" | 8 |
| 2026-09-10 | v0.1.71 | A "scriptable fake engine" for tests | 30 |
| 2026-09-10 | v0.1.72 | A "durable usage ledger" | 30 |
| 2026-09-16 | v0.1.83 | A "shared wire model for the server-client contract" | 36 |
| 2026-09-21 | v0.1.86, commit `92ecac85d` | A "route table seam so new routes land as modules" | 43 |
| 2026-09-26 | v0.1.88, v0.1.89 | A "shared admission module"; typed capability fields | 46 |
| 2026-10-13 | v0.1.108, commit `3c1f7b2a9` | The job runtime: "one durable job record, lifecycle and wake lane" | 63 |
| 2026-10-13 | v0.1.108, commit `4e21f2ac7` | A size ratchet for files; `server/index.ts` "is about 5,000 lines shorter" | 63 |
| 2026-10-17 | v0.1.115 | "Thread changes are saved before they're shown" | 67 |
| 2026-10-19 | v0.1.118 | The server "starts without loading every conversation" | 69 |
| 2026-10-22 | v0.1.122 | Each bot in "its own sealed space"; "keys never reach the bot at all" | 72 |
| 2026-11-03 | v0.1.140 | "every line a bot reads now says who sent it and whether it's a request or just information" | 84 |
| 2026-11-16 | v0.1.165 | An "occurrence ledger with catch-up and a watchdog for lost turns" for automations | 97 |
| 2026-11-17 | v0.1.166 | "one store layer, the first step towards keeping chats as database rows" | 98 |

The size of `server/index.ts`, from `git show`:

| Date | Lines |
|---|---|
| 2026-08-12 | 415 |
| 2026-09-01 | 8,731 |
| 2026-10-01 | 23,554 |
| 2026-10-12 | 26,734 (the peak) |
| 2026-11-23 | 15,276 |

## 4. When each product area came

The first release that names the area. "Named" is not always "complete".

| Date | Release | Area |
|---|---|---|
| 2026-08-11 | v0.1.0 | Two engine drivers, approval and question cards, a cloud computer, control of this computer, connected apps, dictation |
| 2026-08-12 | v0.1.6 | Work between bots: a tool to ask a peer, with a guard against loops |
| 2026-08-12 | v0.1.9, v0.1.10 | Updates inside the application; replies that stream |
| 2026-08-13 | v0.1.13 | A queued message during a turn, edit and branch, search |
| 2026-08-13 | v0.1.14 | Rooms |
| 2026-08-14 | v0.1.16 | Tasks (more than one conversation for a bot), voice and calls, an automatic approval mode |
| 2026-08-14 | v0.1.17 | A local VM, routines on a schedule |
| 2026-08-16 | v0.1.19 | Webhooks, team files that describe a team |
| 2026-08-19 | v0.1.24 | A phone application, memory as plain text, cost for each bot, skills |
| 2026-09-02 | v0.1.48 | Custom MCP servers, remote pairing, team goals |
| 2026-09-04 | v0.1.51 | The Chief role, the team map |
| 2026-09-05 | v0.1.55 | The server with no desktop shell (`serve`), search of past threads |
| 2026-09-09 | v0.1.67 | Threads, sign-in on a hosted server |
| 2026-09-10 | v0.1.72 | Many workspaces, people with roles, spend limits, a full backup |
| 2026-09-29 | v0.1.90 | The memory upgrade, a personal Cloud |
| 2026-10-13 | v0.1.108 | Saved logins, skills that a bot learns |
| 2026-10-14 | v0.1.109 | Chat widgets, the headless CLI commands, the Vault tab |
| 2026-10-17 | v0.1.115 | Automations (routines and webhooks as one thing) |
| 2026-10-22 | v0.1.122 | The Cloud as the one home of the data |
| 2026-11-03 | v0.1.140 | Parallel threads for one bot |
| 2026-11-05 | v0.1.141 | A bot as an HTTP API, email |

## 5. Problems that come again

Six subagents read six periods, and none saw the report of another. The
last column says in how many of the six reports the theme is.

| Theme | Reports | Examples (release) |
|---|---|---|
| A turn or a wait that does not end | 6 of 6 | "hanging until the timeout" (v0.1.15); "Recover a thread whose resume never answers" (v0.1.71); "fail a turn whose agent goes silent mid-answer" (v0.1.85); "waits forever on 'Reserving your machine'" (v0.1.123); "A stuck engine stops in minutes, not 15." (v0.1.132); a chat "marked busy with nothing running, and Stop couldn't clear it" (v0.1.151) |
| The same work done or delivered two times, or lost | 6 of 6 | "A message sent to a busy bot used to disappear" (android-v1.2.0); "prevent duplicate jobs across restarts" (v0.1.74); "send each teammate result once" (v0.1.83); "never append or rerun a queued send twice after a crash" (v0.1.108); "A Claude turn is never sent twice" (v0.1.150) |
| Process control on Windows | 6 of 6 | "EPERM unlink" (v0.1.57); a data folder lease after a reused process id (v0.1.83); "Cannot use import statement outside a module" (v0.1.109); ".cmd wrappers" did not start (v0.1.129); "taskkill /T fails" (v0.1.140) |
| Sign-in to an engine, and engine CLIs that change | 6 of 6 | One engine "could never come online" (v0.1.14); "recover after upgrading" (v0.1.54); "failed on Codex 0.160" (v0.1.101); "An expired Claude sign-in is recognised" (v0.1.153) |
| A secret or an access right in the wrong place | 6 of 6 | Credentials in "process arguments" (v0.1.19); "Cloud secrets over a pipe, not the environment" (v0.1.92); secrets "no longer visible to a Codex bot's shell commands" (v0.1.101); "data_sql read-only gate bypasses closed" (v0.1.128) |
| A feature added, then removed or reversed | 6 of 6 | Section 6 |
| "Busy" and races between bots | 5 of 6 | "a renewable lease with an expiry rather than a flag" (v0.1.21); "not whole-bot busy" (v0.1.81); "scope broker socket by bot id, not threadId alone" (v0.1.76); "the server could use all its CPU re-checking the queue" (v0.1.149) |
| The size of the tool list of one turn | 4 of 6 | "API-engine bots failed past 128 tools" (v0.1.101); "41 of its 49 tools were being skipped" (v0.1.120); one tool list for each role, "$0.228 → $0.065" (v0.1.141) |
| State lost at a restart or a crash | 5 of 6 | Delegations "survive a restart" (v0.1.24); "keep turns waiting for capture across a restart" (v0.1.107); "a crash restarts cleanly and interrupted turns run again" (v0.1.165) |
| A file written over after a failed read | 2 of 6 | "never overwrite a routines/webhooks file the server could not read" (v0.1.103); a routine deleted "on the next save" (v0.1.107) |
| The approval model changed | 4 of 6 | Section 6 |
| Memory and the number of processes | 4 of 6 | Cloud peak memory "from about 3 GB to 1.6 GB" (v0.1.118); "only a few Codex bots start at once (at least 2, or one per CPU)" (v0.1.110); "EAGAIN" (v0.1.165) |
| Usage and cost numbers corrected | 3 of 6 | "book Claude turns at their own cost, not the CLI's running total" (v0.1.90); "Cached input is counted" (v0.1.170) |
| Tests that fail by chance, and a red main branch | 5 of 6 | "fix the five timing flakes that kept blocking releases" (v0.1.99); "not on a clock or a lucky port" (v0.1.133) |

## 6. Removed, replaced or reversed

The larger changes of direction. Each one was work done two times.

| What | First | Then |
|---|---|---|
| One conversation for each bot | v0.1.0 | Tasks (v0.1.16), threads (v0.1.67), parallel threads (v0.1.140) |
| "Busy" as a flag of the bot | first commit | A queue (v0.1.24); a thread slot in three steps (v0.1.81, v0.1.83, v0.1.86); the rule of one thread for each project folder "is gone" (v0.1.96) |
| Work between bots | A tool to ask a peer (v0.1.6); asynchronous with a gate (v0.1.19); a durable conversation for each pair (v0.1.78) | The job runtime replaces all of it and removes five tools (v0.1.108) |
| The approval model | An automatic mode (v0.1.16); levels for each bot (v0.1.54); the modes of the provider (v0.1.74) | Changes of a bot to itself stop asking (v0.1.99); "Bots start with Full access, on every engine" (v0.1.109); no send card at full access (v0.1.111); two choices (v0.1.144); approvals kept for an exact tool (v0.1.176) |
| A quiet engine | A stop after a fixed time | "stop killing quiet agents" (v0.1.93); a stop by progress (v0.1.135); 2 or 5 minutes (v0.1.132) |
| The browser of a bot | A browser inside the desktop shell | An outside browser engine (v0.1.58, v0.1.59); the installed Chrome (v0.1.113) |
| One engine driver | A CLI (v0.1.6) | Replaced (v0.1.14), replaced again (v0.1.51) |
| The tool connection of an engine | The MCP support of each engine | The connector of the project for all engines except one (v0.1.101) |
| Where the data is | This computer | Side by side with the Cloud (v0.1.117); one-way sync (v0.1.120); the Cloud is "the one home" (v0.1.122); an opt-out (v0.1.125) |
| The UI mode | Advanced | Simple is the default (v0.1.94); "Simple is now the only mode" (v0.1.151); "Advanced mode is back" (v0.1.152) |
| Routines and webhooks | Two features | One feature, "automations" (v0.1.115); no automatic switch-off after failures (v0.1.161) |
| Features that lived for weeks | Cloud overflow (v0.1.90); "tightening requests" (v0.1.88); a Today page (v0.1.120) | Deleted (v0.1.96, v0.1.96, v0.1.123) |
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
"PR list" means that the note is a list of pull request titles.

### v0.1.0 to v0.1.77 (2026-08-11 to 2026-09-13)

| Tag | Date | The main change |
|---|---|---|
| v0.1.0 | 08-11 | First build: two engine drivers, approval and question cards, a cloud computer, connected apps |
| v0.1.1 to v0.1.3 | 08-11 | Onboarding with live engine checks; a free port at start; no black window after a relaunch |
| v0.1.4 | 08-12 | The first engine over ACP |
| v0.1.5 | 08-12 | Engine CLIs found when the application opens from the desktop; tests and CI on three systems |
| v0.1.6 | 08-12 | Work between bots; a generic ACP core; a capability gate for tools |
| v0.1.7 to v0.1.12 | 08-12 | Updates inside the application; replies that stream; all engines can delegate |
| v0.1.13 | 08-13 | A message sent during a turn is queued; edit and branch; search |
| v0.1.14 | 08-13 | Rooms; one engine CLI replaced because its vendor retired it |
| v0.1.15 | 08-13 | Computer control twice as fast; a first Windows installer; a failure no longer "silently swallowed" |
| v0.1.16 | 08-14 | Tasks, each with "its own conversation *and its own model session*"; voice; an automatic approval mode |
| v0.1.17 | 08-14 | A local VM; routines on a schedule; a missing driver was reported as unavailable with no reason |
| v0.1.18 | 08-16 | Two more engines; "Resumable streams"; security hardening |
| v0.1.19 | 08-16 | Webhooks, with the payload "marked as *untrusted input*"; delegation becomes asynchronous |
| v0.1.20 | 08-16 | "A webhook turn no longer inherits auto mode"; session cursors no longer go to clients |
| v0.1.21 | 08-16 | VM ownership becomes "a renewable lease with an expiry rather than a flag" |
| v0.1.22, v0.1.23 | 08-17 | The key of the connector service moves to the credential store of the operating system |
| v0.1.24 | 08-19 | A phone application; memory as plain text; a queue for a busy bot; delegations "survive a restart"; a packaging bug "killed the server on launch" |
| v0.1.25 | 08-20 | More platforms; team import only adds |
| v0.1.27 | 08-20 | One more ACP engine; credentials encrypted at rest; an audit log; the license changes to Apache 2.0 |
| v0.1.29, v0.1.32 | 08-23 | Local models; a model catalogue with exact identifiers |
| v0.1.30, v0.1.31, v0.1.33 to v0.1.45 | 08-23 to 09-01 | 15 drafts with no content |
| v0.1.46, android-v1.0.0 | 09-01 | A tablet layout; pairing over a private network; an Android application |
| v0.1.48 | 09-02 | A container image for a server; custom MCP servers; remote pairing; goals; rooms wait for a busy member |
| v0.1.49, v0.1.50 | 09-02 | A model catalogue that refreshes; "Notify when a turn dies before it starts" |
| v0.1.51 | 09-04 | An official ACP runtime replaces one engine CLI; the team map; the Chief role |
| v0.1.52, android-v1.1.0, android-v1.2.0 | 09-03, 09-04 | Steer a held message from the phone |
| v0.1.54 | 09-05 | Approval levels for each bot |
| v0.1.55 | 09-05 | The `serve` command; "default-deny client scope"; search of past threads |
| v0.1.56 | 09-05 | An npm package of the server |
| v0.1.57 | 09-06 | "The bot is a folder": standing instructions in a file |
| v0.1.58, v0.1.59 | 09-06 | An outside browser engine replaces the browser of the desktop shell; "ignore Codex output after turn settlement" |
| v0.1.60 to v0.1.63 | 09-06, 09-07 | A bundled browser; a bot with full access keeps it when it gets work; "Permissions do not transfer from the sending bot" |
| browser-engine-v0.36.0-omb.1 | 09-07 | A patched browser engine for a Windows process problem |
| v0.1.65, v0.1.66 | 09-08 | The live browser view; a data folder lease that is proved dead after a reboot |
| v0.1.67 | 09-09 | Threads; a tunnel and a domain for the server; email sign-in on a hosted server |
| v0.1.68 to v0.1.70 | 09-09 | Run logs of routines; a service install; parallel work for each bot; bots open threads |
| v0.1.71 | 09-10 | Rewind a thread; see, edit and revert memory; a scriptable fake engine |
| v0.1.72 | 09-10 | A durable usage ledger; many workspaces; people with roles; a full backup |
| v0.1.73 | 09-11 | "keep helper completion from ending the parent run" |
| v0.1.74 | 09-11 | Approval levels are "the provider's own modes, passed through"; "prevent duplicate jobs across restarts" |
| v0.1.75 | 09-12 | "clear stuck approvals after deleting a thread" |
| v0.1.76 | 09-12 | Room coordination with receipts; delegation waits 24 hours for a busy teammate; "newest N rows in SQL" |
| v0.1.77 | 09-13 | A hosted workspace switcher; "close two confirmed holes in shared-folder access" |

### v0.1.78 to v0.1.96 (2026-09-13 to 2026-10-05)

| Tag | Date | The main change |
|---|---|---|
| v0.1.78 | 09-13 | "one durable conversation per pair of bots"; control of this computer on Windows |
| v0.1.79 | 09-15 | Cloud turns run on the cloud computer; "retry only pre-start crashes"; "finish [DONE]-less chat streams" |
| v0.1.80 | 09-15 | Organization sign-in; "bank Codex turns as a delta" |
| v0.1.81, android-v1.3.0 | 09-15 | "not whole-bot busy"; a cap on the event log of a thread; MCP servers by address |
| v0.1.82 | 09-16 | "wait for occupied desktops instead of failing turns" |
| v0.1.83 | 09-16 | The shared wire model; steer a queued message into the running turn; "send each teammate result once" |
| v0.1.84 | 09-17 | A broken run reaches the Chief; the test suite in shards |
| v0.1.85 | 09-20 | "one agent process per thread" for ACP; "fail a turn whose agent goes silent mid-answer" |
| v0.1.86 | 09-23 | The route table seam; visibility of a bot and an admin log; "end_turn with no items as a failed turn, not a quiet success" |
| v0.1.87 | 09-24 | Teams; an eval harness; connector grants with a store migration; "Keep prompt prefixes stable" |
| v0.1.88 | 09-26 | "extract shared admission module with zero behavior change" |
| v0.1.89, android-v1.5.0 | 09-27 | Typed capability fields; "keep a turn alive while a quiet tool is running" |
| v0.1.90 | 09-29 | The memory upgrade; a personal Cloud; "book Claude turns at their own cost, not the CLI's running total" |
| v0.1.91, v0.1.92 | 09-29, 10-01 | A paid plan; a decision model; "Cloud secrets over a pipe, not the environment"; OAuth for remote MCP servers |
| v0.1.93 | 10-02 | "stop killing quiet agents"; three roles for people |
| v0.1.94 | 10-02 | "Simple mode by default"; live calls on all clients |
| v0.1.95 | 10-03 | "Stop re-reading config.json on every broadcast frame"; "never lose a note at the size cap" |
| v0.1.96 | 10-05 | "Merge streamed text deltas every 50 ms"; a ratchet test for routes; three features deleted |

### v0.1.97 to v0.1.111 (2026-10-06 to 2026-10-15)

| Tag | Date | The main change |
|---|---|---|
| v0.1.97 | 10-06 | Work continues in a new thread after a turn dies; one engine kind deleted; "A refused action stays refused" |
| v0.1.98 | 10-07 | "Threads follow their bot's model"; the MCP call timeout becomes a setting |
| v0.1.99 | 10-07 | Changes of a bot to itself apply with Undo, with no card |
| v0.1.100 | 10-07 | The time to list the tools of an MCP server goes from 8 to 30 seconds |
| v0.1.101 | 10-08 | All engines except one use the connector of the project; a large tool catalogue becomes three small tools |
| v0.1.102 | 10-08 | "index messages by thread and time"; the usage routes leave the server index |
| v0.1.103 | 10-09 | "never overwrite a routines/webhooks file the server could not read" |
| v0.1.104 | 10-09 | A data tab with one database for each bot; "write the canonical event log asynchronously" |
| v0.1.107 (with .105, .106) | 10-10 | "keep turns waiting for capture across a restart"; a working folder for each conversation |
| v0.1.108 | 10-13 | The job runtime; five delegation tools removed; the server file split; saved logins |
| v0.1.109 | 10-14 | The runtime kept the server "at full CPU until it stopped answering"; "Index live assignments"; full access becomes the default |
| v0.1.110 | 10-15 | "only a few Codex bots start at once"; "A failed stop now always ends the turn" |
| v0.1.111 | 10-15 | Continue on a second engine at a limit; ten new parts are "Off by default" |

### v0.1.112 to v0.1.129 (2026-10-15 to 2026-10-27)

| Tag | Date | The main change |
|---|---|---|
| v0.1.112 | 10-15 | Old data folder paths "rewritten once ... with a backup of each changed file" |
| v0.1.113 | 10-16 | The browser of a bot goes "through an egress gate"; the installed Chrome replaces the old browser |
| v0.1.114 | 10-16 | "One stuck engine check no longer stalls every bot"; a run "skipped without a word" |
| v0.1.115 | 10-17 | Automations; "Thread changes are saved before they're shown"; "New bots start at Full access" |
| v0.1.116 | 10-18 | Automations from app events; a signed-out engine fails over to the backup engine |
| v0.1.117 | 10-19 | This computer and the Cloud side by side; the Cloud waits for memory before it starts an engine |
| v0.1.118 | 10-19 | A performance release: peak memory "from about 3 GB to 1.6 GB"; the server "starts without loading every conversation" |
| v0.1.119 | 10-20 | A browser profile for each bot; a stable webhook address |
| v0.1.120 | 10-20 | Automatic one-way sync to the Cloud; "41 of its 49 tools were being skipped" |
| v0.1.121 | 10-21 | A workspace starts with one Chief; new words for engine and computer |
| v0.1.122 | 10-22 | The Cloud becomes "the one home"; each bot in "its own sealed space" |
| v0.1.123 | 10-22 | The daily brief; a usage page; "waits forever on 'Reserving your machine'" |
| v0.1.124 | 10-23 | Large MCP results trimmed, not cut |
| v0.1.125 | 10-23 | A built-in helper bot; an opt-out of the move to the Cloud |
| v0.1.126 | 10-24 | "A message waits only for its own bot's engine, not for every engine to be checked" |
| v0.1.127 | 10-24 | The move to the Cloud "could sit there for hours" |
| v0.1.128 | 10-27 | "Every bot can reach every bot"; "one malformed request or reset socket can't stop the server" |
| v0.1.129 | 10-27 | Updates install themselves; engines installed as ".cmd wrappers" start on Windows |

### v0.1.130 to v0.1.141 (2026-10-27 to 2026-11-05)

| Tag | Date | The main change |
|---|---|---|
| v0.1.130 | 10-27 | A simple mode redesign; one inbox for each person; "A chat that goes quiet is rescued" |
| v0.1.131 | 10-28 | "Codex never replays a turn whose tool already ran"; "serialize writes per path" |
| v0.1.132 | 10-29 | A second AI takes over at a usage limit; "A stuck engine stops in minutes, not 15." |
| v0.1.133 | 10-29 | One card for questions and approvals; "MCP tool count exceeds the 128-tool limit" |
| v0.1.134 | 10-30 | Waits that need no AI; saved steps |
| v0.1.135 | 10-31 | "Two teammates asking a bot the same thing at the same time get one answer."; a room turn stops by progress, not by time |
| v0.1.136 | 10-31 | Share each bot; "A message you send isn't held up behind a long tool call." |
| v0.1.137 | 11-01 | A fix for a blank window after an update |
| v0.1.138 | 11-02 | PR list; a test that "the bridge keeps every function a page of the last two releases calls" |
| v0.1.139 | 11-03 | "the server sleeps when nothing is due"; bots manage MCP servers from the chat |
| v0.1.140 | 11-03 | Parallel threads, "one thread per 2 GB of memory, from 3 to 16"; each line says who sent it |
| v0.1.141 | 11-05 | A bot as an API; email; "two bots no longer wait on each other forever"; your Stop ends the work of the teammates |

### v0.1.142 to v0.1.177 (2026-11-05 to 2026-11-22)

Tags v0.1.156, 157, 159, 162, 163, 164, 168, 172 and 174 have no release.

| Tag | Date | The main change |
|---|---|---|
| v0.1.142 | 11-05 | A bot at a limit continues on a backup engine; an MCP result over 50 KB goes to a file |
| v0.1.143 | 11-06 | An end-to-end encrypted phone connection, switched off |
| v0.1.144 | 11-06 | Long commands run in the background; jobs "no longer time out and run twice" |
| v0.1.145 | 11-06 | "Four states the app could get stuck in are fixed" |
| v0.1.146 | 11-07 | Several local workspaces; installed engines update to tested versions |
| v0.1.147 | 11-07 | A bot joins a meeting and takes notes |
| v0.1.148 | 11-07 | One way to connect to a server; each way in is off by default |
| v0.1.149 | 11-08 | "the server could use all its CPU re-checking the queue and stop answering" |
| v0.1.150 | 11-09 | The queue check is "in proportion to the number waiting, not its square"; "A Claude turn is never sent twice" |
| v0.1.151 | 11-09 | A Vault page; "Simple is now the only mode" |
| v0.1.152 | 11-10 | "Advanced mode is back"; provider keys in the encrypted store of the desktop |
| v0.1.153 | 11-11 | Burst mode; an update "that backs up first and goes back by itself" |
| v0.1.154 | 11-12 | A reply streams into the chat; "Stop reaches the running turn after the connection restarts" |
| v0.1.155 | 11-13 | A cloud computer that does not answer is no longer shown as ready |
| v0.1.158 | 11-14 | Bots change settings, with Undo; fork a conversation |
| v0.1.160 | 11-15 | Pause a bot or a department; themes; tools "loaded only when a turn needs them" |
| v0.1.161 | 11-15 | "An automation is never switched off by failures"; "'Ready' means the computer answered" |
| v0.1.165 | 11-16 | "a crash restarts cleanly and interrupted turns run again"; an occurrence ledger for automations; "No leftover processes after a stop or a crash" |
| v0.1.166 | 11-17 | "one store layer, the first step towards keeping chats as database rows" |
| v0.1.167, v0.1.169 | 11-17 | Team files; team templates; a second password manager |
| v0.1.170 | 11-19 | "Cached input is counted"; a repair command for the data of a server |
| v0.1.171 | 11-19 | Bot reminders; the state of a hand-off |
| v0.1.173 | 11-19 | Two engines compact their own sessions; "the server starts listening earlier" |
| v0.1.175 | 11-21 | A new conversation: "nothing is saved until you send"; two engines stop reading the config files of the person |
| v0.1.176 | 11-21 | Approvals saved for an exact tool, "never remembered for anything that sends, posts or moves money" |
| v0.1.177 | 11-22 | A hand-off chip shows the conversation of a teammate; the Vault reads a larger secret now and writes it one release later, "so you can still go back to an earlier version safely" |

## 9. Not verified

- The main session checked 35 quotes, 4 to 10 from each report. It did not
  check each quote, and it did not check each row of section 8.
- The counts of feature notes and fix notes in the reports are hand counts.
  This file does not use them. The commit counts come from `git log`.
- "First release that names an area" (section 4) comes from the text of the
  notes. A feature can be in the code before a note names it. Example: the
  notes first name SQLite in v0.1.71 (2026-09-10), and the git history adds
  the SQLite message store on 2026-08-17.
- 15 releases (v0.1.30, v0.1.31, v0.1.33 to v0.1.45) are drafts with no
  content. What changed in them is not known from the notes.
- Many notes from v0.1.48 are lists of pull request titles. Nobody opened a
  pull request.
- The notes do not give the schema of the job record or of any store.
- Nobody read the 84 `refactor` commits one by one.
