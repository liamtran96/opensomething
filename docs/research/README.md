# Research: how the reference project works

The author wants to understand all of the reference project: its data, its
behaviour, its UI and its system design. We analyze it part by part, one part
in each session, before we write the code of that part. Each part gets one
file in this folder.

The reference project is the local clone in the folder next to this
repository: `../OpenMausBot`. Never open a file in its `enterprise/`
directory (`AGENTS.md`).

## The files in this folder

| File | What it holds |
|---|---|
| [`reference-features.md`](reference-features.md) | Each feature of the reference, with its group (1, 2, 3, later, no), the crate that gets the port, and the state of its research. Start here |
| [`progress.md`](progress.md) | The research work, batch by batch: what is done, what runs, what is next |
| [`changelog.md`](changelog.md) | The release history of the reference, the base parts that came late, and what that means for our structure |
| [`features/`](features/) | One file for each feature that is analyzed |
| [`turn-flow-comparison.md`](turn-flow-comparison.md) | The analysis of one turn that was made by part, before the work changed to features |

The unit of work is now one row of
[`reference-features.md`](reference-features.md), not one part. The table
of parts below stays as the map of the code of the reference: the column
"Part" of `reference-features.md` points to it.

## How to do one part

1. Choose a part from the tables below. The parts for the next steps of
   [`../plan/README.md`](../plan/README.md) come first.
2. Start a new session in this repository.
3. Paste the prompt below, with the number and the name of the part.
4. When the session ends, read the new file, then set the state of the part
   in the table.

## The prompt

```text
Analyze part <NUMBER> (<NAME>) of docs/research/README.md.
Use a workflow with subagents.

## Goal
Make a complete, verified record of how this part of the reference project
works: its data, its behaviour, its UI and its system design. The author
reads this record to understand the part fully, and we build our system from
it and make it better. Do not write source code in this task.

## Read these first
1. MEMORY.md and AGENTS.md in this repository. Obey them.
2. docs/research/README.md: the row of this part, and the files of the parts
   that are complete. Do not do their work again.
3. docs/decisions.md, docs/comparison.md and docs/plan/README.md: what we build and
   what is out of scope. A part that is out of scope is still analyzed in
   full, because the author wants to understand it.

## The reference project
It is the local clone in the folder next to this repository: ../OpenMausBot
- NEVER open a file in its enterprise/ directory.
- Ignore node_modules, dist and third_party.
- The "Where to start" column of the table gives starting points only. Find
  all the files of the part: the code that implements it, the code that calls
  it, its tests and its document in the docs/ folder of the reference.

## Rules
- Use one subagent for each group of related files. Tell each subagent to
  read each file completely.
- A very large file (for example server/index.ts) can be read in ranges.
  Record the ranges that were read.
- Each fact has a file and a line. Do not guess. Do not answer from general
  knowledge.
- Each subagent report ends with two lists: "Files read completely" (path
  and line count) and "Not verified".
- Check the key findings of each subagent against the code before you use
  them.
- If a search stops early, search again in a smaller path.

## Output
Write docs/research/<part-name>.md with these sections:
1. In short: what the part is and why it exists, in words that a person who
   did not read the code can understand. Explain each special term one time.
2. Files read completely
3. How it works: the flow from start to end, with the error paths, the
   limits and the edge cases. Use a numbered list for each flow.
4. The data: types, JSON, what is stored and where
5. The UI, when the part has one: components, text, and the empty, busy and
   error states
6. The tests: what behaviour they guarantee
7. Ours compared: what we have, what we plan, where we differ
8. Where we can be better, with a reason for each point (a wrong state that
   the compiler can refuse, less code, a known problem that we do not copy)
9. Not verified

Then update the row of the part in docs/research/README.md: the state, the
file, the number of files read and the open points.

Call the other project "the reference project" in all files. Put no personal
data and no secrets in a file.

## Last step
Give me a list of proposed changes to docs/plan/README.md and docs/decisions.md, in
order of importance. Do not change those two files. Do not commit or push.
I decide after I read the list.

## Before you start
Tell me the groups of files, the number of subagents and an estimate of the
cost. Then wait for my approval.
```

