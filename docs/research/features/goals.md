# Goals: the goal run, the live goal card and the `/goal` command

This file is for the feature row `plans/2026-09-02-goal-mode-v2.md` of
[`../reference-features.md`](../reference-features.md) (line 431). It is
part 63 of [`../README.md`](../README.md). Its plan group is "later", and
it has no step of [`../../plan/README.md`](../../plan/README.md) yet. A port
goes to `bot-core` (the goal loop and its record), `bot-protocol` (the card
and the decision types) and `bot-desktop` (the card and the composer).

- **Reference commit:** `fcce0b6de`, 13 commits after the tag v0.1.182.
  No tag after v0.1.182 exists at this commit, so no newer release note
  exists. Each line number in this file is at that commit. None of the 13
  commits changes a goal file (`git show --stat` of each).
- **Method:** eight readers read eight groups of files, each completely or
  in recorded ranges. The lead then read the key code again (section 2.9).
- **Names:** "the reference project" is the other project. Paths are
  relative to its root. Quoted strings keep their text. The reference
  writes its product name into some strings. This file writes
  `<product>` in its place. The one exception is the tag of the control
  envelope, `<openmaus-goal>`: it is a literal of the code
  (`server/group-goal-run.ts:10-11`), and the other research files also
  quote such literals.
- **Border with the files that are done:**
  - [`automations.md`](automations.md) has the routine side of a room
    goal: the `room-goal` target, the 720-minute run limit, `goalStatus`,
    `startGoal`, `interruptGoal` and the routine run card. This file adds
    how `finishGoalRun` maps each goal status (section 3.9), and that a
    goal run row never gets a cost (section 3.10).
  - [`chat-turns.md`](chat-turns.md) has `goalTurns.hasUnboundDiscarded`.
    This file adds the whole lead-turn guard (section 3.6).
  - [`bot-coordination.md`](bot-coordination.md) has room rounds and the
    30-minute wait for a busy member. This file adds what the goal loop does
    when that wait ends (sections 3.4 and 3.5).
  - [`usage-and-budgets.md`](usage-and-budgets.md) has the monthly spend
    limit and the room goal test of the limit. This file adds the
    one-on-one goal at the limit, and where the limit is checked in a goal
    (section 3.10).
  - [`assignment-runtime.md`](assignment-runtime.md) has `goalRunId` on the
    assignment row. This file adds how the host uses it (section 3.8).

## 1. In short

A **goal** is a request that a bot, or a team of bots, keeps working on
until the work is done. A normal message gets one reply. A goal gets many
turns, one after another, with no new message from the person between
them.

The person starts a goal in one of three ways:

- type `/goal <text>` in the composer.
- turn on the goal switch of the composer ("Finish together" in a room,
  "Work until done" in a one-on-one chat), then send the text.
- make a routine of the kind "team goal", which starts a goal at its time.

Terms used in this file:

- **Goal run:** one goal from its start to its end. Each run has an
  identifier, `runId`.
- **Lead** (the code says *coordinator*): the bot that decides each next
  step. In a room, the lead chooses which member works next. In a
  one-on-one chat, the bot is the lead and the only member. The code calls
  this "a room of one".
- **Worker:** a room member that the lead gives an assignment to.
- **Step:** one turn of one bot inside a goal run. Each step counts as one
  turn of the run.
- **Control envelope:** a private block that the lead writes at the end of
  each reply: `<openmaus-goal>{JSON}</openmaus-goal>`. The JSON is the
  **decision**: continue (with the next member and an instruction), or
  completed, needs-input or blocked. The server removes the envelope
  before the person sees the reply.
- **Goal card:** one chat message of the kind `goal.run`. It shows the goal,
  the status, the lead and the turn count. The server changes this one
  message in place while the run works. The card is the only stored record
  of a goal run.
- **Turn limit:** 13 turns for each run. At the limit, the run ends with the
  status `limit-reached`.
- **Wait cap:** a step waits at most 30 minutes for a busy bot.

The goal loop is the same for a room and for a one-on-one chat. The loop
itself has no I/O. The host gives it each step, and the host writes the
card. All loop state is in memory. **A restart ends every goal run.** At
the next start, the server changes each card that still says `working` to
`failed`, or to the result of its routine run. It does not continue the
goal.

The feature changed direction two times:

1. Goal mode v1 (2026-08-31) worked only in rooms. A busy member failed
   the whole run. The v2 plan (2026-09-02) replaced it with a wait for the
   busy bot and a reassignment.
2. A separate one-on-one `/goal` engine came on 2026-10-24 and was deleted
   two days later (1,087 lines). The one-on-one goal now runs on the room
   loop.

## 2. Files read completely

### 2.1 The loop and the wire types (reader goal-run-core)

| File | Lines | Read |
|---|---|---|
| `server/group-goal-run.ts` | 429 | all |
| `server/group-goal-run.test.ts` | 395 | all |
| `shared/group-goal-run.ts` | 1 | all |
| `packages/phone-protocol/src/group-goal-run.ts` | 28 | all |
| `packages/phone-protocol/src/wire.ts` | 1000 | 20-35, 425-500, 535-570 (each `goal` hit) |

### 2.2 The host modules (reader host-glue)

| File | Lines | Read |
|---|---|---|
| `server/host/goal-cards.ts` | 171 | all |
| `server/host/goal-turns.ts` | 99 | all |
| `server/host/one-on-one-goals.ts` | 230 | all |
| `server/host/one-on-one-goals.test.ts` | 136 | all |
| `server/host/peer-limit-resend.ts` | 207 | all |
| `server/host/usage-cap-gate.ts` | 189 | all |
| `server/harness/public-reply.ts` | 17 | all |
| `server/coordinator.ts` | 282 | 1-150 (the only `goal` hits are 80 and 90) |

### 2.3 The server wiring (reader server-wiring)

| File | Lines | Read |
|---|---|---|
| `server/index.ts` | 15253 | 215-236, 1950-2000, 2755-2762, 3455-3520, 3605-3630, 3765-3795, 3878-3890, 4090-4200, 4300-4410, 4955-4980, 5250-5262, 6240-6300, 6336-6346, 6364-6372, 7085-7092, 7428-7436, 7630-7646, 8450-8462, 8538-8548, 8570-8600, 8650-8735, 8770-8810, 9400-9460, 9780-9788, 10255-10268, 10400-10440, 10450-10860, 11930-11937, 15060-15090 (all 137 hits of `goal` or `spendCap`) |
| `server/routes/bot-messages.ts` | 875 | 135-142, 195-275 |
| `server/store.ts` | 2255 | 28, 880-945 |
| `server/message-db.ts` | 1000 | 1-100, 195-225, 465-490 |
| `server/runtime/runtime.ts` | 936 | 20-60, 155-180 |
| `server/runtime/store.ts` | 384 | 40-60 |
| `server/runtime/types.ts` | 402 | 85-105 |
| `server/runtime-coordinator.ts` | 773 | 100-120, 360-392 |
| `server/team-backup.ts` | 271 | all |
| `server/team-backup-words.ts` | 29 | all |

### 2.4 The spend cap and the routine side (reader spend-cap-and-routines)

| File | Lines | Read |
|---|---|---|
| `server/spend.ts` | 122 | all |
| `server/routine-recovery.ts` | 295 | all |
| `server/routine-run-limits.ts` | 25 | all |
| `server/routine-bounds.ts` | 184 | all |
| `server/spend-cap-api.test.ts` | 307 | all |
| `server/spend-cap-goal.e2e.test.ts` | 149 | all |
| `server/routines.ts` | 1553 | 100-115, 240-285, 370-392, 686-735, 845-870, 1052-1078, 1136-1215, 1255-1300, 1330-1420 |

### 2.5 The end-to-end tests (reader e2e-tests)

| File | Lines | Read |
|---|---|---|
| `server/group-goal-run.e2e.test.ts` | 1133 | all |
| `server/group-goal-run-one-on-one.e2e.test.ts` | 266 | all |
| `server/group-goal-wait-cap.e2e.test.ts` | 259 | all |

### 2.6 The UI (reader ui)

