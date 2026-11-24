# Chat UI: the streamed reply, the live status and the parts around them

Feature row of [`../reference-features.md`](../reference-features.md):
"`chat-ui.md`: streamed replies, the thinking timer, the live step status and
the "Now" card, usage details, a queued message that can be edited, the
inspector, the tool rows, the Skill Burger card, code blocks on a phone".
Document of the reference: `docs/verification/chat-ui.md`. Parts 23 and 40 of
[`../README.md`](../README.md). Step 7 of [`../../plan/README.md`](../../plan/README.md).

Read on 2026-11-24 at commit `ad27f0716` of the reference project. All paths
are in the reference project unless a line says "ours". The `enterprise/`
directory was not opened. Six subagents read the files. The main session
checked the key facts against the code (section 9 lists what it did not
check).

This file adds to three earlier files, which read the reference at `3aec210`:

- [`event-bus-fold.md`](event-bus-fold.md), sections 3.13 to 3.16 and 5. This
  file adds:
  - the gap flag in full, and the redaction gaps of live text.
  - the streaming Markdown files that batch 2 did not read
    (`markdown-stream-blocks.ts`, `markdown-stream-pieces.ts`, `CodeBlock.tsx`),
    and the fade of a streaming block.
  - the live step on the server (`live-steps.ts`, `step-summary.ts`).
  - the timer and the "Now" card.
  - the driver tests of a live reply, and the Inspector.
- [`chat-turns.md`](chat-turns.md), section 5. This file adds the full rule
  for when the status line shows and hides, and what clears a turn that does
  not end.
- [`queue-and-steer.md`](queue-and-steer.md), sections 3.8 and 5.2. This file
  checks the edit again at `ad27f0716` and adds what an edit loses.

It does not repeat what those files say. Section 9 lists each statement of
them that is now wrong.

## 1. In short