## The parts

There are 66 parts. On 2026-11-23, eight subagents read all the
documentation of the reference project: 408 Markdown files, every line. The
features that they found are in [`reference-features.md`](reference-features.md), each with the
number of its part. This table has a part for each of them.

- The numbers of files come from a count of the folders, without
  `node_modules` and `dist`.
- "Where to start" has starting points, not complete lists. A path comes
  from a document of the reference that names it. Nobody read the source
  code for this table.
- State: **done** (all sections written), **partial** (some files or
  aspects are not read), **open** (not started).

### A. The core: needed for parts 1 and 2 of our plan

| # | Part | Where to start | For our step | State |
|---|---|---|---|---|
| 1 | One chat turn, from send to stored reply; queue and steer | `server/index.ts` (`beginTurn`, the fold), `src/state/live-reply.ts`, `docs/specs/steer-vs-queue.md` | 2, 7 | partial: [`turn-flow-comparison.md`](turn-flow-comparison.md) |
| 2 | The driver contract, the registry, the event bus, the chat driver | `server/contracts.ts`, `server/harness/` (23 files), `server/drivers/openai-chat.ts`, `docs/custom-engines.md` | 3, 4, 5 | partial: [`features/driver-contract.md`](features/driver-contract.md) |
| 3 | The shared wire types | `shared/` (289 files), `packages/phone-protocol/` (100 files) | 2 | open |
| 4 | The store and the data folder: bots, threads, messages, the config, atomic writes, the data format marker, feature switches | `server/store.ts`, `server/config.ts`, `server/atomic.ts`, `server/message-db.ts`, `CONTRIBUTING.md`, `docs/feature-flags.md` | 6, 8 | partial: [`features/store-and-data-format.md`](features/store-and-data-format.md) |
| 5 | The composition root: start-up, shutdown, how the modules connect | `server/index.ts` (15,276 lines), `server/host/README.md`, `server/routes/README.md` | 7 | partial: [`features/composition-root.md`](features/composition-root.md) |
| 6 | The HTTP API, the event stream to clients, loopback trust | `server/routes/` (233 files), `server/sse-fanout.ts`, `server/request-auth.ts`, `server/harness/http.ts` | none (D10), 7 for the event stream | open |
| 7 | Engines that keep a session: the ACP core and its adapters | `server/drivers/acp/`, `server/testing/fake-acp-cli.ts`, `docs/cursor.md`, `docs/opencode-go.md` | 9 | partial: [`features/acp-core.md`](features/acp-core.md), [`features/acp-adapter.md`](features/acp-adapter.md) |
| 8 | The two largest CLI drivers, and engine hooks | `server/drivers/claude.ts`, `server/drivers/codex.ts`, `server/hooks/`, `server/kill-tree.test.ts`, `docs/specs/steer-sigterm-audit.md` | 9 | partial: [`features/engine-process-lifecycle.md`](features/engine-process-lifecycle.md) |
| 9 | The other chat drivers, the model lists, reasoning levels, the helper model, retry rules, local model servers | `server/drivers/` (427 files in total), `server/model-catalog/`, `server/model-manifest/`, `server/side-jobs.ts`, `server/drivers/retry.ts` | 5 | partial: [`features/turn-limits.md`](features/turn-limits.md) |
| 10 | Approvals: the levels, permission requests, tool selection, the command allow list, the safety floor, the decision log | `docs/approval-levels.md`, `docs/tool-selection.md`, `server/auto-approve.ts`, `shared/approval-mode.ts`, `shared/tool-scope.ts`, `server/mcp-gate.ts`, `server/safety-floor.ts`, `server/decision-log.ts` | 10 | partial: [`features/approval-levels.md`](features/approval-levels.md), [`features/approval-cards.md`](features/approval-cards.md) |
| 11 | Security: secrets, redaction, the Vault, password managers, logs, file permissions | `shared/redact.ts`, `server/vault/`, `SECURITY.md`, `docs/bitwarden.md` | 6, 9 | partial: [`features/security-model.md`](features/security-model.md) |
| 57 | The sandbox of a bot process on Linux | `server/bot-box/` (47 files), `docs/bot-box.md` | 9 | open |
| 62 | Work summaries of a turn: digests and receipts | `server/digest.ts`, `docs/plans/2026-09-14-phase-0-foundation.md` | 8 | open |
| 64 | Message branches: edit, rewind, the version switcher, Undo | `server/branching.test.ts`, `src/components/ChatView.tsx` | 8 | partial: [`features/harness-upgrades.md`](features/harness-upgrades.md) |

