# Features of the reference project, from its documentation

A list of each feature that the documentation of the reference project
describes, with the part of [`README.md`](README.md) that analyzes it. Eight
subagents read all Markdown files of the reference on 2026-11-23, every line.
Nobody read the source code for this list.

"State" is what the document says: **built**, **planned**, **removed**, or
**not stated**. A plan can describe a feature that was never built.

## The four groups, and the order of the work

We port the reference project from TypeScript to Rust. Each row has a group.
Do group 1 first. Do not start a later group before the group before it
works. The reasons are in [`changelog.md`](changelog.md): the reference built
wide first, and its base parts came late.

| Group | Meaning | Plan steps | The test | Rows | Research done or partial |
|---|---|---|---|---|---|
| **1** | The core: one bot answers | 1 to 7 | You type a message, and the answer appears word by word | 11 | 6 |
| 2 | The bot remembers and acts | 8 to 10 | The conversation is there after a restart, and an approval works | 13 | 2 |
| 3 | A team of bots | 11 to 16 | One bot gives work to a second bot and gets the result | 93 | 0 |
| later | We want it, after step 16 | none | none | 106 | 0 |
| no | Not in our plan. We read it only to understand it | none | none | 131 | 0 |

- **Ours** is the crate that gets the port: `bot-protocol` (types, no I/O),
  `bot-engine` (the `Driver` trait and the drivers), `bot-core` (the store,
  the runtime, memory), `bot-desktop` (the window), `bot-cli` (the
  composition root).
- **Research** is the state of the analysis of the row: open, partial or
  done, with the file. The work in progress is in
  [`progress.md`](progress.md).
- In each table, the rows are in the order of the groups.
- The group of a row comes from the first part number of the row, and then
  from a list of 25 rows that the main session marked by hand on
  2026-11-23. A row with many features can have features of a later group.
  Change a mark that is wrong.

### What group 1 needs

| # | Capability | Crate | Step | Research |
|---|---|---|---|---|
| 1 | Identifiers, message types, the five events | `bot-protocol` | 2 | partial: [`turn-flow-comparison.md`](turn-flow-comparison.md) |
| 2 | The `Driver` trait, capability flags, a fake driver | `bot-engine` | 3 | done: [`features/driver-contract.md`](features/driver-contract.md) |
| 3 | The registry, with "unavailable" for a bad entry | `bot-engine` | 4 | done: [`newer-config-unavailable.md`](features/newer-config-unavailable.md) |
| 4 | The chat API driver with streaming | `bot-engine` | 5 | done: [`chat-streaming.md`](features/chat-streaming.md), [`chat-driver-tool-calls.md`](features/chat-driver-tool-calls.md) |
| 5 | Settings, the data folder, keys, atomic writes, redaction | `bot-core` | 6 | done: [`write-only-secrets.md`](features/write-only-secrets.md), [`file-modes-atomic-writes-redaction.md`](features/file-modes-atomic-writes-redaction.md) |
| 6 | The event bus, the fold, the streamed reply in the window | `bot-core`, `bot-desktop` | 7 | done: [`event-bus-fold.md`](features/event-bus-fold.md) |
| 7 | One chat turn from send to reply | `bot-core` | 7 | done: [`chat-turns.md`](features/chat-turns.md), [`turn-flow-comparison.md`](turn-flow-comparison.md), [`queue-and-steer.md`](features/queue-and-steer.md) |

### What to do next

1. The author types the code of step 2 from `docs/code/turn-flow-comparison/`. The
   research for step 2 is enough to start.
2. The author decides five design choices before step 2 ends, because they
   change the types of `bot-protocol`. They are in section 7 of
   [`changelog.md`](changelog.md): one final event for a turn, an identifier
   that makes a second write a no-op, the thread as the unit of "busy", a
   sender on each message, and no wait with no limit.
3. Research the three gaps of group 1, one worktree for each: the streaming
   of the chat API driver (capability 4), the event bus and the fold
   (capability 6), and the part of one chat turn that
   `turn-flow-comparison.md` did not read (capability 7). Done on
   2026-11-23 (batch 2 of [`progress.md`](progress.md)).
4. After that, no more research until step 7 is done. One exception: the
   `Driver` contract for step 3 (batch 3 of [`progress.md`](progress.md)).

## Plans in `docs/superpowers/plans/`, files 1 to 12

All 12 files were read completely (5,477 lines).

| Feature | Document | State | Part | Group | Ours | Research |
|---|---|---|---|---|---|---|
| Rule: secrets are write-only; the UI sees only "configured" | `2026-08-31-00-control-plane-roadmap.md` | built | 11 | **1** | `bot-core` | done: [`write-only-secrets.md`](features/write-only-secrets.md) |
| Rule: files with mode 0600, atomic writes, redaction of text that an agent wrote | `2026-08-31-00-control-plane-roadmap.md` | built | 4, 11 | **1** | `bot-core` | done: [`file-modes-atomic-writes-redaction.md`](features/file-modes-atomic-writes-redaction.md) |
| Rule: a config from a newer version loads in an older version as "unavailable" | `2026-08-31-00-control-plane-roadmap.md` | built | 2 | **1** | `bot-engine` | done: [`newer-config-unavailable.md`](features/newer-config-unavailable.md) |
| A fake ACP CLI for protocol tests | `2026-08-15-opencode-go-integration.md` | not stated | 40 | 2 | `bot-engine` | open |
| The engine switch in the middle of a thread, with a replay of the thread | `2026-08-31-00-control-plane-roadmap.md` | built | 17 | 3 | `bot-core` | open |
| The MCP registry: the person adds an MCP server (stdio or HTTP), tests it and sees its tools | `2026-08-31-03-mcp-registry.md` | not stated | 20 | 3 | `bot-engine` | open |
| Grants of one MCP tool to one bot | `2026-08-31-03-mcp-registry.md` | not stated | 20 | 3 | `bot-engine` | open |
| The Connections Center UI: "Apps" and "MCP servers" | `2026-08-31-03-mcp-registry.md` | not stated | 20 | 3 | `bot-engine` | open |
| Connector grants for each bot, by exact tool name | `2026-08-31-04-connector-scopes.md` | built | 20 | 3 | `bot-engine` | open |
| Connector grants by verb class (read, draft, send, modify, delete) | `2026-08-31-04-connector-scopes.md` | removed | 20 | 3 | `bot-engine` | open |
| Memory proposals: a bot proposes a memory change, and a person approves, edits or rejects it | `2026-08-31-06-memory-review-loop.md` | not stated | 16 | 3 | `bot-core` | open |
| Typed memory entries: facts, preferences, decisions, procedures | `2026-08-31-06-memory-review-loop.md` | not stated | 16 | 3 | `bot-core` | open |
| The memory panel: read, edit and delete memory files, with a capacity gauge | `2026-08-31-06-memory-surface.md` | not stated | 16 | 3 | `bot-core` | open |
| The memory journal: each memory change of a turn, with revert | `2026-08-31-06-memory-surface.md` | not stated | 16 | 3 | `bot-core` | open |
| The task board for delegated work: owner, state, deadline, artifacts | `2026-08-31-07-delegation-task-board.md` | not stated | 15 | 3 | `bot-core`, `bot-engine` | open |
| The supervisor role: one more level of delegation | `2026-08-31-07-delegation-task-board.md` | not stated | 15 | 3 | `bot-core`, `bot-engine` | open |
| A limit on delegations that run at the same time | `2026-08-31-07-delegation-task-board.md` | not stated | 15 | 3 | `bot-core`, `bot-engine` | open |
| A reviewer stage: a second bot checks the work | `2026-08-31-07-delegation-task-board.md` | not stated | 15 | 3 | `bot-core`, `bot-engine` | open |
| `ask_bot` and `delegate_bot`: a bot asks or gives work to a bot | `2026-08-31-07-delegation-task-board.md` | built | 13, 15 | 3 | `bot-engine` | open |
| The depth limit of delegation, and the limit of queued hand-offs for a thread | `2026-08-31-07-delegation-task-board.md`, and `2026-09-12-delegation-mailbox.md` | built | 15 | 3 | `bot-core`, `bot-engine` | open |
| A hand-off waits up to 24 hours for a busy bot, then expires | `2026-09-12-delegation-mailbox.md` | not stated | 15 | 3 | `bot-core`, `bot-engine` | open |
| The state of a teammate: available, working, waiting on the person, not responding, unavailable | `2026-09-12-delegation-mailbox.md` | not stated | 15 | 3 | `bot-core`, `bot-engine` | open |
| `list_bots` and `check_delegation` show the state of the target | `2026-09-12-delegation-mailbox.md` | not stated | 13 | 3 | `bot-engine` | open |
| The Chief of Staff role and its roster | `2026-09-12-delegation-mailbox.md` | built | 15 | 3 | `bot-core`, `bot-engine` | open |
| The OpenCode Go engine over ACP: a model list from the engine, a write-only key, set-up screens | `2026-08-15-opencode-go-integration.md` | not stated | 7, 9 | later | `bot-engine` | open |
| The decision log: each allow and each deny writes an audit row | `2026-08-31-00-control-plane-roadmap.md` | built | 10 | later | `bot-protocol`, `bot-engine`, `bot-desktop` | open |
| Token usage split into new input, cache write and cache read | `2026-08-31-01-usage-accounting-and-budgets.md` | not stated | 21 | later | `bot-core` | open |
| Spend caps for each bot and for the workspace, checked before a turn starts | `2026-08-31-01-usage-accounting-and-budgets.md` | not stated | 21 | later | `bot-core` | open |
| The bot profile: one document for all parts of a bot, with a version log and rollback | `2026-08-31-02-bot-profile.md` | not stated | 45 | later | `bot-desktop` | open |
| Ten mascot body shapes for a bot, made by a generator | `2026-08-31-04-mascot-shape-catalog.md` | not stated | 46 | later | `bot-desktop` | open |
| The "Living" avatar: an uploaded picture is the body, with the live face on it | `2026-08-31-04-mascot-shape-catalog.md` | not stated | 46 | later | `bot-desktop` | open |
| The 25 face expressions, the gaze and the mouths of the mascot | `2026-08-31-04-mascot-shape-catalog.md` | not stated | 46 | later | `bot-desktop` | open |
| The host adapter: what a computer without a desktop session cannot do | `2026-08-31-05-headless-harness.md` | not stated | 29, 33 | later | `bot-desktop` | open |
| Copy of a skill to another bot | `2026-08-31-06-memory-review-loop.md` | not stated | 19 | later | `bot-core` | open |
| Search of past sessions | `2026-08-31-06-memory-review-loop.md` | built | 47 | later | `bot-core` | open |
| The team map: who talks to whom | `2026-08-31-07-delegation-task-board.md` | built | 24 | later | `bot-desktop` | open |
| The control-plane roadmap: the order of plans P1 to P7 and the global rules | `2026-08-31-00-control-plane-roadmap.md` | planned | 43 | no | not planned | open |
| Rule: an imported skill, connector, routine or MCP server stays off until a person turns it on | `2026-08-31-00-control-plane-roadmap.md` | built | 44 | no | not planned | open |
| The export contract: an export never has credentials, transcripts, memory or grants | `2026-08-31-00-control-plane-roadmap.md` | built | 44 | no | not planned | open |
| The private team backup: your bots, with transcripts and memory, between your computers | `2026-08-31-00-control-plane-roadmap.md` | built | 44 | no | not planned | open |
| A test floor: the minimum number of tests | `2026-08-31-00-control-plane-roadmap.md` | built | 41 | no | not planned | open |
| Export of one bot, and a clone of one bot | `2026-08-31-02-bot-profile.md` | not stated | 44, 45 | no | not planned | open |
| `serve`: the server without the desktop shell, with a supervisor for its processes | `2026-08-31-05-headless-harness.md` | not stated | 33 | no | not planned | open |
| The machine roster: the list of installations, online or not | `2026-08-31-05-headless-harness.md` | not stated | 34, 36 | no | not planned | open |
| Rule: the server listens on the loopback address and refuses another Host header | `2026-08-31-05-headless-harness.md` | built | 6, 11 | no | not planned | open |
| Service files for systemd and launchd | `2026-08-31-05-headless-harness.md` | not stated | 36 | no | not planned | open |