| File | Lines | Read |
|---|---|---|
| `src/components/GoalRunCard.tsx` | 119 | all |
| `src/components/GoalRunCard.test.ts` | 77 | all |
| `src/components/RichMessageRow.tsx` | 74 | all |
| `src/components/sidebar-preview.ts` | 112 | all |
| `shared/suggested-reply.ts` | 79 | all |
| `src/components/GroupView.tsx` | 625 | 1-60, 140-300, 340-440, 560-625 |
| `src/state/store.tsx` | 3258 | 112-140, 625-675, 1169-1215, 1275-1320, 1630-1665, 1728-1782, 2215-2250, 2300-2420, 2567-2610, 2706-2730, 2798-2815, 3030-3062 |
| `src/locales/en.json` | 12251 | 455-474, 3084-3094, 3172-3190, 5609-5619, 5944-5949, 8896-8926, 9245-9254, 10110-10113, 10140-10178 |
| `src/lib/composer-commands.ts` | 68 | 1-60 |

### 2.7 Other tests (reader other-tests)

| File | Lines | Read |
|---|---|---|
| `server/decider/auto-room-compat.test.ts` | 145 | all |
| `server/index.test.ts` | 15166 | 540-600, 755-845, 1600-1650, 1935-2010, 3985-4160 |
| `server/routines.test.ts` | 4561 | 1-125, 236-262, 575-600, 1185-1200, 2505-2780, 2900-2930, 3080-3285, 4090-4112, 4540-4561 |
| `server/team-backup.test.ts` | 448 | 1-90, 200-225 |
| `server/group-tasks.test.ts` | 265 | 95-200 |
| `server/routine-recovery.test.ts` | 549 | 1-60, 115-150, 260-300 |
| `server/room-roots.e2e.test.ts` | 667 | 1-40, 120-145, 455-560, 615-667 |
| `server/room-quoted-replies.e2e.test.ts` | 301 | 1-80, 230-301 |
| `server/routes/bot-messages.test.ts` | 825 | 365-380, 498-512, 765-780 (no goal test) |
| `scripts/testing/store-read-ratchet.test.ts` | 222 | 1-30, 55-80 |

### 2.8 Documents and history (reader plan-docs)

| File | Lines | Read |
|---|---|---|
| `docs/plans/2026-09-02-goal-mode-v2.md` | 197 | all |
| `docs/runtime-contract.md` | 144 | all |
| `docs/verification/group-local-vm.md` | 113 | all |
| `apps/docs/content/docs/features/automation.mdx` | 71 | all |
| `docs/verification/room-coordination.md` | 506 | 1-20, 80-140, 340-375, 440-460 |
| `docs/plans/2026-09-14-phase-0-foundation.md` | 448 | 1-20, 40-70, 200-245, 380-448 |
| `announcements/releases.json` | 1341 | 860-900, 1150-1250 (the only `goal` hits are 884 and 1237) |

The reader also read the commit messages and `git show --stat` of
`ed69ac676`, `ac41eb814`, `4af05e7e7`, `cd67a5575`, `bd59135ec`,
`2c4e5b70d`, `cbfb7a94a`, `12fc6ce7c`, `d97559347`, `5598f8811`,
`7eaaac9c7`, `ee98c5149`, `ec5c9ed0f`, `4793c9bce` and `0049316e0`.

### 2.9 Claims that the lead checked against the code

| Claim | Where | Result |
|---|---|---|
| 13 turns, 30-minute wait cap with a 1 s floor, 3 exhausted waits | `server/group-goal-run.ts:6-9` | agrees |
| A transient step gets one retry. A spend cap refusal gets none | `server/group-goal-run.ts:288-298` | agrees |
| A worker that is busy or parked counts as one exhausted wait. At 3, the run ends `blocked` | `server/group-goal-run.ts:405-418` | agrees |
| After the loop: `limit-reached`, "Paused at the 13-turn safety limit" | `server/group-goal-run.ts:426-428` | agrees |
| One-on-one: one deadline for the busy wait and the lost-slot retries | `server/host/one-on-one-goals.ts:105-137` | agrees |
| One-on-one: `turnCount` goes up only after `startTurn` resolves | `server/host/one-on-one-goals.ts:146` | agrees |
| One goal for each chat, refusal 409 | `server/host/one-on-one-goals.ts:171-173` | agrees |
| The `finally` ends a card that is still working as `failed` | `server/host/one-on-one-goals.ts:202-207` | agrees |
| Room step: after a lost claim race, a bot that is busy again gets a new wait with a new 30-minute timer. The step has no total deadline | `server/index.ts:10467-10527`, `:4154-4171`, `:9537-9541` | agrees. This is a new finding (section 8, P538) |
| The room composer's Stop ends a room goal | `src/components/Composer.tsx:443-445`, `server/index.ts:4370-4391` | agrees |
| A restart rerun of a goal step is refused | `server/index.ts:3776-3778`, `:3790-3792` | agrees |
| At start, each `working` card is closed. A routine run result wins | `server/store.ts:892-933`, `server/index.ts:8777-8800` | agrees |
| `finish` of a card runs once, and settles the routine run before the card | `server/host/goal-cards.ts:94-110` | agrees |
| A room goal run never adds `turn.completed` cost to its routine run | `server/routines.ts:1262-1269`, `:1289` | agrees |
| `finishGoalRun` saves with `saveLater`, not at once | `server/routines.ts:1335-1366`, `failRun` at `:1382-1385` | agrees |
| The goal route on the bot route | `server/routes/bot-messages.ts:245-258` | agrees |
| The lead-turn guard keeps a discarded turn for 5 minutes | `server/host/goal-turns.ts:13` | agrees |
| The separate one-on-one engine was deleted, 1,087 lines | commit `d97559347` | agrees |
| Only a one-on-one card has a Stop button | `src/components/GoalRunCard.tsx:98-119` | agrees |
| No code sets a goal to `paused` | `git grep` of `server`, `shared` and `packages` for a finish or status of `"paused"` | agrees (no hit outside tests) |

## 3. How it works

### 3.1 Start a goal from the composer

1. The composer reads `/goal <text>` with `/^\/goal(?:\s+([\s\S]*))?$/i`
   (`src/lib/composer-commands.ts:45-48`). The rest of the text is the goal.
2. When the person picks `/goal` from the command menu, the composer stays
   empty and changes its mode to goal: "/goal only flips the composer's
   mode" (`src/lib/composer-commands.ts:56-58`).
3. A room uses the help text "Keep a team working until the goal is
   complete". A one-on-one chat uses "Keep this bot working until the goal
   is complete" (`src/locales/en.json:3090-3091`). The switch is "Finish
   together" or "Work until done" (`:3175-3178`).
4. A room send is `POST /api/groups/<id>/messages` with `mode` always set
   (`src/state/store.tsx:2577-2585`). A one-on-one send is
   `POST /api/bots/<id>/messages` with `mode: "goal"` only in goal mode
   (`src/state/store.tsx:2341`).
5. The draft of each task keeps its mode (`src/lib/drafts.ts:128-136`).

### 3.2 Start a one-on-one goal: the server

1. The route accepts `mode` only as absent, `"chat"` or `"goal"`. Other
   values give 400 "mode must be chat or goal"
   (`server/routes/bot-messages.ts:246`).
2. A goal must be plain typed text. A guarded send, a widget press, an app
   message or a pointed pick gives 400 "a goal is a plain typed message"
   (`:248`).
3. The thread must be a task of this bot, else 404 (`:249`).
4. `directSendRefusal` runs (`:250-251`). It gives 409 `code: "spend_cap"`
   when the monthly spend limit or a usage cap stops the turn, and 409 for a
   moved bot (`server/index.ts:7085-7092`).
5. Idempotency: a `sendId` that matches a stored line with the same text and
   mode returns 202 with that line, and no second goal starts. A `sendId`
   that belongs to another line, or to the same line in another mode, gives
   409 "sendId already belongs to another message" (`:252-255`,
   `server/send-idempotency.ts:19-37`).