### B. A team of bots: needed for part 3 of our plan

| # | Part | Where to start | For our step | State |
|---|---|---|---|---|
| 12 | Threads: a bot with more than one conversation, folders, pins, parallel threads, snooze | `docs/plans/2026-09-09-independent-threads.md`, `server/store.ts`, `server/task-record.ts` | 11 | done: [`features/threads.md`](features/threads.md) |
| 13 | The tools that the server gives to an engine: the catalog, the proxy, the tool bridge, large results | `server/drivers/agents-*.ts`, `docs/agents-tool-bridge.md`, `server/tool-results.ts` | 12 | done: [`features/agent-tools.md`](features/agent-tools.md) |
| 14 | The assignment runtime | `server/runtime/` (25 files), `docs/runtime-contract.md` | 13 | done: [`features/assignment-runtime.md`](features/assignment-runtime.md) |
| 15 | Work between bots: rooms, hand-offs, the Chief, questions between bots, the aside lane | `server/host/` (376 files), `server/peer-roster.ts`, `docs/specs/aside-injection-seams.md` | 14 | done: [`features/bot-coordination.md`](features/bot-coordination.md) |
| 55 | Departments: groups of bots, shared instructions, who is in charge | `server/section-context.ts`, `src/lib/team-map.ts` | 14 | open |
| 63 | Goals: the goal record, the goal loop, the `/goal` command | `server/group-goal-run.ts`, `server/host/one-on-one-goals.ts`, `server/host/goal-turns.ts`, `docs/plans/2026-09-02-goal-mode-v2.md` | later | open |
| 66 | Incidents: the server detects a problem and the Chief reports | `docs/team-incidents.md` | later | open |
| 16 | Memory: the files, recall, upkeep, the tidy-up, the journal, proposals | `docs/memory.md`, `server/recall.ts`, `server/memory-upkeep.ts`, `server/memory-journal.ts` | 15 | done: [`features/memory.md`](features/memory.md) |
| 17 | Context: the transcript rebuild, compaction, summaries, the context budget, a model switch | `server/context-rebuild.ts`, `server/delta-context.ts`, `server/turn-context.ts`, `server/host/conversation-compaction.ts` | 8, 15 | partial: [`features/harness-upgrades.md`](features/harness-upgrades.md) |
| 18 | Automations: routines, schedules, webhooks, app events, check-backs, waits, the daily brief | `docs/routine-schedules.md`, `docs/proactive-routines.md`, `server/routines.ts`, `server/waits.ts`, `server/webhook-ingress.ts` | 15 | done: [`features/automations.md`](features/automations.md) |
| 19 | Skills: for each bot, learned skills, import, the built-in skills | `skills/` (19 files), `server/skills.ts`, `server/native-skills.ts`, `server/imported-skills.ts`, `server/skill-review.ts` | later | open |
| 20 | Outside tools: custom MCP servers, sign-in to them, connected apps, grants | `docs/custom-mcp-servers.md`, `docs/composio.md`, `server/mcp-registry.ts`, `server/mcp-oauth.ts`, `server/composio.ts` | 16 | partial: [`features/custom-mcp-servers.md`](features/custom-mcp-servers.md); connected apps open |
| 21 | Usage: the ledger, cost, caps, traces, backup models | `docs/usage-caps.md`, `server/usage-ledger.ts`, `server/usage-trace/`, `server/automatic-recovery.ts`, `server/engine-limits.ts` | later | open |

### C. The window