## Plans in `docs/superpowers/plans/`, files 13 to 24

All 12 files were read completely (7,947 lines).

| Feature | Document | State | Part | Group | Ours | Research |
|---|---|---|---|---|---|---|
| Sign-in to a remote MCP server with OAuth, from the desktop only | `2026-09-30-mcp-sign-in.md` | not stated | 20 | 3 | `bot-engine` | open |
| The OAuth token store, token refresh, and the token in each turn | `2026-09-30-mcp-sign-in.md` | not stated | 11, 20 | 3 | `bot-engine` | open |
| A remote MCP server goes through a local stdio proxy | `2026-09-30-per-bot-tool-scoping.md` | built, in a draft pull request | 20 | 3 | `bot-engine` | open |
| Waits: "tell me when": code with no model checks a file, a process, a page or a bot | `2026-10-27-waits.md` | not stated | 18 | 3 | `bot-core` | open |
| The tools `wait_until`, `list_waits` and `cancel_wait` | `2026-10-27-waits.md` | not stated | 13, 18 | 3 | `bot-engine` | open |
| The page check with an egress rule: public addresses only, limited redirects and size | `2026-10-27-waits.md` | not stated | 11, 18 | 3 | `bot-core` | open |
| Tool selection for each bot: allow and deny lists for native tools and MCP tools | `2026-09-30-per-bot-tool-scoping.md` | built, in a draft pull request | 10 | later | `bot-protocol`, `bot-engine`, `bot-desktop` | open |
| The MCP gate: it filters the tool list and blocks a call to an excluded tool | `2026-09-30-per-bot-tool-scoping.md` | built, in a draft pull request | 10, 13 | later | `bot-protocol`, `bot-engine`, `bot-desktop` | open |
| The "Access" section of the bot settings | `2026-09-30-per-bot-tool-scoping.md` | built, in a draft pull request | 45 | later | `bot-desktop` | open |
| Local environments: more than one data folder on a computer, one active at a time | `2026-10-07-local-environments.md` | not stated | 4, 29 | later | `bot-core` | open |
| The switch of environment: stop, release the lease, start, check, and roll back on failure | `2026-10-07-local-environments.md` | not stated | 29 | later | `bot-desktop` | open |
| Chat widgets: a bot shows an interactive card, and a press becomes the next message | `2026-10-13-chat-widgets.md` | not stated | 48 | later | `bot-desktop` | open |
| The DeepSeek engine over ACP | `2026-10-22-deepseek-harness-engine.md` | not stated | 7, 9 | later | `bot-engine` | open |
| The floating box that shows the live words and the reply | `2026-10-27-talk-shortcut.md` | not stated | 29, 35 | later | `bot-desktop` | open |
| Notifications and the unread badge | `2026-10-27-waits.md` | not stated | 50 | later | `bot-desktop` | open |
| The gesture core for the phone applications: touch becomes remote mouse and keyboard input | `2026-09-18-gesture-core.md` | not stated | 34 | no | not planned | open |
| Direct mode and trackpad mode, long press as right click, scroll with momentum, local zoom | `2026-09-18-gesture-core.md` | not stated | 34 | no | not planned | open |
| One test fixture that the iOS and the Android code must both pass | `2026-09-18-gesture-core.md` | not stated | 34, 40 | no | not planned | open |
| X research tools for a bot: search, the posts of an account, one post, a profile | `2026-10-08-x-research-tools.md` | not stated | 49 | no | not planned | open |
| X research as an included service of a paid Cloud plan, through a relay with a monthly limit | `2026-10-09-x-research-pro-relay.md` | not stated | 36, 49 | no | not planned | open |
| The widget renderers for desktop, iOS and Android | `2026-10-13-chat-widgets.md` | not stated | 34, 48 | no | not planned | open |
| "My Chrome": a bot on the Cloud drives the real Chrome of a lent computer | `2026-10-26-cloud-my-chrome.md` | not stated | 31, 36 | no | not planned | open |
| Lending: a desktop lends folders, the screen, the terminal and Chrome to the Cloud, over a device link | `2026-10-26-cloud-my-chrome.md` | not stated | 36 | no | not planned | open |
| Saved steps: the computer actions of a request are recorded and replayed later with no model call | `2026-10-27-saved-steps.md` | not stated | 32 | no | not planned | open |
| The rules that decide if steps can be saved, and the fall back to the model when a step fails | `2026-10-27-saved-steps.md` | not stated | 32 | no | not planned | open |
| The talk shortcut on macOS: hold keys in any application, speak, and the words go to a "Quick asks" chat | `2026-10-27-talk-shortcut.md` | not stated | 35 | no | not planned | open |

## Verification records in `docs/verification/`, files 70 to 137

All 68 files were read completely. A verification record describes a feature
that the project checked by hand, so each feature below is built unless a row
says a different state.