The chat view shows a reply word by word while the engine writes it. Under
the reply, a status line says what the bot does now ("Working · 1m 12s ·
Writing index.html · 14 KB"). A click on that line opens a small card with the
last steps of the turn. When the turn ends, the stored message replaces the
live words, and the status line disappears.

The reference keeps all of this state in the window, in three small stores
outside the main app store. The server sends live frames that it never stores.
The window draws them, then swaps them for the stored rows. Most of the
problems that this file finds are in that swap. Two kinds are frequent:

- The window shows a state before the server stores it.
- A state stays on screen when the end frame does not come.

Special terms, explained one time:

- **Live frame**: one message from the server to the window on the event
  stream (SSE). A `runtime` frame carries one runtime event.
- **Delta** (`content.delta`): a small piece of new reply text. The window
  adds it to the live text.
- **Item**: one message of the bot inside a turn. A turn with tools can have
  more than one. The server gives each item an id (`itemId`).
- **Live row**: the bubble that shows an item before the server stores it.
  Its id starts with `live:`.
- **Last-word hold**: the window shows the live text only up to the last
  space or line break. A word shows when the space after it arrives.
- **Gap**: the event stream connected again and the server could not send
  the frames that the window missed.
- **Status line** (`TurnPresence`): the line under the transcript while a turn
  runs. It has a lead word, the timer and a phrase.
- **Thinking timer**: the time since the turn started, on the status line.
- **Step**: a short phrase for one tool call, made on the server, for example
  "Running pnpm test".
- **"Now" card** (`NowCard`): the card that opens from the status line. Its
  title is "What {name} is doing". It lists the last four steps and the last
  output lines of a command.
- **Quiet part**: a sign of life for a long tool call, for example "busy, no
  output yet".
- **Queued message**: a message that the person sent while the bot was busy.
  It waits above the composer until the turn ends.
- **Usage details**: the token counts and the cost of a thread, in the
  tooltip of the "Usage" row of the chat menu.
- **Inspector**: a side panel with three tabs (Run log, Events, Raw) for one
  thread.
- **Tool rows**: the chips in the transcript for each tool call. A setting
  (`showToolCalls`) shows or hides them.
- **Skill Burger**: a card in the corner of the chat. After a run of two or
  more steps, it saves the run as a workflow skill. It replaced the "This
  run" card on 2026-11-23.
- **Headless-browser driver**: a test script that opens the real window in a
  Chrome without a screen and clicks it.

## 2. Files read completely

Line counts at `ad27f0716`.

### Group 1: the streamed reply in the window

| File | Lines |
|---|---|
| `src/state/live-reply.ts` | 370 |
| `src/state/live-reply.test.ts` | 322 |
| `src/components/ChatView.live-reply.test.ts` | 212 |
| `src/components/ChatMarkdown.streaming.test.ts` | 197 |
| `src/components/ChatMarkdown.stream-fade.test.ts` (new since `3aec210`) | 83 |
| `src/components/ChatMarkdown.stream-identity.test.ts` | 228 |
| `src/components/ChatMarkdown.tsx` (two ranges, 1-500 and 500-989) | 989 |
| `src/lib/markdown-stream-blocks.ts` | 226 |
| `src/lib/markdown-stream-pieces.ts` | 86 |
| `src/components/CodeBlock.tsx` | 329 |
| `src/lib/live-events.ts` | 413 |
| `packages/phone-protocol/src/runtime-events.ts` | 213 |

### Group 2: the live step on the server

| File | Lines |
|---|---|
| `server/harness/live-steps.ts` | 225 |
| `server/harness/live-steps.test.ts` | 171 |
| `server/step-summary.ts` | 276 |
| `server/step-summary.test.ts` | 113 |
| `server/harness/bus.ts` | 317 |
| `server/harness/progress-gate.ts` | 80 |
| `server/harness/public-reply.ts` | 17 |
| `server/harness/text-items.testkit.ts` | 53 |
| `server/redact.ts` | 48 |
| `server/tool-summary.ts` | 122 |
| `server/drivers/tool-progress.ts` | 150 |
| `packages/phone-protocol/src/turn-progress.ts` | 68 |
| `server/testing/live-reply-cases.ts` | 59 |
| `server/drivers/claude-live-reply.test.ts` | 55 |
| `server/drivers/acp/live-reply-matrix.test.ts` | 81 |
| `scripts/verify-live-reply.ts` | 299 |

### Group 3: the timer, the status line and the "Now" card

| File | Lines |
|---|---|
| `src/components/TurnPresence.tsx` | 256 |
| `src/components/TurnPresence.test.ts` | 221 |
| `src/components/NowCard.tsx` | 71 |
| `src/state/turn-status.ts` | 123 |
| `src/state/turn-status.test.ts` | 112 |
| `src/components/WorkingIndicator.tsx` | 32 |
| `src/lib/turn-tail.ts` | 29 |
| `src/lib/activity-runs.ts` | 190 |
| `src/lib/now-steps.ts` | 92 |
| `src/lib/live-activity.ts` | 209 |
| `src/lib/friendly-activity.ts` | 54 |
| `src/lib/working-time.ts` | 7 |
| `src/lib/tool-liveness.ts` | 19 |
| `src/lib/stop-turn.ts` | 106 |
| `src/components/StatusActivityRow.tsx` | 43 |
| `src/components/ActivityRun.tsx` | 57 |
| `src/hooks/use-live-tool-ids.ts` | 20 |
| `src/components/ChatView.live-status.test.ts` | 244 |
| `src/components/ChatView.follow.test.ts` | 64 |
| `scripts/testing/thinking-timer-ui.e2e.test.ts` | 278 |
| `server/host/idle-threads.ts` | 50 |

### Group 4: the chat view and its document

| File | Lines |
|---|---|
| `src/components/ChatView.tsx` | 1,201 |
| `docs/verification/chat-ui.md` | 337 |
| `docs/verification/evidence/chat-ui/chat-ui.png` | image, 1280×577 |
| `src/lib/use-media-query.ts` | 32 |
| `src/components/mascot-beat.ts` | 19 |
| `src/lib/automation-note.ts` | 73 |
| `git diff 3aec210 ad27f0716` of `ChatView.tsx`, `live-reply.ts` and `chat-ui.md` | 98 changed lines |

### Group 5: the queued message and the usage details

| File | Lines |
|---|---|
| `src/components/ComposerQueuedMessages.tsx` | 173 |
| `src/components/ComposerQueuedMessages.test.ts` | 280 |
| `src/state/queue-receipts.ts` | 68 |
| `server/steer-queue.ts` | 325 |
| `src/components/EngineUsage.tsx` | 278 |
| `scripts/testing/usage-details-ui.e2e.test.ts` | 156 |
| `src/lib/usage.ts` | 143 |
| `src/lib/chat-usage-summary.ts` | 24 |
| `src/lib/cache-keepwarm.ts` | 23 |

### Group 6: the parts to record only

| File | Lines |
|---|---|
| `scripts/testing/control-omb-ui.ts` | 525 |
| `scripts/testing/control-omb-ui.e2e.test.ts` | 392 |
| `scripts/testing/bot-tools-ui.e2e.test.ts` | 240 |
| `scripts/testing/threads-preview.tsx` | 34 |
| `src/lib/feature-flags.ts` | 99 |
| `src/lib/feature-flags.test.ts` | 100 |
| `src/components/skill-burger/SkillBurgerSlot.tsx` | 93 |
| `src/components/skill-burger/SkillBurger.tsx` | 261 |
| `src/components/skill-burger/SkillBurger.dom.test.ts` | 173 |
| `src/components/InspectorPanel.tsx` | 270 |
| `src/components/RunLog.tsx` | 63 |
| `shared/inspector.ts` | 21 |
| `src/lib/inspector-window.ts` | 72 |
| `src/lib/taskTimeline.ts` | 66 |
| `server/drivers/native.ts` | 118 |
| `DESIGN.md` | 421 |

### Large files, read in ranges

| File | Ranges |
|---|---|
| `src/state/store.tsx` (3,277) | 170-182, 225-290, 365-380, 560-592, 765-775, 895-930, 1565-1626, 2015-2035, 2094-2100, 2230-2399, 3040-3065, 3115-3140, 3180-3211 |
| `server/index.ts` | 4655-4690, 5365-5385, 5440-5455, 6251-6315, 6360-6370, 6395-6432, 6630-6800, 7120-7140, 14740-14750 |
| `server/store.ts` | 515-535, 1600-1635, 1790-1860 |
| `src/components/Composer.tsx` (980) | 130-159, 415-494, 740-769, 876-896 |
| `server/routes/bot-messages.ts` (874) | 365-472 |
| `src/components/ChatMoreMenu.tsx` (289) | 1-60, 150-215 |
| `shared/redact.ts` | 36-50, 70-168 |
| `src/styles.css` | 8-15, 1305-1385 |
| `server/drivers/acp/quiet-status.ts` (444) | 27-63, 300-320, 355-380 |
| `src/components/AppSettingsRows.tsx` (423) | 320-380 |
| `scripts/control-omb.ts` (556) | 37-48, 108-116, 480-510 |
| `shared/skill-burger/layers.ts` (506) | 1-15, 400-415, 498-506 |
| `src/lib/inspector.ts` (197) | 1-60, 112-197 |
| `src/lib/skill-burger.ts` (208) | 14-22, 148-153 |
| `server/routes/channels.ts` | 475-495 |
| `server/message-db.ts` | 328-364 |
| `server/registry-save.ts` | 45-62 |
| `server/turn-watchdog.ts` | 265-282 |
| `src/locales/en.json` | the keys cited in section 5 |

## 3. How it works

### 3.1 A frame gets to the window

1. The window parses each SSE message. It drops `ping` and `hello`. It gives
   each other frame to `tapLiveFrame`, then to the app store
   (`src/lib/live-events.ts:293-297`, `:352-355`).
2. `tapLiveFrame` (`live-events.ts:134-144`):
   - A `runtime` frame goes to `noteTurnEvent` (the status line), then to
     `noteLiveReplyEvent` (the live reply), then to `recordRuntimeEvent`.
   - A `message` frame of a bot text goes to `noteLiveReplyMessage`.
3. The tap runs before the app store queues the frame
   (`store.tsx:3204-3208`). Thus the live stores are one frame ahead of the
   transcript. The draw step hides this difference (3.3, step 4).
4. The app store ignores deltas. Its `runtimeFrameAction` passes only
   `turn.started`, `session.model-variants` and `turn.completed`
   (`store.tsx:2026-2031`, test `store.test.ts:2706-2715`).
5. On `hello` with `resumed: false`, the store runs these steps
   (`store.tsx:3196-3203`):
   1. It applies the waiting frames.
   2. It calls `publishMissedFrames()`, which calls `forgetLiveReplies()`
      (`live-events.ts:97-99`).
   3. It drops the frames that arrived before the load.
   4. It calls `forgetLiveTurns()`. This clears only the turn ids of Stop
      (`stop-turn.ts:38-41`). It does not clear the status line store.
   5. It loads all data again.

### 3.2 A delta grows a live item (`live-reply.ts:83-99`)

1. The window drops the delta if one of these is true (`:88-89`):
   - `streamKind` is not `assistant_text`. Reasoning text never shows.
   - The delta is empty.
   - Its `eventId` is in the set of known ids (4,096 ids, `:65-70`).
   - The thread is `skipping` (after Stop).
   - The global flag `gapped` is set and this thread had no boundary since
     the gap.
2. It finds the item with the same `itemId`. With no `itemId` (an old
   server), it takes the last open item of the same turn (`legacyOpen`,
   `:119-123`).
3. If the item exists and is not done, it adds the delta (`:91-93`). A delta
   for a done item is dropped (`:93`, test `live-reply.test.ts:247-253`).
4. If no item matches, it starts a new item. First it drops each item that is
   not done (`:96-99`). The code comment says: "an earlier one still open
   never completes". The new item has `at: Date.now()`, the clock of the
   window.
5. `put` keeps the last 32 items of a thread and 200 threads. It tells the
   listeners only when the items changed (`:54-63`).

### 3.3 The item completes and the stored message replaces it

1. `item.completed` of `assistant_text` (`:100-105`):
   1. It is dropped if its `eventId` is known.
   2. It records a boundary for the gap rule.
   3. If a matching item is open, it sets the full text and `done: true`. The
      server already masked that text (`server/harness/public-reply.ts:9-14`).
   4. If no item matches (no delta came), it makes nothing. The row then
      comes only from the store.
   5. It always clears `skipping`.
2. A bot text `message` frame sets `savedAs` on the item with the same
   `itemId`. With no `itemId`, it takes the first done, unsaved item of the
   turn (`:127-139`). It adds the message id to `streamed` (500 ids), so the
   stored bubble does not play its entry animation again (`:173-175`,
   `ChatView.tsx:423`).
   - Edge case: the match by `itemId` does not check `done`. `savedAs` can
     be set on an item that still streams.
3. `useLiveTranscriptLayout` (`:351-360`) builds the list:
   - It hides an item when the transcript has a message with its `itemId` or
     with its `savedAs` id (`drawnAfter`, `:246-263`). The live row and the
     stored row are never drawn together. They swap in the same render.
   - It adds live rows only when the window of rows ends at the newest
     message (`:285-288`).
   - It calls `settleLiveReplies` in an effect after the render (`:358`).
4. The swap by `itemId` works also when the `message` frame never arrived,
   for example after a reload (`live-reply.test.ts:226-231`).
5. A live row in the list is a stand-in with no words (`:340-346`). The
   bubble reads the words itself with `useLiveRow` (`:210-216`,
   `ChatView.tsx:301`). Thus a new word does not render the list again.

### 3.4 The text that a live row shows (`live-reply.ts:181-186`)

1. For an open item, the text stops after the last space or line break. A
   tab is not a cut point. Text with no space shows nothing.
2. A client cancel sentence shows as nothing (`shared/client-cancel.ts:23-40`).
3. Each other text goes through `redactSecretsInText` before it shows.
4. Whitespace-only text makes no row (`:265-267`).
5. A live row gets no file links, no attachments and no published-site cards
   (`ChatView.tsx:335`, `:339`). Its actions are hidden and inert
   (`MessageActions.tsx:77-78`).

### 3.5 Turn start, turn end, Stop and gap

1. `turn.started` keeps only items that are saved and belong to this turn. An
   event with no `turnId` drops all items (`:108-111`).
2. A turn end keeps only saved items (`:112-114`). The window counts four
   events as a turn end (`isTurnEnd`, `:78-80`): `turn.completed`,
   `cap.exhausted`, `session.exited` and `runtime.error` with
   `terminal: true`. A turn end does not compare `turnId`.
3. A `runtime.error` that is not terminal changes nothing
   (`live-reply.test.ts:108-110`).
4. Stop (`stop-turn.ts:64-92`):
   1. A second press on the same thread within 1,000 ms does nothing.
   2. The window calls `stopLiveReply`, which sets `skipping: true` and keeps
      the text (`live-reply.ts:143-145`). This occurs **before** the POST
      (`stop-turn.ts:70`).
   3. It sends `POST /api/bots/:id/interrupt` with `{threadId, turnId}`.
   4. On "already-stopped", it forgets the live turn id (`:82-85`).
   5. On an error, the next press counts as new, and the error shows
      (`:86-91`). Nothing clears `skipping`. The text stays frozen until the
      next `item.completed`, `turn.started` or turn end.
5. A gap (`forgetLiveReplies`, `:148-154`) sets the module flag
   `gapped = true` and drops each unsaved item. While the flag is set, a
   thread draws deltas only after a boundary on that thread: `item.completed`,
   a tool `item.started`, `turn.started` or a turn end.
6. Only `resetLiveReplies` sets `gapped` to false, and only tests call it
   (`:362-369`). The first load of the window always goes through step 5 of
   3.1. Thus, after start-up, a reply that streams shows nothing until its
   next boundary. The earlier research found this (`event-bus-fold.md`,
   3.16 step 8). It is still true.

### 3.6 Streaming Markdown and code blocks

1. `ChatMarkdown` reads `StreamingReplyContext`. `ChatView` sets it only
   around a `live:` row (`ChatView.tsx:738`).
2. While the text streams, `markdownParts` cuts it into blocks
   (`ChatMarkdown.tsx:877-890`). It parses each finished block one time and
   keeps the result by its text. It parses only the last block again.
3. `splitMarkdownBlocks` (`markdown-stream-blocks.ts:29-95`) cuts at a blank
   line only when the next line does not continue the block. It never cuts in
   a code fence, in display math or in an HTML block. It returns null (one
   parse of all text) for text with `\r`, link reference definitions or
   footnotes.
4. For a long list or table in the last block, `splitStreamPieces` cuts it
   into items or rows (`:102-192`). Only the last item or row is parsed
   again. A block with math, a tab or `\r` is not cut (`:199-203`).
5. `drawStreamPieces` (`markdown-stream-pieces.ts:70-86`) joins the parsed
   pieces into one list or one table. If a piece has an unexpected shape, it
   returns null, and the caller parses the whole block
   (`ChatMarkdown.tsx:947-950`).
6. An open code fence as the last block is drawn as `<CodeBlock open>` with
   the key `pre-0` (`ChatMarkdown.tsx:659-667`, `:959`). That key is the key
   that the parser gives the `pre` element. Thus the element stays the same
   when the fence closes. This is new since `3aec210`.
7. An open code block (`CodeBlock.tsx:164-329`):
   - It has no colours. Colours start only for a closed block of 100,000
     characters or fewer, near the screen (`:164`, `:206-207`).
   - In Advanced mode, its action row is invisible and inert (`:283`). In
     Simple mode, it has no action plate (`:260`).
   - Mermaid draws only from a closed fence (`ChatMarkdown.tsx:677-679`).
8. Fade: while the text streams, the root has `data-streaming`. Each new
   top-level block fades in over 600 ms, one time, only when the person
   allows motion (`ChatMarkdown.tsx:956`, `styles.css:1340-1354`). This is new
   since `3aec210`. There is no caret.
9. A streaming reply loads no files and no pictures (`ChatMarkdown.tsx:952-953`).
10. Code blocks on a phone and on touch screens:
    - The `touch` variant is `(hover: none), (pointer: coarse)`
      (`styles.css:11-15`). A comment says that each hover-only control must
      also show on touch, and `touch-actions.test.ts` checks it (`:8-10`).
    - Simple mode: the action plate is always visible on touch. Its buttons
      grow from 28 px to 44 px (`CodeBlock.tsx:174`, `:185`).
    - Advanced mode: below 40 rem or on touch, the actions take a full row
      and wrap. Each button is at least 44×44 px (`styles.css:1361-1380`).
    - The "Copy" word shows only on a small screen or on touch
      (`CodeBlock.tsx:319-322`).
    - Code scrolls sideways unless the person turns on wrap
      (`CodeBlock.tsx:246-254`).
    - The phone layout of the chat starts at `(max-width: 767.98px)`
      (`src/lib/use-media-query.ts:32`).

### 3.7 The live step of a tool call (server)

1. A driver sends `item.started` for a tool. The bus calls
   `LiveSteps.observe` (`bus.ts:113`, `live-steps.ts:84-117`).
2. `toolStep` (`step-summary.ts:247-276`) makes the step from the redacted
   `summary` and `input` of the call:
   - **command**: the program and its first plain argument, for example
     "pnpm test". It skips `cd`, `export`, `echo`, `sudo` and similar words
     (`:91-115`, `:171-199`).
   - **web**: the search query.
   - **fetch**: the host. The detail is host and path, never the query string
     or a password (`:132-140`, `:260-266`).
   - **write**, **edit**, **read**: the base name of the file.
   - Each other tool (Grep, MCP tools) gets no step (`step-summary.test.ts:108-112`).
3. Each text is redacted before it is cut (`step-summary.ts:11-14`). The
   target has 60 characters or fewer, the detail 200 or fewer. A
   `NAME=value` shows as `NAME=…` (`:16-20`).
4. The bus stores the step in the `item.started` event of the log
   (`bus.ts:128`, `:170`). The server also stores it as `tool.step` on the
   activity row (`index.ts:6421-6430`).
5. After the bus delivers `item.started`, it calls `announce`, which sends a
   `turn.progress` frame with the step (`bus.ts:129`, `live-steps.ts:120-123`).
6. The engine's own progress reports (`turn.progress` from Claude, Codex and
   ACP) get the words of the tracked step (`live-steps.ts:126-131`).