| # | Part | Where to start | For our step | State |
|---|---|---|---|---|
| 22 | The UI state: the store, live events, optimistic sends | `src/state/` (101 files) | 7 | partial: section 5 of [`turn-flow-comparison.md`](turn-flow-comparison.md) |
| 23 | The chat view: messages, Markdown, tables, mentions, reactions, the composer | `src/components/ChatView.tsx`, `src/components/Composer.tsx`, `src/components/ChatMarkdown.tsx` | 1, 7 | partial: the same section, [`features/chat-ui.md`](features/chat-ui.md) |
| 48 | Cards in the chat: approval, question, credential and proposal cards, widgets, HTML pages, the Inbox | `src/components/ApprovalCard.tsx`, `shared/widget.ts`, `server/chat-widgets.ts`, `server/chat-apps.ts`, `server/host/ask-cards.ts` | 10 | partial: [`features/question-cards.md`](features/question-cards.md), [`features/approval-cards.md`](features/approval-cards.md) |
| 24 | The sidebar, the places rail, the team map | `src/components/Sidebar*.tsx`, `src/components/TeamMapPage.tsx` | 1 | open |
| 45 | The bot: its settings, standing instructions, history with Undo, presets, defaults, pause, the default helper bot | `server/bot-profile.ts`, `server/bot-folder.ts`, `server/profile-versions.ts`, `server/presets.ts`, `server/default-bot.ts`, `src/components/bot-settings/` | 1 | open |
| 61 | The application settings: the inventory, and the tool that lets a bot change them | `src/components/settings/settings-index.ts`, `server/app-settings/` (13 files) | 6 | open |
| 25 | Onboarding and the set-up of an engine | `src/components/onboarding/`, `docs/cli-onboarding.md`, `server/provider-auth-sessions.ts` | 6, 7 | open |
| 26 | The design system: tokens, skins, themes, motion, the rules of `DESIGN.md` | `DESIGN.md`, `docs/design/`, `server/themes/`, `shared/theme.ts` | 1 | open |
| 46 | Avatars and the mascot: body shapes, expressions, generated pictures | `shared/mascot-bodies.ts`, `src/components/Avatar.tsx`, `docs/avatar-storage.md` | 1 | open |
| 47 | Search | `server/message-search-worker.ts`, `server/message-db.ts` | later | open |
| 50 | Notifications: the types, sounds, the unread badge | `server/notify.ts`, `shared/notification.ts`, `docs/notification-and-proactivity-qa.md` | later | open |
| 27 | The other UI code | `src/components/` (1,430 files), `src/lib/` (723 files), `src/hooks/` (27 files) | later | open |
| 28 | Languages and right-to-left text | `src/locales/` (34 files), `docs/localization.md` | later | open |
| 29 | The desktop shell: the window, local environments, links, packaging, updates, the tray | `electron/` (569 files), `build/`, `docs/releasing.md`, `docs/linux-desktop.md` | all of `bot-desktop` | open |

### D. Features that our plan does not have

The author wants to understand these too.