| Feature | Document | Part | Group | Ours | Research |
|---|---|---|---|---|---|
| A model connection with no tools | `openai-tools.md` | 9 | **1** | `bot-engine` | open |
| Tool calls for the chat API drivers, with approvals, deny and interrupt | `openai-tools.md` | 9, 10 | 2 | `bot-engine` | done: [`chat-driver-tool-calls.md`](features/chat-driver-tool-calls.md) |
| Turn limits: 64 model steps and 200 tool calls | `openai-tools.md` | 9 | 2 | `bot-engine` | open |
| The approval level of one thread | `provider-recovery.md` | 10 | 2 | `bot-protocol`, `bot-engine`, `bot-desktop` | open |
| Question cards: a bot asks the person with buttons or a reply field; a copy goes to the Inbox | `question-cards.md` | 48 | 2 | `bot-desktop` | open |
| Notification tools that only the helper bot has | `mausbot.md` | 13, 50 | 3 | `bot-engine` | open |
| The helper bot as the Chief when there is none | `mausbot.md` | 15 | 3 | `bot-core`, `bot-engine` | open |
| MCP sign-in from another computer: paste the callback address back | `mcp-sign-in.md` | 20 | 3 | `bot-engine` | open |
| Memory: automatic recall, a topic index, until-dates, background capture, a nightly tidy-up with undo | `memory-layer.md` | 16 | 3 | `bot-core` | open |
| Reply habits in each prompt, and "Remember:" and "Forget" in the chat | `memory-layer.md` | 16, 17 | 3 | `bot-core` | open |
| Mentions: a picker in the composer, colours for each bot, `@everyone` in a room | `mentions.md` | 23 | 3 | `bot-desktop` | open |
| A tool directory when a bot has more than 128 MCP tools | `openai-tools.md` | 13, 20 | 3 | `bot-engine` | open |
| A bot says where another bot lives | `own-home.md` | 15, 36 | 3 | `bot-core`, `bot-engine` | open |
| A connection to a social posting service | `postiz.md` | 20 | 3 | `bot-engine` | open |
| Proactive routines: checks of mail and calendar with no model, and a daily brief | `proactive-routines.md` | 18 | 3 | `bot-core` | open |
| Question routing: the Chief answers, or the person answers | `question-cards.md` | 15, 48 | 3 | `bot-core`, `bot-engine` | open |
| A follow-up from a teammate in the middle of a turn | `question-cards.md` | 15 | 3 | `bot-core`, `bot-engine` | open |
| Coordination in the chat: `coordinate_bots`, receipts, "Teammates working", consult | `room-coordination.md` | 14, 15 | 3 | `bot-core` | open |
| Recovery after a restart: a cut turn of a teammate runs again one time | `room-coordination.md` | 14 | 3 | `bot-core` | open |
| Files in a hand-off, with limits for each message and each day | `room-coordination.md` | 15, 30 | 3 | `bot-core`, `bot-engine` | open |
| Parking: a message waits until the teammates finish | `room-coordination.md` | 15 | 3 | `bot-core`, `bot-engine` | open |
| Stop ends the request and all the work that it gave out | `room-coordination.md` | 14, 15 | 3 | `bot-core` | open |
| Jobs in a room in parallel, and the room queue | `room-coordination.md` | 15 | 3 | `bot-core`, `bot-engine` | open |
| Limits of the runtime: depth 4, 24 requests for each root, a 24-hour queue | `room-coordination.md` | 14 | 3 | `bot-core` | open |
| Pages and applications in a room are view-only | `room-pages.md` | 15, 48 | 3 | `bot-core`, `bot-engine` | open |
| Routines: schedules by month and by cron, with an editor | `routines.md` | 18 | 3 | `bot-core` | open |
| The Automations page: a list, a calendar, "Run now", run logs | `routines.md` | 18 | 3 | `bot-core` | open |
| Where a routine posts its results; run on start-up; overlap rules; failure streaks | `routines.md` | 18 | 3 | `bot-core` | open |
| Webhooks, with delivery identifiers kept for 7 days | `routines.md` | 18 | 3 | `bot-core` | open |
| The authority of a Chief over more departments | `team-access.md` | 15, 55 | 3 | `bot-core`, `bot-engine` | open |
| Team set-up by the Chief, with one review card | `team-setup.md` | 15, 48 | 3 | `bot-core`, `bot-engine` | open |
| A bot proposes the deletion of a bot | `team-setup.md` | 15, 45 | 3 | `bot-core`, `bot-engine` | open |
| Threads: a model for each thread, folders, rename, reorder, snooze | `threads.md` | 12 | 3 | `bot-core`, `bot-desktop` | open |
| A limit on parallel threads, and the queued state | `threads.md` | 12 | 3 | `bot-core`, `bot-desktop` | open |
| A new thread in a working folder | `threads.md` | 12, 30 | 3 | `bot-core`, `bot-desktop` | open |
| Large tool results: a prefix, and a tool to read the remainder | `tool-results.md` | 13 | 3 | `bot-engine` | open |
| Waits | `waits.md` | 18 | 3 | `bot-core` | open |
| A connection to a hosted application with OAuth and no key | `whop.md` | 20 | 3 | `bot-engine` | open |
| Local environments in the settings | `local-environments.md` | 29 | later | `bot-desktop` | open |
| The default helper bot: each installation has one, and it cannot be deleted | `mausbot.md` | 45 | later | `bot-desktop` | open |
| The helper model: one model for background calls, with a switch for each bot | `memory-layer.md` | 9, 16 | later | `bot-engine` | open |
| The welcome flow: two screens, then the chat of the Chief | `onboarding.md` | 25 | later | `bot-desktop` | open |
| The guided tour of the application | `onboarding.md` | 25 | later | `bot-desktop` | open |
| The default model after the first start | `onboarding.md` | 9, 25 | later | `bot-engine` | open |
| Import of skills and MCP servers from other AI tools on this computer | `onboarding.md` | 19, 44 | later | `bot-core` | open |
| The welcome of a new Cloud | `onboarding.md` | 25, 36 | later | `bot-desktop` | open |
| A nudge when a model says it will act and does not | `openai-tools.md` | 9 | later | `bot-engine` | open |
| Screenshots as picture parts of a request | `openai-tools.md` | 9, 32 | later | `bot-engine` | open |
| Reasoning levels (variants) for each conversation | `opencode-variants.md` | 7, 9 | later | `bot-engine` | open |
| Search in a worker, so that it does not block the server | `persistence-performance.md` | 47 | later | `bot-core` | open |
| Limits of a shell timeout for one engine | `pi-shell-timeouts.md` | 8 | later | `bot-engine` | open |
| Preset bots in the "New bot" dialog, from files and from the organization | `presets.md` | 45, 52 | later | `bot-desktop` | open |
| Proposal cards: a bot proposes a profile setting; a credential request card | `proposal-cards.md` | 48 | later | `bot-desktop` | open |
| Recovery of engines: picture input, account settings, a permission override, an internal error | `provider-recovery.md` | 7, 8 | later | `bot-engine` | open |
| Model routes of one engine | `qwen-models.md` | 7 | later | `bot-engine` | open |
| Reactions on a message: thumbs are a yes or no reply, and reactions answer a card | `reactions.md` | 23, 48 | later | `bot-desktop` | open |
| Rich tables: sort, search, copy and export; previews of CSV files | `rich-tables.md` | 23, 30 | later | `bot-desktop` | open |
| The safety floor: a list of shell commands that are always denied | `safety-floor.md` | 10, 11 | later | `bot-protocol`, `bot-engine`, `bot-desktop` | open |
| Sign-in to an engine with a device code in the browser | `server-settings.md` | 8, 25 | later | `bot-engine` | open |
| Who can answer a card | `shared-workspace-trust.md` | 48, 51 | later | `bot-desktop` | open |
| The decision log, kept for 180 days | `shared-workspace-trust.md` | 10 | later | `bot-protocol`, `bot-engine`, `bot-desktop` | open |
| The sidebar: confirmations, "mark all as read", notification sounds | `sidebar.md` | 24, 50 | later | `bot-desktop` | open |
| Departments: groups of bots in the sidebar, by drag | `sidebar.md`, and `teams.md` | 24, 55 | later | `bot-desktop` | open |
| The "Active threads" menu, and the Inbox row | `sidebar-attention.md` | 24, 48 | later | `bot-desktop` | open |
| The approval card of a learned skill | `skill-approval-lifecycle.md` | 19, 48 | later | `bot-core` | open |
| A monthly spend cap and sell prices (the document says these need the enterprise layer) | `spend-cap.md` | 21 | later | `bot-core` | open |
| The loading screen and the tray on Windows | `startup-tray.md` | 29 | later | `bot-desktop` | open |
| Departments with shared instructions | `teams.md` | 55 | later | `bot-core` | open |
| The team map canvas | `teams.md` | 24 | later | `bot-desktop` | open |
| Tool selection for each bot | `tool-selection.md` | 10 | later | `bot-protocol`, `bot-engine`, `bot-desktop` | open |
| The usage ledger: one row for each completed turn, with the cost | `usage-ledger.md` | 21 | later | `bot-core` | open |
| Spending insights, traces and the token detail in the chat header | `usage-ledger.md` | 21 | later | `bot-core` | open |
| Chat widgets, and what a bot chooses with no instruction | `widgets.md`, `widget-prompts.md` | 48 | later | `bot-desktop` | open |
| Live calls: a voice call with a bot, with one call record row in the chat | `live-calls.md` | 35 | no | not planned | open |
| Live call providers: your own OpenAI key, Azure OpenAI, a custom endpoint, Fish Audio | `live-calls.md` | 35 | no | not planned | open |
| The helper that controls the screen of this computer, and its start-up | `local-computer-launch.md` | 32 | no | not planned | open |
| Screen control on Windows | `local-computer-launch.md` | 32 | no | not planned | open |
| `ask_for_computer`: a bot asks the person to turn on computer access, with a card | `local-computer-launch.md` | 32, 48 | no | not planned | open |
| Typing with a pace, for an old driver | `local-computer-launch.md` | 32 | no | not planned | open |
| The local VM stops when idle and resumes | `local-vm-resume.md` | 54 | no | not planned | open |
| Pictures that an engine made, on the phone applications | `mobile-generated-images.md` | 30, 34 | no | not planned | open |
| Read a reply aloud with OpenAI voices | `openai-readout.md` | 35 | no | not planned | open |
| The cloud computer of a bot: it starts on first use | `openai-tools.md` | 54 | no | not planned | open |
| The organization connection of the desktop: sign-in, the logo, disconnect | `organization-settings.md` | 52 | no | not planned | open |
| The organization policy: company models only, an engine list, MCP rules | `organization-settings.md` | 52 | no | not planned | open |
| Company models after sign-in | `organization-settings.md` | 52 | no | not planned | open |
| The organization library: packages from the organization, withdrawn releases | `org-library.md` | 52 | no | not planned | open |
| "Make this server my home": the bots move to one server, and this computer is lent to it | `own-home.md` | 36 | no | not planned | open |
| A notice when bots are in two places | `own-home.md` | 36 | no | not planned | open |
| People in a hosted workspace: sign-in with an email code, roles, an invitation link | `people.md` | 51 | no | not planned | open |
| The web application on a phone: a manifest, icons, no service worker | `phone-web-app.md` | 34 | no | not planned | open |
| Local VMs in Podman, and self-hosting with Podman Compose | `podman-firefox.md`, `podman-self-hosting.md` | 36, 54 | no | not planned | open |
| The "Published apps" page: pages and sites that bots put online, with a preview and delete | `published-apps.md` | 37 | no | not planned | open |
| How verification works: one control command, a disposable server, a fake engine | `README.md` | 40 | no | not planned | open |
| Saved steps (built on macOS only) | `saved-steps.md` | 32 | no | not planned | open |
| A custom domain for remote access | `server-settings.md` | 53 | no | not planned | open |
| Visibility of a bot: everyone, admins or named people | `shared-workspace-governance.md` | 51 | no | not planned | open |
| The admin activity log | `shared-workspace-governance.md` | 51 | no | not planned | open |
| Loopback trust: an owner or a service; the routes that a service can call | `shared-workspace-trust.md` | 6, 51 | no | not planned | open |
| Tailscale: discovery, "Your other computers", serve, keep this computer awake | `tailscale.md` | 53 | no | not planned | open |
| Take control of the computer of a bot, and give it back | `take-control.md` | 54 | no | not planned | open |
| The talk shortcut | `talk-shortcut.md` | 35 | no | not planned | open |
| Team backups, team templates, skills in a package, restore of archived bots | `team-backups.md` | 44 | no | not planned | open |
| Access levels to a bot on a Team Cloud: none, view, chat, edit | `team-bot-access.md` | 51 | no | not planned | open |
| A new bot is private until it is shared | `team-bot-access.md` | 51 | no | not planned | open |
| Team cloud computers | `teams.md` | 54 | no | not planned | open |
| Share a bot or a department as a template: a folder, GitHub, import | `team-sharing.md` | 44 | no | not planned | open |
| Slack: a channel message is a shared conversation, a direct message is a private one | `team-slack.md` | 56 | no | not planned | open |
| Recovery of a remote computer over SSH | `vps-recovery.md` | 54 | no | not planned | open |
| A full backup of the workspace, encrypted, and its restore | `workspace-backups.md` | 44 | no | not planned | open |
| Many installations on one server, with a fleet agent | `workspaces.md` | 36 | no | not planned | open |
| The X card in the Apps page | `x-connector.md` | 49 | no | not planned | open |

