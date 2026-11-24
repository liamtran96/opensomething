# Check of the feature list against the reference

This file records a check of [`reference-features.md`](reference-features.md)
(the list) against the Markdown files of the reference project. The aim: the
list misses no feature, and each row is correct. The corrections that this
check verified are now in the list.

- **Commit read:** `d6660e2d7` (2026-11-23 21:17 +0530), the latest
  `upstream/main`, from `scripts/reference.sh`.
- **Date:** 2026-11-23.
- **Method:** the method at the top of the list. Eight subagents read all
  Markdown files outside `enterprise/` and `node_modules/`, every line, one
  group each. A ninth subagent compared the source folders with the rows. The
  main session then checked the key findings in the reference files and in
  the code. Nobody opened `enterprise/`.

"Checked" in the tables below:

- **yes**: the main session read the reference at the given line. "yes,
  code" means that the main session also read the code.
- **no**: only a subagent read it. A later session must check it before it
  acts on it.

## 1. The files

The reference has 377 Markdown files (68,908 lines) outside `enterprise/` and
`node_modules/`. The sections of the list counted 361.

| Group | Files | Section of the list | Count in the list | Count now | Read completely |
|---|---|---|---|---|---|
| G1 | `docs/superpowers/plans/`, files 1 to 12 | Plans, files 1 to 12 | 12 (5,477 lines) | 12 (5,477 lines) | 12 |
| G2 | `docs/superpowers/plans/`, files 13 to 24 | Plans, files 13 to 24 | 12 (7,947 lines) | 12 (7,947 lines) | 12 |
| G3 | `docs/verification/`, files 1 to 69 | Verification records, files 1 to 69 | 69 | 69 (7,536 lines) | 69 |
| G4 | `docs/verification/`, files 70 to 137 | Verification records, files 70 to 137 | 68 | 68 (8,304 lines) | 68 |
| G5 | The feature pages at the top of `docs/` | Feature pages | 42 | 41 (8,844 lines) | 41 |
| G6 | The Cloud, team, self-hosting and phone pages | Cloud, teams, self-hosting, phones | 18 (8,915 lines) | 18 (8,979 lines) | 18 |
| G7 | `docs/plans`, `specs`, `requirements`, `design`, the other files of `docs/superpowers/` | Plans, specifications and design notes | 51 (10,864 lines) | 51 (10,864 lines) | 51 |
| G8 | Root documents, `apps/docs/`, the other folders | Root documents, docs site, other folders | 89 (8 + 58 + 23) | 106 (8 + 54 + 44) | 105, and 1 (see below) |

Notes on the counts:

- **G5:** the list said 42 files. There are 41. The row of `localization.md`
  covers two files, so the 40 rows cover 41 files. No row names a page that
  does not exist.
- **G4 and G3:** the boundary between the two sections is off by one file. The
  "files 70 to 137" section cites `live-calls.md` (a G3 file). The "files 1 to
  69" section cites `evidence/bot-attach-file/README.md` (a G4 file). The two
  counts are correct.
- **G8:** the list said 89 files. There are 106. No row named 31 of them (see
  section 6).
- **One file read in part:** the G8 subagent read lines 1 to 310 and 425 to
  436 of `third_party/cua-driver/THIRD_PARTY_NOTICES.md` line by line. A filter
  showed that each of lines 311 to 424 is a row of a crates.io licence table.
- **Not in the 377:** `apps/docs/app/llms.mdx` is on disk but git does not
  track it.

### Files added or changed after the list was made

The list was made on 2026-11-23. This check compared the main branch at
`3aec21005` (2026-11-23 03:00 +0530) with `d6660e2d7`. 13 files differ:

| File | Change | New feature |
|---|---|---|
| `packages/phone-protocol/src/open-bot-avatar/README.md` | new (30 lines) | the vendored Open Bot Avatar engine |
| `README.md` | +6 | credit and licence of Open Bot Avatar |
| `apps/docs/content/docs/computers/index.mdx` | +64 | a different computer for one chat, and the Settings → Devices map |
| `docs/approval-levels.md` | +8 | a note: Codex sandbox modes on Linux block `ssh` (a limit, not a feature) |
| `docs/bot-api.md` | +53 | bot to bot across servers |
| `docs/cloud-pro.md` | +64 | the storage report of a Cloud home |
| `docs/composio.md` | +2 | a bot can be kept to some connected-app accounts |
| `docs/memory.md` | +39 | a conversation's own notes |
| `docs/runtime-contract.md` | +1 | the remote teammate in the tool surface |
| `docs/verification/chat-ui.md` | +5, −26 | the Skill Burger card replaces the "This run" card |
| `docs/verification/computer-wait.md` | +25 | what a waiting turn's model is told |
| `docs/verification/memory-layer.md` | +2 | a conversation's own notes |
| `skills/openmausbot-docs/SKILL.md` | 1 changed | `bot-api.md` now covers a bot on another server |