| # | Part | Where to start | State |
|---|---|---|---|
| 30 | Files, attachments, pictures, team files | `docs/files.md`, `docs/team-files.md`, `server/turn-images.ts` | open |
| 31 | The browser of a bot: the engine, profiles, the live panel, saved logins, the egress gate | `server/browser/` (165 files), `docs/plans/browser-engine.md`, `docs/browser-packaging.md` | open |
| 32 | Control of this computer by a bot, and saved steps | `docs/computer-use-integration.md`, `server/local-computer.ts`, `server/saved-steps/` (24 files), `electron/cua.mjs` | open |
| 54 | The other computers of a bot: a local VM, your own server, a cloud computer; take control; waiting for a shared computer | `server/container-computer.ts`, `server/vps-computer.ts`, `docs/byo-vps.md` | open |
| 33 | The headless CLI, the bot API, the MCP server for other tools, external runtimes | `server/headless/` (40 files), `docs/headless-cli.md`, `docs/bot-api.md`, `docs/mcp-server.md`, `scripts/mcp-server.ts` | open |
| 53 | Remote access: pairing, sessions, Tailscale, the tunnel, a custom domain | `docs/plans/remote-workspace.md`, `server/tunnel.ts`, `server/tailscale.ts`, `server/custom-domain.ts` | open |
| 34 | Phones: the companion process, the encrypted connection, the relay, push, touch control, an Android phone over USB | `companion/` (86 files), `relay/` (34), `server/phones/`, `server/phone-screen/`, `docs/ios-companion.md`, `docs/phone-relay-server.md` | open |
| 35 | Voice: speech, dictation, call mode, live calls, the talk shortcut, meeting notes | `server/tts/`, `server/live-call.ts`, `server/meetings/`, `electron/speech.mjs`, `docs/voice-mode.md` | open |
| 36 | The Cloud and self-hosting: plans, lending, the move to a Cloud, the installer, the connector, the control plane, many installations | `docs/cloud-pro.md`, `docs/self-hosting.md`, `docs/deploy-vps.md`, `connector/` (48 files), `cloudflare/` (75), `deploy/` (28) | open |
| 65 | Resource limits of a server: turns wait for room, memory watches, the engine stop | `server/engine-memory.ts`, `server/process-room.ts`, `server/admission.ts` | open |
| 51 | Shared workspaces: people, roles, bot visibility, access levels, who answers a card, activity logs | `docs/team-cloud.md`, `server/bot-visibility.ts`, `server/host/bot-access-gate.ts`, `server/host/access-requests.ts`, `server/admin-activity.ts` | open |
| 52 | Organizations: sign-in, policy, company models, the library | `docs/org-library.md`, `server/org-library.ts`, `server/managed-policy.ts`, `server/managed-desktop.ts` | open |
| 44 | Import, export and backup: templates, packages, the team backup, the full backup, import from other tools | `docs/team-sharing.md`, `server/package-export.ts`, `server/team-backup.ts`, `server/workspace-backup.ts`, `server/setup-import.ts` | open |
| 56 | Slack | `docs/team-slack.md`, `server/team-slack.ts` | open |
| 37 | Published pages and sites, included hosting, the data tools, email | `server/pages/`, `server/data/`, `server/email/`, `server/host/published-apps.ts` | open |
| 49 | X research and social posting | `server/x-research.ts`, `server/postiz/` | open |
| 58 | The decision model: a small model that routes and extracts | `server/decider/` (30 files), `server/extractor/`, `docs/decision-model.md` | open |
| 59 | Picture generation | `docs/image-generation.md` | open |
| 60 | Diagnostics: `doctor`, the scanner command, logs, the bug report | `server/doctor/` (27 files), `server/sentinel/` (21 files), `docs/sentinel.md` | open |
| 38 | The small server modules that no other part has | `server/burst/`, `server/engine-homes/`, `server/perf/` | open |
| 39 | Analytics and announcements | `docs/analytics.md`, `docs/announcements.md`, `server/announcements/` | open |

### E. How the reference project is built and tested

| # | Part | Where to start | State |
|---|---|---|---|
| 40 | Tests: fake drivers, fake clocks, golden files, evals, the verification method | `server/testing/` (117 files), `src/testing/`, `evals/` (81 files), `docs/verification/README.md` | open |
| 41 | CI, scripts, the build, releases and updates | `docs/ci.md`, `docs/releasing.md`, `scripts/` (362 files) | open |
| 43 | The history of the design: what was planned, what was built and what was removed | `docs/plans/` (16 files), `docs/superpowers/` (47 files), `docs/specs/`, `docs/design/` | partial: [`reference-features.md`](reference-features.md) has the state of each plan |
| 42 | The last check: each file that no other part read, and each feature that has code and no document | all folders, and the 741 files directly in `server/` | open |

## Order

1. Before each step of our plan, do the parts that the "For our step" column
   names for it.
2. Do part 42 last. It finds what the other parts did not cover.
3. A part that proves too large for one session is split: add rows to its
   table.

## What "partial" means for parts 1 and 2

- Part 1: the wrappers around `sendTurn` in `server/index.ts`, and room
  turns, are not read.
- Part 2: the six wrappers around each instance in `server/harness/registry.ts`
  are not read. `server/config.ts` is read in ranges only.