## Feature pages in `docs/`, 42 files

All 42 files were read completely. These pages describe what is built, unless
a feature is marked. Each row has all the features of one page.

| Document | Features | Part | Group | Ours | Research |
|---|---|---|---|---|---|
| `custom-engines.md` | Provider icons; a custom ACP instance; model refresh for each bot; removal of the keys of other providers; OpenAI-compatible instances; guides for providers; an invalid instance does not stop the others | 2, 7, 9 | **1** | `bot-engine` | partial: [`features/driver-contract.md`](features/driver-contract.md) |
| `approval-levels.md` | The approval levels (ask, auto-accept edits, approve for me, custom, full access); full access is the default; reads of own files never ask; a new thread gets the level of the conversation; change of level in the middle of a turn; a level for all bots of a department; a receipt with Undo; the level of a Chief flows down; allow once and allow for this session; question cards and `ask_user`; the safety floor and guarded sends | 10 | 2 | `bot-protocol`, `bot-engine`, `bot-desktop` | open |
| `cursor.md` | One ACP engine in detail: a sign-in card, a version check, install on a Cloud, model discovery, autonomy, a question card, the agent tools on that engine | 7 | 2 | `bot-engine` | open |
| `agents-tool-bridge.md` | The tool bridge: a short tool list with `find_tool` and `use_tool` (off by default); automatic for local models; the tools that are always listed; which engines can use it; a golden test of the catalog; an eval of tool choice | 13 | 3 | `bot-engine` | open |
| `composio.md` | Connected apps through a connector service: a project key; more than one account for an app; a managed connection service on the Cloud; automations from app events, with daily limits; apps for each person on a Team Cloud; file uploads; tool grants for each bot; bots that a Chief makes get its apps; named mail and calendar tools; "sending on your behalf" | 20, 18 | 3 | `bot-engine` | open |
| `custom-mcp-servers.md` | Add a server by paste; an edit form; a test when added; a restart action; "only for me" on a Team Cloud; built-in cards; bot access for each card; OAuth sign-in, also from another computer; bulk import; "bring what you already use"; imported skills; the choice of MCP servers for each bot; the MCP servers of one bot; health checks at the start of a bot; tool search for a large server; a table of which engine reaches what; also use the MCP servers and skills of another CLI; project skills; an allow list from the organization; safety rules; a result gate | 20, 19 | 3 | `bot-engine` | open |
| `memory.md` | Memory files; a switch for each bot; the memory panel; redaction of credentials on write; the load budget; until-dates; the topic index; automatic recall; upkeep that notices facts; learning from group chats; organization into topics; "About me" facts; a nightly tidy-up; a warning for a heavy bot; the helper model; remember, forget and prefer in the chat; safe editing on conflict; a brief of recent work; a daily turn log line; `session_search` with dates; the memory journal with Undo; the routes; a memory layer for each person on a Team Cloud; shared team memory; fact checks | 16 | 3 | `bot-core` | open |
| `proactive-routines.md` | The default routine "keep an eye on my day"; the daily brief card; a meeting preparation card and a 10-minute reminder; routine checks; read-and-draft runs; inbox triage with the helper model; reliability rules; state files; a morning brief on a personal Cloud | 18 | 3 | `bot-core` | open |
| `routine-schedules.md` | Routines from natural language with cron; the schedule types; the `check_back` tool; an on/off switch; one-time routines; delete cascade; where a routine runs; keep the computer awake; catch-up after downtime and "Missed" rows; a ledger of occurrences; a cap on run rows; restart of a lost run; run time limits; a busy bot misses after 60 minutes; safety for an unreadable routines file; waits for approval | 18 | 3 | `bot-core` | open |
| `runtime-contract.md` | The assignment record and its database; the lifecycle; one answer to the same request; a question from a child interrupts the wait; a requester with full access answers; typed questions become cards; continue and loop guards; wake, cancel, stop; the level rule; the envelope; the restart policy; budgets and clocks; ten invariants; ports; the tool surface | 14 | 3 | `bot-core` | open |
| `avatar-storage.md` | Bot avatars in the attachment store; an avatar made with AI | 46 | later | `bot-desktop` | open |
| `bitwarden.md` | A password manager in the Vault: server choice, a check before save, a CLI runner, `bw://` references, a secrets manager, a pinned download | 11 | later | `bot-core` | open |
| `bot-box.md` | The bot box: a sandbox for the process of a bot on Linux; a list of permitted environment variables; an egress gate; a credential broker; a broker for MCP headers; a system-call filter; a self-check | 11, 57 | later | `bot-core` | open |
| `cli-onboarding.md` | Install with `npx`; a set-up wizard in the terminal; sign-in with a device code; a test message; phone access (a managed tunnel, Tailscale, or an existing address); pairing with a QR code; where credentials are stored | 25, 33, 53 | later | `bot-desktop` | open |
| `desktop-chat-links.md` | "Copy link" to a bot; the `://bot/<id>` link; link handling; links to the Cloud and to the organization | 29 | later | `bot-desktop` | open |
| `feature-flags.md` | The `features` switches in the config; the opt-out file of the library; three states of server lending; environment overrides; the loop guard; removed flags | 39, 4 | later | `bot-core` | open |
| `linux-desktop.md` | The Linux desktop (beta): packages, the updater, CLI discovery, the screen preview, local control on Xorg, a GPU switch; Wayland is not available | 29 | later | `bot-desktop` | open |
| `localization.md`, `localization-pt-br.md` | Locale packs with English as the fallback; the language setting; a check script; a draft tool that uses a model; a style guide and a glossary for one language; localization of server messages; vocabulary tests | 28 | later | `bot-desktop` | open |
| `notification-and-proactivity-qa.md` | The types of notification; notifications off for a bot; quiet threads that a bot opened; a click goes to the exact bot and task; read-on-open across applications; no notification when the window has focus; notifications on iOS | 50 | later | `bot-desktop` | open |
| `opencode-go.md` | One ACP engine in detail: its key, keys for its other providers, model discovery, a retry at 128 tools, usage limits | 7 | later | `bot-engine` | open |
| `pausing-bots.md` | Pause a bot, a department or all bots; what a pause does; who can pause; the API and the CLI | 45, 55 | later | `bot-desktop` | open |
| `presets.md` | Preset bots as a starting role; what a preset can contain; skills on or off by source; withdrawn releases; import and export of preset files | 45 | later | `bot-desktop` | open |
| `tool-selection.md` | Tool selection in the Access settings; the selector syntax; sub-names of the agent tools; a table of engine support | 10 | later | `bot-protocol`, `bot-engine`, `bot-desktop` | open |
| `usage-caps.md` | Usage caps; `stops`; the `usage_limits` bot tool; a warning at 80% and a notice when reached; rows for skipped runs; the settings; a licensed monthly spend limit | 21 | later | `bot-core` | open |
| `analytics.md` | Usage analytics with a switch; redaction; a list of permitted values; a daily snapshot; the event catalog; start-up stage events | 39 | no | not planned | open |
| `announcements.md` | Announcement cards from a remote feed; the card schema, actions and audience; the Announcements page; release notes; a kill switch | 39 | no | not planned | open |
| `bot-api.md` | The bot API: an HTTP API for one bot (off by default), keys, the request contract, a confined sandbox, an "acts as me" key, a call log | 33 | no | not planned | open |
| `browser-packaging.md` | The bundled browser engine; switches; the choice of real Chrome; the browser identity; signed-in sites; My Chrome; the egress gate with a SOCKS5 proxy and an allow list; "open sites on this server"; idle close and a sweep of leftover processes; video recording (CLI only); the AppArmor policy on Linux | 31 | no | not planned | open |
| `ci.md` | CI: the choice of areas, lanes, one gate, test shards, runner limits, a browser benchmark, the release proof, a retry list for unstable tests | 41 | no | not planned | open |
| `computer-use-integration.md` | The driver that controls the desktop of this computer; a one-time consent; the tools of the driver; saved steps; a proxy to a remote or cloud computer; read-only screen lending on Windows | 32 | no | not planned | open |
| `decision-model.md` | The decision model: a small model that decides; its providers and key order; automatic routing in a room; fail-open; a log; inbox triage and extraction; the bot calls `decide` and `extract`; a live eval | 58 | no | not planned | open |
| `desktop-library.md` | The organization library on the desktop: sync, download, an encrypted state file, clean-up at sign-out, install reports | 52 | no | not planned | open |
| `files.md` | The Files page on the Cloud; copies of lent folders; "add a folder" and the share dialog; stop sharing; reads while the computer is away; writes that wait while away; pause and resume in the menu bar; a clone of a GitHub repository; download of the work of bots | 30, 36 | no | not planned | open |
| `headless-cli.md` | The CLI: login, logout, servers; server targeting; connect and pair; access tokens; JSON output and exit codes; `doctor`; status, bots, channels, models; delete, pause and resume a bot; stop; threads; computers; messages and send; run and wait; interrupt a tree; export; events; engines; team apply and export; new bot, new channel, set model, edit; `mcp`; a CI recipe | 33 | no | not planned | open |
| `image-generation.md` | The `generate_image` tool; its settings; a limit for each reply and a daily cap; only a person can ask; `edit_image` with markup; providers and backup rules; a custom gateway | 59 | no | not planned | open |
| `mcp-server.md` | The project as an MCP server over stdio, for other tools: run modes, a paired token for tools that change state, port discovery, the tools, caps | 33 | no | not planned | open |
| `meeting-notes.md` | A meeting notes bot: it joins a meeting, shows a live card with "Leave meeting"; a "join my meetings" routine; a chain of speech-to-text services; limits | 35 | no | not planned | open |
| `releasing.md` | The release workflows; the CI proof gate; a record of the data format; promote to stable; the server update routine; a rule for updater migration | 41 | no | not planned | open |
| `sentinel.md` | A scanner command that finds problems in the logs, with a privacy-preserving issues file; detectors; install as a service | 60 | no | not planned | open |
| `voice-mode.md` | Text to speech; voice providers; a half-duplex call mode; spoken narration of tool steps; spoken approvals and questions; live calls; a voice for each bot | 35 | no | not planned | open |