6. `goals.start` (`server/host/one-on-one-goals.ts:168-209`):
   1. The bot and its task must exist, else 404 (`:170`).
   2. If a goal is live in this thread, it gives 409
      `serverError.goal.alreadyRunning`: "A goal is already running in this
      chat. Stop it before starting another." (`:171-173`,
      `src/locales/en.json:10112`).
   3. It stores the person's line with `channelMode: "goal"` (`:174-181`).
   4. It posts the card with `runId` = the routine run id, or
      `goal-<time in base 36>-<uuid>` (`:183-187`).
   5. It starts `runGoalRun` with `solo: true` and `members: [bot]`, and does
      not wait for it (`:190-201`).
   6. If the loop throws, the card ends `failed` with the error text
      (`:202`). In all cases, a `finally` ends the card `failed` with "The
      goal run ended before the bot reported an outcome." This does nothing
      when the card has already ended, because `finish` runs only one time
      (`:203-207`, `server/host/goal-cards.ts:94-95`).
7. The route answers 202 with the person's line (`:256-257`).

### 3.3 Start a room goal: the server

1. The room route accepts `mode` as `"chat"` or `"goal"`. A goal in a
   bot-to-bot room gives 400 "goal mode is available in team channels, not
   bot-to-bot channels". A pointed goal gives 400
   (`server/routes/channels.ts:416-421`, `:443`).
2. The route checks the monthly spend limit before the send and gives 409
   `code: "spend_cap"` (`server/routes/channels.ts:431-434`).
3. `startGroupTurn(..., channelMode = "goal", ...)` (`server/index.ts:10566-10584`):
   1. The goal members are the members that are not hidden, not held in
      this room, and not at home in another place of the person
      (`server/room-routing-members.ts:8-11`).
   2. A requested lead must be an active member, else 409 (`:10599-10604`).
   3. The lead is: the requested lead, else the first goal member that the
      text @mentions, else `selectGroupGoalCoordinator` (`:10681-10684`).
      That function uses the room's default responder if it is active, then
      the first Chief of Staff, then the first active member
      (`server/group-goal-run.ts:171-183`).
   4. In goal mode, page picks and automatic routing are off
      (`:10606-10607`, `:10674`, `:10693`).
   5. It posts the card at once, before the room queue runs
      (`:10744-10746`).
   6. It puts the run on the queue of the thread (`:10747-10748`). If an
      earlier speaker is still stopping, the run ends there. The card
      ends `failed` with "The team run ended before the lead reported an
      outcome." (`:10750-10758`, `:4100-4101`).
4. A goal that the person sends while the room is busy waits in the queue
   with its mode. The queue row keeps `mode` (`server/message-db.ts:209`,
   `server/index.ts:10847`).
5. If the chosen lead is paused, the run ends `blocked` with 0 turns. It
   does not choose another lead. A member held in the room is never the
   lead, even with an @mention (`server/room-quoted-replies.e2e.test.ts:260-300`).

### 3.4 The goal loop: `runGoalRun`

The loop is in `server/group-goal-run.ts:300-429`. It reads and changes only
what the host gives it in `GoalRunDeps` (`:272-286`).

1. The loop runs while the run is not cancelled and
   `turnCount < maxTurns` (`:313`).
2. **The lead's step.** The loop builds the lead's prompt and runs the step
   with one retry (section 3.5) (`:314-325`). The prompt
   (`:195-227`) has:
   - "You are working alone toward a bounded goal." (solo), or "You are
     the lead coordinator for a bounded team goal run.".
   - the goal, and for a team, the members with their ids.
   - "This is turn N of M; R turn(s) remain after this one."
   - a "Harness note" line when the loop has one.
   - "Do not claim completion unless the requested deliverable or answer is
     present in the conversation.".
   - an example envelope, and "Never mention, quote, or explain the control
     envelope in your human-facing text."
3. If the run was cancelled during the step, the loop stops and does not
   write the card. The code that stopped the run owns the end status
   (`:326`).
4. The loop reads the outcome of the lead's step:
   - `unavailable`: `blocked`, "<lead> is not available." (`:327-330`)
   - `spend_capped`: `blocked`, with the cap text. No retry (`:331-334`).
   - `busy`: `blocked`, "<name> stayed busy for N minute(s) — send the goal
     again when they are free." A busy lead ends the run at once
     (`:335-341`).
   - `parked` (waits for a computer): `blocked`, "... — send the goal again
     when the computer is free." (`:342-348`)
   - any other outcome that is not `settled`: `failed`, "<lead> could not
     complete the coordination step" (`:349-353`).
5. The loop reads the decision from the reply (section 3.7). No valid
   decision: `blocked`, "<lead> did not provide a valid next-step
   decision." (`:355-359`). A reply with no envelope never counts as done.
6. `completed`, `needs-input` or `blocked`: the run ends with that status and
   the `detail` of the decision (`:360-363`).
7. `continue` on the last turn: the loop leaves, and the run ends
   `limit-reached` (`:364`, `:426-428`).
8. The loop finds the `next` member by exact id, or by exact name when only
   one active member has that name. It removes a leading `@` and ignores
   case. It never matches a prefix (`:185-193`). No match: `blocked`, "<lead>
   selected a teammate who is not an active member of this channel."
   (`:366-370`). The loop reads the member again from the store. A member
   that is gone or hidden now gives `blocked` (`:371-375`).
9. **No-progress guard.** The key is the member id and the instruction, in
   lower case with spaces made one. The third same key gives `blocked`,
   "The team repeated the same assignment three times without resolving the
   goal." (`:246-248`, `:376-382`)
10. **Solo continue.** In a one-on-one goal, `next` is the bot itself. The
    loop keeps the note "Your next step: <instruction>" for the next lead
    prompt, and goes to step 1. There is no worker step (`:383-386`).
11. **The worker's step.** The worker prompt has the goal, the lead's name,
    the lead's instruction as the assignment, and "team turn N of M". It
    says: "Do not invent a new orchestration protocol or emit an
    openmaus-goal control envelope." (`:229-244`, `:388-395`)
12. The loop reads the outcome of the worker's step:
    - `unavailable` or `spend_capped`: `blocked`, as for the lead
      (`:397-404`).
    - `busy` or `parked`: one more exhausted wait. At 3: `blocked`,
      "Teammates stayed busy past the wait limit 3 times — try again when
      the team is free." Below 3: an activity line "<reason> — asking <lead>
      to reassign", and a harness note for the lead: "... could not take the
      assignment "<instruction, 160 characters>". Reassign it to another
      available member, do it yourself if you can, or report blocked."
      (`:405-418`)
    - not settled, or an empty reply: `failed`, "<worker> could not return a
      result to <lead>" (`:419-423`).
    - settled with text: go to step 1. The loop does not give the worker's
      reply to the lead. The lead reads it in the conversation: "Use the
      conversation as the progress ledger." (`:216-218`)
13. After the loop, if the run is not cancelled and not ended, it ends
    `limit-reached`: "Paused at the 13-turn safety limit. Send the goal again
    to continue with a fresh bounded run." (`:426-428`)

Turn count: in a team, one cycle is the lead and one worker, so two turns.
The limit 13 is odd, so the last turn is always the lead's
(`:6-7`). A solo run uses one turn for each cycle (`server/group-goal-run.test.ts:175-183`).

### 3.5 One retry for a transient step

1. A transient outcome is `provider_failed`, `dispatch_failed`, `stalled` or
   `timed_out` (`server/group-goal-run.ts:289`).
2. The comment says: "spend_capped is deliberately absent: a cap refusal is
   deterministic." (`:288`)
3. After a transient outcome, and if the run is not cancelled, the loop
   writes "{name}'s turn did not settle ({why}) — retrying once." on the
   card, and runs the same step one more time (`:291-297`,
   `src/locales/en.json:10143`).
4. The second result is final. The retry costs a turn
   (`server/group-goal-run.e2e.test.ts:1044-1045`: a provider crash gives
   `failed` with `turnCount: 2`).
5. The retry runs the same instruction again. Nothing checks whether the
   first attempt already did work outside the chat (see section 8, P540).

### 3.6 The private text of the lead

The envelope must never reach the person. Three guards do this.