7. Command output (`item.output`, from Codex and ACP only) becomes a `tail`:
   the last two lines, with escape codes removed, redacted, and 160
   characters or fewer. One tail frame each second for each call. The server
   keeps the last 8 KiB of output (`live-steps.ts:15-18`, `:135-162`).
8. After 60 s, each 15 s, the server adds a quiet part. It samples the
   process tree of the engine: network, busy or idle (`live-steps.ts:189-217`,
   `quiet-status.ts:28-37`, `:361-380`).
9. Each frame then goes through `ProgressGate`: one frame for each thread in
   400 ms, and a frame equal to the last one is dropped
   (`progress-gate.ts:9`, `:38-57`). A status event (`turn.started`, a delta,
   `item.started`, `item.completed`, `request.opened`) drops a waiting frame
   (`bus.ts:43`, `:114`).
10. `item.completed` of the tool removes the call (`live-steps.ts:91-99`). A
    terminal event removes all calls of the thread (`:85-90`).
11. The server never writes `turn.progress` and `item.output` to a log. But
    the SSE replay buffer keeps `turn.progress` frames in memory and sends
    them again on a resume (`index.ts:4676`, `server/host/sse-replay.ts:15-17`).
    The type comment says "nothing stores it" (`runtime-events.ts:119-121`).

Edge cases:

- A call whose `item.completed` never arrives, in a turn that never ends,
  stays in memory. The 15 s sample continues. There is no limit
  (`live-steps.ts:71`).
- `EventBus.detach` removes an adapter but sends no terminal event. Its
  calls stay (`bus.ts:311-316`).
- A call that ends in less than 400 ms loses its step frame in the gate. The
  window then takes the step from the stored activity row
  (`src/lib/live-activity.ts:174-176`).

### 3.8 The status line store (`src/state/turn-status.ts`)

1. Each frame sets `lastFrames[thread] = Date.now()`, for at most 500
   threads (`:46-49`).
2. A frame with another `turnId` starts a new entry
   `{turnId, ended: false, status: null}` (`:50-53`).
3. The effect of each event:

| Event | Effect | Lines |
|---|---|---|
| `turn.started` | `ended: false`, no status | `:55-56` |
| `turn.completed`, `cap.exhausted`, `session.exited` | `ended: true`, no status | `:57-60` |
| `turn.progress` | the step: activity, target, detail, size, quiet, tail | `:61-67` |
| `content.delta` | "thinking" for reasoning, "reply" for reply text | `:68-69` |
| `item.started` | keeps the step only for the same `itemId`, else clears it | `:70-71` |
| `item.completed`, `request.opened` | clears the step | `:72-74` |
| `context.summarizing` | sets or clears "summarizing" | `:75-80` |
| each other event, also `runtime.error` | no change | `:81-82` |

4. A terminal `runtime.error` does **not** end the entry. `live-reply.ts`
   counts it as an end (`:78-80`). The bus counts it as an end
   (`bus.ts:45-50`). Thus three modules have two different lists of turn
   ends.
5. Nothing clears this store at a gap. `resetTurnLive` runs only in tests
   (`turn-status.ts:120`). A step from before the gap can stay until a frame
   with a new `turnId` arrives.

### 3.9 The thinking timer

1. The server sets `task.turnStartedAt = Date.now()` when the task changes
   from idle to busy. It deletes the stamp when the task stops being busy
   (`server/store.ts:1617-1621`). This is the server clock.
2. The server does not save the stamp to disk (`server/registry-store.ts:75`).
   At start, each task is idle (`server/store.ts:526-529`).
3. The window copies the stamp to the task (`store.tsx:374`).
4. `ChatView` sets `busySince = bot.turnStartedAt ?? Date.now()` while busy,
   in an effect (`ChatView.tsx:899-902`).
   - The first render after busy starts has no `since`. That frame shows
     "Working" with no timer (`TurnPresence.tsx:193`).
   - With no server stamp, the window clock is the start. That fallback
     starts again at each change of thread.
5. `WorkingTimer` writes `formatElapsed(Date.now() - since)` into its own
   text node each second, outside React (`WorkingIndicator.tsx:21-31`).
6. `formatElapsed` gives "42s" or "1m 05s". It changes a negative value to
   0 (`working-time.ts:1-7`). This is the only guard against a difference
   between the server clock and the window clock.
7. The timer keeps its count after a change of thread, for a 1:1 chat and
   for a room (`thinking-timer-ui.e2e.test.ts:144-207`, `:209-277`).
8. The timer has no stopped state. It disappears with the status line.
9. Simple mode does not show the timer. It puts it in the tooltip of the
   status line, and computes the tooltip only at a render (`TurnPresence.tsx:225`).

### 3.10 When the status line shows and hides

1. `waiting = bot.busy && bot.activity !== "waiting-on-you" &&
   showWorkingDots(bot.busy, lastMessage, undefined, live.ended)`
   (`ChatView.tsx:860`).
2. `showWorkingDots` (`turn-tail.ts:7-19`):
   - It is false when the task is not busy.
   - It is true when there is no last row, or the last row is not a bot text.
   - In a room, it is true when another bot spoke last.
   - Else it is true until `turnEnded`.
3. The code comment says: "a settled reply at the tail hides them only once
   the turn has ended; no timer ever does" (`turn-tail.ts:5-6`). A sentence in
   the middle of a turn does not hide the line.
4. When a bot text arrives while the line shows, the window keeps the
   presence for 520 ms in an "answer" phase, with no status text
   (`ChatView.tsx:876-885`, `TurnPresence.tsx:130`, `:146-150`).
5. `presenceVisible = waiting || popping || teammatesWorking`
   (`ChatView.tsx:887`). "Teammates working" shows in Simple mode while the
   bot waits for other bots (`:886`).
6. The line goes under the live bubble while a live reply exists
   (`useHasLiveReply`, `:888-889`).
7. Advanced mode draws "Working · timer · phrase · size · quiet or silence"
   (`TurnPresence.tsx:190-221`). Simple mode draws the avatar and one friendly
   phrase (`:179-189`, `friendly-activity.ts:42-53`).
8. Phrases change each 4 to 6 seconds (`live-activity.ts:207-209`). The quiet
   and silence parts render again each 15 s (`TurnPresence.tsx:62-82`).
9. "nothing new for {count} min" shows after 2 minutes with no frame
   (`now-steps.ts:83-92`).
10. The phrase order is: the live step, then the first sentence of a notice
    row, then the running tool row (`live-activity.ts:120-127`).

### 3.11 The "Now" card

1. `useTurnNow` (`NowCard.tsx:47-71`) runs in `ChatView` (`:857`).
2. `nowSteps` (`now-steps.ts:57-69`) takes the activity rows with an
   `itemId` after the last user text that was not a steer. A row is "now"
   with no `ok`, "done" with `ok: true` and "failed" with `ok: false`. It adds
   the live call as `live:<itemId>` when no row has that id yet. It keeps the
   last four.
3. The tail shows only for a `command` step (`NowCard.tsx:54`).
4. The card exists only when it has steps or tail lines (`NowCard.tsx:69`).
   The status line is then a toggle button (`TurnPresence.tsx:157-158`,
   `:233-247`). Escape folds it (`:162-174`).
5. "Open activity" opens the Activity panel on the turn. A remote client
   does not get it (`NowCard.tsx:55-60`).
6. The card disappears with the status line.

### 3.12 "Worked for"

1. `workedLabel` gives "Worked for {elapsed}" from 1 s, else "Worked"
   (`activity-runs.ts:57-59`).
2. The start is the last user message before the turn, from the stored
   message times (`activity-runs.ts:51-54`). The timer uses another start,
   `task.turnStartedAt`. The two can differ. A queued message can make the
   label longer than the turn (not checked, see section 9).
3. A settled turn folds its tool steps behind a "Worked for" chip
   (`activity-runs.ts:75-112`, `TurnNarrationRun.tsx:18-42`). Simple mode
   puts the time in the tooltip of the last bubble (`ChatView.tsx:626`).
4. A stopped or failed turn has no final row. It gets no label and no fold
   (`activity-runs.ts:68`, `:83-88`).

### 3.13 What clears a turn that does not end