## Verification records in `docs/verification/`, files 1 to 69

All 69 files were read completely. Each feature is built, because the record
describes a check of it. Each row has all the features of one record.

| Document | Features | Part | Group | Ours | Research |
|---|---|---|---|---|---|
| `chat-turns.md` | Chat turns and independent tasks; uploaded pictures for file tools; "Works on": where a turn acts; recovery of queued follow-ups after a restart; hand-offs on the runtime; approval results of a teammate shown to the Chief; Stop for a CLI; the message of the person stops a long tool call; a shared chat on a Team Cloud; parallel threads for each bot | 1, 12, 14 | **1** | `bot-core` | partial: [`turn-flow-comparison.md`](turn-flow-comparison.md) |
| `chat-ui.md` | A tool that drives the window in a headless browser; the flag for tool rows; the "This run" card and "Save as skill"; the inspector with a run log, events and raw events; usage details; code blocks on a phone; the thinking timer; the live step status and the "Now" card; streaming replies; a queued message can be edited | 23, 40 | **1** | `bot-desktop`, `bot-core` | open |
| `app-settings.md` | The `app_settings` bot tool: a bot finds, reads and changes settings, with an Undo card; secrets go through a secure card only; window preferences through the desktop | 13, 61 | 3 | `bot-engine` | open |
| `automation-reports.md` | An automation works in a hidden conversation and reports into the chat of the bot; a "Results" chat | 18 | 3 | `bot-core` | open |
| `bot-contact-cards.md` | Cards that give a bot its own email, phone number and calls | 20, 35 | 3 | `bot-engine` | open |
| `channels.md` | Channels (rooms): create, send, read; the tools of the Chief for rooms | 15 | 3 | `bot-core`, `bot-engine` | open |
| `check-backs.md` | The `check_back` tool: a bot asks to return at a time | 18 | 3 | `bot-core` | open |
| `connected-apps-oauth.md` | Recovery of the sign-in to connected apps | 20 | 3 | `bot-engine` | open |
| `context-compaction.md` | Compaction by the engine or by the server; summaries made while idle; the context breakdown; context of a room; room sessions; the helper model for summaries; tool history in a rebuilt session | 17 | 3 | `bot-core` | open |
| `evidence/bot-attach-file/README.md` | The `attach_file` tool; the `vm_exec` tool; audio and video attachments that play in the chat | 13, 30 | 3 | `bot-engine` | open |
| `full-access.md` | With full access, the Chief changes profiles, routines, skills and teams directly | 10, 15 | 3 | `bot-core` | open |
| `group-local-vm.md` | Which computer a room, a goal or a channel uses | 15, 54 | 3 | `bot-core`, `bot-engine` | open |
| `handoff-status.md` | The state row of a hand-off: claimed, working, waiting, done, failed | 15 | 3 | `bot-core`, `bot-engine` | open |
| `interval-restrictions.md` | A routine "each X minutes" with limits by weekday, hours and an end date | 18 | 3 | `bot-core` | open |
| `automatic-recovery.md` | Backup models for each bot (up to 5); a backup engine for all bots; take-over when a usage limit is reached; recovery from a refused sign-in | 21 | later | `bot-core` | open |
| `avatar-providers.md` | Providers for avatar pictures | 46 | later | `bot-desktop` | open |
| `bidi.md` | Right-to-left text in messages | 23 | later | `bot-desktop` | open |
| `bot-continuity.md` | The set-up interview of a bot, only on `/setup`; the scope of a model change; files across threads; the model picker for a signed-out or absent engine | 45, 12 | later | `bot-desktop` | open |
| `bot-settings.md` | The bot settings dialog and its sections (identity, standing instructions, history with Undo, memory, skills, routines, access, model, permissions, voice, usage); duplicate a bot; "New bot" and its defaults; the simple bot panel with six tabs | 45 | later | `bot-desktop` | open |
| `chatgpt-plan.md`, `claude-account.md`, `codex-account.md` | Sign-in and sign-out of engine accounts in the settings | 8, 25 | later | `bot-engine` | open |
| `chat-polish.md` | Tool details that open in the chat; the attachment gallery and preview; search in the settings; shortcut hints | 23, 24 | later | `bot-desktop` | open |
| `claude-endpoint.md`, `claude-tool-lifecycle.md` | Custom endpoints for one engine; capabilities that end with the turn; how MCP servers load; warm engines; steering into a running turn; rebuilt conversations | 8 | later | `bot-engine` | open |
| `cline.md`, `copilot-engine.md`, `custom-acp-models.md`, `kimi-models.md`, `grok-steering.md` | ACP engines in detail: login, model and thinking choices, steering | 7 | later | `bot-engine` | open |
| `cloud-rail.md` | The places rail at the left edge: this computer, Clouds, servers; buy a Cloud or add a server; a colour for each place; a banner picture; more local workspaces | 24, 36 | later | `bot-desktop` | open |
| `codex-browser-routing.md`, `codex-helpers.md`, `codex-instructions.md` | One engine in detail: it uses our browser bridge; the events of its helpers are separate; bot instructions with a receipt | 8 | later | `bot-engine` | open |
| `command-allowlist.md` | An exact allow list of commands | 10 | later | `bot-protocol`, `bot-engine`, `bot-desktop` | open |
| `desktop-server-connection.md` | The desktop connects to a server and switches between servers; computer sharing (a flag, off by default) | 29, 36, 53 | later | `bot-desktop` | open |
| `desktop-server-recovery.md` | The supervisor restarts a crashed bundled server | 29 | later | `bot-desktop` | open |
| `digests.md` | Work summaries (digests and receipts) on each reply; engine hooks; a hint after a shell timeout | 62 | later | `bot-core` | open |
| `engines.md`, `engines-ui.md` | The list of engines and `doctor`; named accounts; many engines and API providers; the engine library in the settings and in onboarding | 7, 9, 25 | later | `bot-engine` | open |
| `first-hour.md` | The first hour of a new Cloud: a greeting, cards for mail and calendar, a first look | 25, 36 | later | `bot-desktop` | open |
| `gmail-drafts.md` | The "sending on your behalf" policy; draft tools for mail | 10, 20 | later | `bot-protocol`, `bot-engine`, `bot-desktop` | open |
| `inbox.md` | The Inbox: approvals, questions and messages to the person from all threads | 48 | later | `bot-desktop` | open |
| `backup-responsiveness.md` | The workspace export runs in a worker thread | 44 | no | not planned | open |
| `browser-live.md` | The live browser panel and "Take control"; browser profiles; the page size; the `request_sign_in` tool and its card; saved logins, the Vault and `fill_login`; a password manager integration; page dialogs; recovery after idle time | 31, 11 | no | not planned | open |
| `browser-steps.md` | Page errors in the results of browser tools; a record of browser steps with screenshots, kept for 30 days | 31 | no | not planned | open |
| `cloud-account.md` | An optional personal Cloud account with a device code, and the plan | 36 | no | not planned | open |
| `cloud-preview.md` | The preview of a cloud screen in the Computer panel | 54 | no | not planned | open |
| `cloud-send.md` | "Move to My Cloud": a one-time move of all data; a move of some bots; the freeze of this computer; a status report | 36, 44 | no | not planned | open |
| `company-backups.md` | Backups to the company cloud, with a key that the organization wraps | 44, 52 | no | not planned | open |
| `computer-files.md`, `computer-panel-focus.md` | The Files tab of the Computer panel: save a copy of changed files; keyboard focus | 54, 30 | no | not planned | open |
| `computer-wait.md` | Turns wait in order for one shared computer, with a position and an estimate | 54 | no | not planned | open |
| `data.md` | The data viewer: the data tools of a bot put results in a Data tab, with SQL | 37 | no | not planned | open |
| `deepseek-speech.md`, `gemini-speech.md`, `dictation.md` | Speech providers; dictation on macOS | 35 | no | not planned | open |
| `desktop-library.md` | The channel for the organization library on the desktop | 52 | no | not planned | open |
| `desktop-viewer.md` | A remote desktop viewer with keyboard and clipboard panels | 54 | no | not planned | open |
| `enterprise-license.md` | How the enterprise layer loads and how its license expires (the code is in `enterprise/`, which we do not read) | none | no | not planned | open |
| `external-runtime.md` | External runtimes: an outside engine has a standing right to one thread | 33 | no | not planned | open |
| `fleet.md` | The fleet CLI for many workspaces on one server | 36 | no | not planned | open |
| `guarded-messages.md` | A guarded API for external messages; follow and stop one request; a policy for full access in a shared workspace | 6, 33 | no | not planned | open |
| `headless-cli.md` | The CLI, checked | 33 | no | not planned | open |
| `hetzner-launch-2026-09-07.md` | Self-hosting on a rented server, checked from install to a real chat | 36 | no | not planned | open |
| `hosted-slack-management.md`, `hosted-workspaces.md` | The Slack link of a hosted workspace; sign-in and revocation of a hosted workspace | 51, 56 | no | not planned | open |
| `included-hosting.md` | Included hosting of applications: the tools `publish_app` and `check_app_hosting` | 37 | no | not planned | open |
| `japanese-desktop.md` | A font in the managed desktop image | 54 | no | not planned | open |