1. **The lead-turn guard** (`server/host/goal-turns.ts`). The host calls
   `begin(threadId)` only for a lead step (`server/index.ts:10488`,
   `server/host/one-on-one-goals.ts:115`). While a lead turn is open:
   1. Each `assistant_text` item of that turn goes into a buffer and is not
      sent. Images and streamed deltas of the lead are dropped
      (`server/index.ts:6260-6279`). The comment says: "a model can split
      the private envelope across items, so item-by-item sanitizing would
      leak it" (`:6260`).
   2. At `turn.completed`, the host joins the buffer, removes the envelope,
      removes secrets, and sends the rest as one new item with the id
      `<eventId>-goal-text` (`:6280-6295`).
   3. An event maps to a lead turn by its `turnId`. An event with no
      `turnId` maps only when exactly one lead turn is open. If not, the
      text stays private: it "fails closed" (`server/host/goal-turns.ts:37-65`).
   4. A lead turn that ended `timed_out` or `stalled` stays as a discard
      guard for 5 minutes. Its late text is dropped, and its provider turn
      id is retired at once (`:13`, `:50-51`, `:73-87`).
2. **The stored text.** Before the host stores a bot line that has the tag,
   it removes each envelope (`server/index.ts:6369`).
3. **The public reply.** `savedReplyText` removes the envelope from each
   finished `assistant_text` item that goes to clients
   (`server/harness/public-reply.ts:9-14`).

`visibleCoordinatorText` removes each envelope, plain or with an escaped
close tag. It cuts an open tag with no close tag to the end of the text:
"Never expose a half-written control marker or JSON fragment"
(`server/group-goal-run.ts:41-68`). Since commit `ec5c9ed0f` (2026-11-11),
the host removes the envelope from every reply of the bot. Before, a lead
turn that a teammate's result woke could show the envelope to the person.

A lead turn does not add to the room memory (`server/index.ts:5257`). Files
that a lead turn parks are discarded (`:6342`).

### 3.7 Read the decision

`parseGroupGoalDecision(text)` (`server/group-goal-run.ts:141-169`):

1. Find the last close tag, plain or escaped. Find the last open tag before
   it. If the JSON between them parses, use it. "The last complete envelope
   wins, so a quoted example earlier in the reply cannot steer the run."
   (`:141-156`)
2. If not, recover a cut envelope: the text must have exactly one open tag,
   at the start of its own line. Parse from there to the end (`:158-167`).
3. `parseDecisionPayload` (`:94-129`):
   1. Take the first balanced JSON object after the tag (`:70-92`).
   2. If more text follows with another tag or another `{`, refuse it: "a
      second decision object or a control marker means the reply
      contradicts itself" (`:104-115`).
   3. `continue` needs a `next` and an `instruction` that are not empty.
      `completed`, `needs-input` and `blocked` need a `detail` that is not
      empty. Any other status is refused (`:118-128`).
   4. Lengths are cut: `detail` 500, `next` 100, `instruction` 2,000
      characters (`:117-120`).

The model can choose only `continue`, `completed`, `needs-input` or
`blocked` (`:15-17`). Only the host sets `limit-reached`, `stopped` and
`failed`.