## 2. MISSING: features that the documents describe and that have no row

"Group" and "Crate" are suggestions from [`docs/plan/README.md`](../plan/README.md)
and the crate layout in [`README.md`](../../README.md). "Part" is the part of
[`README.md`](README.md). Paths are relative to the reference root.

### 2.1 Checked, and added to the list

| Feature | Reference | State | Part | Group | Crate | Checked |
|---|---|---|---|---|---|---|
| The capability rule: never offer a control, tool or attachment that a driver cannot mount. A new integration gets a new capability flag, and the UI reads the flag | `docs/superpowers/plans/2026-08-31-00-control-plane-roadmap.md:38-41` | built | 2 | **1** | `bot-engine` | yes |
| Bot to bot across servers: an admin saves a "teammate on another server" (address and Bot API key). Local bots give it work with `coordinate_bots` | `docs/bot-api.md:138-189`, `docs/runtime-contract.md:123` | built | 15, 33 | later | `bot-core`, `bot-engine` | yes, code (`server/remote-teammates.ts`) |
| A conversation's own notes: facts of one matter go to `memory/threads/<id>.md`, and `scope: "everywhere"` saves to `MEMORY.md` | `docs/memory.md:42-78`, `docs/verification/memory-layer.md:15, 42` | built | 16 | 3 | `bot-core` | yes, code (`server/thread-notes.ts`) |
| A bot can be kept to some accounts of a connected app ("Accounts this bot may use") | `docs/composio.md:103` | built | 20 | 3 | `bot-engine` | yes |
| The Skill Burger card: after a run of two or more real steps, **Add skill** saves the run as a workflow skill, with Undo | `docs/verification/chat-ui.md:96-102` | built | 19, 48 | later | `bot-desktop`, `bot-core` | yes |
| The rules and limits of a wait: only a turn that the person started in their own one-to-one chat can make or cancel a wait. 10 waits for each bot, 50 in all, 24 hours by default, 168 at most. The `then` follow-up runs in the same chat | `docs/superpowers/plans/2026-10-27-waits.md:22-30, 554-571` | not stated | 18 | 3 | `bot-core` | yes |
| Provenance notes: each line that a bot reads, except the person's own line in their own chat, starts with `[From <who> · <what> · <authority>]` | `docs/team-cloud.md:42-55` | not stated | 15, 11 | 3 | `bot-core` | yes |
| Work from outside stays confined: a webhook or an app event marks the conversation for good, and its effects are fenced | `docs/team-cloud.md:237-245`, `docs/cloud-pro.md:247-264` | not stated | 18, 11 | 3 | `bot-core` | yes |
| The computer wait ceiling: a turn waits 30 minutes at most, then parks and continues when the computer is free. The model is told its place in line, never who holds the computer | `docs/verification/computer-wait.md:39-89` | built | 32, 54 | no | not planned | yes |
| Ask once before the first action of a bot on the person's own computer, at each approval level, unless the person picked that computer | `docs/superpowers/specs/2026-10-27-saved-steps-design.md:203-207` | built | 32, 10 | no | not planned | yes |
| A different computer for one chat: a chat overrides the **Works on** of its bot | `apps/docs/content/docs/computers/index.mdx:24-40` | built | 54 | no | not planned | yes |
| Settings → Devices: a map of each connected device, with how it connects and what it needs | `apps/docs/content/docs/computers/index.mdx:54-96` | built | 53 | no | not planned | yes |
| The vendored Open Bot Avatar engine (MIT, npm 0.3.0) | `packages/phone-protocol/src/open-bot-avatar/README.md:1-30` | built | 46 | later | `bot-desktop` | yes |
| The storage report of a Cloud home: what fills the volume, by category, in the health read | `docs/cloud-pro.md:1862-1924` | not stated | 36 | no | not planned | yes (diff) |
| Prompt-cache keep-warm: off by default. It holds a Claude process for 3 hours by default, one day at most | `docs/verification/context-compaction.md:302-312` | built | 17 | later | `bot-engine` | yes |
| The email send tool of a bot's own mailbox (`EMAIL_SEND_MESSAGE`): plain text required, four inline pictures at most, a copy filed in Sent | `server/email/README.md:1` | built | 37, 20 | no | not planned | yes, code (`server/email/`) |

### 2.2 Not checked by the main session

The subagents found these. They are not in the list yet. Most are details of
an existing row. A later session checks each one before it adds a row.