## Plans, specifications and design notes

`docs/plans/` (16 files), `docs/specs/` (3), `docs/requirements/` (4),
`docs/design/` (5) and files 25 to 47 of `docs/superpowers/` (23). All 51
files were read completely (10,864 lines). The state is what each document
says.

| Document | Features | State | Part | Group | Ours | Research |
|---|---|---|---|---|---|---|
| `plans/2026-08-18-001-fix-claude-turn-teardown...` and the two other fix plans of that date | Kill the process tree of an engine when a turn ends; refuse a permission request that arrives after the turn ended; a guard for two requests with the same identifier | planned | 8, 10 | 2 | `bot-engine` | open |
| `plans/agent-harness-upgrades.md` and `-v2.md` | A list of 17 upgrades: context rebuild on a model switch; attachments; automatic retry; search across threads; cost visibility; a liveness check; portable context; durable delegations; tool deadlines and loop detection; redaction of tool results; approvals that fail closed; activity state on the server; the raw event inspector; a driver for local models; steering in the middle of a turn. Also built: message branches with a version switcher | some built | 1, 9, 17, 47, 64 | 2 | `bot-core` | open |
| `specs/steer-sigterm-audit.md` | A graceful Stop for one engine; steer and queue never kill | built | 8 | 2 | `bot-engine` | open |
| `specs/steer-vs-queue.md` | Enter queues a message, and a second Enter steers it into the running turn | specification | 23, 1 | 2 | `bot-core`, `bot-desktop` | done: [`queue-and-steer.md`](features/queue-and-steer.md) |
| `plans/2026-09-02-bot-concurrency.md` | A busy member of a room is woken later, not skipped; a direct message goes before background work; optional parallel turns for a bot | decision record | 15, 12 | 3 | `bot-core`, `bot-engine` | open |
| `plans/2026-09-09-independent-threads.md` | Tasks became threads; folders; the thread list and "All threads"; parallel threads (default 3); a working folder for each thread; a claim on the browser or the computer for each turn; the `memory_update` tool; archive of idle threads (later) | built | 12 | 3 | `bot-core`, `bot-desktop` | open |
| `plans/2026-09-09-thread-aware-bots.md` | The tools `list_threads`, `start_thread` and `close_thread`; "opened by" on a thread; links to a thread with `#Title` | planned | 12, 13 | 3 | `bot-core`, `bot-desktop` | open |
| `plans/2026-09-25-memory-layer.md` | The memory layer: recall, the topic index, until-dates, upkeep, capture, "About me", tidy-up, organize | built | 16 | 3 | `bot-core` | open |
| `specs/aside-injection-seams.md` | The aside lane: context from a peer goes into a running turn; how each driver takes it | built | 2, 15 | 3 | `bot-core`, `bot-engine` | open |
| `requirements/` and `design/` for issue 1635 | The thread list in order of update; pinned threads; the 6 newest open threads by default | design | 12, 24 | 3 | `bot-core`, `bot-desktop` | open |
| `requirements/` and `design/` for issue 1641 | New coordinated work waits while an approval card of a peer is open | design | 15 | 3 | `bot-core`, `bot-engine` | open |
| `superpowers/plans/2026-11-01-mcp-in-chat.md` and its specification | The `mcp_server` tool: a bot lists, adds, changes, tests and removes MCP servers from the chat, with approval cards and a sign-in card | planned | 13, 20 | 3 | `bot-engine` | open |
| `superpowers/specs/2026-08-19-configurable-room-turn-timeout-design.md` | A setting for the turn timeout of a room | not stated | 15, 61 | 3 | `bot-core`, `bot-engine` | open |
| `superpowers/specs/2026-09-30-mcp-sign-in-and-plugin-catalog-design.md` | OAuth sign-in for MCP servers; a "Plugins" tab with a featured catalog; search of the MCP registry | waits for review | 20 | 3 | `bot-engine` | open |
| `superpowers/specs/2026-10-06-configurable-mcp-call-timeout-design.md` | A setting for the timeout of an MCP call | not stated | 20, 61 | 3 | `bot-engine` | open |
| `plans/2026-09-02-goal-mode-v2.md` | Goals: a stored goal record; a live goal card; the `/goal` command; a goal loop for one bot with detectors for "stuck" and "no progress"; a routine that starts a goal in a room | partly built | 63 | later | `bot-core` | open |
| `plans/2026-09-09-onboarding.md` | The welcome flow; a feature reel of six scenes; the guided tour; the first conversation tour; onboarding state in the config; replay from the settings | built | 25 | later | `bot-desktop` | open |
| `plans/2026-09-14-phase-0-foundation.md` | A work digest for each turn; engine hooks; typed turns with an output schema; a global launch budget; commands with receipts; metrics; replay by bytes and a manual compact route; a benchmark driver | partly built | 62, 17, 8 | later | `bot-core` | open |
| `plans/local-environments.md` | Named local environments | built | 29 | later | `bot-desktop` | open |
| `plans/opencode-go-integration.md` | One ACP engine | proposed | 7 | later | `bot-engine` | open |
| `requirements/` and `design/` for issue 1688 | A new model in a model list, with its context window | design | 9 | later | `bot-engine` | open |
| `superpowers/specs/2026-09-05-bot-folder-and-self-setup-design.md` | The sections of the bot settings; `SOUL.md`: the standing instructions of a bot, with apply and discard of file changes; set-up by conversation with `/setup`; `propose_profile` cards; history and undo; import of skills from GitHub; the overview; the prompt preview | in a pull request | 45 | later | `bot-desktop` | open |
| `superpowers/specs/2026-10-14-chat-apps-design.md` | Chat apps: a bot shows an HTML page in the chat (`show_html`, `update_html`) in a sandbox; MCP applications drawn in the chat; a switch for each MCP server | built on desktop | 48 | later | `bot-desktop` | open |
| `superpowers/specs/2026-11-12-app-settings-tool-design.md` | The `app_settings` tool with three tiers of settings; settings cards in the chat; window preferences; the engines setting; an inventory of 104 settings | built | 61 | later | `bot-core` | open |
| `plans/browser-engine.md` | One browser engine; a headless mode; "watch and take over"; browser profiles; signed-in sites with sign-out; My Chrome; process hygiene; one call at a time for a browser; page health; a record of browser steps with an evidence store | built | 31 | no | not planned | open |
| `plans/remote-workspace.md` | Remote access to a server: an environment identifier; one-time pairing and a session for each device; a ticket for the event stream; cookie sessions; scopes; a Tailscale helper; a managed tunnel | partly built | 6, 53 | no | not planned | open |
| `requirements/` and `design/` for issue 1706 | Tables and task lists in bot messages on iOS; speech of tables | design | 34 | no | not planned | open |
| `design/self-hosted-design.md` | Self-hosted modes: standalone, connected, air-gapped (later); the connector on the server of the customer, with a short list of jobs; an audit log with a hash chain; an owner policy file; pause of remote management; an update runner; an installer | mostly built | 36 | no | not planned | open |
| `superpowers/specs/2026-09-18-mobile-touch-control-design.md` | Touch control of the browser of a bot from a phone; a device flag for browser control | in progress | 34, 31 | no | not planned | open |
| `superpowers/specs/2026-09-25-live-call-bar-design.md` | Live calls with the chat visible: the call bar, captions, the call controller, spoken approvals, status notes, the settings, calls on phones | built | 35 | no | not planned | open |
| The other specifications in `superpowers/specs/` | The design of features that have a plan above: mascot bodies, the delegation mailbox, tool selection, local environments, X research, chat widgets, one engine, My Chrome, saved steps, the talk shortcut, waits | see the plan rows | see the plan rows | see the plan rows | see the plan rows | open |