| Part | What clears it | Lines |
|---|---|---|
| Live reply text | `turn.started`, a turn end of the four kinds, a gap (unsaved items), eviction | `live-reply.ts:78-80`, `:108-114`, `:148-154` |
| `skipping` after Stop | `item.completed`, `turn.started`, a turn end | `live-reply.ts:105`, `:111`, `:114` |
| The step | `item.completed`, `request.opened`, a turn end of three kinds, a new `turnId` | `turn-status.ts:50-60`, `:72-74` |
| The status line, the timer, the "Now" card | the task is not busy, or waits on the person, or a settled reply plus `ended` | `ChatView.tsx:860`, `turn-tail.ts:13-18` |
| The busy flag (server) | the end of the turn, a Stop of a thread that no engine holds, the watchdog | `server/host/idle-threads.ts:1-3`, `server/index.ts:14747`, `server/turn-watchdog.ts:269-280` |

1. The window has no timer that clears any of these parts. This is on
   purpose (`ChatView.tsx:859`, `turn-tail.ts:5-6`).
2. If the end frame does not arrive and the task stays busy, the line stays.
   After 2 minutes it shows "nothing new for N min". The server keeps sending
   a quiet part each 15 s while it tracks a call.
3. The fix of v0.1.151 is on the server. A Stop frees at once a thread that
   no engine holds. The watchdog checks each 60 s and frees a thread that
   nothing held for `stallMs` (`server/index.ts:4934`,
   `server/host/idle-threads.ts:26-47`). A turn that an engine holds waits for
   its own end (`idle-threads.ts:2-3`).
4. The Stop button shows only when `!simpleHead && (bot.busy ||
   bot.waitingForTeammates)` (`ChatView.tsx:1015`). `simpleHead` is
   `!advanced && !remoteClient` (`:761`). Thus Simple mode on the desktop has
   no Stop in the header. The composer has its own Stop
   ([`queue-and-steer.md`](queue-and-steer.md), 5.3).
5. A terminal `runtime.error` with no `turn.completed` drops the live text but
   keeps the step (3.8, step 4).

### 3.14 The edit of a queued message

The server has no edit route at `ad27f0716`. The allow list has only `DELETE
…/queue/:id` and `POST …/queue/:id/steer`, for bots and for rooms
(`server/request-auth.ts:54`, `:374-375`, `:422-423`). An edit is a remove,
then a refill of the composer.

1. The pencil shows on each row only when the composer is not locked
   (`Composer.tsx:764`, `ComposerQueuedMessages.tsx:148-158`). A shared team
   chat shows no queue rows (`Composer.tsx:421-422`).
2. A click calls `editQueued(queueId)` (`Composer.tsx:452-470`). It keeps the
   draft id of the moment of the click.
3. It sends `cancelQueued`, or `cancelGroupQueued` for a room. The store does
   not remove the row first. The row stays until the server answers
   (`store.tsx:2242-2246`).
4. The window sends `DELETE /api/bots/:id/queue/:queueId` with `{threadId}`
   (`store.tsx:2292-2293`).
5. The server (`server/routes/bot-messages.ts:375-389`):
   1. It refuses with 403 `queued_not_yours` when another person queued the
      message in a shared chat (`:382-383`).
   2. It removes the item from the memory queue. It marks the table row
      `cancelled` with empty text and keeps its `send_id`
      (`steer-queue.ts:286-298`, `message-db.ts:335-348`).
   3. If the item is not there, it answers 404 "no such queued message"
      (`:384-386`).
   4. It opens again a widget whose press made this queued message (`:387`).
   5. It answers 200 `{ok: true}` and sends a `bot.queued` frame
      (`index.ts:4719`).
6. On 200, the window removes the row and records a receipt
   (`store.tsx:1602-1612`). Then it puts the words at the top of the draft,
   above the text that the person typed, and adds the citations again as
   attachments (`Composer.tsx:456-467`, `drafts.ts:317-343`). It moves the
   caret to the end of the words only if the same draft is still open.
7. Nothing is sent. A later Send is a new send with a new `sendId`
   (`store.tsx:2355`). The server decides again: queue, steer or start.

Error paths and edge cases:

- **A drain starts the message first.** The drain removes the entry from the
  memory map before it runs (`steer-queue.ts:203-212`). The DELETE then gets
  404, and the window shows the error. The window does not give the words back, and the
  message runs one time.
- **A steer holds the queue.** The edit gets 404. If the steer fails, the
  server puts the items back (`steer-queue.ts:301-317`).
- **The answer of the DELETE is lost.** The server cancelled the message,
  but the window never runs the refill. The words are lost (from the code at
  `store.tsx:2292-2298`, not run).
- **What an edit loses**: the place in the queue, `replyToId`, `dataContext`,
  `mentions` and `peerAsk`. The window row has only `{queueId, text, reason,
  sender}` (`store.tsx:568`, `steer-queue.ts:20-48`).
- **Pictures**: an `<attached-image … />` tag goes back into the draft as raw
  text (`citations.ts:124-140`).
- **A send again with the old `sendId`** gets 409 (`index.ts:7130-7131`).
- **Rooms**: the same 403 and 404, but no widget reopen. `cancelGroupQueued`
  records no receipt (`store.tsx:1615-1623`).

### 3.15 The usage details

1. While a turn runs, the server keeps `thread.token-usage.updated` in
   memory only (`index.ts:6632-6637`). The window gets no live usage.
2. On `turn.completed`, the server takes `event.usage` or the last report
   (`index.ts:6678-6679`, `:6709`). For a 1:1 bot it calls
   `store.addTaskUsage` (`index.ts:6712-6718`).
3. `addTaskUsage` (`server/store.ts:1805-1842`):
   - A NaN or a negative value becomes 0 (`:1816`).
   - It adds input, output and one turn. `cachedInput` is never more than
     the input.
   - The cost stays `null` until a turn reports one.
   - It writes `lastTurn` again each turn.
   - It saves "later", then emits a `bot` change at once (`:1839-1840`). The
     code says that a crash loses the usage of the last turn
     (`server/registry-save.ts:54-55`).
4. The ledger and the digest get the same numbers and the model
   (`index.ts:6727-6756`). Rooms book the ledger only (`:6784-6800`).
5. The window shows the usage as the "Usage" row of the chat menu
   (`ChatMoreMenu.tsx:157-164`). The row text is the cost, or the uncached
   input, or the input (`usage.ts:132-137`). The tooltip comes from
   `chat-usage-summary.ts:6-24`. It has these lines: turns, the token split, the last message, the context,
   the context warning at 80 %, the cache keep-warm line and the cost.
6. The row is not there when the thread has no usage or 0 turns
   (`chat-usage-summary.ts:9`).
7. A click opens the Usage page of the bot (Advanced) or of the app (Simple)
   (`ChatMoreMenu.tsx:163`).

Edge cases:

- A turn with no usage report still adds a turn and prints "Last message: 0
  input … · 0 output" (`server/store.ts:1816`, `:1829-1834`, `usage.ts:126-130`). A missing report
  looks like a real zero.
- The cost of the last turn is stored (`lastTurn.costUsd`) but never shown.
  Its test is named "says what the last message alone cost"
  (`usage.test.ts:180-184`).
- `EngineUsage.tsx` is a different feature: the limit bars of the plan of an
  engine (5-hour and weekly), not the tokens of a turn.

### 3.16 The parts recorded only

These parts are not traced step by step. Section 5 has their text.

**The headless-browser driver** (`scripts/testing/control-omb-ui.ts`, 525
lines):

- It opens the real app in a Chrome with no screen, against a fake engine
  server that it deletes at the end. Its verbs are `launch`, `snapshot`,
  `click`, `type`, `press`, `screenshot`, `console`, `eval`, `flag` and
  `wait-settle` (`:321-404`).
- `launch` downloads a pinned browser release and checks its size and
  SHA-256 (`:167-196`). It writes a handle file with mode 0600 (`:500-501`).
- `wait-settle` waits until no bot is busy, the newest message is in the
  page, and the network is idle (`:283-318`).
- It never shows the stderr of the browser tool, because stderr can show
  paths and environment values (`:98-99`).
- The entry point is `scripts/control-omb.ts:501-504`.

**The flag for tool rows** (`src/lib/feature-flags.ts:59-61`):

- `showToolCallsEnabled` is true only when `config.features.showToolCalls`
  is exactly `true`.
- `ChatView` shows tool chips only when the flag is on and, in Advanced
  mode, the Activity tools filter is on (`ChatView.tsx:812`). With the flag
  off, failed turns, status rows and data results still show (`:681-698`).
- The switch `ToolCallsRow` sends `PATCH /api/config` and changes only when
  the server answers (`AppSettingsRows.tsx:334-372`). A remote client does
  not get it (`AppPages.tsx:174`).

**The Skill Burger card** (`src/components/skill-burger/`):

- `ChatView` mounts `SkillBurgerSlot` in the dock (`ChatView.tsx:1169`).
- The card shows when the run since the last ask has two layers or more,
  and one of them is not a read (`shared/skill-burger/layers.ts:502-506`).
- It fetches the summary and the draft only when the run is finished: not
  busy and no layer running (`SkillBurgerSlot.tsx:42-62`).
- "Add Skill Burger" sends `POST /api/skill-burgers`. Undo sends `DELETE
  /api/skill-burgers/<name>?sha256=<sha>` (`SkillBurger.tsx:108-132`).
- The saved state is a module map in the window. A reload forgets it
  (`src/lib/skill-burger.ts:148-153`).
- The server part is 18 files in `server/skill-burger/` and 13 in
  `shared/skill-burger/`. A saved burger is a skill folder with `SKILL.md`
  and `workflow.json`.

**The Inspector** (`src/components/InspectorPanel.tsx`):

- The chat menu opens it (`ChatMoreMenu.tsx:173-180`). Only a remote client
  does not get it. Simple mode gets it too.
- **Run log**: made from the stored messages, redacted, the last 200
  entries (`taskTimeline.ts:27-66`, `RunLog.tsx:19`).
- **Events** and **Raw**: `GET /api/threads/:id/events?limit=400`, from the
  event log and the native log of the thread (`InspectorPanel.tsx:44`,
  `server/thread-events.ts:246-266`).
- Events also adds live runtime frames of the thread, in batches of 16 ms
  (`InspectorPanel.tsx:76-119`). It loads again 400 ms after `turn.completed`
  or `runtime.error` (`:114-117`).
- A row shows its full JSON when the person opens it (`:263-267`).
- The Inspector of approvals belongs to the feature `approval-cards`. The
  reader did not find a separate one in this code.

