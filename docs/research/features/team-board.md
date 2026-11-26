# The Team Board: board items on room threads, a dispatcher and three bot tools

This file is for the feature row "The Team Board" of
[`../reference-features.md`](../reference-features.md) (line 544, in "Rows
added on 2026-11-26"). The row cites `team-board.md` and
`verification/team-board.md`. Its "Part" column says 15 and 18. These are
part numbers of [`../README.md`](../README.md) (work between bots, and
automations), not plan steps. The board has no step of
[`../../plan/README.md`](../../plan/README.md) yet. Its neighbours are step
13 (the assignment runtime) and step 14 (several bots). A port goes to
`bot-core` (store, dispatcher) and `bot-engine` (the three tools).

- **Reference commit:** `140172d88` (2026-11-26, version 0.1.182). Each line
  number in this file is at that commit, unless a line says otherwise. The
  board came in two commits: `05384419c` (2026-11-24) and `07e6de9c6`
  (2026-11-25). Both are in the tags v0.1.181 and v0.1.182. Neither release
  note has a line about the board.
- **Method:** six readers read six groups of files completely or in recorded
  ranges. Two verifiers tried to refute the key claims against the code. The
  server verifier confirmed 43 of 46 claims. The tools and UI verifier
  confirmed 29 claims, found 2 partly wrong and 1 mixed. The lead read the key
  code again (section 2.7). Where a reader and a verifier disagreed, this
  file uses the code.
- **Scope:** the item, its store and its states, and the person routes. The
  bot tools and their routes, the dispatcher, the lease and the tries.
  `later`, questions to a person, the restart and the switch. The tool list,
  the UI, the tests and the history. Rooms, room turns, the runtime, unattended work and
  the tool bridge are in other files. This file cites them and says how the
  board uses each one.
- **Names:** "the reference project" is the other project. Paths are
  relative to its root. Quoted strings keep their text.

## 1. In short

The **Team Board** is a work layer over the rooms of a Team Cloud. A person
or a bot puts work on the board. The server then gives each piece of work to
a free bot of the room, and starts that bot's turn by itself. Nobody needs
to send a message. The board is off by default. It works only on a Team
Cloud, and only after an Owner or Admin turns it on.

The special terms of this file:

- **Team Cloud:** a server that is the home of a team of people
  (`CLOUD_TEAM`, `server/index.ts:688`). Our plan has no Team Cloud
  (decision D10).
- **Room:** a group chat of people and bots (`GroupRecord`). A **room
  thread** is one conversation of a room. See
  [`bot-coordination.md`](bot-coordination.md) section 1.
- **Board item:** one piece of work. Each item is one room thread, and its id
  is the thread id (`packages/phone-protocol/src/board.ts:38-63`). A thread
  has at most one item.
- **State:** one of `waiting`, `ready`, `working`, `needs_person`, `done`,
  `failed`, `cancelled` (`board.ts:6`). The first four are **open**. The last
  three are **settled** (`board.ts:8-9`).
- **Needs:** the items that must be `done` before this item can start. Up to
  10 items of the same room, with no loop (`server/board/state.ts:89-101`).
- **Labels:** up to 12 tags, key and value (`state.ts:50-64`). The dispatcher
  does not read them.
- **`forBotId`:** only this bot of the room may take the item.
- **Holder:** the bot that took the item, and the time when it took it
  (`board.ts:11-15`). An item has a holder while it is `working` or
  `needs_person`.
- **Dispatcher:** the server part that gives each `ready` item to a free bot
  (`server/board/dispatcher.ts`).
- **Brief:** the text that opens the bot's turn on an item. The server writes
  it in the thread from a template (`server/board/wiring.ts:67-76`).
- **Lease:** the claim of a bot on an item. In the reference project, "the
  'lease' is the turn itself" (`dispatcher.ts:4`). The item stays the bot's
  while its thread has a turn. There is no expiry time.
- **Try:** one time that a bot took the item. `attempts` counts them
  (`state.ts:144`). The third turn that ends without a result fails the item.
- **Later:** the bot sets the item aside for 1 to 1,440 minutes with a note.
  The same bot gets the item again at that time. An item can be set aside at
  most 20 times (`board.ts:65-84`).
- **Unattended work:** a turn that no person started. The board starts its
  turns with `trigger: { kind: "bot" }` (`server/index.ts:11371`).

The main facts:

1. The board is one JSON file, `board.json`, for all rooms. The server reads
   it one time and keeps it in memory. Each change writes the whole file
   again (`server/board/host.ts:62-70`).
2. A file that the server cannot read gives an empty board. The next change
   then writes over the old file. A test asserts this
   (`server/board/store.ts:37-49`, `server/board/host.test.ts:178-185`).
3. A pass of the dispatcher runs on each board change, each bot change and
   each runtime node change. While work waits, it runs again each 15 s
   (`dispatcher.ts:20`, `:63`, `wiring.ts:104`, `server/index.ts:3873-3874`).
4. A bot is free when it is idle everywhere and holds no other item that it
   works on (`server/index.ts:11371`, `dispatcher.ts:140`). The oldest
   `ready` item goes to the first free bot in room order.
5. The server starts the turn as a room turn in the item's thread, with
   `@Bot` and a brief (`server/index.ts:11371`, `:10576-10822`). The brief
   includes text that a model wrote.
6. The dispatcher gets no result from the turn. Only the bot's own
   `board_update` settles the item. When the thread is idle 20 s or more after
   the take, the item goes back to `ready`. At the third try it is `failed`
   (`dispatcher.ts:80-83`, `:106-112`).
7. Nothing starts in the first 2 minutes after the board is built. Then a
   `working` item on an idle thread is taken again, and the try counts
   (`dispatcher.ts:12`, `:52`, `:159`).
8. A spend or usage cap on one bot stops the dispatch of every room
   (`dispatcher.ts:85-92`, `:141`).
9. There is no board page. A person sees an item only as its room thread,
   as "waiting on you", or as an inbox entry (`docs/team-board.md:11-13`).
10. The three tools add 2,055 bytes to each turn of an engine that lists all
    tools. They are core tools: a person cannot turn them off for one bot
    (`server/drivers/agents-tool-groups.ts:35`).

What this file adds to earlier research:

- The Team Board was not in any research file. The batch 6 files
  ([`assignment-runtime.md`](assignment-runtime.md),
  [`bot-coordination.md`](bot-coordination.md), [`threads.md`](threads.md),
  [`agent-tools.md`](agent-tools.md), [`automations.md`](automations.md)) are
  at `eee23ebbe`. That commit is older than the board.
- Two statements in done files are about a different thing:
  `team-structure.md:764-765` ("No board in `src/components/TeamMapPage.tsx`")
  and `bot-coordination.md:1159-1160` ("The task board of 2026-08-31 was
  planned and never built"). Both are about the delegation plan of
  2026-08-31. They stay true for that plan. The Team Board is a later,
  separate design (section 3.18).
- [`recovery-and-pausing.md`](recovery-and-pausing.md) line 963 says "The team
  board does not count it as free (`:11371`)". This file explains that check
  (section 3.7).
- The part numbers "15, 18" of `reference-features.md:544` are not steps.
  There is no step 18 in our plan.

## 2. Files read completely

| Group | Report | Files |
|---|---|---|
| 1. State and store | `.research/board-core.md` | the item, the states, the store, the host |
| 2. Dispatcher and wiring | `.research/board-dispatch.md` | the dispatcher, the wiring, the launcher, the board lines of `server/index.ts` and `server/config.ts` |
| 3. Routes and wire | `.research/board-routes.md` | the person routes, the tool routes, the wire types, the access rules, the two end-to-end tests |
| 4. The three tools | `.research/board-tools.md` | the tool file, the tool groups, the catalog, the environment, the goldens |
| 5. Documents, switch, UI, history | `.research/board-docs-ui.md` | the two documents, the switch, the Settings page, the history, the release notes |
| 6. Ours and the borders | `.research/board-ours.md` | our documents, our crates, the done research files |
| Verify | `.research/verify-server.md`, `.research/verify-tools-ui.md` | the key claims of groups 1 to 6 |

### 2.1 State and store

Read completely: `shared/board.ts` (1), `packages/phone-protocol/src/board.ts`
(131), `server/board/state.ts` (195), `server/board/state.test.ts` (230),
`server/board/store.ts` (54), `server/board/store.test.ts` (57),
`server/board/host.ts` (195), `server/board/host.test.ts` (194).

Read in ranges: `server/atomic.ts` lines 1-120 of 142.

### 2.2 Dispatcher and wiring

Read completely: `server/board/dispatcher.ts` (225),
`server/board/dispatcher.test.ts` (308), `server/board/wiring.ts` (193),
`scripts/launch-team-board.ts` (85), `server/due-timer.ts` (104).

Read in ranges:

- `server/index.ts` (15,253): 688, 1796-1808, 3470-3500, 3825-3880,
  4076-4135, 4195-4210, 4302-4370, 4400-4425, 10560-10870, 11371,
  11619, 11885-11905, 12048-12058, 13262-13272, 15108-15136, 15190-15205.
- `server/config.ts` (1,227): 205-229, 470, 875-905.
- `server/store.ts`: 316-317, 1060-1069, 1596-1630, 1770-1790.
- `server/spend.ts`: 20-60.

### 2.3 Routes and wire

Read completely: `server/routes/board.ts` (129),
`server/routes/board-tools.ts` (261), `packages/phone-protocol/src/wire.ts`
(1,000, notes on the board only), `server/request-auth.ts` (763, notes on
the board only), `server/cloud-team-board.e2e.test.ts` (199),
`server/cloud-team-board-dispatch.e2e.test.ts` (237).

Read in ranges: `server/index.ts` 1755-1785 and 12715-12775.
`server/host/late-tool-results.ts` 55-85, `server/host/internal-body-ids.ts`
1-13.

### 2.4 The three tools

Read completely: `server/drivers/agents-board-tools.ts` (75),
`server/agent-tool-policy.ts` (35), `server/agent-tool-policy.test.ts` (50),
`server/agents-turn.ts` (101), `server/drivers/agents-tool-groups.ts` (53),
`server/drivers/agents-tool-groups.test.ts` (87),
`server/drivers/agents-catalog-profile.ts` (72),
`server/drivers/agents-mcp-env.ts` (13), `server/bot-box/env.ts` (94),
`server/testing/fake-stdio-app-server.ts` (128),
`server/drivers/agents-schema.test.ts` (168),
`server/drivers/agents-claude-defer.test.ts` (102),
`server/drivers/agents-client.ts` (57).

Read in ranges:

- `server/drivers/agents-call.ts` (998): 1-82, 214-300.
- `server/drivers/agents-catalog.ts` (888): 640-665, 814-888.
- `server/drivers/agents-catalog-goldens/profiles.json` (2,069): 1-12,
  1800-2069, and the size of each profile by a script.
- `server/drivers/agents-catalog-goldens/bridged.profiles.json` (806):
  705-806, and sizes by a script.
- `server/drivers/agents-catalog-wire.test.ts` (488): 40-130, 210-240,
  280-296, 470-488.
- `server/drivers/agents-bridge-wire.test.ts` (408): 1-20, 60-127.
- `server/drivers/agents-schema.ts` (116): 1-60. The verifier read 62-102.
- `server/drivers/agents-claude-defer.ts`: 1-50.
- `server/chat-apps-mcp.test.ts`, `server/chat-apps-mcp.e2e.test.ts`,
  `server/mcp-app-observer.test.ts`: the grep lines only. Their "board" is a
  fake MCP app, not the Team Board.

### 2.5 Documents, switch, UI and history

Read completely: `docs/team-board.md` (125),
`docs/verification/team-board.md` (73), `docs/verification/README.md`
(386), `src/lib/feature-flags.ts` (124), `src/lib/use-feature.ts` (18),
`src/components/settings/pages/FeaturesPage.tsx` (57),
`src/state/config-status.ts` (254),
`src/components/settings/SettingsWindow.test.ts` (334),
`src/components/WebPanelPage.test.ts` (189),
`scripts/testing/room-pages-ui.e2e.test.ts` (235).

Read in ranges: `src/locales/en.json` 440-455 and 12120-12140.
`scripts/ci-scope.mjs` 1-130, `scripts/ci-scope.test.ts` 182-260.
`server/routes/config.ts` 140-175, the headings, lines 1-12, 38-51, 56-83
and 161-170 of `docs/superpowers/plans/2026-08-31-07-delegation-task-board.md`.

Also read: the release notes of v0.1.181 and v0.1.182 (complete). The
messages and statistics of the commits `05384419c`, `07e6de9c6`,
`134cc5f8c` and `67a32f672`. A search of `src/`, the apps, the packages and
the desktop shell for a board UI.

### 2.6 Ours and the borders

Read completely: `MEMORY.md`, `docs/research/README.md`,
`docs/research/progress.md`, `docs/decisions.md`, `docs/comparison.md`,
`docs/plan/README.md`, and each Rust file of `crates/`.

Read in ranges: sections 5, 6 and 7 of `docs/research/changelog.md`, and
the board rows of `docs/research/reference-features.md`. Also the sections
of nine research files about leases, recovery, rooms, threads, unattended
work and tool groups. `.research/board-ours.md` records each range.

### 2.7 Claims that the lead checked against the code

The lead read these lines again after the verifiers:

1. `store.ts:1-3`, `:37-54` and `host.ts:56-93`: an empty board after a
   failed read, one read for each process, the whole-file write, `live()`.
2. `host.test.ts:178-185`: the test of the overwrite.
3. `dispatcher.ts:1-20`, `:60-225`: the constants, `lost()`, the cap,
   `startTurn`, `reconcile`, `wake`, `dispatch`, `next()`, `personReplied`,
   `answered`.
4. `wiring.ts:64-120`, `:145-193`: the brief, `threadWorking`, the tool
   routes, `ask`, `reply`.
5. `routes/board-tools.ts:107-231`: `board_add`, `board_list`,
   `board_update`.
6. `state.ts:115-131`: who may make each move.
7. `routes/board.ts:100-108`: DELETE in any state.
8. `server/routes/channels.ts:505-528`: a person's reply starts the holder's
   turn and resumes the item.
9. `server/store.ts:217-240` and `shared/room-mentions.ts:18-39`: who
   answers a line with `@` names.
10. `server/index.ts:9460-9468`, `:9776-9792`, `:10080-10090`: a board turn
    is a room member turn. It writes a runtime root row and has the room
    turn timeout.

## 3. How it works

### 3.1 The switch and the Team Cloud

1. The switch is `features.teamBoard` in the `config.json` of the server.
   The schema is `teamBoard: z.boolean().optional()`, "off unless true"
   (`server/config.ts:229`).
2. The board is on when `on = deps.team && deps.enabled()`
   (`wiring.ts:51`). `team` is `Boolean(CLOUD_TEAM)`. `enabled` is
   `cfg.features?.teamBoard === true`, read on each call
   (`server/index.ts:11371`).
3. The server reads `on()` in three places:
   - the person routes, the tool routes, each pass of the dispatcher and each
     store change (`wiring.ts:51`, `:102`, `dispatcher.ts:155`).
   - the tool list of each turn: `board: Boolean(CLOUD_TEAM) &&
     cfg.features?.teamBoard === true` (`server/index.ts:1802`).
   - `GET /api/config`: `teamBoard: CLOUD_TEAM ? cfg.features?.teamBoard ===
     true : undefined` (`server/index.ts:11619`).
4. Only an admin scope can change the switch. `PATCH /api/config` is not in
   the client list, so it needs `admin` (`server/request-auth.ts:456`,
   `:535-543`).
5. Off a Team Cloud, a PATCH of `teamBoard` is stored and has no effect. No
   check other than the schema reads it.
6. When the board is off, a person route falls through to the general 404
   (`routes/board.ts:67`). A tool route answers 404 with "The board is off
   here. Ask an Owner or Admin to turn on Board in Settings → Features."
   (`routes/board-tools.ts:235`).
7. A change of the switch acts at once, because each call reads it. A change
   in the middle of a conversation changes the tool list of the next turn.
   The design wants one list for the whole conversation, for the prompt cache
   (`server/agents-turn.ts:1-4`).

### 3.2 The store

1. The file is `board.json` in the data folder (`store.ts:10`,
   `host.ts:56`). Its form is `{ version: 1, items, repeats }`, two-space
   JSON, mode `0o600` (`store.ts:53`). `repeats` is kept as read. No code
   uses it yet (`store.ts:33-34`).
2. The host reads the file on the first use and never again:
   `board ??= readBoardFile(file)` (`host.ts:62`).
3. `readBoardFile` returns an empty board for each failure: a missing file,
   a read error, bad JSON, a wrong shape, or `version` not 1
   (`store.ts:37-49`). It does not log, and it keeps no copy.
4. An item that fails the schema is left out (`store.ts:41-44`). The item
   schema keeps unknown keys (`z.looseObject`, `store.ts:13-28`).
5. Each change goes through `commit` (`host.ts:66-83`):
   1. It computes the new items.
   2. It writes the whole file with `writeFileAtomic`: a temporary file,
      `fsync`, then a rename (`store.ts:51-54`, `server/atomic.ts:53-81`).
   3. It replaces the cache.
   4. It tells each listener about each changed item. A listener that throws
      is logged and does not stop the others (`host.ts:78-82`).
6. A failed write throws before step 3. The cache does not change, and the
   caller gets the error.
7. The write is synchronous on the one event loop. It runs on every change,
   also a change with no effect.
8. `live()` runs on each `list`, `get`, `create`, `patch` and `remove`
   (`host.ts:86-93`). It calls `alive(groupId, threadId)` for each item of
   the file. An item whose room or thread is gone is removed from the file.
   `alive` is "the room thread exists in the store" (`wiring.ts:57-61`).
9. Settled items stay in the file for ever. Only a person's DELETE or the
   removal of the thread or the room removes one. The limit of 200 counts
   only open items of one room (`host.ts:155`).

### 3.3 The states and the moves

The moves are in `state.ts:115-131`. Each refused move gives 409
`board_bad_move` with "This item is {state}: it cannot be moved to {move}
now." (`state.ts:140`).

| Move | From | To | Who | Effect | Lines |
|---|---|---|---|---|---|
| `take` | `ready` | `working` | dispatcher | Holder = bot and now. `attempts` + 1. Clears question, result and later. Keeps `laterCount`. | `state.ts:120`, `:142-145` |
| `done` | `working` | `done` | person, dispatcher, holder bot | Clears holder, question and later. Sets the result. | `:121`, `:146-149` |
| `done` | `waiting`, `ready`, `needs_person` | `done` | person | the same | `:121` |
| `failed` | `working` | `failed` | dispatcher, holder bot | the same as `done` | `:122` |
| `ask` | `working` | `needs_person` | holder bot | Keeps the holder. Sets the question (1 to 2,000 characters). Clears later. | `:123`, `:150-156` |
| `later` | `working` | `working` | holder bot | Needs a note and a time ahead. Refused at `laterCount` 20. `laterCount` + 1. | `:124`, `:157-165` |
| `wake` | `working` with a later | `working` | dispatcher | Clears later. Holder time = now. No try counted. | `:125`, `:166-169` |
| `resume` | `needs_person` | `working` | dispatcher | Clears question and later. Holder time = now. Can set a new later. | `:126`, `:170-173` |
| `release` | `working` | `ready` | dispatcher, holder bot | Clears holder, question and later. Keeps `attempts` and `forBotId`. | `:127`, `:174-177` |
| `release` | `needs_person` | `ready` | person, dispatcher | the same | `:127` |
| `cancel` | each open state | `cancelled` | person, or the bot that made it | settles | `:128` |
| `reopen` | each settled state | `waiting` or `ready` | person | Clears holder, question, result, later and `laterCount`. `attempts` = 0. | `:129`, `:178-181` |

Two automatic changes:

1. **Promote:** on each commit, a `waiting` item whose needs are all `done`
   becomes `ready` (`state.ts:186-188`, `host.ts:133`).
2. **A need that failed or was cancelled readies nothing** (`state.ts:185`).
   Its dependants wait until a person reopens it, changes the needs, or
   removes it. `withoutItems` drops a removed item from each list of needs
   (`state.ts:191-195`).

The holder check is by bot id only:
`holds = actor.kind === "bot" && item.holder.botId === actor.botId`
(`state.ts:111`).

### 3.4 A person makes an item

`POST /api/board/items` (`routes/board.ts:77-97`):

1. The body must be a JSON object, else 400 "Send a JSON object."
2. The room must exist, must not be a private chat (DM), and the caller must
   see it. Else 404 "No such room." `board_not_found`.
3. A `threadId` that is not given means a new thread. A given thread must be
   a thread of that room, else 404 "No such thread in that room."
4. A member who writes needs at least "chat" access to each bot of the room
   whose level is not "none" (`routes/board.ts:55-62`). Else 403.
5. A room that is saving a credential refuses a new thread: 403 "This room is
   securely saving a credential. Try again when it finishes."
6. The first line is at most 20,000 characters, else 400.
7. `board.create` checks these, in this order (`host.ts:150-171`):
   - the room (404) and the thread (404).
   - one item for each thread (409 `board_exists` "That thread is already a
     board item.").
   - fewer than 200 open items in the room (409 `board_full`).
   - the title (one line, 1 to 120 characters), the labels and `forBotId` (a
     bot of the room).
   - the needs, with no loop (409 `board_cycle` "Those needs would make items
     wait for each other forever.").
8. Then it opens the thread, and only then writes the file
   (`host.ts:162-169`). If the write fails, the thread stays with no item.
9. The new thread has one line: the text, or the title. "no bot answers it"
   (`docs/team-board.md:105-107`). The answer is 201 `{ item }`.

There is no client id. The same POST sent two times makes two threads and two
items.

### 3.5 A bot makes items: `board_add`

`POST /api/internal/board/add` (`routes/board-tools.ts:107-168`):

1. The room is the room of the caller's thread, or a room named by id or name
   among the bot's own rooms (`routes/board-tools.ts:85-93`). Else 404 with
   the list of its rooms.
2. The bot must be a member of the room, else 403 "You can add items only in a
   room you are in." (`:110`).
3. The open items plus the new ones must be 200 or fewer, else 409
   (`:111-114`).
4. The route checks each entry before a thread opens (`:115-143`):
   - a key used two times gives 400.
   - the title and the labels.
   - `for` must name exactly one bot of the room, by id or name.
   - each need must be a key of this call or an item of this room.
5. The keys are put in order of their needs. A loop gives 409 (`:145-151`).
6. The items are made one at a time (`:152-165`). The first line of each
   thread is the brief or the title, written as the bot's own line
   (`wiring.ts:154-159`).
7. The answer is 201 with one line for each item: key, thread id, state,
   title.

A bad entry from the model gives no thread, because step 4 checks all
entries first. A save that fails in step 6 returns "Already added: ...", and
the items made before it stay (`:160-163`). The `key` is not stored, so a
retry of a call whose answer was lost makes a second set of items.

### 3.6 A pass of the dispatcher

When a pass runs:

1. The dispatcher uses the shared due timer (`server/due-timer.ts`). Its
   `next()` gives the time of the next pass (`dispatcher.ts:170-183`):
   - now, while a `ready` item exists and no cap or hold applies.
   - the time of a `later`, for an item set aside.
   - the holder time plus 20 s, for a `working` item.
2. Each board change, each `bot` change of the store and each runtime node
   change pokes the timer (`dispatcher.ts:63`, `wiring.ts:104`,
   `server/index.ts:3873-3874`). A poke runs a pass at once when `next()` is
   already past (`due-timer.ts:72`).
3. When a pass ends and `next()` is still past, the timer runs again after
   15 s (`BOARD_RETRY_MS`, `due-timer.ts:88-90`). A shared 60 s clock also
   pokes each due timer (`due-timer.ts:21`, `:28`).
4. Thus, while one `ready` item cannot go to a bot, a pass runs each 15 s
   for ever.

One pass, `tick()` (`dispatcher.ts:154-167`):

1. Stop if a pass runs now or the board is off (`:155`).
2. Stop before `quietUntil`: 2 minutes after the dispatcher was built
   (`:52`, `:159`). The server builds it once at start
   (`server/index.ts:11371`). A `stop()` and `start()` for maintenance do not
   apply the quiet time again.
3. `reconcile`: the lease check (section 3.9). It runs also under a cap.
4. Stop while a cap holds (`:161`).
5. `wake`: items set aside whose time came (section 3.10).
6. `dispatch`: each `ready` item, oldest first, all rooms in one list
   (`:133-152`, `host.ts:141`):
   1. Skip the item if its start was refused less than 60 s ago, or if its
      thread works (`:135`).
   2. The candidates are the bots of the room in room order. `forBotId`
      keeps only that bot (`:136-137`).
   3. Skip each candidate that has no model (for 10 minutes), that is not
      free, or that holds an active item anywhere (`:139-146`).
   4. A cap on the bot stops the whole pass (`:141`).
   5. `take` the item, then start the turn, then go to the next item
      (`:147-149`).

The pass has no `await`. In one process, a second pass cannot run in the
middle of the first, and `take` works only from `ready` (`state.ts:120`).
Two bots cannot take one item in one process. Nothing locks `board.json`
against a second process.

The cost of one pass:

- Each `board.list()` runs `live()` over each item of the file.
- `holdsActive(deps.board.list({ state: "working" }), botId)` runs for each
  pair of a ready item and a candidate bot (`dispatcher.ts:121`, `:140`).
- `activeGroupTurnForBot` loops over each room and each speaker
  (`server/index.ts:4407-4425`).

### 3.7 A free bot

`botFree(botId, groupId, threadId)` is true when all of these are true
(`server/index.ts:11371`):

1. The bot and the room exist, and the bot is not hidden (archived).
2. The bot is not busy in any thread (`bot.busy`).
3. The bot has no approval grant that waits.
4. The bot is not paused, and its starter plan does not stop it.
5. The bot is not held in this room.
6. The account of its engine is not being changed.
7. The room member lock does not hold the bot in another room thread.
8. The bot has no room turn and is no room speaker
   (`activeGroupTurnForBot`, `server/index.ts:4407-4425`).

The dispatcher adds one more rule: the bot holds no active item. An item is
active when it is `working` and not set aside (`dispatcher.ts:67-68`). An
item that waits on a person, or is set aside, does not count. Thus the bot
can take other work meanwhile.

All of these values are in memory. The threads research has "the thread is
the unit of busy" for direct turns ([`threads.md`](threads.md) section 1).
The board uses the older rule, "busy as a flag of the bot".

### 3.8 How the turn starts

1. The dispatcher builds the brief (`wiring.ts:67-76`):
   - **take:** "server.board.brief" with the bot name, the title and the
     first text line of the thread, cut to 2,000 characters
     (`BRIEF_TEXT_MAX`, `wiring.ts:17`). For each need, "- {title}: {result
     or state}" under "server.board.briefNeeds".
   - **wake:** "server.board.wake" with the bot name, the title and the note.
2. The template starts with "@{bot}" (`src/locales/en.json:447`, `:449`).
3. `startTurn` calls `startGroupTurn(groupId, text, ..., "chat", ...,
   { threadId, mentions: [botId], trigger: { kind: "bot", botId }, sender })`
   (`server/index.ts:11371`). The sender is "Board"
   (`en.json:446`).
4. `startGroupTurn` appends the brief to the thread as a `role: "user"` line
   (`server/index.ts:10645-10656`). Each take and each wake adds one line.
5. It finds who answers with `roomResponders` (`server/index.ts:10674`).
   That function reads each `@` name in the text (`server/store.ts:217-240`).
   `mentions: [botId]` only settles a name that two bots share
   (`shared/room-mentions.ts:34-36`).
6. It registers the room turn operation at once
   (`server/index.ts:4076-4095`). The thread is "working" before the pass
   ends.
7. The run waits on the promise chain of the thread
   (`server/index.ts:10746-10817`). The member turn
   (`runClaimedGroupMemberTurn`, `server/index.ts:9468`) writes a runtime
   root row with `coordinator.beginTurn` (`:9781-9786`). It has the room
   turn timeout by progress (`:10084-10089`). The room research file has
   these limits ([`bot-coordination.md`](bot-coordination.md) sections 3.4
   and 3.7).

The brief is a template filled with stored fields. Some of those fields are
model output:

- the first line of a thread that `board_add` opened is the bot's brief
  (`wiring.ts:154-159`).
- `need.result` is the text of another bot's `board_update`.
- the wake note is the bot's own `later` note, or a person's inbox answer.

If that text has "@everyone" or "@OtherBot", `roomResponders` adds those bots
to the turn (`server/store.ts:225-234`).

### 3.9 The lease and the three tries

1. `take` writes `working`, the holder and `attempts + 1` to the file
   (`state.ts:142-145`). Then the turn starts.
2. A start that throws (for example, the thread is gone) is logged. The item
   is held 60 s, and `lost()` runs (`dispatcher.ts:94-103`).
3. `reconcile` runs at the start of each pass (`dispatcher.ts:106-112`). For
   each active `working` item whose holder took it 20 s ago or more
   (`BOARD_LEASE_MS`), it asks `threadWorking`.
4. `threadWorking` is true while the thread has a room speaker, a room turn
   operation, or a queued line of a person
   (`server/index.ts:3480-3489`, `wiring.ts:83`).
5. When the thread is idle, `lost()` runs (`dispatcher.ts:80-83`):
   - `attempts >= 3`: `failed`, with the result "Stopped after 3 tries: each
     turn ended without finishing the item." (`en.json:450`).
   - else `release`: back to `ready`, `attempts` kept.
6. The same pass then runs `dispatch`. The item can go to a different bot at
   once.

What the dispatcher does not know:

- It gets no result and no event from the turn. A good end, an error, a
  stop, a timeout and a turn that never started all look the same. In each
  case the item is `working`, and the thread is idle.
- `startGroupTurn` can return without a throw and without a turn, when no
  bot answers (`server/index.ts:10695-10712`). A member wait can also skip
  the bot (`server/index.ts:4302-4347`). Each case spends a try.
- A refused start spends a try, because `take` counted it first.
- Talk of a person in the thread keeps it "working". The lease then has no
  limit (`wiring.ts:83`, `dispatcher.ts:135`).
- A `working` item with no holder is skipped by `reconcile`
  (`dispatcher.ts:108`) and stays stuck. Only a damaged file can make one.

### 3.10 Set aside: `later` and `wake`

1. The holder calls `board_update` with `move: "later"`, `minutes` and a note
   (`routes/board-tools.ts:206-217`).
2. The route rounds `minutes`. It must be 1 to 1,440, else 400. The note must
   not be empty, else 400.
3. If `laterCount >= 20`, the route moves the item to `failed` with "Set aside
   20 times without finishing, so it stopped." (`en.json:451`). It answers 409
   "This item was set aside 20 times, the most it may be, so it is now
   failed. Say so in one line and stop." (`:210-213`). The state machine has
   the same limit as a second check (`state.ts:162-163`).
4. Else the item stays `working` with its holder. It gets `later = { at,
   note }`, and `laterCount + 1` (`state.ts:157-165`). One minute is
   `60,000 × timeScale` ms (`wiring.ts:147`).
5. An item set aside is not active. Its bot can take other items.
6. In each pass, `wake` looks at each item whose time came
   (`dispatcher.ts:115-130`):
   - If its bot left the room, `release` (any bot of the room can take it).
   - Else wait until the bot is free, holds no active item, and the thread is
     idle. A cap stops the pass. A bot with no model is skipped.
   - Then `wake` (holder time = now, no try counted) and start the turn with
     the note.
7. `laterCount` is kept by `release` and `take`. Only `reopen` clears it. The
   limit of 20 is for the life of the item, not for each try.
8. A wake turn that ends with no move is lost 20 s later, like a take. It
   then counts one more try (`state.ts:168`, `dispatcher.ts:106-112`).

### 3.11 A question to a person

1. The holder calls `board_update` with `move: "ask"` and the question
   (`routes/board-tools.ts:198-205`). The item must be `working` and held by
   this bot, else 409.
2. The person is `person` (a name or an email), else the person who made the
   item. A bot-made item with no `person` asks nobody.
3. The route first posts the question in the thread as the bot's line, and
   sends it to the inbox of that person (`wiring.ts:161-168`).
4. Then it moves the item to `needs_person`. If that move fails, the question
   is already sent, and the item stays `working`.
5. The room thread shows "waiting on you" while the item is `needs_person`
   (`wiring.ts:91-99`). The sidebar shows it through
   `src/lib/room-threads.ts:33-34`.
6. The bot is free again. It can take other items.
7. A person's chat line in that thread goes to the holder. The server puts
   "@Bot " in front unless the line names the bot (`wiring.ts:114-120`). The
   line starts the holder's turn, and `personReplied` resumes the item
   (`server/routes/channels.ts:509-527`, `dispatcher.ts:209-212`).
8. An answer from the inbox comes as the bot's relay line and starts no turn.
   `answered` resumes the item with a later at "now" and the answer as the
   note (`wiring.ts:105-110`, `dispatcher.ts:215-221`). `wake` starts the
   holder when it is free.
9. An item that waits on a person has no time limit. The state machine lets
   the dispatcher release it, but the dispatcher never does
   (`state.ts:127`).

Step 7 does not check `botFree` or `holdsActive`. The bot can then hold two
active items. `dispatcher.test.ts:238-249` shows this state.

### 3.12 Settle, release, labels and the list

`board_update` with `done`, `failed` or `release`
(`routes/board-tools.ts:218-230`):

1. The item is `item` from the body, or the caller's thread
   (`:189`). The item must be in a room of the bot, else 404 (`:190-193`).
2. The state machine checks the move. `done` and `failed` need the holder
   and `working`. Else 409 (`state.ts:121-122`).
3. The text of `done` or `failed` is the result, up to 2,000 characters.
   Empty text gives no result.
4. The answers: "Marked done; items waiting on it are ready now. End your turn
   with a short summary.", "Marked failed. End your turn with one line on
   why.", "Handed back; another free bot of the room may take it. End your
   turn."
5. A call with only `labels` replaces all labels of the item. It has no
   holder check and no state check (`:224`, `host.ts:115`). Any bot of the
   room can change the labels of any item of the room.

The holder check is by bot id. The holder bot can settle the item from a
turn in a different thread, if it names `item`.

The bot cannot cancel through the tool. The tool has no `cancel` move, but
the state machine lets the bot that made an item cancel it (`state.ts:128`).

`board_list` (`routes/board-tools.ts:170-186`):

1. It reads all items, then keeps the items of the bot's rooms (`:179`).
2. It shows the newest 60 with "The newest 60 of N:" (`:51`, `:181-185`).
   Settled items are in the list. An old open item can be hidden behind newer
   settled items.
3. Each line: thread id, state, title, holder, `for`, needs, labels, the
   question (160 characters) and the result (200 characters)
   (`:95-105`).

### 3.13 A person changes or removes an item

1. `GET /api/board[?groupId=]` returns each item that the caller can see,
   all states, oldest first. It has no paging (`routes/board.ts:73-76`).
2. `PATCH /api/board/items/:threadId` (`routes/board.ts:98-123`) takes
   `move` (`cancel`, `reopen`, `release`, `done`), `title`, `labels`,
   `needs`, `forBotId` and `result`. The move comes first, then the fields,
   in one commit (`host.ts:109-135`).
   - `needs` changes only in `waiting` or `ready`. Else 409 "Change what an
     item needs only before a bot takes it."
   - `result` changes only on a settled item.
3. A person may mark an item `done` or `cancelled` while its turn runs. The
   bot's next `board_update` then gets 409, and what the bot found is not
   saved.
4. `DELETE /api/board/items/:threadId` removes the item in each state, also
   `working` (`routes/board.ts:104-107`). The thread stays. The running
   turn's next `board_update` gets 404.

### 3.14 Restart, crash, maintenance and sleep

1. At start, the board starts after the engines are read, inside the move
   freeze (`server/index.ts:15131-15133`).
2. The file keeps each item with its state, holder, `attempts`, `later` and
   `laterCount`. The memory of the dispatcher is lost: `skipBot`,
   `holdItem`, `cappedUntil` (`dispatcher.ts:52-61`).
3. The room turn maps are in memory, so each thread is idle after a restart
   (`server/index.ts:3471-3472`). `bot.busy` is reset at load
   (`server/store.ts:316-317`).
4. For 2 minutes nothing starts and no lease is checked. "the runtime re-runs
   a room turn a restart cut, and owns those minutes" (`dispatcher.ts:5-6`).
5. After that time:
   - If the runtime ran the cut turn again, the thread works and the item
     stays with its bot (`dispatcher.test.ts:171-184`).
   - Else `reconcile` releases the item, or fails it at the third try. The
     next `dispatch` gives it to a free bot.
6. A crash between `take` and the start of the turn leaves `working` with no
   turn. It spends one try after the quiet time.
7. `start()` shows "waiting on you" again for each `needs_person` item
   (`wiring.ts:181-185`).
8. An item set aside keeps its time. A sleeping Cloud wakes for it through
   `nextDueAt` (`dispatcher.ts:201-207`, `server/index.ts:15114`). A `ready`
   item gives no wake time unless a cap holds.
9. Maintenance stops the board with the other timers, and starts it again
   (`server/index.ts:11893-11901`).

### 3.15 Caps and models

1. `capped(botId)` checks the monthly spend limit, then the usage cap of the
   bot (`server/index.ts:11371`). A cap error gives `{ resetsAt }`. Each other
   error counts as "not capped".
2. When one bot is capped, `cappedUntil` holds the whole board until the reset
   time, at least 15 s (`dispatcher.ts:86-92`). No try is counted, because
   the check comes before `take`. "the pause is the whole board's"
   (`dispatcher.ts:85`).
3. The spend limit is one limit for all bots. A usage cap is for one bot. The
   reference project pauses all rooms for both.
4. `modelReady(botId)` needs the model instance, a policy that allows it, and
   an engine that is not signed out. A bot with no model is passed over for 10
   minutes in `dispatch` (`dispatcher.ts:142-145`). In `wake` it is only
   skipped for that pass.

### 3.16 Who may do what

1. **Person routes:** only a signed-in team person with an email
   (`auth.kind === "session" && auth.session.email`,
   `server/index.ts:11371`). Else 403 "Sign in to the team to use its board."
   (`routes/board.ts:69`). The routes are in the client list
   (`server/request-auth.ts:515-519`). A local request with no session gets
   403 on a Team Cloud (`server/request-auth.ts:42-60`, `:747-750`).
2. A person sees an item only when they see its room and its thread
   (`routes/board.ts:70-71`). A hidden item gives the same 404 as a missing
   one.
3. **Tool routes:** the bearer of the turn says which bot and which thread
   call (`server/index.ts:12716-12747`, `:13272`). The capability must be of
   kind "agents" and the current turn of that thread
   (`server/index.ts:1762-1784`, `:12760-12774`). A token of an ended turn
   gets 401. Body ids that disagree get 403.
4. The MCP server refuses a tool that the turn does not list with "Unknown
   tool" (`server/drivers/agents-mcp.ts:60-64`). On the HTTP form, the
   `OMB_TEAM_BOARD` value comes in a request header
   (`server/routes/own-mcp-http.ts:22-31`). Thus the route's `on()` is the
   real lock.
5. A bot reaches only the items of its rooms (`routes/board-tools.ts:190-193`).
   It can add items, list items, and change labels of each item there.

### 3.17 The three tools

The tool file is `server/drivers/agents-board-tools.ts`. Each tool is a POST
to `/api/internal/board/{add|list|update}` with the arguments of the model
(`:8-13`). A good answer gives `{ text }`. A bad one gives the route's
`error`, or "The board did not answer. Try again shortly.", as an error
(`:12`).

| Tool | Description (exact) | Schema |
|---|---|---|
| `board_add` | "Add work items to a room's board, each on a new thread; the server gives ready ones to free bots of the room." | `room?`, `items` (at most 15) of `{ key, title (≤ 120), brief?, needs?, labels?, for? }` |
| `board_list` | "The board items of your rooms, with state, holder and needs." | `room?`, `state?` (the seven states) |
| `board_update` | "Settle the board item you hold (default: this thread's): done or failed with text as the result, ask a person (text = question), later (look again in minutes; text = note) or release it." | `item?`, `move?` (5 moves), `text?` (≤ 2,000), `person?`, `minutes?` (1 to 1,440), `labels?` |

1. The proxy checks only the length, number and count limits of the schema
   (`server/drivers/agents-schema.ts:99-102`). It does not check `required`,
   `enum` or types. The route checks them with zod `.strict()` schemas
   (`routes/board-tools.ts:54-73`).
2. The route has limits that the tool schema does not show:
   - `key`: 1 to 40 characters.
   - `brief`: up to 20,000 characters.
   - `needs`: up to 10.
   - `room`, `for` and `item`: up to 200 characters.
   - `person`: up to 254 characters.
3. No description tells the model about the 3 tries or the limit of 20.
4. Only `board_list` is a reviewed read-only tool
   (`server/agent-tool-policy.ts:19`).
5. The tools are listed when `profile.board` is true
   (`server/drivers/agents-catalog.ts:864`). That comes from `OMB_TEAM_BOARD`
   (`server/agents-turn.ts:48`, `agents-catalog-profile.ts:62`). They are in
   rooms and in one-to-one chats, for a Chief and for each other bot.
6. They are in `CORE_TOOLS` (`agents-tool-groups.ts:35`). The tool groups of
   a bot cannot remove them.
7. They sit after `check_back`, in the middle of the catalog
   (`agents-catalog.ts:655`). With a provider limit on the tool count, the
   list is cut by order, so the board tools can be cut while calls still work
   (`server/tool-count-limit.ts:21-23`).
8. A board call has no client time limit (`agents-client.ts:17-29`). A
   connection error comes back as an error result
   (`server/drivers/agents-mcp.ts:72-75`).

The cost on the tool list:

| Engine form | Without the board | With the board | Source |
|---|---|---|---|
| Each tool listed (team profile) | 65 tools, 71,959 bytes | 68 tools, 74,014 bytes | `agents-catalog-goldens/profiles.json:1880` |
| Each tool listed (room profile) | 48 tools, 57,447 bytes | 51 tools, 59,502 bytes | `profiles.json:1954` |
| Claude, tools deferred | 1,721 deferred bytes | 1,794 deferred bytes (names only) | `agents-claude-defer.test.ts:30-31` |
| Bridged engine | 19,171 bytes | 19,208 bytes, no new entry | `bridged.profiles.json:736` |

### 3.18 History

1. `05384419c` (2026-11-24, merged as #7355): the items, `board.json`, the
   state machine, the person routes, the live frame and the switch. 28 files,
   1,498 lines added.
2. `07e6de9c6` (2026-11-25, #7411): the dispatcher, `later`, the three tools,
   the end-to-end test, the launcher and the verification document. 40 files,
   1,836 lines added. It squashes ten commits. Three of them fix the lease:
   - an item set aside whose bot left the room is handed back.
   - bots whose engine is refused or signed out are skipped.
   - a person's line queued behind a turn keeps the thread "working"
     (`wiring.ts:83`).
3. The first document said "Bots taking items, the bot tools, the Board page
   and repeating items come later." The second commit removed the Board
   page from that promise. The text now is "There is no Board page"
   (`docs/team-board.md:11-13`).
4. No later commit changes the logic of the board. The release notes of
   v0.1.181 and v0.1.182 do not name it.

**How it differs from the plan of 2026-08-31.**
[`team-structure.md`](team-structure.md) section 3.12 analyzed that plan.
None of it was built, and the board does not cite it.

| Part | Plan of 2026-08-31 | Team Board |
|---|---|---|
| Unit | a work item for each delegation, with an id, a parent and a depth | one item for each room thread, keyed by the thread id |
| Owner | `ownerBotId` at creation | None at creation. The first free bot, or `forBotId`. |
| States | queued, running, blocked, done, failed, cancelled | waiting, ready, working, needs_person, done, failed, cancelled |
| Order | a tree by `parentId` | `needs` between items of one room |
| Deadline | `dueAt` | None. Only `later`. |
| Artifacts | files, links, threads | a result text of up to 2,000 characters |
| Supervisor, reviewer | a supervisor flag and a reviewer stage | None. A review is another item that needs the draft. |
| Limit | 3 delegations at the same time | One active item for each bot. 200 open items for each room. |
| Who starts the work | the bot that delegates | the server, as unattended work |
| Data | `work-items.json` | `board.json`, the same file pattern |
| UI | a board tab with columns | none |
| Where | each install | a Team Cloud only |

What replaced the delegation plan was the job runtime of v0.1.108
([`bot-coordination.md`](bot-coordination.md) section 3.25). The board does
not build on the runtime for its own state. Its turns are room turns, and a
room turn writes a runtime root row (`server/index.ts:9781-9786`).

## 4. The data

### 4.1 The item

`BoardItem` (`packages/phone-protocol/src/board.ts:38-63`). `shared/board.ts`
only exports this file again.

| Field | Type | Meaning |
|---|---|---|
| `threadId` | string | the id of the item and of its room thread |
| `groupId` | string | the room |
| `title` | string | one line, 1 to 120 characters |
| `state` | one of seven | section 3.3 |
| `needs` | string[] | thread ids of items of the same room, up to 10 |
| `labels` | map of string to string | up to 12 |
| `forBotId` | string? | only this bot may take it |
| `holder` | `{ botId, since }`? | set while `working` or `needs_person` |
| `attempts` | number | "Times a bot took it since it was made or last reopened" |
| `question` | `{ text, askedAt, person? }`? | while `needs_person` |
| `later` | `{ at, note }`? | while set aside |
| `laterCount` | number? | the times it was set aside |
| `result` | string? | up to 2,000 characters, on a settled item |
| `createdBy` | `{ kind: "person" \| "bot", id, name }` | who made it |
| `createdAt`, `updatedAt` | number | times |

There is no lease id, no turn id, no expiry and no version on the item.

### 4.2 The limits

`BOARD_LIMITS` (`board.ts:65-84`) and the route limits
(`routes/board-tools.ts:51-73`):

| Limit | Value |
|---|---|
| `titleMax` | 120 |
| `textMax` (first line, brief) | 20,000 |
| `needsMax` | 10 |
| `labelsMax` | 12 |
| `labelKeyMax` | 32, pattern `/^[a-z0-9_-]{1,32}$/` (`board.ts:87`) |
| `labelValueMax` | 80 |
| `resultMax` | 2,000 |
| `questionMax` (also the `later` note) | 2,000 |
| `openPerRoom` | 200 |
| `itemsPerCall` | 15 |
| `laterMinutesMax` | 1,440 |
| `latersMax` | 20 |
| `triesMax` | 3 |
| `LIST_MAX` of `board_list` | 60 |
| `BRIEF_TEXT_MAX` | 2,000 (`wiring.ts:17`) |

### 4.3 The times

| Constant | Value | Source |
|---|---|---|
| `BOARD_QUIET_MS` | 2 minutes | `dispatcher.ts:12` |
| `BOARD_LEASE_MS` | 20 s | `dispatcher.ts:14` |
| `BOARD_MODEL_SKIP_MS` | 10 minutes | `dispatcher.ts:16` |
| `BOARD_START_RETRY_MS` | 60 s | `dispatcher.ts:18` |
| `BOARD_RETRY_MS` | 15 s | `dispatcher.ts:20` |
| A cap with no reset time | 1 hour | `server/index.ts:11371` |
| A `later` minute | 60 s | `wiring.ts:147` |

`OMB_BOARD_TIME_SCALE` multiplies each time. The wiring accepts a value above
0 and up to 1,000 (`wiring.ts:45`, `:52`). A comment says "only tests set
it", but it is an environment variable that the server reads
(`server/index.ts:11371`).

### 4.4 The file

`board.json` in the data folder: `{ "version": 1, "items": [...], "repeats":
[...] }` (`store.ts:29`, `:53`). One file for all rooms. Written whole on each
change, owner-only. Section 3.2 has the read and write rules.

### 4.5 The memory

Kept only in memory, and lost at a restart:

- the cache of the file (`host.ts:59`).
- `skipBot`, `holdItem`, `cappedUntil`, `quietUntil`, `running`
  (`dispatcher.ts:52-61`). The two maps are never pruned.
- the room turn maps that `threadWorking` reads
  (`server/index.ts:3471-3472`).
- each value that `botFree` reads (section 3.7).

### 4.6 The wire

- `BoardItemCreateBody`, `BoardItemPatchBody`, `BoardListResponse`,
  `BoardItemResponse` (`board.ts:93-122`).
- The live frame `{ kind: "board.item", groupId, threadId, item | null }`
  (`board.ts:126-131`). `null` means removed. It goes only to people who see
  the thread (`wiring.ts:62`).
- `wire.ts` has types only. It has no schema check and no protocol version.
  The frame is one member of `ServerFrame` (`wire.ts:4`, `:998`).

### 4.7 The server lines

From `src/locales/en.json:446-452`:

| Key | Text |
|---|---|
| `server.board.sender` | "Board" |
| `server.board.brief` | "@{bot} This board item is yours: \"{title}\".\n\n{text}\n\nIt is done when the work above is finished and you can say what came of it. Finish with board_update: done or failed (text: what came of it), ask (text: your question for a person), later (minutes and a note, to look again then) or release (to hand it back)." |
| `server.board.briefNeeds` | "What it waited on:\n{results}" |
| `server.board.wake` | "@{bot} Back to the board item \"{title}\": {note}\n\nFinish with board_update: done, failed, ask, later or release." |
| `server.board.stopped` | "Stopped after {count} tries: each turn ended without finishing the item." |
| `server.board.tooManyLaters` | "Set aside {count} times without finishing, so it stopped." |
| `server.board.askTitle` | "{bot} asks you about \"{title}\"" |

## 5. The UI

1. There is no board page, list, column view or panel. A search of `src/`,
   the apps, the packages and the desktop shell finds no client that calls
   `/api/board` or reads the `board.item` frame. The document says so: "There
   is no Board page" (`docs/team-board.md:11`).
2. **Settings → Features** has a "Board" row (`FeaturesPage.tsx:12`, `:53`).
   The label is "Board" (`en.json:12132`). The line under it is "Track work
   in group chats as items with a state, labels and what each one waits for"
   (`en.json:12133`).
   - The row shows only when `GET /api/config` has the key, which is only on a
     Team Cloud (`FeaturesPage.tsx:19`, `:23`).
   - The Features page is only for an Owner or Admin
     (`SettingsWindow.test.ts:330-332`).
   - The switch saves with `PATCH /api/config` (`FeaturesPage.tsx:29-30`).
   - `useFeature("teamBoard")` gives the state of the row
     (`FeaturesPage.tsx:18`, `use-feature.ts:11`). Nothing else in the client
     reads the switch.
3. The line under the switch does not say that the server will start bots by
   itself, which costs money.
4. A person sees an item only in three places:
   - as an ordinary room thread, with the Board line in it.
   - as "waiting on you" on the room thread (`wiring.ts:91-99`.
     `src/lib/room-threads.ts:33-34`.
     `src/components/SidebarGroupThreadList.tsx:26`).
   - as an inbox entry titled "{bot} asks you about \"{title}\""
     (`en.json:452`).
5. The state, `attempts`, the needs and the result are visible only through
   the API. A failed item shows only in its thread.
6. The phone app's source is not in the clone (section 9).

## 6. The tests

| Test | What it proves | Lines |
|---|---|---|
| `server/board/state.test.ts` | Each actor, state and move outside the allowed table gives 409. It tests each move, the needs and promote, and the limits of title, labels and result. It tests `later` up to 20, and `wake`. | 34-229 |
| `server/board/store.test.ts` | A round trip keeps the data. The mode is `0o600`. No temporary file stays. A missing, bad or newer file reads as empty. A bad item is left out. | 24-56 |
| `server/board/host.test.ts` | It tests create, the limit of 200, promote and field patches. A refused change writes nothing. It tests remove, and the drop of items of a deleted thread. The next change replaces a corrupt file. | 47-193 |
| `server/board/dispatcher.test.ts` | It tests the quiet time, one item for each bot, `forBotId`, a cap that pauses all, and a bot with no model. Three tries end in `failed`. It tests a restart with a re-run turn, the switch off, needs, a refused start, a person's reply, an inbox answer, `later`, and a bot that left the room. | 68-307 |
| `server/cloud-team-board.e2e.test.ts` | the switch, who sees what, needs and loops, person moves, DELETE, an idle restart, a personal Cloud gets 404 | 92-199 |
| `server/cloud-team-board-dispatch.e2e.test.ts` | the tools only with the switch on, dispatch to Writer as unattended work, a result reaches the dependant, ask and the inbox, a queued reply, `board_add`, `later` | 84-237 |
| `server/drivers/agents-catalog-wire.test.ts` | the board adds exactly three tools and changes nothing else | 287-294 |
| `server/drivers/agents-schema.test.ts` | each length and count limit of the board schemas is refused before the route | 113-134 |
| `server/drivers/agents-claude-defer.test.ts` | the board tools are deferred for Claude | 22-32 |
| `src/components/settings/SettingsWindow.test.ts` | the Board row shows only on a Team Cloud, not for a member | 320-332 |

The manual check (`docs/verification/team-board.md:50-73`) has seven steps
with a real model. The launcher (`scripts/launch-team-board.ts`) makes a
temporary Team Cloud with the switch on.

No test covers:

- two bots and one item, or two server processes.
- three tries in an end-to-end test, or the 21st `later`.
- a restart while an item is `working` or set aside.
- a crash between `take` and the start of the turn.
- a need that failed, or `forBotId` of a bot that left (the test at
  `dispatcher.test.ts:295-307` leaves such an item and asserts nothing about
  it).
- a `board_add` sent two times, or the "Already added" path.
- a change of labels only, a DELETE or `done` during a turn.
- a bot that holds two active items after a person's reply.
- a save of the Board switch in Settings.

## 7. Ours compared

**What we have now.** No part of a board exists in code. `bot-core` has only
`echo_reply` (`crates/bot-core/src/lib.rs`). `bot-engine` has only its doc
line. `bot-protocol` has the ids, `Event`, `EventKind::{TurnStarted,
TurnCompleted}`, `Outcome::{Completed, Failed, Interrupted}` and `Message`.
The workspace has no SQLite and no async runtime yet.

**What our documents already say about this feature.**

- **P220** ([`../../plan/bot-coordination.md`](../../plan/bot-coordination.md)):
  "One tool, one route and one record for work between bots ... No ask tool,
  no mailbox, no task board". A board with its own record and three tools is
  against this open proposal.
- **P285** ([`../../plan/team-structure.md`](../../plan/team-structure.md)):
  "A read-only board can come later from the assignment rows."
- **P286:** the rooms of a team have no step
  ([`../../plan/README.md`](../../plan/README.md), "Gaps that have no step").
  A board item is a room thread, so the board waits for rooms.
- **D8** (proposed): the runtime owns work state, and the opening of a
  delegated turn comes from stored data. **D14:** SQLite from the first
  store, and no stage with JSON files. **D10:** no Team Cloud. **D22:** a
  capability flag only when a step reads it. **D20:** `turn.completed` is
  always the last event of a turn.
- [`threads.md`](threads.md) section 8, point 1: the thread is the unit of
  busy (P3, open). D8 still says "One turn per bot at a time".

**Where each part goes.**

| Part | Reference files | Our crate and module | State |
|---|---|---|---|
| Item, states, moves, limits | `packages/phone-protocol/src/board.ts`, `server/board/state.ts` | `bot-protocol::board` (types, pure moves) | absent |
| Store of items | `server/board/store.ts`, `server/board/host.ts` | `bot-core::runtime` store tables (step 13), not a file | planned as the runtime store only |
| Dispatcher, lease, tries, `later` | `server/board/dispatcher.ts`, `server/due-timer.ts` | `bot-core::runtime` tick and claim (step 13) | planned for assignments, not for a board |
| Wiring, brief | `server/board/wiring.ts` | `bot-core::runtime::envelope` (step 13) | planned |
| Person routes | `server/routes/board.ts` | `bot-desktop` commands (no HTTP server, D10) | absent |
| Bot tools | `server/drivers/agents-board-tools.ts`, `server/routes/board-tools.ts` | `bot-engine::tools` (step 12) | absent |
| Room thread | `server/store.ts` rooms, `server/index.ts` room turns | `bot-core` rooms | no step (P286) |
| Switch | `server/config.ts:229`, `server/index.ts:1802`, `:11619` | a setting in `bot-core::settings` | absent |

**Where we differ on purpose.** We have no Team Cloud and no HTTP server
(D10). A board for us would be local, for the rooms of one person's bots, and
only after rooms have a step.

## 8. Where we can be better

Each point gives what the reference project does, what we can do, and the
reason. The author decides each one (`MEMORY.md`, "Follow the reference, and
raise each improvement"). Where no point is given, we follow the reference.

The board came in v0.1.181 with no release note. Thus the releases that each
point names are the releases of its theme in section 5 of
[`../changelog.md`](../changelog.md), not releases of the board.

**Where the board lives**

1. **No second store of work.** The reference project keeps board state in
   `board.json` and the turn in the runtime (`server/index.ts:9781-9786`). The
   two are written at different times. A crash between `take` and the start
   leaves a `working` item with no turn, and a try is spent
   (`dispatcher.ts:147-148`, `:106-112`). We can make a board item a row of the
   step 13 runtime store, with the claim and the turn in one transaction.
   Reason: our rule "The runtime in `bot-core` owns all work state". Also the
   known problems "The same work done two times, or lost" and "State lost at a
   restart".
2. **A failed read is an error, not an empty board.** `readBoardFile` returns
   an empty board for each failure. The next change writes over all items
   (`store.ts:37-49`, `host.ts:66-70`, `host.test.ts:178-185`). A file of a
   newer version is also erased. We use SQLite (D14), and a store that does
   not open gives a typed error. Reason: the known problem "A file written
   over after a failed read" (v0.1.103, v0.1.107, v0.1.151).

**The lease and the tries**

3. **The lease ends on the turn's last event.** The reference project guesses
   the end of a turn: the thread is idle 20 s after the take
   (`dispatcher.ts:106-112`). A turn that never started, a skipped member and
   a turn with no answering bot each spend a try
   (`server/index.ts:10695-10712`, `:4302-4347`). Talk of a person in the
   thread keeps the lease with no limit (`wiring.ts:83`). We can end the
   claim on `turn.completed` (D20), with its `Outcome`, in the same
   transaction. A turn that did not start is a typed refusal and counts no
   try. Reason: the known problem "Busy and races between bots" (v0.1.21,
   "a renewable lease with an expiry rather than a flag").
4. **One active item for each bot, checked in one place.** A person's reply
   resumes an item with no `botFree` check (`server/routes/channels.ts:509-527`.
   `dispatcher.ts:209-212`). The bot then holds two active items
   (`dispatcher.test.ts:238-249`). We can put the claim in one admission
   function that each entry point calls. Reason: "Busy and races between
   bots".
5. **A restart applies the same rule as a turn end.** The reference project
   waits 2 minutes, then guesses again from an idle thread
   (`dispatcher.ts:5-6`, `:159`). The quiet time is set once, when the board
   is built (`dispatcher.ts:52`). We can decide each claim at start from
   stored rows, with the restart policy of step 13. Reason: "State lost at a
   restart" (v0.1.24, v0.1.165).

**Waits that end**

6. **Each wait has a limit and a reason.** These waits never end in the
   reference project:
   - a `ready` item whose `forBotId` bot left the room, or a room with no bot
     (`dispatcher.ts:136-137`). The pass then runs each 15 s for ever
     (`dispatcher.ts:178`).
   - a `waiting` item whose need failed or was cancelled (`state.ts:185`).
   - a `needs_person` item with no answer (`state.ts:127`, never used).

   We can give each of them a typed state that a person sees, and a deadline.
   Reason: "A turn or a wait that does not end" (v0.1.153: work waiting on you
   "closes after three, instead of waiting forever").
7. **The model knows the limits.** No tool description names the 3 tries or
   the 20 `later` moves (`agents-board-tools.ts:18-74`). We can put the limits
   in the descriptions. Reason: less wasted work. This is a judgment call.

**The text that opens a turn**

8. **No `@` routing from model text.** The brief includes the first line that
   `board_add` wrote, the results of the needs, and the `later` note
   (`wiring.ts:67-76`, `:154-159`). `roomResponders` reads each `@` name in it
   (`server/store.ts:225-234`). A bot that writes "@everyone" in a brief
   starts each bot of the room. We can build the opening from stored fields,
   send it to the holder only, and quote model text as data. Reason: our rule
   "Text that opens a delegated turn is built from stored data, never from
   model output". This is a judgment call: no release names it.

**Work done two times, or lost**

9. **Caller-made ids make a retry safe.** `board_add` and the person POST
   have no id from the caller (`routes/board-tools.ts:54-64`.
   `routes/board.ts:92-95`). A retry after a lost answer makes a second set of
   threads. A failed save after `openThread` leaves a thread with no item
   (`host.ts:162-169`). We can give each item a caller-made id (D17), and
   write the thread and the item in one transaction. Reason: "The same work
   done two times, or lost" (v0.1.83, v0.1.108).
10. **A question is sent once.** `ask` posts the question and fills the inbox
    before it moves the item (`routes/board-tools.ts:202-203`). If the move
    fails, the bot can ask again, and the person gets the question two times.
    We can save the move first and send after the commit. Reason: "The same
    work done two times, or lost".
11. **A settle comes from the turn that holds the item.** The holder check is
    by bot id (`state.ts:111`). A turn of the same bot in another thread can
    settle the item. A change of labels has no check at all
    (`routes/board-tools.ts:224`). A person's `done`, `cancel` or DELETE during
    a turn throws away what the bot found (`routes/board.ts:104-107`). We can
    check the claim of the calling turn, and keep a late result as a note on
    the item. Reason: "The same work done two times, or lost".

**One stuck part, the scan, the tool list**

12. **A cap holds its own bot.** One bot's usage cap stops each room
    (`dispatcher.ts:85-92`, `:141`). We can hold all rooms only for the shared
    spend limit, and skip only the capped bot for its own cap. Reason: "One
    slow or stuck part blocks the others" (v0.1.114, v0.1.153).
13. **Read only open items.** Each `list` runs `alive()` on each item of the
    file (`host.ts:86-93`). The pass lists the board again for each pair of
    an item and a bot (`dispatcher.ts:121`, `:140`). Settled items are never
    pruned, and `board_list` can hide an old open item behind newer settled
    ones (`routes/board-tools.ts:179-185`). We can read open items through an
    index, and page the list. Reason: section 7 of the changelog, "The runtime
    scans all ended work" (fixed in v0.1.109 and v0.1.165, see
    [`assignment-runtime.md`](assignment-runtime.md) section 3.13). It is not
    a theme of section 5.
14. **The tools are a group that a person can switch off.** The three tools
    are core tools (`agents-tool-groups.ts:35`). They add 2,055 bytes to each
    turn of an engine that lists all tools (`profiles.json:1880`, `:1954`).
    They sit in the middle of the catalog, so the switch changes the cached
    part of each tool after them (`agents-catalog.ts:655`). We can put them in
    a tool group, at the end of the list, and measure them in the golden test.
    Reason: "The size of the tool list of one turn" (v0.1.101, v0.1.111,
    v0.1.120, v0.1.141).

**The switch**

15. **A setting, not a capability flag.** The reference project reads a
    config switch and the Team Cloud kind (`server/index.ts:1802`, `:11371`).
    No driver capability is involved. We follow the reference with one
    setting, read by the step that builds the board. We have no Team Cloud
    (D10). Reason: D22.

### 8.1 The problems of `changelog.md` section 5 in this code

| Problem | In the reference project here |
|---|---|
| A turn or a wait that does not end | Present: a `ready` item no bot can take, a need that failed, a question with no answer, a lease kept by talk in the thread (sections 3.9, 3.11). Guarded: 3 tries, 20 `later` moves, 1,440 minutes at most. |
| The same work done two times, or lost | Present: a retake after a crash or a lost lease redoes work. No idempotency for `board_add`. A thread with no item after a failed save. A question sent before the move. A result thrown away by `done`, `cancel` or DELETE during a turn. Guarded: two bots cannot take one item in one process. |
| A feature added, then removed | Present in part: the promise of a Board page was dropped. No board code was reverted. The plan of 2026-08-31 was never built. |
| "Busy" and races between bots | Present: "free" is a set of flags in memory. A person's reply makes a bot hold two active items. The lease guesses the end of a turn. Three lease fixes came inside #7411. |
| The size of the tool list | Present: +3 core tools, +2,055 bytes for each turn. Guarded: deferred for Claude, hidden behind the bridge. |
| State lost at a restart | Present: the dispatcher's memory is lost, the thread maps are lost, and a cut take spends a try. Guarded: the items, tries and `later` times are in the file. |
| A file written over after a failed read | Present: an unreadable or newer `board.json` becomes an empty board, then the next change erases it. |
| Sign-in to an engine, engine CLIs that change | Present in part: a fix inside #7411 skips bots whose engine is refused or signed out (`modelReady`, `server/index.ts:11371`). Before it, the dispatcher could give an item to a bot that could not run it. |
| Tests that fail by chance | Present in part: two commits inside #7411 fix the timing of the dispatch end-to-end test. The test runs the waits 20 times faster (`OMB_BOARD_TIME_SCALE=0.05`). |
| One slow or stuck part blocks the others | Present: one bot's cap stops each room. The synchronous write with `fsync` runs on the one event loop for each change. A board call has no client time limit. |

## 9. Not verified

No reader ran a test or a server.

**Reference behaviour traced in code only**

- Whether the `bot` change of the store comes before or after the end of the
  room turn operation. If it comes before, the dispatcher sees the end up to
  15 s later.
- Whether the unattended-turn limits (4 hours, 400 requests, 5 denials) apply
  to a board turn. The room member path (`server/index.ts:9460-10300`) has no
  `markUnattended` call. Only the room turn timeout was found.
- Whether the runtime re-runs a cut board turn after a restart, for each kind
  of cut turn.
- Whether `alive()` can be false for a thread that still exists, for example
  before the room store loads. If it can, the items are deleted for good.
- What `messageTextRefusal` checks in the person POST.
- How the outer HTTP handler turns a 401 from `requireActive` into an answer.
- Whether a turn with no outside access ("a confined turn",
  `docs/team-board.md:85-86`) can call the board tools. The tool routes have
  no such check, and the route list of such a turn was not read.
- Whether the bot-written brief is redacted for secrets. No redaction was
  seen in `wiring.ts:154-159`.

**Not read**

- `server/atomic.ts` lines 121-142.
- The phone app. Its source is not in the clone, so a phone UI of the board
  could not be checked.
- Whether a Team Cloud phone session has an email, and so can use the person
  routes.
- How an older client treats the unknown `board.item` frame.
- `docs/research/changelog-check.md` section 6.

**Our side**

- The research files of batch 6 are at `eee23ebbe`. This file cites their
  sections, not their reference lines, because those lines can differ at
  `140172d88`.
- The highest P-number in `docs/plan/` was P470 at the time of reading.
  Other open branches can hold later numbers.