| Feature | Reference | State | Part | Group | Crate |
|---|---|---|---|---|---|
| The harness mounts its own MCP servers in each engine CLI (composio, computer, agents, phone, dweb, the `ogb` permission proxy). A stdio MCP bridge has a liveness watchdog and a policy gate | `docs/superpowers/plans/2026-08-31-03-mcp-registry.md:7, 28-33` | built | 13 | 3 | `bot-engine` |
| Approval by a person of a hand-off between bots (`approvePeerComms`) | `docs/superpowers/plans/2026-08-31-07-delegation-task-board.md:155`, `2026-09-12-delegation-mailbox.md:711-722` | built | 15 | 3 | `bot-core` |
| `wait_delegation`, and `ask_bot` falls back to a queued hand-off when the target is busy | `docs/superpowers/plans/2026-09-12-delegation-mailbox.md:5-14, 547-580` | not stated | 13, 15 | 3 | `bot-engine` |
| Engine bake-off: one prompt to N instances, with a comparison | `docs/superpowers/plans/2026-08-31-00-control-plane-roadmap.md:82-102` | deferred | 9 | later | `bot-engine` |
| The headless credential store (mode 0600, refuses a readable folder), `GET /api/machine` | `docs/superpowers/plans/2026-08-31-05-headless-harness.md:85-91, 109-112` | not stated | 11, 33 | no | not planned |
| Engines with no name in the list: Antigravity, OMP, Mistral Vibe, Groq, ModelGo, Greenference, Meta Muse, direct API endpoints for Codex | `docs/verification/engines.md:52-186`, `engines-ui.md` | built | 7, 9 | later | `bot-engine` |
| Automation report rules: `NOTHING NEW` leaves no message, `NEEDS INPUT:` becomes a question | `docs/verification/automation-reports.md:7-52` | built | 18 | 3 | `bot-core` |
| Chat-driven choice of the computer, and pool seats against `maxInstances` | `docs/verification/group-local-vm.md:73-113` | built | 54 | no | not planned |
| The "Update Claude for me" card for an old Claude CLI | `docs/verification/chat-ui.md:312-322` | built | 8 | later | `bot-desktop` |
| **Compact now** from 80 % of the window | `docs/verification/context-compaction.md:63-70` | built | 17 | 3 | `bot-core` |
| The inbox across places, with a dot for each Cloud | `docs/verification/inbox.md:20-49` | built | 48 | later | `bot-desktop` |
| Background work of the xAI engine: `auto_wake` turns, and the session closes at Stop | `docs/verification/grok-steering.md:88-125` | built | 8, 9 | later | `bot-engine` |
| Retry when the provider refuses a tool call: 3 attempts at most, never after answer text streamed | `docs/verification/openai-tools.md:179-197` | built | 9 | **1** | `bot-engine` |
| The built-in helper bot: a switch to show it in the sidebar, and a welcome popup | `docs/verification/mausbot.md:3-70` | built | 45 | later | `bot-desktop` |
| Work handed into a room for a bot that is not a member goes to that bot directly | `docs/verification/room-coordination.md:314-353` | built | 15 | 3 | `bot-core` |
| How `coordinate_bots` resolves a name and removes duplicates (`rework=true`) | `docs/verification/room-coordination.md:153-157, 395-402` | built | 13, 15 | 3 | `bot-engine` |
| Edit of automation instructions through `trigger_info`, and 409 when they hold redacted secrets | `docs/verification/routines.md:18-52` | built | 18 | 3 | `bot-core` |
| The "Show threads" switch, and the empty "New thread" after the last delete | `docs/verification/threads.md:36-88` | built | 12 | 3 | `bot-desktop` |
| First-run variants for a hosted workspace | `docs/verification/onboarding.md:76-109` | built | 25 | no | not planned |
| Organization licence renewal and lapse | `docs/verification/organization-settings.md:67-160` | built | 52 | no | not planned |
| A Windows Defender check of the installer in CI | `docs/verification/local-computer-launch.md:81-106` | built | 41 | no | not planned |
| The Agentcard card | `docs/verification/whop.md:35-37` | built | 20 | no | not planned |
| Each usage row is booked to the person whose message started the turn | `docs/verification/usage-ledger.md:9-145` | built | 21 | later | `bot-core` |
| A chain of waits, and only the person can set a wait | `docs/verification/waits.md:15-75` | built | 18 | 3 | `bot-core` |
| Delete of a bot first removes its own Boat, VPS and Local VM | `docs/verification/team-setup.md:57-99` | built | 54 | no | not planned |
| The boot fallback of local environments, and the "missing" badge | `docs/verification/local-environments.md:72-115` | built | 29 | later | `bot-desktop` |
| An outside "approved" never counts as an approval. There is no signed approval token | `docs/approval-levels.md:173-210` | built | 10 | 2 | `bot-engine` |
| Codex asks without a wait (`request_user_input_async`) | `docs/approval-levels.md:352-356` | built | 8, 10 | later | `bot-engine` |
| Read-only hints on the agents MCP tools. A third-party `readOnlyHint` is never authorization | `docs/approval-levels.md:397-409` | built | 10, 13 | 3 | `bot-engine` |
| Browser use in three tiers (a decision of 2026-08-12) | `docs/computer-use-integration.md:23-25, 173-208` | decision | 31 | no | not planned |
| The notice queue and its built-in notices | `docs/analytics.md:153-175`, `docs/announcements.md:152-174` | built | 39 | no | not planned |
| What the job runtime still does not own | `docs/runtime-contract.md:135-144` | partly built | 14 | 3 | `bot-core` |
| Personal Cloud ownership: "adopted" and "proven" keys | `docs/cloud-pro.md:171-306` | not stated | 36 | no | not planned |
| The memory review lock before the lent Mac | `docs/cloud-pro.md:983-1052` | not stated | 16, 36 | no | not planned |
| Routines wait while the owner has left | `docs/cloud-pro.md:2042-2075` | not stated | 18, 36 | no | not planned |
| Team admin: health of each connection, the Vault report | `docs/team-cloud.md:247-307` | not stated | 51 | no | not planned |
| The roster check of a team session, and the clean-up when a member leaves | `docs/team-cloud.md:162-176, 383-428` | not stated | 51 | no | not planned |
| The phone Share extension | `docs/ios-privacy.md:63-83` | not stated | 34 | no | not planned |
| The earlier desktop companion connection is retired | `docs/desktop-companion.md:72-79` | removed | 53 | no | not planned |
| Goal mode, later batch: an independent verifier, a plan contract, a token budget | `docs/plans/2026-09-02-goal-mode-v2.md:160-182` | planned | 63 | 3 | `bot-core` |
| Harness upgrades left out of the row: generation fencing, and "emit inside the store" | `docs/plans/agent-harness-upgrades.md:398-432` | planned, deferred | 2, 14 | 2 | `bot-core` |
| Self-hosted entitlements and the seat count | `docs/design/self-hosted-design.md:75-80, 143-145` | planned, seat count built | 36 | no | not planned |
| A version-skew banner, and a reconnection ladder of 3, 4, 8 and 16 s | `docs/plans/remote-workspace.md:81-88` | planned | 6, 53 | later | `bot-desktop` |
| An engine that cannot enforce a tool selection refuses the turn | `docs/superpowers/specs/2026-09-30-per-bot-tool-scoping-design.md:20-26` | design | 10 | later | `bot-engine` |
| X research with the person's own token, then removed | `docs/superpowers/specs/2026-10-09-x-research-pro-relay-design.md:24-26` | removed | 49 | no | not planned |
| The bot capability for one turn, and the desktop token for each launch | `.oss-scanner/threat_model.md:57-74`, `SECURITY.md:16-20` | built | 6, 11 | 2 | `bot-core` |
| CLI login approved in the window | `SECURITY.md:28-34` | built | 33 | no | not planned |
| File checkpoints for a rewind | `skills/openmausbot-docs/SKILL.md:41` | built | 17, 64 | later | `bot-core` |
| Built-in skills mounted by keyword for one turn | `skills/openmausbot-docs/SKILL.md:82-85` | built | 19 | later | `bot-core` |
| A models.dev catalog snapshot, with refresh | `third_party/models-dev/README.md:3-16` | built | 7, 9 | 2 | `bot-engine` |
| Import of sign-ins from installed browsers | `third_party/opencode/README.md:9-13` | built | 31 | no | not planned |
| The live screen of a USB Android phone through scrcpy | `third_party/scrcpy/README.md:3-28` | built | 34 | no | not planned |
| Pinned bundled binaries, each checked by digest | `third_party/browser/README.md:5-62` | built | 41 | no | not planned |
| Group replies: the final message is the reply, and the notes fold into **Worked for…** | `apps/docs/content/docs/features/bots-and-tasks.mdx:54` | built | 15 | 3 | `bot-core` |
| Routine details: remember the last run, a retry after a usage limit | `apps/docs/content/docs/features/automation.mdx:21-49` | built | 18 | 3 | `bot-core` |
| Cloud computers sleep after 10 minutes | `apps/docs/content/docs/computers/cloud-and-vps.mdx:13` | built | 54 | no | not planned |
| Passkeys in a bot's browser | `apps/docs/content/docs/troubleshooting/google-sign-in-cloud-browser.mdx:17-44` | built | 31 | no | not planned |
| ARM64 builds | `apps/docs/content/docs/self-hosting/deploy-vps.mdx:197-208` | built | 36 | no | not planned |