Release v0.1.154 (2026-11-12) has: "Goals: a decision is recovered when its
closing tag is missing or followed by extra text."
(`announcements/releases.json:1237`). Before commits `4793c9bce` and
`0049316e0` (issue #5209), only an exact close tag worked, and a cut or
escaped tag ended the run `blocked`.

### 3.8 One step: the host

**A one-on-one step** (`server/host/one-on-one-goals.ts:98-165`):

1. One deadline for the whole step: now plus 30 minutes. "the busy wait and
   the lost-slot retries share it, so neither restarts the clock"
   (`:105-106`).
2. `waitUntilFree` (`:66-96`):
   1. It returns `cancelled`, `unavailable` (bot or task gone) or `ready`.
      Ready means that a direct turn can start now and no teammate still
      holds work from this chat (`:60-64`, `server/index.ts:3506-3508`).
   2. If it waits, the card says "<name> is finishing what it is doing. This
      goal will continue when it is free." (`:70-71`).
   3. It checks again each 1 s, on each store change of the bot, and when
      `stop` wakes it. At the deadline it returns `timed_out` (`:72-95`).
3. `timed_out` gives the outcome `busy` with "<name> stayed busy for N
   minute(s)" (`:100-104`, `:112`).
4. It opens a lead turn guard and calls `startTurn` with
   `cardContinuation: true` and `goalRunId` (`:115-127`).
5. If `startTurn` refuses with `thread_busy` or `thread_limit`, it waits
   250 ms and tries again, within the same deadline (`:131-137`). Commit
   `7eaaac9c7` (#3967) added this limit. Before, the retry had no deadline
   and counted no turn, "so the run could spin forever".
6. `spend_cap` adds an activity line and gives `spend_capped`. Other errors
   give `dispatch_failed` (`:138-144`).
7. Only after `startTurn` resolves: `turnCount` goes up by one, and the card
   says "<name> is working on turn N of M." (`:146-148`). A lost race uses
   no turn.
8. It waits for the turn to settle. The outcome is `stalled`, `settled` or
   `provider_failed`. The reply text is the lead's buffer (`:149-157`).

**A room step** (`server/index.ts:10454-10536`):

1. `waitForGroupMemberBot` claims the member, or waits up to 30 minutes for
   it. The claim is "One synchronous step, so threads woken by the same
   release cannot all read the member as free" (`:4142-4147`). A last check
   "Close[s] the read→subscribe race" (`:4192`).
2. While it waits, the card says "<name> is finishing another conversation.
   This goal will continue when they are available." (`:10467-10470`,
   `:4156`).
3. `timed_out` gives `busy` with "<name> stayed busy in another conversation
   for N minute(s)" (`:10476-10484`).
4. `runGroupMemberTurn` runs the turn with `goalRunId`. `onClaimed` adds one
   to `turnCount` (`:10490-10519`).
5. "Busy here is a lost claim race, so retry in-step" (`:10526`). The loop
   goes back to step 1. `waitForGroupMemberBot` claims the member at once
   when it is free (`:4154-4155`). When the member is busy again, a new wait
   starts with a new 30-minute timer (`:4171`). `runGroupMemberTurn` gives
   `busy` when the bot is busy after the wait ("the last-line guard for a
   1:1 that re-claimed the bot after the member wait settled", `:9537-9541`),
   and when the bot changed during the start (`:9711`, `:9727`, `:9742`,
   `:9757`). So the room step has no total deadline, unlike the one-on-one
   step (section 8, P538).

**What `goalRunId` changes** (`server/coordinator.ts:80`, `:90`,
`server/runtime/types.ts:96-98`):

1. Each step is a root of the runtime with `goalRunId`
   (`server/index.ts:7635-7640`, `:9785`). A one-on-one step is a card
   continuation, but it still begins its own root, so it can give work to
   teammates (commit `ee98c5149`, #4370).
2. The runtime never parks a goal step on a person's card. The goal loop
   decides (`server/index.ts:1957-1966`).
3. A goal step does not go to the backup engine of the peer resend module
   (`server/host/peer-limit-resend.ts:101`). It also gets no computer
   selection (`server/index.ts:7645`).
4. When the automatic engine fallback runs for a goal step, the first root
   ends, and the backup begins a new root (`server/index.ts:8456-8461`).

### 3.9 Stop and end

1. **One-on-one Stop.** The person's Stop of the chat calls
   `oneOnOneGoals.stop(threadId)` (`server/index.ts:2760`). `stop` marks the
   goal cancelled, removes it, ends the card `stopped` "Stopped by you.",
   and wakes a waiting step (`server/host/one-on-one-goals.ts:212-220`). "the
   turn in flight is the caller's to interrupt" (`:211`). A late reply of
   the stopped turn is not stored, and no new turn starts
   (`server/group-goal-run-one-on-one.e2e.test.ts:184-199`).
2. **Room Stop.** `POST /api/groups/:id/interrupt` cancels the operations
   of the thread and ends the card `stopped` (`server/index.ts:4370-4391`).
   It does not stop the bot's direct work in another chat
   (`server/group-goal-run.e2e.test.ts:453-541`).
3. The lead's own Stop also stops a scheduled goal while the lead runs a
   goal turn. A Stop of an unrelated direct turn of the lead does not stop
   the goal (`server/group-goal-run.e2e.test.ts:647-867`).
4. **Card end** (`server/host/goal-cards.ts:86-143`):
   1. It runs only one time (`:94-95`).
   2. It cuts `detail` to 500 characters and removes secrets (`:97`).
   3. It calls `routines.finishGoalRun(runId, status, detail)` first (`:110`).
   4. If the routine run now waits, it sends a "question" notice. If the goal
      completed, it sends a "done" notice. A goal that the person started
      sends no notice (`:111-137`).
   5. If the chat was deleted, it does not change the card (`:138`).
5. **The routine run** (`server/routines.ts:1335-1366`):
   - `completed` gives a `completed` run with `output` = detail (2,000
     characters).
   - `stopped` gives `cancelled`.
   - `needs-input` and `paused` give `waiting`, with the detail as
     attention.
   - `failed`, `blocked` and `limit-reached` give `failed`.
   - Commit `bd59135ec` made this mapping. Before, `needs-input` gave a
     completed, green run and a "done" notice.

### 3.10 The spend cap and the cost of a goal

1. A goal has no own cost and no own cap. The monthly spend limit is one
   total for the workspace (`server/spend.ts:22-36`).
2. The limit is checked before each step, not one time for each goal:
   `assertWithinBudget` before a direct turn and before a room member turn
   (`server/index.ts:7472`, `:9591`).
3. A step that the limit refuses gives `spend_capped`, an activity line with
   the cap text, and no turn (`server/host/one-on-one-goals.ts:138-140`,
   `server/index.ts:10411-10432`). The loop ends the run `blocked` with no
   retry.
4. The turn that goes over the limit is not cut. The next step is refused
   (`server/spend-cap-goal.e2e.test.ts:40`). So a goal can spend one turn
   more than the limit.
5. A usage cap (not the monthly limit) stops a scheduled goal step, but not a
   goal that the person started. A goal step is a card continuation, and
   `personWaiting` is true for it unless the chat is unattended
   (`server/usage-caps.ts:260`, `:277-285`).
6. A routine run of a room goal never gets a cost. The run returns at
   `turn.completed` before the line that adds `event.cost`
   (`server/routines.ts:1262-1269`, `:1289`,
   `server/routines.test.ts:3101-3117`). The money of a goal is only in the
   usage rows of each member turn.
7. The goal card has no cost field
   (`packages/phone-protocol/src/group-goal-run.ts:14-28`). The v2 plan
   puts "a spend ceiling alongside the turn budget" and a token budget in
   "Later" (`docs/plans/2026-09-02-goal-mode-v2.md:170`, `:181`).
8. Already in [`usage-and-budgets.md`](usage-and-budgets.md): one cost
   number was corrected. Commit `938fa58c3` counts a booked turn
   until its ledger row lands. Before, the cached month total did not have
   the last turn, so for 15 s the next turns were not refused. A test now
   waits for the usage ledger before it counts goal turns (commit
   `11bb8f4e8`).

### 3.11 Restart

1. All goal state is in memory: the run loop
   (`server/group-goal-run.ts:303-312`), `LiveGoalRun`
   (`server/host/goal-cards.ts:12-22`), the live map of one-on-one goals
   (`server/host/one-on-one-goals.ts:54`), the room operation
   (`server/index.ts:3467-3471`) and the lead-turn guards
   (`server/host/goal-turns.ts:16`). A test comment says: "Goal orchestration
   is process-local" (`server/index.test.ts:765`).
2. At start, `reconcileInterruptedGroupGoals` finds each `goal.run` message
   with `status = 'working'` in a thread that a bot or a room owns
   (`server/store.ts:892-911`, `server/message-db.ts:472-480`).
3. For a card of a routine run, the run's status wins. The comment says:
   "Separate durable stores: after a crash between the two writes, the
   correlated RoutineRun's terminal state wins." (`server/index.ts:8777-8800`)
4. Each other card gets `failed`, "<product> restarted before this goal
   finished." (`server/store.ts:900`, `:912-916`).
5. The runtime runs a cut root again after a restart. For a goal step whose
   run is not live, the host refuses with "The goal run this step belonged
   to ended with the restart." It shows no notice in the chat
   (`server/index.ts:3776-3778`, `:3790-3792`,
   `server/room-roots.e2e.test.ts:498-524`, `:649-664`).
6. A routine run of a room goal that was `running` or `waiting` cannot run
   again. It fails with "<product> restarted while this routine was running"
   and `goalStatus: "failed"` (`server/routines.ts:376-386`). See
   [`automations.md`](automations.md).
7. A goal that the person sent while the room was busy, and that was in
   dispatch at the crash, is shown again for review. It is not sent again
   (`server/index.ts:15071-15086`).
8. The goal does not continue. The v2 plan wanted `paused` after a restart,
   with a resume (`docs/plans/2026-09-02-goal-mode-v2.md:71-73`). The
   shipped code closes the card instead (`:186-190`).

### 3.12 A backup

1. An export keeps a goal card only as readable text:
   `[Goal: <status>]`, the goal and the detail, with a fixed text code
   (`server/team-backup.ts:36-52`, `server/team-backup-words.ts:13-20`).
2. An import makes each message `kind: "text"`. A card never comes back as a
   live card (`server/team-backup.ts:220-221`,
   `server/team-backup.test.ts:63-81`).
3. A room-goal routine is exported only when its bot, room and lead still
   exist. Imported routines are off (`server/team-backup.ts:105-110`,
   `:252-255`).

### 3.13 Routine goals

[`automations.md`](automations.md) has the routine flow. New points:

1. A routine goal always runs in a new task. In a room, it is a background
   task of the room. With no room, it is a new task in the bot's own chat:
   "Just the bot, in its own chat" (`server/routines.ts:1148-1155`,
   `src/locales/en.json:5948`).
2. The prompt goes to the goal as it is. It does not go through the prompt
   builder of a bot run (`server/routines.ts:1172-1191`).
3. A failed room-goal run never runs again by itself
   (`server/routine-recovery.ts:166`, `:221`).
4. An enabled team-goal routine or an open run can need the lead of a
   room. Then a person cannot remove that lead: 409 "pause or reassign this room's
   team-goal routine before removing its lead" (`server/index.ts:3613-3628`).

## 4. The data

### 4.1 The card: `GroupGoalRunCardData`

`packages/phone-protocol/src/group-goal-run.ts:14-28`. Its doc says
"Durable progress receipt for one goal-driven channel run" (`:2`).

| Field | Type | Note |
|---|---|---|
| `runId` | string | the routine run id, or `goal-<base36 time>-<uuid>` |
| `goal` | string | the goal text, secrets removed |
| `status` | `GroupGoalRunStatus` | see 4.2 |
| `coordinatorBotId` | string | the lead |
| `coordinatorName` | string | |
| `turnCount` | number | steps that started |
| `maxTurns` | number | 13 |
| `detail?` | string | the last progress line or the end reason, 500 characters |
| `detailCode?`, `detailParams?` | text key and values | "Fixed detail words, used only while they reconstruct the stored English" (`:23-24`) |
| `startedAt` | number | |
| `finishedAt?` | number | |

The card is the field `goalRun` of a message with `kind: "goal.run"`
(`packages/phone-protocol/src/wire.ts:443`, `:488-489`). The message row is
in the SQLite table `messages(thread_id, id, at, role, kind, text, json)`
(`server/message-db.ts:52-61`). A partial index helps the start-up scan:
`messages_goal_run ON messages(at) WHERE kind = 'goal.run'` (`:71-72`).
There is no goal table.

A person's line that started a goal has `channelMode: "goal"`
(`packages/phone-protocol/src/wire.ts:552-553`).

### 4.2 The statuses

`packages/phone-protocol/src/group-goal-run.ts:3-12`:

| Status | Who sets it | Card label (`src/locales/en.json`) |
|---|---|---|
| `working` | the host | "Working" (`:9247`) |
| `completed` | the lead's decision | "Completed" (`:5612`) |
| `needs-input` | the lead's decision | "Needs your input" (`:5613`) |
| `blocked` | the lead's decision, or the loop | "Blocked" (`:5614`) |
| `limit-reached` | the loop (13 turns), or a routine (its time limit) | "Turn limit reached" (`:5615`) |
| `paused` | no code sets it | "Paused" (`:5616`) |
| `stopped` | a Stop, or a routine | "Stopped" (`:5617`) |
| `failed` | the loop, or a restart | "Failed" (`:5618`) |

- `paused` came with commit `bd59135ec`, so that "a resume path later is a
  one-line change". No resume path exists.
- `limit-reached` has two meanings. From the loop it is the turn limit. From
  a routine it is the time limit (`server/routines.ts:1374-1379`). The card
  and the start-up text say "reached its turn limit" in both cases
  (`server/store.ts:920`).

### 4.3 The decision

`server/group-goal-run.ts:15-17`:

```text
{ status: "continue", next: string, instruction: string, detail?: string }
{ status: "completed" | "needs-input" | "blocked", detail: string }
```

Wrapped as `<openmaus-goal>{...}</openmaus-goal>` on its own line
(`:10-13`, `:220-224`).

### 4.4 The limits

| Name | Value | Where |
|---|---|---|
| `GROUP_GOAL_MAX_TURNS` | 13 | `server/group-goal-run.ts:7` |
| `GROUP_GOAL_WAIT_MAX_MS` | 30 min, env `OMB_GOAL_WAIT_MAX_MS`, at least 1 s | `:8` |
| `GROUP_GOAL_MAX_WAIT_EXHAUSTIONS` | 3 | `:9` |
| same assignment | 3 times | `:379` |
| transient retry | 1 for each step | `:288-298` |
| `detail` / `next` / `instruction` | 500 / 100 / 2,000 characters | `:117-120` |
| reason in a message | 120 characters | `:350`, `:411`, `:420` |
| instruction in a reassign note | 160 characters | `:415` |
| lost-race retry (one-on-one) | 250 ms | `server/host/one-on-one-goals.ts:50` |
| lead-turn discard guard | 5 min | `server/host/goal-turns.ts:13` |
| routine run of a room goal | 720 min of work | `packages/phone-protocol/src/routines.ts:122` |
| card detail on screen | 280 characters, 2 lines | `src/components/GoalRunCard.tsx:17`, `:93` |
| goal title on screen | 180 characters | `src/components/GoalRunCard.tsx:71` |

### 4.5 Memory only

| Object | Fields | Where |
|---|---|---|
| `LiveGoalRun` | `runId`, `cardMessageId`, `goal`, `coordinatorBotId`, `coordinatorName`, `turnCount`, `maxTurns`, `startedAt`, `finished` | `server/host/goal-cards.ts:12-22` |
| `LiveGoal` (one-on-one) | `run`, `botId`, `cancelled`, `wake?` | `server/host/one-on-one-goals.ts:41-46` |
| `GoalLeadTurn` | `token`, `turnId?`, `assistantItems`, `discard`, `cleanupTimer?` | `server/host/goal-turns.ts:4-11` |
| loop state | `assignmentCounts`, `coordinatorNote`, `waitExhaustions` | `server/group-goal-run.ts:303-312` |

### 4.6 Stored links

- The runtime assignment row has `goalRunId?`. "A root that is one step of a
  room goal run (the run's id): it neither parks nor continues in place and
  is not run again after a restart. Never changed after begin."
  (`server/runtime/types.ts:96-98`, `server/runtime/store.ts:52`). The
  runtime itself never reads it again. The host keeps the promise
  (`server/runtime/runtime.ts:51`, `:170`).
- A routine run has `target: "room-goal"`, `goalStatus?`, `groupId?` and
  `botId` (the lead). Its `id` is the card's `runId`
  (`server/routines.ts:52-53`, `:108-111`).

### 4.7 The design that did not ship

The v2 plan had a `GoalRecord` in `~/.<product>/goals.json`, with `kind`,
`waiting { onBotId, since, attempts }`, `receiptMessageId` and `source`
(`docs/plans/2026-09-02-goal-mode-v2.md:52-73`). It also had
`/goal status | pause | resume | stop` on `/api/goals/:id` (`:94-96`). The
delivery note says that this store stayed on a donor branch
(`:186-193`). The readers found no `goals.json` and no `/api/goals` route.
The wait-cap test calls `GET /api/groups/:id/goal-runs`, but no route has
that path (`server/group-goal-wait-cap.e2e.test.ts:209-210`).

## 5. The UI

### 5.1 The card: `GoalRunCard`

`src/components/GoalRunCard.tsx:59-110`:

1. With no `goalRun` payload, the card shows the message text, cut to 280
   characters (`:60-68`).
2. The title is the goal, cut to 180 characters, or "Group goal" (`:71`,
   `:88`).
3. The status label is in an `aria-live="polite"` span, so a screen reader
   reads each change (`:89-91`).
4. Each status has a colour and an icon. `working` has a turning loader.
   `completed` has a check. `failed` has a red X (`:19-56`). The table must
   have an entry for each status, so the type check fails for a new status
   with no entry (`:28-31`).
5. The detail line is built from `detailCode` and `detailParams` in the
   language of the viewer, cut to 280 characters and 2 lines (`:72`, `:93`).
6. While `working`, the turn line is "Turn {turnCount + 1} of {max}", never
   above the max. After the end, it is "1 turn" or "{count} turns"
   (`:73-75`).
7. A one-on-one card shows "<bot> · <turns>". A room card shows "<bot>
   coordinating · <turns>" (`:94-96`).
8. Only one button: Stop, only while `working`, and only on a one-on-one
   card. It sends the same `interrupt` as the Stop of the chat
   (`:98-119`). There is no Pause, Resume or Retry button.

### 5.2 Where the card shows

- In a one-on-one chat, `RichMessageRow` gives each `goal.run` row to
  `GoalRunRow`, which has Stop (`src/components/RichMessageRow.tsx:32-33`).
- In a room, `GroupView` shows `<GoalRunCard message={m} />` with no Stop
  (`src/components/GroupView.tsx:264-267`). The Stop of the room composer
  sends `interruptGroup` with the thread (`src/components/Composer.tsx:443-445`).
  That is `POST /api/groups/:id/interrupt`, which ends the goal (section
  3.9). The pill "Stop <name>" is different: it holds the bot that speaks
  now, not the goal (`src/components/GroupView.tsx:583-596`).
- The sidebar shows "<status label>: <detail or goal>" for a room whose last
  line is a card (`src/lib/sidebar-layout.ts:70-76`). It uses the stored
  English detail, not the text code.
- While a card is the newest row, the chat offers no suggested reply
  (`shared/suggested-reply.ts:30-34`, `:59`).

### 5.3 Live changes

1. The server changes the card message in place. The client gets a
   `message.patch` frame and replaces the row with the same id
   (`src/state/store.tsx:3055-3057`, `:1285`, `:1301`).
2. A patch for a row that is not loaded, or for a room task that is not
   open, is dropped. The row is correct again only after the transcript
   loads again (`:1279`, `:1285`, `:1301`).
3. The card has no timer. It says `working` until a patch comes.

### 5.4 Texts

| Key | English |
|---|---|
| `chat.notice.goalWaiting` | "{name} is finishing what it is doing. This goal will continue when it is free." |
| `chat.notice.goalWorking` | "{name} is working on turn {turn} of {max}." |
| `chat.notice.goalRetry` | "{name}'s turn did not settle ({why}) — retrying once." |
| `chat.notice.goalBusyOne`, `...Many` | "{name} stayed busy for {minutes} minute(s)" |
| `...Again` | "... — send the goal again when they are free." |
| `chat.notice.goalEnded` | "The goal run ended before the bot reported an outcome." |
| `serverError.goal.alreadyRunning` | "A goal is already running in this chat. Stop it before starting another." |
| `server.teammates.goal.*` | "Goal completed: {detail}", "Goal blocked: {detail}", and one for each status |

All are in `src/locales/en.json:457-472`, `:10112`, `:10143-10154`. No text
of the goal UI is about cost or a budget.

## 6. The tests

| Test | Where | What it proves |
|---|---|---|
| Lead, worker, lead, then completed | `server/group-goal-run.e2e.test.ts:234-278` | The order of speakers. Each step counts (`turnCount: 3`). No envelope in any stored line |
| Wait for a busy lead | `:280-356` | `working`, `turnCount: 0`, the room is not busy with that bot. The run completes on the same card |
| Wait for a busy worker | `:358-451` | The worker's direct turn is not stopped. The goal goes on after it |
| Stop a waiting goal | `:453-552` | Room Stop gives `stopped` and leaves the bot's direct work |
| Stop a scheduled goal | `:554-735` | Room Stop, or the lead's Stop in its goal turn, gives a `cancelled` run and a `stopped` card |
| Stop the lead's other turn | `:736-877` | The goal is not stopped. The test accepts a race (`:833`) |
| Turn limit | `:990-1021` | `limit-reached` at 13 |
| Provider crash | `:1023-1046` | `failed`, `turnCount: 2` |
| Mode and `sendId` | `:1048-1062` | Unknown mode gives 400. A `sendId` reused in another mode gives 409 |
| One-on-one done | `server/group-goal-run-one-on-one.e2e.test.ts:140-172` | 2 prompts. The second has "Your next step:". The same `sendId` gives the same line and one card |
| Envelope in another turn | `:174-182` | It is removed |
| One-on-one Stop | `:184-200` | 409 for a second goal. Stop gives `stopped`. The late text is not stored |
| No decision | `:202-219` | `blocked`, "did not provide a valid next-step decision" |
| One-on-one limit | `:221-227` | 13 prompts, `limit-reached` |
| One-on-one routine | `:235-260` | A routine with no room runs the goal in the bot's own chat |
| Worker busy past the cap | `server/group-goal-wait-cap.e2e.test.ts:136-175` | The lead reassigns, and the goal completes |
| Lead busy past the cap | `:177-195` | `blocked`, not `failed` |
| Lead crash | `:197-215` | One retry, then `failed` |
| Spend cap, room | `server/spend-cap-goal.e2e.test.ts:37-87` | `blocked`, one paid turn, no retry |
| Spend cap, one-on-one | `:117-148` | The same rule for a room of one |
| Spend cap, n turns | `server/spend-cap-api.test.ts:191-230` | Exactly n paid turns. The refused turn does not count |
| Restart | `server/index.test.ts:1609-1637` | A `working` card becomes `failed`, or takes the routine run result. Nothing runs |
| Restart, store | `server/group-tasks.test.ts:113-162` | The same at the store, for each room task |
| Restart, goal step | `server/room-roots.e2e.test.ts:498-524`, `:649-664` | The cut step is not run again, and no notice shows |
| Stalled step with a card | `:526-546` | The step fails `stalled`, and the credential card stops |
| One-on-one step gives work | `:627-647` | The step is a root. The child result comes later as a normal turn |
| Computer wait ceiling | `server/index.test.ts:3990-4155` | The parked worker step fails and never runs again |
| Lead protection | `server/index.test.ts:1939-1988` | 409 when a person removes the lead of a team-goal routine |
| Paused lead | `server/room-quoted-replies.e2e.test.ts:260-300` | `blocked` with 0 turns. A held member is not the lead |
| Routine mapping | `server/routines.test.ts:3083-3277` | Each goal status gives its routine run status. A late finish after a cancel does nothing |
| Backup | `server/team-backup.test.ts:63-81` | A card comes back as text only |
| Loop and parser | `server/group-goal-run.test.ts:24-394` | The parser, the lead choice, the solo loop, the retry and the limits |
| One-on-one lost race | `server/host/one-on-one-goals.test.ts:79-135` | The busy wait and lost races share one cap |
| Card | `src/components/GoalRunCard.test.ts:30-76` | Labels, the turn line and Stop on the one-on-one card only |

Not tested: 3 exhausted waits, `paused`, a lead that is `unavailable`, the
room lost-race loop, and a routine goal at the spend cap.

## 7. Ours compared

We have no goal code. The crates have only the first types of step 2
(`crates/bot-protocol/src/event.rs`, `ids.rs`, `message.rs`).

| Reference | Ours (planned) | Difference |
|---|---|---|
| `server/group-goal-run.ts` (the loop, pure) | `bot-core`, a module `goal` | none yet. The pure loop with an injected step fits a trait |
| `server/host/one-on-one-goals.ts`, `server/index.ts:10454-10563` (the step) | `bot-core::goal` with the step of the runtime (step 13) | the reference has two step code paths with different wait rules (P538) |
| `server/host/goal-cards.ts` | `bot-core` store and `bot-protocol` card type | the reference keeps the run in memory and the card in SQLite (P535) |
| `server/host/goal-turns.ts`, `server/harness/public-reply.ts` | `bot-core` fold (steps 7 and 8) | the reference hides a text envelope in three places (P536) |
| `packages/phone-protocol/src/group-goal-run.ts` | `bot-protocol`, a `goal` module | our status can be a Rust enum with one type for the decision and one for the end (P539) |
| `server/routes/bot-messages.ts:245-258`, `server/routes/channels.ts:416-443` | no HTTP (D10). A command of the desktop core | the same checks go into the core |
| `src/components/GoalRunCard.tsx`, `src/lib/composer-commands.ts` | `bot-desktop` | none yet |
| `server/routines.ts:1335-1366` (`finishGoalRun`) | `bot-core` routines (step 15) | the reference saves the routine run later, not with the card (P541) |
| `server/store.ts:892-933` (start-up repair) | `bot-core` start-up | the reference fails each goal at a restart (P535) |

Our rules that touch this feature:

- `AGENTS.md`: "The runtime in `bot-core` owns all work state." The
  reference says: "a room goal run still routes its steps outside the
  runtime" (`docs/runtime-contract.md:144`).
- `AGENTS.md`: "Text that opens a delegated turn is built from stored data,
  never from model output." The reference puts the lead's `instruction` into
  the worker's prompt (`server/group-goal-run.ts:229-244`) and into the next
  solo prompt (`:383-386`).
- `AGENTS.md`: "Every state change in the runtime writes the row and its
  event in one transaction before anything acts on it."

## 8. Where we can be better

Each point says what goes wrong in the reference, with the file and line.

- **P535. A goal run is a stored record of the runtime, and a restart pauses
  it.**
  - Problem in the reference: a restart ends every goal. The person sees
    "<product> restarted before this goal finished." and must send the goal
    again. All loop state is in memory (`server/group-goal-run.ts:303-312`,
    `server/host/one-on-one-goals.ts:54`, `server/store.ts:892-916`). This
    is "State lost at a restart or a crash" of `changelog.md` section 5
    (v0.1.24, v0.1.165).
  - Ours: one goal row in the store of `bot-core`, with the status, the turn
    count, the wait count, the assignment counts and the pending note. Each
    change writes the row and its event in one transaction. At start, a
    `working` goal becomes `paused` with a Resume, as the reference's own v2
    plan wanted (`docs/plans/2026-09-02-goal-mode-v2.md:71-73`). This also
    obeys our rule that the runtime owns all work state.
  - This is not only a choice "better than the reference". The reference
    says "a room goal run still routes its steps outside the runtime"
    (`docs/runtime-contract.md:144`). `AGENTS.md` says: "The runtime in
    `bot-core` owns all work state." To follow the reference, the author must
    write an exception to `AGENTS.md`.
  - Option a: the goal row is in the runtime, and a restart closes it as
    `failed`, as the reference does. Option b: the goal row is in the
    runtime, and a restart pauses it for a Resume. Option c: an exception to
    `AGENTS.md`, and the loop state stays in memory as in the reference.
- **P536. The decision is a typed tool call, not a text envelope.**
  - Problem in the reference: the parser of the text envelope failed when the
    close tag was cut, escaped or followed by text. Each such reply ended the
    goal `blocked` (issue #5209, release v0.1.154,
    `announcements/releases.json:1237`). The envelope also reached the person
    from a turn that a teammate's result woke (commit `ec5c9ed0f`). Three
    separate guards now hide it (section 3.6).
  - Ours: the lead calls one tool, for example `goal_decision`, with typed
    fields. The tool result goes to the loop. No text needs to be hidden.
    The reference itself planned a "schema-first" decision
    (`docs/plans/2026-09-14-phase-0-foundation.md:227-231`).
  - This answers no theme of `changelog.md` section 5 directly. It is a
    judgment call with release evidence (v0.1.154).
- **P537. The worker's prompt comes from the stored decision row.**
  - Problem in the reference: the loop copies the lead's model text (up to
    2,000 characters) straight into the worker's prompt
    (`server/group-goal-run.ts:229-244`, `:388-394`), into the next solo
    prompt (`:383-386`) and into the reassign note (`:414-416`). Nothing
    stores the decision first. `AGENTS.md` says: "Text that opens a delegated
    turn is built from stored data, never from model output."
  - The worker cannot read the instruction in the conversation, because the
    host removes the envelope that holds it (section 3.6). So the prompt must
    carry the instruction.
  - Ours: the same reading as [P51](../../plan/chat-turns.md) and the
    runtime of the reference (`server/runtime/envelope.ts:125-143`, in
    [`assignment-runtime.md`](assignment-runtime.md) section 8). The loop
    writes the decision as a row first. The prompt is a fixed text, built
    from that row, with the instruction quoted as data.
  - This is our rule, not a release problem. To follow the reference, the
    author must write an exception to `AGENTS.md`.
- **P538. One deadline for each step, in the room and in the one-on-one
  chat.**
  - Problem in the reference: in a room step, a lost claim race goes back to
    the wait. If the bot is busy again, a new 30-minute timer starts. The
    loop has no count and no total deadline (`server/index.ts:10467-10527`,
    `:4171`, `:9537-9541`). A bot that a one-on-one chat takes back again
    and again can keep the step waiting with no end. The tests do not cover
    this (section 9). The one-on-one step had the same fault. Commit `7eaaac9c7` (#3967) fixed it there only, because
    "the run could spin forever". This is "A turn or a wait that does not
    end" (v0.1.132, v0.1.151, v0.1.153).
  - Ours: one step function for both, with one deadline made at the start
    of the step.
- **P539. Two Rust types: what the model decides, and how a run ends.**
  - Problem in the reference: one status list of 8 values serves the model,
    the host and the routine. `paused` has no code that sets it (section
    2.9). `limit-reached` means the turn limit from the loop and the time
    limit from a routine, and the text says "turn limit" for both
    (`server/store.ts:920`, `server/routines.ts:1374-1379`).
  - Ours: `GoalDecision` (continue, completed, needs input, blocked) and
    `GoalEnd` with separate `TurnLimit` and `TimeLimit`. No `Paused` until
    a resume exists (or with P535 option b).
  - This answers no release problem. It is a judgment call.
- **P540. A retry only when the first attempt did nothing outside the
  chat.**
  - Problem in the reference: a transient step runs again with the same
    instruction (`server/group-goal-run.ts:297`). Nothing in the loop checks
    what the first attempt did. A worker step that timed out after it sent
    an email or wrote a file can do that work two times (not seen in a test,
    section 9). This is "The same work done or delivered two times" (v0.1.108,
    v0.1.150, v0.1.182).
  - Ours: the runtime already knows if a turn did an outward action (the
    restart rule, `server/runtime/runtime.ts:109-158`, row "State lost at a
    restart" of `changelog.md` section 7). A goal step uses the same rule.
- **P541. The goal end, the routine run and the card change in one
  transaction.**
  - Problem in the reference: the card and the routine run are in two
    stores. The routine run is saved later (`saveLater`), after the card
    write (`server/host/goal-cards.ts:110`, `server/routines.ts:1350-1362`).
    The code needs a repair rule for a crash between the two writes
    (`server/index.ts:8777`). This is "State lost at a restart or a crash"
    (v0.1.24, v0.1.107, v0.1.165).
  - Ours: one SQLite transaction for the three rows (step 8 store).
- **P542. The goal has its own cost, and an optional spend limit.**
  - Problem in the reference: a routine run of a room goal never gets a
    cost (`server/routines.ts:1262-1269`, `:1289`). The card has no cost.
    Only the workspace limit stops a goal, and only at the next step. This
    is "Usage and cost numbers corrected" (v0.1.90, v0.1.170, v0.1.178).
    The v2 plan put a goal spend limit in "Later"
    (`docs/plans/2026-09-02-goal-mode-v2.md:181`).
  - Ours: the goal row adds the usage of each step. The card shows it. An
    optional limit for each goal ends it `blocked` before the next step.
- **P543. Follow the reference: one engine for a room and a chat of one.**
  - Problem in the reference: a separate one-on-one engine shipped on
    2026-10-24 and was deleted on 2026-10-26, 1,087 lines (commits
    `12fc6ce7c`, `d97559347`). This is "A feature added, then removed or
    reversed". No release note names it. The evidence is the commits only.
  - Ours: one loop from the first version, as the reference does now.
- **P544. A card change that comes before its row is not lost.**
  - Problem in the reference: the client drops a patch for a row that is
    not loaded, or for a room task that is not open
    (`src/state/store.tsx:1279`, `:1285`, `:1301`). The card can say
    `working` after the goal ended, until a reload.
  - Ours: the fold of `bot-core` keeps the last state of each card by id,
    and the window reads that state when it opens a task.
  - No release note names this fault. It is a judgment call.

### 8.1 The problems of `changelog.md` section 5 in this code

| Problem | In this feature | Proposal |
|---|---|---|
| A turn or a wait that does not end | Guarded: 13 turns, 30-minute wait, 3 exhausted waits, 3 same assignments, one retry, the `finally` end of a card. Open: the room lost-race loop (section 3.8) | P538 |
| The same work done or delivered two times, or lost | Guarded: `sendId` with mode, one goal for each chat, `finish` runs once, no rerun of a goal step after a restart, no backup-engine resend. Open: the transient retry. The client patch drop (judgment call) | P540, P544 |
| "Busy" and races between bots | Guarded: synchronous claim, the last check after subscribe, a goal step waits for teammates (commit `ec5c9ed0f`), the lead cannot leave a room with a team-goal routine | none |
| State lost at a restart or a crash | Every goal ends at a restart. Two stores for the card and the routine run | P535, P541 |
| A feature added, then removed or reversed | v1 (busy is fatal) to v2 (wait and reassign). The separate one-on-one engine, two days. The planned `goals.json`, never shipped | P543 |
| Usage and cost numbers corrected | No goal cost. A goal can spend one turn over the limit. Commit `938fa58c3` corrected the month total | P542 |

## 9. Not verified

- Whether a lost claim race in a room step repeats many times in real use.
  The code allows it (`server/index.ts:10526`, `:9537-9541`). No test makes
  it happen, so how often it happens is not known.
- Whether a retried step after `timed_out` repeats work outside the chat.
  The loop retries with no check (`server/group-goal-run.ts:297`). No test
  shows a repeat.
- Whether the server sends `message.patch`, not a new `message`, for each
  card change. Only the client side was read.
- What `FAKE_CLAUDE_TRANSIENTS: "1"` does in the scheduled-goal test
  (`server/group-goal-run.e2e.test.ts:173`).
- Whether a goal in a bot-to-bot room is refused in the e2e test. The
  assertion runs only `if (dm)` (`server/group-goal-run.e2e.test.ts:1060-1061`).
  The route refusal itself is read (`server/routes/channels.ts:420-421`).
- The code of the deleted one-on-one engine (`server/bot-goal.ts`). Only its
  commit message and file list were read.
- Whether an outstanding slow stop of a routine goal
  (`server/routine-bounds.ts:109`) is repaired after a restart.
- How the composer shows the goal switch (`src/components/Composer.tsx` was
  read only by `grep`).
- Whether a late envelope can leak more than 5 minutes after a lead turn
  timed out. The public reply guard (`server/harness/public-reply.ts:9-11`)
  removes it from finished text, but the delta path was not traced.
- The reason that the room keeps the routine run thread as its active thread
  after a routine goal completes (`server/group-goal-run.e2e.test.ts:963`).