## Documents about the Cloud, teams, self-hosting and phones

18 files in `docs/`, all read completely (8,915 lines). Most of these pages
describe current behaviour and give no state, so a row has a state only when
the page gives one.

| Document | Features | Part | Group | Ours | Research |
|---|---|---|---|---|---|
| `team-incidents.md` | Incidents: the server detects a problem, opens a "Problems to look at" thread, and the Chief reports; `retry_thread`; reassign; escalate to the person; a report queue; limits for a crash loop | 66 | later | `bot-core` | open |
| `cloud-pro.md` | The Cloud plans; the "Your Cloud" card; the welcome of a Cloud and its set-up checklist; engine sign-in tiles; the Cloud on a phone and in a browser; where bots work on a Cloud; automatic lending of this computer to your own Clouds, with a grant, a menu-bar item and enforcement on the computer; "Your Chrome"; who can use a lent computer; guest restrictions; the Cloud image, its launcher and its boot contract; secrets over a pipe; a memory gate; threads for each bot; limits of the smallest plan; turn order and stop words; explanations of a wait; idle engine time; an emergency engine stop; messages when memory runs out, with a restart; included services and included connected apps; a trial credit; signed pairing and a signed health read; sleeping Clouds; the free trial and cancellation; a notice queue; the usage meter; add a Cloud; the one-time move to a Cloud | 36 | no | not planned | open |
| `self-hosting.md` | The ways in to a server; the pairing block; "connect to a server"; install with Docker, as a service or with Podman; guided `start`, `setup` and `serve`; a domain with a web server child process; Tailscale; a private network filter; a tunnel; engine sign-in from a browser; a custom domain; container platforms; sizing tables for processes and memory; turns wait for room; a maximum of running turns; diagnostics of process room and of each bot; an idle engine shrinks; a memory watch for each bot; a cap on browsers; install of engines from the settings; provider keys; many workspaces and the fleet agent; pairing sessions for a browser; session scopes and lockout; the ticket for the event stream; the environment descriptor; an SSH tunnel; a browser never gets loopback trust; email sign-in with your own mail server; People; who can answer a card; bot visibility; the audience floor of a room; attachment storage; proxy requirements; the remote desktop viewer; phone pairing from a browser; the usage ledger and caps; take-over at a usage limit; a signed-out engine; the default engine; the decision log; the safety floor; the admin activity log; spend limits and sell prices (enterprise); external runtimes; a notice for repeated tool calls; the loop guard; stall timeouts of a turn; spacing of routine failures; a cap on incidents; limits of unattended turns and of hand-offs; pause all bots; the update check; `doctor` | 36, 51, 53, 65 | no | not planned | open |
| `deploy-vps.md` | The one-command installer with preflight checks; the install layout; version pinning; the sandbox set-up for bots; the first admin link; repair and uninstall; no telemetry; three ways in (tunnel, Docker, Tailscale); the bot browser; engines on the server; pairing and device management; the service; update channels; the "Update server" button and its runner; update scripts; a 90-day compatibility rule; backup and restore recipes; loopback and proxy rules | 36, 41 | no | not planned | open |
| `byo-vps.md` | Your own remote server as the computer of a bot: a live screen preview; cloud and automatic modes; automatic start, also for routines; take control; an SSH alias in the settings; a server for each bot; named servers; a wake script; a manual host key; the container lifecycle; a check before each turn; a queue for the desktop among threads | 54 | no | not planned | open |
| `team-cloud.md` | Team roles; invitations; a shared main chat and a private conversation; unread marks for each person; audience labels; the export of the owner leaves out private data; a bot order for each person; memory layers; "About you" and the profile; team rules and where they are enforced; team connections and personal connections; secrets in a private chat; a password manager for the team; a browser for each audience; phones on a team; Slack; sleep on team plans; browser sign-in; the first screen of a team; admin-only UI hidden from users; engine homes; team files; private and shared routines; share a private conversation; save to team memory; the owner of a bot; one Chief for each person; each bot reaches each bot; bring a bot from your own Cloud; bot access levels; a new bot is private; ask to chat; who owns a run; the queue; a team with no AI; one inbox for each person; `message_person` and tags of people; a representative answers for a person; presence; emails when away; a link to a team; known gaps | 51, 36 | no | not planned | open |
| `team-sharing.md` | Share a bot or a department as a template; import a template from a link or a folder; the template folder format; redaction rules; skill scripts go with the skill; publish to the community or to your own repository; a template library of a team; the `share` bot tool | 44 | no | not planned | open |
| `team-files.md` | The team files page: upload, folders, download, rename, delete, preview; phone access; bots see team files read-only; a bot setting "can edit team files"; a templates folder; a lock when full; a change log | 30, 51 | no | not planned | open |
| `team-slack.md` | Slack for a team and for a personal Cloud: a message is the request of that member; the audience; conversation titles; the routes; status reports; cards in Slack runs | 56 | no | not planned | open |
| `org-library.md`, `organization-branding.md` | The organization library tab; import with organization trust; install stamps; offered skills; a "Required" badge; automatic updates of a release; withdrawn releases; crash recovery of an add; organization presets; the logo and shared icons of an organization | 52 | no | not planned | open |
| `multi-device.md` | A home for each device: a Cloud, your own server or one of your computers; phone pairing for each home; an old computer lends after a move; a manual move with a backup | 36, 53 | no | not planned | open |
| `desktop-companion.md` | Two desktops over Tailscale: the "Your other computers" switch; pair a computer; connect as a client; unpair; keep this computer awake; client error messages; a phone code is for phones only | 53 | no | not planned | open |
| `ios-companion.md`, `ios-privacy.md`, `phone-web-app.md` | The phone application: pairing with a QR code; more than one saved computer; chat, approvals and questions; a resumable event stream; the live view of a cloud computer; remote control of a local VM; Markdown; spoken form; secure credential entry; create a basic bot; alerts; the companion process and its device registry; switches for each way in; route rejection by default; phone apps as bot tools; what the phone stores, and no tracking; the web application on the home screen | 34 | no | not planned | open |
| `phone-relay-server.md` | A relay for phones: `serve --relay`, `login --relay`, `pair --phone`, device revocation; the server answers through the relay; the QR format; WebSocket through the relay; a relay token; tunnel protection; a connection key; the model of a compromised relay; a list of permitted browser origins; rate limits | 34, 53 | no | not planned | open |
| `phone-push.md` | Push notifications when the phone application is closed (built, switched off): token registration, decision rules, an outbox, buttons, a payload with no content, live activity, no duplicates, revocation, rate limits | 34, 50 | no | not planned | open |

## Root documents, the docs web site and the other folders

89 files, all read completely: 8 root documents, 58 files of the docs web
site in `apps/docs/`, and 23 Markdown files in other folders.