The subagent reports have about 90 more small details (for example the limits
of one feature). They are not in this file. A later session finds them again
when it researches that part.

## 3. WRONG: rows that are not correct

| Row (first cell) | What is wrong | Reference | Checked | Changed in the list |
|---|---|---|---|---|
| Connector grants by verb class | The state is "removed". The design was replaced before it shipped | `docs/superpowers/plans/2026-08-31-04-connector-scopes.md:3-6` | yes | yes: "superseded, not built" |
| `serve` | The state is "not stated". `serve` exists (`serve --tunnel`, `server/tunnel.ts`). The supervisor has no state | `docs/superpowers/plans/2026-08-31-05-headless-harness.md:17` | yes, code | yes |
| The "Living" avatar | The state is "not stated". It was built, rejected and removed on 2026-09-01 | `docs/superpowers/specs/2026-08-31-mascot-shape-catalog-design.md:13-22` | yes | yes: "removed" |
| The 25 face expressions | The state is "not stated". They are in `src/components/CursorAvatar.tsx`, and the plan only moves them | `docs/superpowers/plans/2026-08-31-04-mascot-shape-catalog.md:72-74` | yes | yes: "built" |
| The safety floor | "Always denied" is wrong. It is off by default, does nothing on Windows, and stops only an automatic approval | `docs/verification/safety-floor.md:3-10`, `server/safety-floor-gate.ts:14-16` | yes, code | yes |
| Parking | Parking is an opt-in for each bot. Steering is the default | `docs/verification/room-coordination.md:186-198` | yes | yes |
| Question cards | The Inbox copy is only on a Team Cloud | `docs/verification/question-cards.md:58` | yes | yes |
| The "Active threads" menu | The Inbox row replaced the menu | `docs/verification/sidebar-attention.md:3` | yes | yes |
| Team backups | The team backup export is legacy. The sidebar no longer offers it, and import still works | `docs/verification/team-backups.md:5-8` | yes | yes |
| `linux-desktop.md` | "Wayland is not available" is wrong. The window, chat and screen preview work on GNOME Wayland. Only local control is off there | `docs/linux-desktop.md:9-14` | yes | yes |
| `chat-ui.md` | The "This run" card was removed. The Skill Burger card replaces it | `docs/verification/chat-ui.md:96-102` | yes | yes |
| `plans/agent-harness-upgrades.md` | The row says 17 upgrades and names 15 | `docs/plans/agent-harness-upgrades.md:9, 398-432` | yes | yes |
| `plans/2026-09-09-independent-threads.md` | "Default 3" is wrong. The default is one thread for each 2 GB of memory, from 3 to 16 | `server/bot-thread-limits.ts:5-17`, `docs/verification/chat-turns.md:327-330` | yes, code | yes |
| `plans/2026-09-09-thread-aware-bots.md` | The state is "planned". `start_thread` is in the code | `server/drivers/agents-call.ts:437`, `docs/verification/claude-tool-lifecycle.md:111-125` | yes, code | yes: "planned; `start_thread` is built" |
| `org-library.md` | There is no "Required" badge. Required is treated as Available, with a "Recommended by …" badge | `docs/org-library.md:53-55` | yes | yes |
| `phone-push.md` | "Built, switched off" is too wide. The part for a Cloud home is not built | `docs/phone-push.md:198-201` | yes | yes |
| `README.md` | "A hosted webhook relay" is wrong. Webhooks use the local receiver | `README.md:466-468` | yes | yes |
| Docs site: `self-hosting/` | The connector for a customer server is not on sale. The standby server is a recipe, not a feature | `apps/docs/content/docs/self-hosting/connected-servers.mdx:7-9`, `redundancy.mdx:9` | yes | yes |
| Stop ends the request | Correct in the code. The document contradicts itself (see section 7) | `server/runtime/runtime.ts:665-680` | yes, code | no |
| Ten mascot body shapes | The state is "not stated". They are built: `shared/mascot-bodies.ts` exists | `docs/superpowers/plans/2026-08-31-04-mascot-shape-catalog.md:3-8` | yes, code | yes: "built" |
| A fake ACP CLI | The state is "not stated". It is built: `server/testing/fake-acp-cli.ts` exists | `docs/superpowers/plans/2026-08-15-opencode-go-integration.md:24, 74` | yes, code | yes: "built" |
| Notifications and the unread badge (waits plan) | The plan adds only a `wait` notification and an unread mark | `docs/superpowers/plans/2026-10-27-waits.md:474-476, 540-548` | no | no |
| The "Access" section | The section existed. The plan adds a tool-selection editor to it | `docs/superpowers/plans/2026-09-30-per-bot-tool-scoping.md:138-149` | no | no |
| Lending | Only the internet connection and Chrome go over the device link | `docs/superpowers/plans/2026-10-26-cloud-my-chrome.md:43-44, 111-114` | no | no |
| The gesture core | No gesture makes keyboard input in this plan | `docs/superpowers/plans/2026-09-18-gesture-core.md:1490-1495` | no | no |
| The three fix plans of 2026-08-18 | "Planned" is too narrow: one fix is merged or pending, and one guard is in PR #230 | `docs/plans/2026-08-18-001-fix-permission-broker-ask-id-collision-plan.md:105` | no | no |
| The other specifications | "One engine": there are two engine specifications | `docs/superpowers/specs/2026-08-15-opencode-go-integration-design.md:1-5` | no | no |
| Issue 1635, room turn timeout, MCP call timeout, MCP sign-in, MCP in chat | A later document gives a newer state (built, or partly built) | `docs/superpowers/specs/2026-11-12-app-settings-tool-design.md:63, 100, 210-212` | no | no |
| `hosted-workspaces.md` | The hosted sign-in adapter is in the licensed `enterprise/` layer | `docs/verification/hosted-workspaces.md:3-7` | no | no |
| `bot-settings.md` | The cited record does not name Access, Model, Permissions and Voice | `docs/verification/bot-settings.md:17-59` | no | no |
| Limits of the runtime | Incomplete: 48 executions and 48 wakes for each root, 4 hours with no progress | `docs/verification/room-coordination.md:465-470` | no | no |
| Saved steps | The record says that the hand check before the merge was pending. The code is on main (`server/saved-steps/`), so the row "built" is correct | `docs/verification/saved-steps.md:176-194` | yes, code | no change needed |
| `computer-use-integration.md`, `voice-mode.md` | These are decision documents (2026-08-12, 2026-08-14), not descriptions of the product now | `docs/computer-use-integration.md:3`, `docs/voice-mode.md:3-5` | no | no |
| `desktop-chat-links.md` | "Copy link" copies a thread link, not a bot link | `docs/desktop-chat-links.md:3-30` | no | no |
| `notification-and-proactivity-qa.md` | iOS shows notifications only while the app runs | `docs/notification-and-proactivity-qa.md:31-35` | no | no |
| Docs site: `computers/` | "Pooling of VMs" is not built (issue #508) | `apps/docs/content/docs/computers/local-vm.mdx:43` | no | no |

### Group marks for the author

The author decided these marks on 2026-11-24, and the list has them: the floating box is "no", like the talk shortcut; the notifications of the waits plan are group 3; the capability rule is group 1; bot to bot across servers, prompt-cache keep-warm and the Open Bot Avatar engine are "later". The notes below give the reasons.

- **The talk shortcut and its floating box.** The floating box is "later" and
  the talk shortcut is "no". The box exists only for the talk shortcut
  (`docs/superpowers/plans/2026-10-27-talk-shortcut.md:5, 19-20`). Give both
  rows the same group.
- **Notifications and the unread badge** (waits plan). The row is "later",
  but its content is part of waits, which is group 3.
- **The capability rule** (added). It is group 1, because step 3 of the plan
  has the capability flags.

The added rows follow the rule of the list: the group comes from the first
part number. For four rows, the check put the main part first: provenance
(15, 11), work from outside (18, 11), ask once before the first action
(32, 10) and the email tool (37, 20). Three added rows do not follow the
rule. The author decides:

- **Bot to bot across servers** (part 15): "later", not 3. Step 14 needs
  bots on one server only.
- **Prompt-cache keep-warm** (part 17): "later", not 2. It saves cost and
  no step needs it.
- **The Open Bot Avatar engine** (part 46): "later", not 1. This is the
  same as the mascot rows, which the main session marked by hand.

## 4. UNSUPPORTED: rows that no document supports

| Row | Why | Checked |
|---|---|---|
| `chat-ui.md`: "the 'This run' card" | No document describes it now. "Save as skill" stays only as stale text at `chat-ui.md:54, 329` | yes |
| `README.md`: "a hosted webhook relay" | `README.md:466-468` says that it is not there | yes |
| Docs site `self-hosting/`: "a standby server" | Only a recipe that the person runs (`redundancy.mdx:9`) | yes |
| `feature-flags.md`: "the loop guard" | The page says only that `loopGuard` is a config object (`docs/feature-flags.md:114`) | no |
| Docs site `computers/`: "pooling of VMs" | Only an analytics value supports it | no |
| The Chief of Staff role (mailbox plan) | The plan names the role but does not describe it | no |

## 5. Code only: product areas with code and no row

These go to part 42 of [`README.md`](README.md). The subagent mapped the
`server/` files by prefix and opened about 45 of them. It only sampled
`server/host/`, `server/routes/`, `src/lib/`, `src/state/` and `shared/`. So
this list is a lower bound.

"Checked: yes" means that the main session saw that the files exist. The
descriptions come from the subagent.

### 5.1 Code only, no document

| Area | Main files | What it does | Part | Group | Checked |
|---|---|---|---|---|---|
| Burst | `server/burst/` (744 lines), `src/components/BurstCard.tsx` | `/burst` and a `burst` tool split one request into items, run each as a thread in parallel, and merge the results | 12, 15 | later | yes |
| The link between places | `server/bot-link/` (1,205 lines), `electron/places-together.mjs` | The bots of the person's computer and of their own Cloud work as one team | 15, 36 | no | yes |
| Room voice calls | `src/components/GroupCallView.tsx` (577 lines) | A call with each bot of a room. Documents say that rooms do not speak (`docs/voice-mode.md:107`) | 35 | no | yes |
| Calendar calls | `server/calendar-calls.ts` (393 lines) | A scheduled meeting of 2 to 100 bots. The server opens a room and posts `@everyone` | 18 | no | yes |
| `what_changed` | `server/routes/what-changed.ts`, `shared/text-changes.ts` | A paragraph diff of an edited document against the person's original | 13 | no | yes |
| Pinned web panels | `src/components/WebPanelPage.tsx`, `server/web-panel-framing.ts` | Pin a web page to the sidebar, in a sandboxed frame | 24 | no | no |
| First-reply rescue | `server/first-reply-rescue.ts` | After 20 s with no reply, a notice offers "Switch AI" | 9 | later | no |
| App suggestions | `server/host/app-suggestions.ts`, `server/host/helper-suggestion.ts` | Suggest which app to connect next, and a free helper-model key | 20 | no | no |
| Chat conveniences | `src/components/ChatFindBar.tsx`, `ExportTranscriptMenu.tsx`, `CitationUI.tsx`, `BubbleEditor.tsx` | Find in chat, export a transcript, cite a selection, edit a sent message | 23 | later | no |
| XMind uploads | `server/xmind.ts` | A mind map becomes an outline for the bot | 30 | no | no |
| Image generation through a hosted MCP server | `server/higgsfield-mcp.ts` | One more provider for `generate_image` | 59 | no | no |
| Test before trust | `server/tested-ai.ts` | A tiny test message to each AI before it becomes the default | 9, 25 | later | no |
| Generated thread titles | `server/thread-title-generate.ts` | A title from a one-shot engine call | 12 | 3 | no |
| Crash guard | `server/crash-guard.ts` | An unhandled rejection stops only its turn. An uncaught exception exits with code 70 | 5 | 2 | no |

### 5.2 Documented, and the list has no row

Section 2.1 has rows for three of them: bot to bot across servers, a
conversation's own notes, and prompt-cache keep-warm. The email send tool row
covers the fourth. The other two:

| Area | Main files | Reference | Checked |
|---|---|---|---|
| The value ledger: what the Chief did for the person | `server/host/value-ledger.ts` | `docs/proactive-routines.md:152` | no |
| Workspace checkpoints for each turn (a shadow git repository) | `server/checkpoints.ts` (923 lines) | `docs/plans/2026-09-14-phase-0-foundation.md:83, 133` | no |

## 6. Files that no row covered

The list does not name these files. Its section "Root documents, the docs
web site and the other folders" points to this section. Only
`open-bot-avatar/README.md` and `server/email/README.md` now have a row, in
"Rows added by the check of 2026-11-23". The first five groups below are G8
files. The last is a G7 file.

- **Root:** `AGENTS.md`, `CLA.md`, `CODE_OF_CONDUCT.md`. They have no product
  feature.
- **Hidden folders:** `.claude/skills/verify-omb/SKILL.md`,
  `.claude/skills/windows-release/SKILL.md`,
  `.github/pull_request_template.md`, `.oss-scanner/threat_model.md`.
- **Docs site:** `apps/docs/AGENTS.md`, `apps/docs/CLAUDE.md`,
  `apps/docs/README.md`, `content/docs/index.mdx`, `features/index.mdx`,
  `changelog/index.mdx`, `contributing/index.mdx`,
  `contributing/documentation.mdx`.
- **Other folders:** `build/dmg/README.md`, `server/email/README.md`,
  `packages/phone-protocol/src/open-bot-avatar/README.md`, three files in
  `src/` (`assets/bubblav`, `assets/whop`, `data/given-names`), and the 13
  files of `third_party/`.
- **G7:** `docs/superpowers/specs/2026-08-15-opencode-go-integration-design.md`
  has no row of its own. The plan row of OpenCode Go covers its content.

## 7. Conflicts between documents, checked in the code

The list named three conflicts. The subagents found four more. The main
session checked each one in the code.

| Conflict | What the documents say | What the code does | Result |
|---|---|---|---|
| Push to a closed phone app | Not available (`apps/docs/content/docs/mobile/ios-companion.mdx:43`, `docs/ios-companion.md:54-59`). Needs a hosted relay (`docs/ios-companion.md:468-471`). Built and switched off (`docs/phone-push.md:12-13`). The privacy page describes it as live (`docs/ios-privacy.md:53-62`) | `server/phone-push.ts:4`: off unless `features.phonePush` or `OMB_PHONE_PUSH=1`. The control plane has the APNs and FCM routes (`cloudflare/control-plane/README.md:191-336`) | Settled. The code is built and off by default, so a person does not get push today. The part for a Cloud home is not built (`docs/phone-push.md:198-201`) |
| Four or five voice providers | Four: ElevenLabs, Fish Audio, Mac voices, Chatterbox (`apps/docs/content/docs/features/voice-and-memory.mdx:8-14`, `docs/voice-mode.md:3-5`). Five, with xAI (`README.md:232, 312`, `docs/analytics.md:106`) | `server/tts/index.ts:12`: eight speech providers: `elevenlabs`, `fish`, `system`, `chatterbox`, `xai`, `gemini`, `openai`, `deepseek` | Settled. Each document is out of date. Live calls have a separate set of providers (`docs/verification/live-calls.md:30-36`) |
| "Company Brain" | Named in a list, with no definition: `docs/self-hosting.md:307`, `docs/deploy-vps.md:114`, `apps/docs/content/docs/self-hosting/deploy-vps.mdx:100` | No code or other document uses the name (`git grep -i "company brain"` finds only these three files) | Settled: a name with no feature. The nearest item is a deferred "Brain panel" for shared memory (`docs/plans/agent-harness-upgrades.md:547-558`) |
| Streamed reply text (new, group 1) | "The renderer keeps no streamed text" (`docs/verification/chat-ui.md:194-201`). "The bot's words appear as they arrive" (`chat-ui.md:242-263`) | `src/state/live-reply.ts:87` keeps the `content.delta` text outside the reducer. `src/state/store.tsx:2026-2031` passes no delta to the reducer | Settled. The reply streams. Lines 194 to 201 are true for the reducer only, and are out of date for the window |
| Stop and a teammate in the middle of a turn (new) | Stop ends it (`docs/verification/room-coordination.md:200-207`). The teammate keeps its process and reports (`room-coordination.md:404-407, 459-462`) | `server/runtime/runtime.ts:665-680` (`stopRequester`) cancels each child that is not terminal, started or not. Commit `ba0039a09` (2026-11-05) made this change | Settled. Stop ends the teammate. Lines 404 to 407 and 459 to 462 are out of date |
| Widgets in a room (new) | Refused in rooms (`docs/verification/widget-prompts.md:3`). Shown view-only, and a press is refused (`docs/verification/room-pages.md:3-7`) | `server/agents-turn.ts:13`: "rooms refuse widgets, pages and a computer pick". The tool descriptions (`server/drivers/agents-app-tools.ts:5`) say "In rooms it is view-only". `server/drivers/agents-call-cards.ts` has no room check. A short search did not find the code that decides | Not settled. A later session follows the `show_widget` call to the server route |
| Live calls and a plan (new) | For everyone, with no plan (`docs/superpowers/specs/2026-09-25-live-call-bar-design.md:177`). Phone Live calls are a Pro feature (`docs/superpowers/specs/2026-10-14-chat-apps-design.md:751`) | `server/live-call-controller.ts:192-203` refuses the Azure, custom, Fish, Gemini and ElevenLabs providers by the role of the person. It has no plan check. The phone applications are not in this repository | Not settled here. The server has no plan check. A plan check in a phone application cannot be seen |
| Room voice calls (new) | "Rooms don't speak yet" (`docs/voice-mode.md:107`). "A room has no call" (`docs/cloud-pro.md:458`) | `src/components/GroupCallView.tsx` (577 lines) has a call with each bot of a room. `src/components/Composer.tsx:963` and `src/components/RoomHeader.tsx:258` show its button | Settled. The code has the feature. The two documents are out of date |

## 8. What is verified and what is not

Verified by the main session:

- The commit, the file list, the line counts and the 13 changed files.
- Each finding with "yes" in the tables above, at the given line of the
  reference.
- In the code: push, the voice providers, "Company Brain", the streamed reply,
  Stop, room voice calls, the safety floor default, the thread default,
  `start_thread`, `serve`, the fake ACP CLI, the mascot bodies, saved steps on
  main, and that the files of the code-only areas marked "yes" exist.

Not verified:

- Each finding with "no". A subagent read the file, but the main session did
  not read the line.
- The descriptions of the code-only areas. The main session saw only that the
  files exist.
- Areas of the code that the code-only subagent did not open (section 5).
  There can be more code-only features.
- Widgets in a room, and live calls with a plan.
- The baseline of the diff in section 1. The list recorded no commit. This
  check assumed `3aec21005`, the last main commit before the list was made.
  So a file can have changed before the list was made and still be in that
  table.