## 4. The data

### 4.1 The live reply (window memory, `live-reply.ts`)

```ts
interface LiveReplyItem {        // :13-26
  key: string;                   // itemId, or the eventId of the first delta
  itemId?: string; turnId?: string; botId?: string;
  text: string;                  // raw text, not redacted
  at: number;                    // Date.now() of the window
  done: boolean;
  savedAs?: string;              // id of the stored message
}
interface ThreadReplies { items: LiveReplyItem[]; skipping: boolean } // :28-32
```

| Limit | Value | Lines |
|---|---|---|
| `MAX_THREADS` | 200 | `:38` |
| `MAX_SEEN_EVENTS` | 4,096 | `:39` |
| `MAX_STREAMED` | 500 | `:40` |
| `MAX_ITEMS` for each thread | 32 | `:42` |

Module state: `threads`, `listeners`, `seenEvents`, `streamed`, `shapes`,
`gapped` and `boundarySinceGap` (`:44-52`). None of it is stored.

### 4.2 The live status (window memory, `turn-status.ts`)

```ts
interface TurnLive { turnId?: string; ended: boolean; status: LiveStatus | null; reopened?: true } // :13-20
type LiveStatus = Omit<TurnProgressFields, "type"> | { activity: "thinking" | "reply" | "summarizing" } // :9-11
```

At most 500 threads (`:23`).

### 4.3 The step (wire, `packages/phone-protocol/src/turn-progress.ts`)

```ts
type TurnProgressActivity = "write" | "edit" | "command" | "web" | "read" | "fetch" | "search" | "tool"; // :6
interface LiveStep { activity: TurnProgressActivity; target: string /* ≤60 */; detail?: string /* ≤200 */ } // :11-18
type StepQuiet = { kind: "output"; at: number } | { kind: "network" | "busy" | "idle" }; // :22
interface TurnProgressFields {   // :24-42
  type: "turn.progress"; activity: TurnProgressActivity;
  tool?: string; file?: string; bytes?: number; itemId?: string;
  target?: string; detail?: string; quiet?: StepQuiet; tail?: string[];
}
```

`item.started` carries `step?: LiveStep` (`runtime-events.ts:102-114`).
`item.output` and `turn.progress` are "live only" (`:116-121`).

| Constant | Value | Lines |
|---|---|---|
| `DELTA_MERGE_MS` | 50 | `bus.ts:18` |
| `PROGRESS_FRAME_MS` | 400 | `progress-gate.ts:9` |
| `TAIL_FRAME_MS` | 1,000 | `live-steps.ts:15` |
| `TAIL_LINES`, `TAIL_LINE_MAX` | 2, 160 | `live-steps.ts:16-17` |
| `OUTPUT_KEPT` | 8,192 | `live-steps.ts:18` |
| `STEP_TARGET_MAX` | 60 | `step-summary.ts:8` |
| quiet notice, quiet tick | 60 s, 15 s | `quiet-status.ts:28-30` |
| SSE replay buffer | 500 frames, 8,000,000 characters | `sse-replay.ts:15-17` |

### 4.4 The turn on the server

- In memory only: `task.busy`, `task.activity`, `task.turnStartedAt`
  (`server/store.ts:1617-1621`), and `group.turnStartedAt` (`:842`).
- Not saved to disk (`registry-store.ts:75`, `:89`).

### 4.5 The queued message

- In memory: `Map<threadId, QueueEntry>` (`steer-queue.ts:53`). An item has
  21 fields: `messageId`, `text`, `replyToId`, `sendId`, `dataContext`,
  `mentions`, `peerAsk` and more (`:20-49`).
- On disk: the `chat_followups` table (`message-db.ts:328-332`). The status
  is `pending`, `dispatching`, `cancelled` or `interrupted`.
- Sent to the window: `{queueId, text, reason?, why?, sender?}`
  (`steer-queue.ts:94-97`).
- In the window: `pendingQueued` for each thread, and `consumedQueueIds`, 64
  ids at most (`store.tsx:568-569`, `queue-receipts.ts:5`).

### 4.6 The usage of a thread

```ts
interface TaskUsage {            // store.tsx:266-274
  input: number; output: number; cachedInput?: number;
  costUsd: number | null; turns: number;
  lastTurn?: { input: number; output: number; cachedInput?: number; costUsd: number | null };
  context?: { tokens: number; window?: number };
}
```

Stored for each task in `bots.json`, saved "later" (`server/store.ts:1839`).

### 4.7 The Inspector

- `NativeRecord {at, dir: "in" | "out", source, msg}` (`shared/inspector.ts:5-10`).
- `InspectorPage {entries, total: {runtime, native}}` (`:16-20`).
- `INSPECTOR_WINDOW_LIMIT = 400` (`inspector-window.ts:4`).

### 4.8 What is stored and where

| Data | Where | Redacted |
|---|---|---|
| Deltas | not stored. Sent live and kept in the SSE replay buffer | no (`index.ts:6308`, `public-reply.ts:1-3`) |
| `item.completed` text | the message row | yes (`public-reply.ts:9-14`) |
| The step | the event log and the activity row | yes (`bus.ts:170`, `step-summary.ts:11-14`) |
| `turn.progress`, `tail`, `quiet` | not stored, in the replay buffer | the tail yes (`live-steps.ts:44-57`) |
| The usage of a thread | `bots.json`, saved later | not secret |
| The queued text | `chat_followups` | no |

## 5. The UI

### 5.1 Components

| Component | What it does | Lines |
|---|---|---|
| `MessagesList` in `ChatView.tsx` | merges live rows into the list | `:613`, `:733-739` |
| `Bubble` | reads its live words with `useLiveRow` | `:301` |
| `ChatMarkdown` | draws Markdown, block by block while streaming | `ChatMarkdown.tsx:855-964` |
| `CodeBlock` | a code block, open or closed | `CodeBlock.tsx:164-329` |
| `TurnPresence` | the status line and the toggle of the "Now" card | `TurnPresence.tsx:89-256` |
| `WorkingTimer` | the timer, one update each second | `WorkingIndicator.tsx:21-31` |
| `NowCard` | the card under the status line | `NowCard.tsx:16-43` |
| `TurnNarrationRun` | the "Worked for" chip | `TurnNarrationRun.tsx:18-42` |
| `ComposerQueuedMessages` | the queued rows above the composer | `ComposerQueuedMessages.tsx:49-173` |
| `ChatMoreMenu` | the Usage row and the Inspector item | `ChatMoreMenu.tsx:157-180` |
| `SkillBurgerSlot`, `SkillBurger` | the Skill Burger card in the dock | `ChatView.tsx:1169` |
| `InspectorPanel`, `RunLog` | the Inspector side panel | `App.tsx:482` |

The order in the chat view (`ChatView.tsx`):

1. The top bar: the header, the error banner, the notice (`:927-1069`).
2. The scroll area: the list, the stop notice, `TurnPresence` (`:1071-1163`).
3. The dock: `SkillBurgerSlot`, "Jump to latest", the composer (`:1168-1195`).

### 5.2 Text

Keys and lines are in `src/locales/en.json`.

**The status line**

| Text | Key | Line |
|---|---|---|
| "Working" | `chat.activity.working` | 2904 |
| "Thinking" | `chat.activity.thinking` | 2902 |
| "Summarizing earlier messages…" | `chat.activity.summarizing` | 2903 |
| "Typing…" | `chat.typing` | 2905 |
| "Teammates working" | `chat.teammatesWorking` | 2914 |
| "Thinking it through" (Simple) | `chat.friendly.thinking` | 2915 |
| "Writing a reply" | `chat.activity.reply` | 2941 |
| "Running {target}" / "Running a command" | `chat.activity.runningNamed` / `runCommand` | 2945 / 2925 |
| "Searching the web for “{target}”" | `chat.activity.searchingWebFor` | 2946 |
| "Reading {target}" (a site) | `chat.activity.readingSite` | 2947 |
| "Writing {file}", "Editing {file}", "Reading {file}" | `chat.activity.*Named` | 2942-2944 |
| "{count} KB", "{count} MB" | `chat.activity.sizeKb`, `sizeMb` | 2975-2976 |
| "last output just now" / "{count} min ago" / "{count} h ago" | `chat.liveness.output*` | 2948-2950 |
| "nothing new for {count} min" / "{count} h" | `chat.liveness.silent*` | 2951-2952 |
| "waiting on the network", "busy, no output yet", "idle, no output yet" | `chat.liveness.*` | 2953-2955 |

**The "Now" card**

| Text | Key | Line |
|---|---|---|
| "What {name} is doing" (toggle and region label) | `chat.now.title` | 2956 |
| "Open activity" | `chat.now.openActivity` | 2957 |
| "Latest output" (screen readers) | `chat.now.output` | 2958 |
| "done", "in progress", "failed" | `chat.now.state*` | 2959-2961 |
| "Ran {target}", "Wrote {target}", "Read a file" and others | `chat.now.*` | 2962-2974 |

The marks of the steps are "✓", "✕" and "●", in the code (`NowCard.tsx:13`).

**"Worked for"**: "Worked" (2997), "Worked for {elapsed}" (2998), "{count}
steps · {tools}" (2999), "Show every step" (3000).

**Stop**: "Stop" (`chat.stop`, 2791), title "Stop this turn"
(`chat.stopTurn`, 2792). The header has a hidden status "Working…"
(`sidebar.preview.working`, 2256) for screen readers (`ChatView.tsx:998`).

**Code blocks**: "Wrap" / "Unwrap" (131-132), "Save" (135), "Copy" (137),
"Copied" (140), "Could not copy" (2127). Simple mode: "Wrap lines" (145),
"Save as file" (146), caption "{language} · {lines}" (147). Mermaid: "Mermaid
diagram" (9018), "Diagram could not be rendered: {error}" (10164).

**Queued messages**: "1 queued message" / "{count} queued messages"
(3119-3120). Edit: aria "Edit queued message {index} of {count}" (3186),
title "Edit: move this message back into the composer" (3187). Delete: aria
"Delete queued message {index} of {count}" (3184), title "Delete this queued
message" (3185). The Starter plan line: "Queued. Starter runs one thread at a
time per bot, so this starts when the one running finishes. A bigger plan
runs more." with "See plans" (8375-8376). The other lines are in
[`queue-and-steer.md`](queue-and-steer.md), 5.2.