| Document | Features | Part | Group | Ours | Research |
|---|---|---|---|---|---|
| `README.md` | Bots on the agent CLIs of the person, with a custom binary for each engine; one local server that owns all agents; a computer for each bot; the model picker with a provider rail; a model switch in the middle of a conversation; the Computer panel; approval and question cards; the permission broker; the connected apps marketplace; the context menu of a bot; write-only keys with hot reload; channels; automatic routing with the decision model; install of a team from a Markdown file; spoken replies and calls; streaming replies with tool rows; dictation; screenshots in the transcript; the driver interface; the event bus and the event stream; the HTTP API; the desktop shells; the MCP server for other tools; the headless CLI; triggers: schedules, app events and webhooks, with a triggers page and bot tools; a hosted webhook relay; custom engines by config; the open-source edition | 1 to 42 | **1** | `bot-core` | partial: [`features/driver-contract.md`](features/driver-contract.md), [`changelog.md`](changelog.md) |
| `CONTRIBUTING.md` | Development commands; a screenshot tool; the data format marker and the rule that a format change takes two releases; stores that repair themselves; the driver contract; rules for the control CLIs and for MCP tool schemas; how to add a language; no shell command built from a string; the write-only secrets API; CI gates; self-contained fakes | 4, 41, 40 | **1** | `bot-core` | open |
| `SECURITY.md`, `LICENSING.md` | How to report a vulnerability; loopback binding; the routes that a service can call; the credentials file; pointers to Vault values; the meaning of full access; the edition flag; enterprise entitlements; sign-in to a hosted workspace fails closed | 11 | **1** | `bot-core` | open |
| `server/host/README.md`, `server/routes/README.md` | The rules for the host modules and the route modules: how `server/index.ts` is split | 5 | **1** | `bot-cli`, `bot-desktop` | open |
| Docs site: `features/approvals-and-inspector.mdx` | Approval cards; a change that a bot makes to itself applies with Undo; owner approval on a Cloud; the inspector; a retry while streaming | 10, 48, 64 | 2 | `bot-protocol`, `bot-engine`, `bot-desktop` | open |
| Docs site: `security/` | Optional analytics; full access by default; credentials injected for one provider only; the record of an approval result, and old cards that close; a narrow "always allow"; the `request_credential` secure card; named secrets of a bot in the Vault; value masking; a website sign-in policy and one-time codes; the "Sign in needed" card; permission for remote browser control; saved logins; scrubbing | 10, 11, 31, 39 | 2 | `bot-protocol`, `bot-engine`, `bot-desktop` | open |
| Docs site: `connected-apps/` | Connect an app; the managed service and your own key; the X card and research tools; posting; apps that need your own OAuth; labelled accounts, with a cap of five; tool grants for each bot; disconnect revokes at the provider | 20, 49 | 3 | `bot-engine` | open |
| Docs site: `features/automation.mdx` | Routines; the calendar; run receipts; results in the chat of the bot; a run asks in the chat; run logs; hidden run threads; a bot manages its own routines; the model of a routine; webhook triggers, and a webhook address for a bot | 18 | 3 | `bot-core` | open |
| Docs site: `features/chat-and-teams.mdx` | Queue and steer; reactions; the token usage row; group timeouts; departments; who a bot reports to; a Chief for each person; the team map; the team inbox; "answering is replying"; an assistant answers simple facts; people in the sidebar; a message rate limit; direct delegation; a second opinion on a different model; edits that a second bot checks; the Chief makes specialists; rewind and branches; shared working folders | 23, 55, 15, 48, 64 | 3 | `bot-core`, `bot-desktop` | open |
| `cloudflare/composio-broker/README.md` | The broker for connected apps: an app-event queue, a grant for the Cloud, limits, wake of a sleeping Cloud, erase of an installation | 20, 36 | 3 | `bot-engine` | open |
| `DESIGN.md` | A layout of three places; the "New thread" button; pinned messages; the command palette; bot settings in the bot panel; Undo for changes; Simple mode and Advanced mode; the threads tree under a bot row; skins; pinned bot tiles; side panels; the floating chat header; mascot motion; localization and right-to-left text; reduced motion; keyboard and touch; a UI check suite | 26, 24 | later | `bot-desktop` | open |
| Docs site: `features/bots-and-tasks.mdx` | A new bot from saved defaults; review of a template draft; threads; three direct threads at a time; the model of a thread; folders; the approval level of a thread; reports of contention for a shared resource; groups; hold a bot; appoint or replace a Chief; delegation | 45, 12, 15 | later | `bot-desktop` | open |
| Docs site: `features/skills.mdx` | Skills for each bot; a skill index in each turn; the skills library; a bot writes its own skills; the `/learn` command; automatic learning; learned skills shared with the department; a scanner of skill text | 19 | later | `bot-core` | open |
| Docs site: `features/themes.mdx` | Themes that a bot makes; chat backgrounds; a history of looks; sanitizing of theme CSS; "your themes"; a safe reset | 26 | later | `bot-desktop` | open |
| Docs site: `getting-started/` | The "About me" profile; engine discovery and an explicit path; isolation of an engine from the settings of the person; reuse of an ACP session; the welcome and "Connect an AI"; the default helper bot; "New bot" and "Set me up"; a random name; an HTTP route that creates a bot; downloads; build from source; a move from another product, with an export prompt, an import preview and a report; organization sign-in; the quick tour; the desktop with a Cloud as its home | 25, 45, 44, 52, 36 | later | `bot-desktop` | open |
| Docs site: `providers/` | The built-in engines; an engine with more than one account; a custom ACP instance; the provider table; more than one chat API engine; reasoning levels; free models; custom endpoints; local model servers and their context window; troubleshooting | 7, 8, 9 | later | `bot-engine` | open |
| `skills/` | Seven built-in skills: write a verification skill; data dashboards and pages (`show_html`, `publish_page`); answers about the product from live settings; phone connection diagnosis; an Android phone over USB; publish a site; social post previews | 19, 37 | later | `bot-core` | open |
| Docs site: `computers/` | The kinds of computer of a bot (this computer, a local VM, a cloud computer, your own server); the choice for each bot, and "Auto"; a screen preview and an interactive viewer; copy files to and from a computer; a background command with a status tool; pooling of VMs; a workspace and a browser profile that stay | 54, 32 | no | not planned | open |
| Docs site: `features/attachments-and-search.mdx` | Picture attachments; voice notes; search in the sidebar; message actions | 30, 47, 23 | no | not planned | open |
| Docs site: `features/publish-to-netlify.mdx` | A bot publishes a site to the hosting account of the person, or as a shared page link; the token arrives through a secure card; a site record file; delete a site | 37 | no | not planned | open |
| Docs site: `features/voice-and-memory.mdx` | Spoken replies; voice providers, one of them local; voice notes; call mode; narrated progress; live calls; dictation; memory as plain text | 35, 16 | no | not planned | open |
| Docs site: `mobile/` | Control of an Android phone over USB by a bot; the phone application as a thin client | 34 | no | not planned | open |
| Docs site: `self-hosting/` | The connector for a server that the customer runs: seven jobs, four requests, an audit log; data folder locations; "make this my home"; the full backup; dated copies of the config; the installer; port surfaces; plain HTTP on private networks only; a true loopback check; a standby server and the server lease; update of a server from the application | 36, 44, 53, 4 | no | not planned | open |
| Docs site: `troubleshooting/` | The bug report to the developers; the logs folder and the log files; "Export diagnostics"; the loading screen; the update card and the update flows | 60, 29 | no | not planned | open |
| `companion/README.md`, `companion/src/e2e/README.md` | The companion process: pairing, a capability for each device, a route allow list, discovery on the local network, a credential relay with encryption, a loopback pairing page; the end-to-end encrypted phone connection: a QR descriptor with a pinned key, multiplexing, the relay protocol, fail-closed rules, test vectors | 34 | no | not planned | open |
| `cloudflare/control-plane/README.md` | The control plane: account sign-in, installations and credentials, the managed tunnel, capacity errors, the phone push relay, relay tokens | 36, 53 | no | not planned | open |
| `deploy/local/README.md`, `deploy/podman/README.md` | Local install with Docker Compose; install with rootless Podman | 36 | no | not planned | open |
| `shared/package-fixtures/legacy-botmrr.v1.md` | The first version of the team package format | 44 | no | not planned | open |
| `evals/README.md` and the judge prompts | Behaviour evals in three tiers; a tool-choice eval; an eval of the nightly memory tidy-up; a skill bench; turn routing; rubrics for a live judge | 40 | no | not planned | open |
| `scripts/testing/fixtures/voice-latency/README.md` | Streamed speech delivery, and a harness that measures voice latency | 35, 40 | no | not planned | open |

## Conflicts between documents

The agents found these, and a later session must check them in the code:

- One page says that push to a closed phone application is not available.
  Another page specifies a push relay. A third says that the code is built
  and switched off.
- One page lists four voice providers. Two other pages add a fifth.
- One page names a "Company Brain" feature. No document defines it.

## What this list does not cover

- The `enterprise/` directory. We do not read it. Three documents say that a
  feature needs it: spend limits, sell prices, and many installations on one
  server.
- A feature that has code and no document. Part 42 of
  [`README.md`](README.md) finds these.
- The 683 picture files in `docs/verification/`. They are evidence, not
  descriptions.