**Usage**: the row "Usage" (`chat.usage.menu`, 2809). Tooltip lines: "1 turn"
/ "{count} turns" (2847-2848), "{tokens} uncached input" (2850), "{tokens}
cached input" (2851), "{tokens} output" (2853), "Last message: {detail}"
(2854), "Context {tokens} ({percent}% of {window})" (2862), "Long thread: the
model re-reads all of it on every message. A new thread starts small."
(2864). Cost captions: "equivalent (on your subscription, not billed)"
(2869), "billed to your API key" (2876), "as reported by the provider"
(2877).

**Tool rows**: "Tool calls" (2025), "Show each tool a bot runs in the chat.
Errors always show." (11321), "Show tool calls in chat" (2029), "Could not
save the tool-call setting." (2030).

**Skill Burger**: "Add Skill Burger" (11788), "Saving…" (11789), "Skill
Burger saved" (11790), "Undo" (2246), "Removed from your skills." (11791),
"Add it when the run finishes" (11797).

**Inspector**: "Inspector" (9183), "Run log" (2581), "Copy redacted run log"
(2583), "Copied. Review the log before sharing; redaction may not catch every
secret." (2584), "No runtime events for this thread yet." (9193).

### 5.3 States

| State | What shows | Lines |
|---|---|---|
| Idle, no messages | the empty chat, only when not busy | `ChatView.tsx:1098` |
| Busy, no frame yet | "Working · 12s", the lead shimmers | `TurnPresence.test.ts:105-111` |
| Reasoning | "Working · 12s · Thinking" | `turn-status.ts:68-69` |
| Reply streams | the live bubble grows, the status line is under it | `ChatView.tsx:888-889` |
| A tool runs | "Working · 1m 12s · Writing index.html · 14 KB" | `TurnPresence.test.ts:98-103` |
| A long quiet tool | "… · busy, no output yet" | `TurnPresence.test.ts:124-133` |
| No frame for 2 min | "… · nothing new for N min" | `now-steps.ts:83-92` |
| Waits on the person | no status line | `ChatView.tsx:860` |
| Reply stored | the stored row replaces the live row, 520 ms "answer" phase | `ChatView.tsx:876-885` |
| Error | `runtime.error` does not change the status line. The error row shows in the list | `turn-status.ts:81-82`, `ChatView.tsx:683-692` |
| Stopped from this window | a "stopped" row made in the window, before the server row | `ChatView.tsx:1122`, `stop-turn.ts:101-106` |

### 5.4 The phone layout of the chat

From `ChatView.tsx` with `phone = useMediaQuery(PHONE_LAYOUT)` (`:759`):

- no fork action (`:302`).
- the header centres the name (`:936-937`) and hides the role (`:998`).
- `UsageAlert` shows and `ModelPicker` hides (`:1029-1031`).
- the screen buttons hide (`:1032`, `:1039`).
- the Inspector fills the chat (`InspectorPanel.tsx:168`).

### 5.5 Rules of `DESIGN.md` for this feature

- A streaming reply's blocks fade in over 600 ms, one time each. Each other
  motion has a limit of 300 ms (`DESIGN.md:289-290`).
- No loop except a live status (`:297`). A mascot moves only while its bot
  works (`:299-302`).
- Timers use `tabular-nums` (`:146-147`).
- Rich content (tables, code, quotes) stays in the bubble (`:250-252`).
- Touch targets are 40 to 44 px (`:183-184`).
- "…" for work in progress (`:330-331`).
- Tokens, usage, inspectors and raw logs belong in Advanced (`:359-360`). The
  reference does not obey this rule: the Inspector and the Usage row are in
  the Simple menu.
- No new settings (`:54-56`).
- `DESIGN.md` has no rule for a caret, Stop, the busy line or the queue.

### 5.6 The document of the reference does not agree with the code

- "In-flight reply text" (`chat-ui.md:194-205`) says "The renderer keeps no
  streamed text". The code and the next section stream text. It also says
  that `runtimeFrameAction` "passes only the model-variant frames". It also
  passes `turn.started` and `turn.completed` (`store.tsx:2028`).
- `chat-ui.md:54` and `:328-329` name "Save as skill". The window no longer
  draws it.
- `chat-ui.md:70` expects a chip "Bash". The test expects "Run a command"
  (`control-omb-ui.e2e.test.ts:319`).
- `chat-ui.md:98` says "Add skill". The button says "Add Skill Burger".
- The screenshot shows an "Execution timeline" row. No component draws it
  now. Commit `ebd6e685e` moved it into the Run log of the Inspector.

## 6. The tests

### 6.1 The live reply

- `src/state/live-reply.test.ts` (322 lines):
  - The text grows, reasoning stays out, the last word waits (`:40-50`).
  - Each thread has its own items (`:52-58`).
  - The live item stays until the transcript draws its stored message, and
    the two never show together (`:60-73`).
  - A replayed frame does not add the text two times (`:85-97`).
  - A turn end, a terminal error and Stop drop an unsaved item. A
    non-terminal error does not (`:99-121`).
  - After a gap, nothing shows until a boundary (`:138-149`).
  - A secret is masked, and a half-typed secret never shows (`:151-157`).
  - Text, tool, text, tool, text gives three messages (`:200-224`).
  - The swap works by `itemId` with no `message` frame (`:226-231`).
  - 30 background turns leave at most one item, and at most 32 items stay
    (`:277-321`).
- `src/components/ChatView.live-reply.test.ts` (212 lines): in both modes the
  row grows in place and draws bold text while it streams. Its actions are
  inert. The stored row replaces it with the same markup (`:92-125`). The row
  disappears on `turn.completed ok: false` (`:128-135`).
- `src/components/ChatMarkdown.streaming.test.ts` (197 lines): a finished
  block is parsed one time (`:62-72`). The streamed page equals the finished
  page (`:74-85`). An open fence has inert actions until it closes
  (`:96-109`). Long lists and tables are parsed piece by piece (`:131-163`).
- `src/components/ChatMarkdown.stream-fade.test.ts` (83 lines, new): the
  elements stay the same as they grow, also when a fence closes. The CSS
  uses only opacity and obeys reduced motion (`:44-82`).
- `src/components/ChatMarkdown.stream-identity.test.ts` (228 lines): for 85
  documents and 150 random documents, each prefix drawn in parts equals the
  whole parse (`:197-227`).

### 6.2 The live reply of each driver

- `server/drivers/claude-live-reply.test.ts` (55 lines) and
  `server/drivers/acp/live-reply-matrix.test.ts` (81 lines, 14 ACP drivers)
  run 16 scripted cases (`server/testing/live-reply-cases.ts:18-44`) against
  a fake engine CLI. `replyProblems` (`text-items.testkit.ts:27-53`) checks:
  each delta and completion has an id, the streamed text equals the
  completion, no reasoning text shows, and no token is doubled or lost.
- `scripts/verify-live-reply.ts` (299 lines) is a manual end-to-end check in a
  real browser. It samples the page on each animation frame and writes
  `results.md`. It is not in the unit test suite.

### 6.3 The step

- `server/step-summary.test.ts` (113 lines): 20 command cases (`:8-32`). No
  secret in any field: key, Bearer token, `?token=` (`:62-78`). Each engine
  gives the same step (`:85-99`). Unknown tools get no step (`:108-112`).
- `server/harness/live-steps.test.ts` (171 lines): `observe` adds the step and
  sends nothing, `announce` sends the frame (`:51-60`). The quiet part comes
  after 60 s and changes only on a new state (`:90-115`). The tail masks
  `export TOKEN=…` (`:125-143`). A terminal event forgets the thread
  (`:145-157`).

### 6.4 The status line, the timer and the "Now" card

- `src/components/TurnPresence.test.ts` (221 lines): each phrase holds 4 to
  6 s (`:40-48`). The line reads "Working · 1m 12s · Writing index.html · 14
  KB" (`:98-103`). The "Now" card folds and unfolds, and Escape gives focus
  back (`:147-179`).
- `src/state/turn-status.test.ts` (112 lines): silence starts again at each
  frame (`:16-24`). A late frame does not open an ended turn again, but a new
  `turnId` does (`:64-72`).
- `src/components/ChatView.live-status.test.ts` (244 lines): the line stays
  after a sentence in the middle of a turn (`:123-128`) and through a tool of
  10 minutes (`:140-157`). It clears on `turn.completed` while busy is still
  true (`:159-176`). It hides while the bot waits on the person (`:178-191`).
- `scripts/testing/thinking-timer-ui.e2e.test.ts` (278 lines): the timer
  keeps its count after a change of thread, for a 1:1 chat and for a room
  (`:144-277`).
- No test covers a reload during a turn, the "Worked for" tooltip, or a
  stale step after a gap.

### 6.5 The queued message and the usage

- `ComposerQueuedMessages.test.ts:136-153`: the pencil shows on each row only
  with `onEdit`. This is the only test of the edit. It does not test the
  remove and the refill.
- `drafts.test.ts:417-447`: the words go above the typed text.
- `server/routes/bot-messages.test.ts:570-597`: the DELETE gives 200, then
  404 for a second DELETE and 404 after a drain.
- `scripts/testing/usage-details-ui.e2e.test.ts` (156 lines): after one turn,
  the tooltip has "Last message: 10 uncached input · 2 cached input · 5
  output" and the row shows "$0.01" (`:42-44`). The old format is gone
  (`:45-46`). It checks the layout at four widths (`:61-147`).

### 6.6 The parts recorded only

- `scripts/testing/control-omb-ui.e2e.test.ts` (392 lines): search, keys,
  one turn, the Inspector tabs, and the cleanup after Ctrl-C.
- `src/lib/feature-flags.test.ts`: tool chips are hidden by default
  (`:54-62`).
- `SkillBurger.dom.test.ts` (173 lines): one step shows no card, two steps do
  (`:43-54`). Save and Undo send the correct requests (`:56-67`). The
  summary is fetched only after the run (`:96-105`).

## 7. Ours compared

### 7.1 What we have now

- Ours: `crates/bot-desktop/ui/src/features/chat/ChatPane.tsx` (59 lines).
  It calls the Tauri command `send_message`, waits for one string, and adds
  it as a bot row. The composer is off while it waits. There is no stream,
  no status line, no timer, no queue and no usage.
- Ours: `crates/bot-protocol/src/event.rs` has the five events of decision
  D20: `turn.started`, `content.delta`, `item.completed`, `runtime.error` and
  `turn.completed` with `outcome`.
- Ours: `crates/bot-core/src/lib.rs` has only `echo_reply`.

### 7.2 What step 7 plans, and the reference files of each part

| PR | Ours | Reference files |
|---|---|---|
| 7.1 | `bot-core/src/bus.rs` | `server/harness/bus.ts` (the delta merge, the delivery order) |
| 7.2 | `bot-core/src/runner.rs` | `bus.ts`, and the turn part of the fold in `server/index.ts` |
| 7.4 | `bot-desktop/src/events.rs` | `server/index.ts:6305-6311` (the runtime broadcast), `server/harness/public-reply.ts` |
| 7.5 | `ui/src/features/chat/useTurnEvents.ts`, `ChatPane.tsx` | `src/state/live-reply.ts`, `src/state/turn-status.ts`, `src/lib/turn-tail.ts`, `src/components/TurnPresence.tsx`, `src/components/WorkingIndicator.tsx`, `src/lib/working-time.ts`, the live parts of `ChatView.tsx` |

### 7.3 What step 7 needs from this feature

1. A live item for each `item_id`, which grows on `content.delta` of
   `assistant_text` and ignores reasoning (3.2).
2. The last-word hold and the redaction of the text that shows (3.4).
3. The swap to the stored text with no double row (3.3). Before step 8 we
   have no store, so `item.completed` is the end text (plan PR 7.5).
4. One rule for the turn end (3.5, 3.8).
5. A status line with "Working", the timer, and "Thinking" or "Writing a
   reply" (3.8 to 3.10).
6. Stop that freezes the text (3.5).

### 7.4 What step 7 does not need

- The gap rule and the replay (one process, no SSE).
- The streaming Markdown blocks and pieces (3.6). A parse of the whole text
  at each painted frame is enough at first.
- The live step on the server (3.7). Our events have no tool events before
  step 12.
- The quiet part, the tail and the "Now" card. They need tool events.
- "Worked for", the queue edit (step 8 has the queue), the usage details
  (D20 has no usage yet), the Inspector, the tool rows, the Skill Burger and
  the headless-browser driver.

### 7.5 Where we differ

| Point | The reference | Ours (plan) |
|---|---|---|
| Who owns the live text | the window, in three stores | not decided. The plan puts it in the window (PR 7.5) |
| Redaction of live text | in the window only, at draw time | not decided. Proposal P25 (option b or c) puts it in `bot-core` |
| The timer start | server stamp, else the window clock | not decided |
| The turn end | four modules, two lists | one `turn.completed` (D20) |
| The busy flag | on the task, in server memory | not decided |
| A step | `activity` + `target` + `file` fields | no tool events before step 12 |
| The queue edit | remove, then refill the composer | the queue comes in step 8 |
| Usage | on `turn.completed`, saved later | no usage field yet (D20). `changelog.md` section 7, row "Usage and cost numbers corrected", proposes an optional `usage` on `turn.completed` in step 5 |

## 8. Where we can be better

1. **Redact the live text in `bot-core`, before the event leaves for the
   window.** The reference sends deltas raw to every window
   (`public-reply.ts:1-3`, `index.ts:6308`). It masks them only at draw time
   (`live-reply.ts:185`). Three gaps follow:
   - The raw text is on the wire, in the replay buffer and in the memory of
     the window (`live-reply.ts:20`).
   - The window has no held secrets, so a Vault value shows until
     `item.completed` (`shared/redact.ts:140-150`, scrubbers only on the
     server).
   - A private key block is masked only when its END line arrives
     (`shared/redact.ts:79-92`). The last-word hold lets each base64 line
     through. One subagent ran `redactSecretsInText` on a block with no END
     line, and the key body came back.
   Ours: a streaming redactor in `bot-core` holds the last word and holds an
   open `BEGIN … PRIVATE KEY` block until its END line. The voice path of the
   reference already holds such a block (`src/lib/spoken-reply-stream.ts:13-16`,
   `:49-54`). Reason: we do not copy problem (1), and one copy of the rule is
   less code than three (driver, window, voice).
2. **One `is_terminal()` function on the event type.** `live-reply.ts:78-80`
   and `bus.ts:45-50` count a terminal `runtime.error` as an end.
   `turn-status.ts:57-60` does not. A terminal error with no
   `turn.completed` then drops the text but keeps the status line. Ours: D20
   already makes `turn.completed` the only last event. A `match` with no
   default arm in one function makes each new event kind a decision. Reason:
   the compiler refuses a missing case.
3. **The live item as an enum.** `Streaming { text } | Done { text } |
   Saved { text, message_id }`, with methods that refuse a delta to `Done`
   and `Saved` before `Done`. The reference can set `savedAs` on an item
   that still streams (`live-reply.ts:131-132`). Reason: a wrong state that
   the compiler refuses.
4. **A mandatory `item_id` on the text events.** The reference keeps a second
   path for events with no id (`legacyOpen`, `sameTurn`, `live-reply.ts:73`,
   `:119-123`, `:133`). Reason: less code. This repeats point 5 of
   [`event-bus-fold.md`](event-bus-fold.md), section 8, with new facts.
5. **No global gap flag.** The flag of the reference never goes back to
   false, so a reply that streams when the window opens shows nothing until
   its next boundary (`live-reply.ts:50`, `:89`, `store.tsx:3199`). Ours: a
   window that opens asks `bot-core` for the open items of the thread, then
   listens. Reason: we do not copy a known problem.
6. **Freeze on Stop only after the runtime accepts it.** The reference
   freezes before the POST and does not undo it on a refusal
   (`stop-turn.ts:70`, `:86-91`). Ours: the runtime returns a typed refusal
   (`AGENTS.md`), and the window freezes on success. Reason: no state shown
   before it is saved (`changelog.md` section 7).
7. **The timer from the stamp of the turn start, never from the window
   clock.** The reference falls back to `Date.now()` (`ChatView.tsx:901`). It
   also counts "Worked for" from another start, the user message
   (`activity-runs.ts:51-54`). Ours: `turn.started` carries the start time
   that `bot-core` writes, and the timer and "Worked for" both use it. A
   `Running { turn_id, started_at }` state makes a busy turn with no start
   impossible. Reason: a wrong state that the compiler refuses, and one
   source for two numbers.
8. **The busy state ends with a typed event, not only a flag.** The fix of
   the reference for v0.1.151 clears the busy flag on the server
   (`idle-threads.ts:1-3`). It sends no turn end, so the live stores of the
   window keep their state until a new `turnId` arrives. Ours: a watchdog of
   `bot-core` ends a stuck turn with `turn.completed { outcome: failed }` and
   an error code. Each subscriber then sees the same end. Reason: we do not
   copy problem (3).
9. **Stop in every layout while a turn runs.** The reference hides the header
   Stop in Simple mode on the desktop (`ChatView.tsx:761`, `:1015`). Reason:
   a person must always have a way to end a turn that does not end.
10. **A real edit of a queued message.** One runtime call
    `edit_queued(queue_id, text)` changes the stored row in one transaction
    and returns a typed refusal (`AlreadyDispatched`, `NotYours`). The
    message keeps its place, its reply target and its mentions. The lost-answer
    case (3.14) cannot occur. Reason: we do not copy the problem "work lost".
    Also, the queue item state enum of [`queue-and-steer.md`](queue-and-steer.md)
    point 1 already refuses an edit of an item that runs.
11. **Usage written with its turn end in one transaction.** The reference
    emits the usage at once and saves it later. A crash loses it
    (`server/store.ts:1839-1840`, `registry-save.ts:54-55`). Reason: the
    `AGENTS.md` rule, row and event in one transaction. Also:
    `last_turn: Option<TurnUsage>` with optional counts, so a turn with no
    report does not print "0 input" (`server/store.ts:1816`, `:1829-1834`). Show the cost of the
    last turn, which the reference stores and never shows.
12. **Keep live progress frames out of any replay, or say that they are in
    it.** The type comment of the reference says "nothing stores it", but
    the replay buffer keeps them (`runtime-events.ts:119-121`,
    `index.ts:4676`). Reason: a document that agrees with the code.
13. **Redact the live events of the Inspector, and put it in Advanced.** The
    Events tab shows raw live JSON, also deltas (`InspectorPanel.tsx:106-113`,
    `:263-267`). It is in the Simple menu, against `DESIGN.md:359-360`.
    Reason: problem (1), and the design rule of the reference.
14. **First a simple Markdown stream.** Parse the whole text one time for
    each painted frame, and draw an open fence as plain code with inert
    actions. The block and piece cache of the reference is about 310 lines
    and needs an 85-case test to stay equal to a whole parse
    (`markdown-stream-blocks.ts`, `markdown-stream-pieces.ts`,
    `stream-identity.test.ts`). Add it when a long reply is slow. Reason:
    less code.
15. **Do not port the Skill Burger, and remove unused locale keys.** The
    reference replaced the "This run" card after a short life (commit
    `d7791369e`, 2026-11-23). It left dead keys: `chat.verify.title` "This
    run" (`en.json:2822`), `chat.verify.save` "Save as skill" (`:2837`),
    `chat.timeline.title` (`:2578`), eight `chat.usage.*` keys
    (`:2857-2868`) and three `settings.toolCalls.*` keys (`:2026-2028`). The
    localStorage key of the old setting still folds the new card
    (`src/lib/skill-burger.ts:14-22`). Ours: a test that fails on a locale
    key with no reader. Reason: we do not copy problem (4).
16. **Keep these rules of the reference as they are:** no colours for an open
    fence or code over 100,000 characters, 44 px touch targets, a code action
    row of its own below 40 rem, a 600 ms fade once per block, no caret,
    `tabular-nums` for the timer, a timer outside React. Reason: they are
    small and cheap.
17. **Port the checks of `replyProblems` as a runtime test.** One id for each
    message, streamed text equals the completion, no reasoning text, no
    doubled or lost token (`text-items.testkit.ts:27-53`). Use our fake
    driver and an in-memory store. Reason: the same guarantees for each
    driver, with no real engine.

### 8.1 Problems of `changelog.md` section 5 that the reference has here

| Problem | Here | Evidence |
|---|---|---|
| A secret in the wrong place (streamed text masked only "once the message is saved", v0.1.154) | **Yes.** The window masks at draw time. The wire, the replay buffer, the memory of the window and the Inspector Events tab have the raw text. A key block with no END line shows | `public-reply.ts:1-3`, `index.ts:6308`, `live-reply.ts:185`, `shared/redact.ts:79-92`, `InspectorPanel.tsx:106-113` |
| State shown before it is saved (`changelog.md` section 7) | **Yes.** Stop freezes before the POST. The window "stopped" row comes before the server row. The timer falls back to the window clock. The usage shows before its save. A steer drops the queue row while the table row is `pending`. The Skill Burger "saved" state is window memory | `stop-turn.ts:70`, `ChatView.tsx:901`, `:1122`, `server/store.ts:1839-1840`, `steer-queue.ts:301-305`, `src/lib/skill-burger.ts:148-153` |
| A turn or a wait that does not end (v0.1.151) | **Partly fixed.** The server frees a thread that no engine holds. The window has no timer, and a lost end frame keeps the status line while busy. A terminal `runtime.error` does not end the status. A tracked call has no limit | `idle-threads.ts:1-3`, `turn-tail.ts:5-6`, `turn-status.ts:57-60`, `live-steps.ts:71` |
| A feature added, then removed | **Yes.** The Skill Burger replaced the "This run" card. Dead keys and an old setting key stay | commit `d7791369e`, `en.json:2822`, `src/lib/skill-burger.ts:14-22` |
| The same work done two times, or lost | **Yes, lost.** An edit whose DELETE answer is lost loses the words. An edit loses the reply target and the mentions | `store.tsx:2292-2298`, `store.tsx:568` |
| Usage and cost numbers corrected | **Yes.** A turn with no report counts as 0. The last turn's cost is never shown. A crash loses the last turn's usage | `server/store.ts:1816`, `:1829-1834`, `usage.test.ts:180-184`, `registry-save.ts:54-55` |
| "Busy" and races between bots | **Partly.** A turn end does not compare `turnId`, so one end drops each open item of the thread | `live-reply.ts:112-114` |

## 9. Not verified

### 9.1 Facts that nobody ran or read

- A reload of the window during a busy turn. The code says that the timer
  keeps its count (`store.tsx:374`, `server/store.ts:1620`). No test covers
  it.
- That a streaming private key body shows unmasked in the window. One
  subagent ran the redaction function with Node. Nobody ran the window.
- The value of `stallMs` of the watchdog.
- Whether a queued message changes its `at` when it starts, which decides if
  "Worked for" counts the time in the queue.
- Whether the itemId of a Claude `turn.progress` equals the itemId of its
  `item.started`. If not, the step words never merge for Claude.
- `batchSaves` (`server/save-batch.ts`): whether the activity row is on disk
  before the step frame goes out.
- `TextItems.stamp`, the fake engine CLIs, `samplePosix` and `sampleWindows`.
- How a `bot` change of the store becomes the `tasks[].usage` of the window.
- How the Claude adapter maps the token fields of the fake CLI to `input: 12,
  cachedInput: 2`. This comes from the e2e assertion only.
- Whether a raw `<attached-image>` tag that an edit puts back is sent again
  as a picture.
- Where the usage of a room shows (`GroupUsageChip.tsx`, `RoomMoreMenu.tsx`).
- Whether `content.delta` events are in the event log file. If not, live
  deltas stay unredacted in the Inspector after its refresh.
- `GroupView.live-reply.test.ts`, `GroupView.render-count.test.ts`,
  `use-transcript-viewport*.test.ts`, `touch-actions.test.ts`,
  `RunBurger.tsx` and the other Skill Burger files: not read.
- No phone app in this repository draws chat Markdown. The phone rules in
  3.6 are the CSS of the window for narrow and touch screens.
- The Inspector of approvals. The subagent did not find one. The feature
  `approval-cards` owns it.
- The main session checked these facts against the code: 3.2 to 3.5, 3.8,
  3.9, 3.10 steps 1 to 3, 3.13 step 4, 3.14 steps 2 and 5, 3.15 step 3,
  3.16 (Skill Burger rule and commit, usage row, Inspector frames), the CSS
  of 3.6 step 10, and `DESIGN.md:289-290`, `:359-360`. It took the other
  facts from the subagent reports.

### 9.2 Lines of the earlier research that are now wrong

`git diff 3aec210 ad27f0716` changed `src/components/ChatView.tsx` (1,227 to
1,201 lines) and `docs/verification/chat-ui.md` (359 to 337 lines).
`src/state/live-reply.ts` did not change. Lines 1 to 704 of `ChatView.tsx`
did not move. From line 705 the file moved by +2, then by -8 or -9 after the
removed run card.

What changed in `ChatView.tsx`:

1. The "This run" card (`VerifyCard`), its state and its setting are gone.
   `SkillBurgerSlot` is in the dock (`:1169`).
2. `BotExchangeLine` is new in the dock (`:1171`).
3. The follow-up line of a wait shows as an automation note (`:705-706`).
4. The header mascot moves only for a beat of 1,400 ms (`:819-821`).
5. `lastRequests` replaces the inline search for the last user text (`:848`).

What changed in `chat-ui.md`: one hunk at `:89-102` removes the "This run"
paragraph and adds the Skill Burger paragraph.

These citations in our files are now wrong:

| Our file and line | Old citation | At `ad27f0716` |
|---|---|---|
| `event-bus-fold.md:147` | `ChatView.tsx` (1,227) | 1,201 lines |
| `event-bus-fold.md:154` | `docs/verification/chat-ui.md` (359) | 337 lines |
| `event-bus-fold.md:513` | `store.tsx:3204-3211`, the store calls `forgetLiveReplies()` | `store.tsx:3196-3203`. The store calls `publishMissedFrames()`, which calls `forgetLiveReplies()` |
| `event-bus-fold.md:533` | `live-reply.ts:76-116` | `:83-116`. Lines 76-82 are `kept` and `isTurnEnd` |
| `event-bus-fold.md:578` | "A turn end sets the state to `ended`" | only `turn.completed`, `cap.exhausted` and `session.exited` (`turn-status.ts:57-60`) |
| `event-bus-fold.md:592` | `ChatView.live-reply.test.ts:127-134` | `:128-135` |
| `event-bus-fold.md:702` | `StreamingReplyContext` (`:731-737`) | `:733-739`, the wrap at `:738` |
| `event-bus-fold.md:706` | `ChatMarkdown.tsx` `:850-976` | `:855-964` |
| `event-bus-fold.md:727` | Stop, `ChatView.tsx:1024-1036` | `:1015-1027`, shown only when `!simpleHead` |
| `event-bus-fold.md:729` | `ChatView.tsx:897-898` | `:888-889` |
| `event-bus-fold.md:730` | `ChatView.tsx:885-894` | `:876-885` |
| `event-bus-fold.md:731` | `:1120` (`canRetryLast`) | `:1111` |
| `event-bus-fold.md:728` | "Thinking", `en.json:2895` | `en.json:2902` |
| `event-bus-fold.md:736` | `ChatView.tsx:869` | `:860` |
| `event-bus-fold.md:738` | `ChatView.tsx:747` | `:749` |
| `event-bus-fold.md:752` | `ChatView.tsx:1093-1097`, `:1174` | `:1084-1088`, `:1165` |
| `event-bus-fold.md:757` | `chat-ui.md:216-227` | `:194-205` |
| `event-bus-fold.md:758` | `chat-ui.md:264-299` | `:242-289` |
| `chat-turns.md:194` | `chat-ui.md` (359) | 337 lines |
| `chat-turns.md:297` | ranges `820-830, 864-872, 1010-1035, 1126-1133` | `812-824, 855-863, 1001-1026, 1117-1124` |
| `chat-turns.md:299` | `DESIGN.md` (420 lines) | 421 lines |
| `chat-turns.md:739` | `ChatView.tsx:1024-1034` | `:1015-1025` |
| `queue-and-steer.md:110` | `chat-ui.md` (359) | 337 lines |
| `queue-and-steer.md:770` | `ChatView.tsx: 395-504, 1100-1226` | `395-504, 1091-1200` |
| `reference-features.md:516` | "Add skill" saves the run | the button says "Add Skill Burger" (`en.json:11788`) |

These statements are incomplete, not wrong in their lines:

- `event-bus-fold.md:530-534` lists four conditions for a delta. The gap
  rule is a fifth (`live-reply.ts:89`). `item.completed` also clears
  `skipping` (`:105`).
- `event-bus-fold.md` 3.15 step 2 (Stop): the freeze occurs before the POST, and
  nothing undoes it on a refusal (`stop-turn.ts:70`, `:86-91`).
- `event-bus-fold.md` 3.15 step 1: `item.started`, `item.completed`,
  `request.opened` and `context.summarizing` also change the status, and a
  new `turnId` starts again (`turn-status.ts:50-80`).
- `event-bus-fold.md:719` "There is no caret": still true, but each block
  now fades in over 600 ms (`styles.css:1340-1354`).
- `chat-turns.md:738-740`: the Stop button also shows while the bot waits
  for teammates, and never in Simple mode on the desktop
  (`ChatView.tsx:761`, `:1015`).
- `chat-turns.md:762-763`: a finished reply at the end hides the line only
  after the turn ended (`turn-tail.ts:15-18`). The line also hides while the
  bot waits on the person (`ChatView.tsx:860`). The chat shows the
  `TurnPresence` line, not dots. `WorkingDots` is for "computer starting"
  (`ChatView.tsx:1133-1139`).
- `queue-and-steer.md:293-294` "The edited text is a new send at the end of the
  queue": an edit sends nothing. The words go to the top of the draft. Only
  a later Send by the person makes a new send (3.14).
- `queue-and-steer.md:289` and `:293`: `bot-messages.ts:373-387` is now `:375-389`,
  `Composer.tsx:443-462` is now `:451-470`, `message-db.ts:333-347` is now
  `:335-348`.
- `queue-and-steer.md` 5.2: the Starter plan line and "Steer all {count}
  queued messages now" are missing.
- `event-bus-fold.md:996-997` and `:1021-1022` list `LiveSteps` and
  `InspectorPanel.tsx` as not read. This file reads them (3.7, 3.16).
