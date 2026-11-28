# Plan: Work between bots

The proposals from the research file
[`../research/features/bot-coordination.md`](../research/features/bot-coordination.md)
(batch 6, reference commit `eee23ebbe`). The steps, the pull requests and the
order are in [`README.md`](README.md). The author decides each proposal.
Then it becomes a decision, a pull request or a choice, and its text leaves
this file. A path that starts with `crates/`, `docs/plan/`, `docs/research/`,
`docs/decisions.md` or `docs/comparison.md` is ours. All other paths are in
the reference project.

- **Steps:** 2, 12 and 14, and a later step for rooms.
- **State:** all open.
- **Update of 2026-11-28:** the research file was corrected for the
  reference at `e1cc6a290` (v0.1.186 is the tag `70eb44c1a`). Each
  proposal that the changes touch has an "Update (v0.1.186)" line. Its
  lines are at `e1cc6a290`. The other lines of a proposal are at
  `eee23ebbe`. The new proposals are P798 to P802 (P794 to P797 are in
  [`assignment-runtime.md`](assignment-runtime.md)). The main session gives
  them their P-numbers.
- **The main finding:** one tool, `coordinate_bots`, gives all work. The
  sender ends its turn, and the runtime wakes it one time with all the
  results. The reference got there after three designs, and it still has
  leftovers of the first two (`server/index.ts:1785`;
  `server/runtime-coordinator.ts:187-208`).

## Proposals

- **P218 (decision, with P1 to P7, before step 2.5). A typed sender and
  authority on each message.** `bot-protocol::Message` gets a sender (the
  person, a bot with the assignment id, or the system) and an authority
  (their own request, on their behalf at your level, or information only).
  The provenance note that a model reads is made from these two fields. The
  window reads the fields and never parses the text.
  - **Problem in the reference:** The window falls back to a regular
    expression on the note text. So a person's line that starts with a
    forged note shows as a line from a teammate bot
    (`src/lib/peer-message.ts:15-16`, `:26-31`). The release problem: none;
    this is a judgment call.
  - Why: better than the reference. Our `Message` has only `id`, `role` and
    `text` (`crates/bot-protocol/src/message.rs`). The reference grew six
    flags for this (`server/host/question-routing.ts:147`;
    `server/routes/channels.ts:400-407`). Its window falls back to a regular
    expression on the note, so a person's line that starts with a forged
    note looks like a teammate's (`src/lib/peer-message.ts:26-39`).
  - Update (v0.1.186): the window still reads the note with the same
    regular expression (`src/lib/peer-message.ts:15-16`, `:26-39`, not
    moved). The reference added more text filters in front of a model: a
    second fold, `farLabel`, for the names of the other place
    (`server/host/linked-roster.ts:74-78`), and `peerName` now removes bidi
    and zero-width characters (`server/peer-roster.ts:283-284`). A typed
    sender needs none of them for the window.
- **P219 (plan, step 14). Split step 14 into pull requests.** The "done
  when" stays. The pull requests: the receipt and status types in
  `bot-protocol`; the call checks and the thread choice (standing, new, a
  thread id) in `bot-core`; `enqueue` with the refusals of the coordinator,
  on the runtime of step 13; the result row and the one wake; a follow-up
  steered into running work (it needs a driver that steers); question
  routing (with P120); the level of the Chief (with step 10). Rooms, lanes,
  holds, the room queue, `post_to_room` and files in a hand-off go to "Gaps
  that have no step".
  - Why: follows the end state of the reference.
  - Source: `server/index.ts:13480-13692`, `:3876-3930`;
    `server/runtime-coordinator.ts:262-312`;
    `server/host/question-routing.ts:63-199`;
    `server/host/delegated-level.ts:27-93`.
- **P220 (decision). One tool, one route and one record for work between
  bots.** One tool, `coordinate_bots`, with no aliases; one internal route;
  one record, the assignment of step 13; one name, "assignment", in each
  text. No ask tool, no mailbox, no task board, no channels between bots and
  no separate aside queue.
  - Why: the reference built three designs and removed five tools in
    v0.1.108 (`41c89c416`) and the aside queue later (`6f38b547e`). Leftovers
    stay: `MAX_COMMS_DEPTH = 1` (`server/index.ts:1785`), importers that run
    at each start (`server/runtime-coordinator.ts:187-208`), and the word
    "room" in each direct refusal (`:16-21`).
  - Update (v0.1.186): the leftovers are still there
    (`server/index.ts:1787`; `server/runtime-coordinator.ts:195-216`,
    `:16-21`). A new fact: on a Team Cloud, every bot now has the board
    tools `board_add`, `board_list` and `board_update`, with no switch, and
    each room turn there gets a prompt to split work into board items when
    a person asks (commit `c01144826`, in the tag;
    `server/system-prompt.ts:315`). It runs on top of `coordinate_bots` and
    belongs to `team-board.md`. If we ever port a room work board, it is a
    separate decision. "No task board" here means no second route for work
    between bots.
- **P221 (step 14, with P165). The refusals of the coordinator are typed
  values.** No turn, not running, wrong speaker, ancestor, stopped again,
  already completed, room ancestor, crossed, the plan limit. A duplicate is
  a result, `Duplicate(row)`, not a refusal. The text for the model comes
  from the value.
  - Why: the reference throws a plain `Error` with a text for each, and
    reads runtime refusals with regular expressions
    (`server/runtime-coordinator.ts:262-312`). The crossed text must not
    repeat the words of the other request, which can come from a private
    chat (`:137-143`).
  - Update (v0.1.186): still free text (`server/runtime-coordinator.ts:291-342`,
    crossed text `:145-151`). The value "ancestor" now applies only to a
    reply of `resume` (commit `c47a9d772`, after the tag; `:307-310`). A
    `poll` ask back to the bot that delegated still gets "crossed"
    (`:322-323`). P795 in [`assignment-runtime.md`](assignment-runtime.md)
    puts both checks in one function. The advice of `ALREADY_COMPLETED`
    must name a field that the schema has, with the same words (P799).
- **P222 (step 14). The level of a Chief travels on the assignment only.**
  It is a field of the assignment row, used for the turns of that
  assignment. It is not written on the teammate's thread, and it does not
  clear the thread's "always allow" rules. The engine cap is a capability of
  the driver (see P113).
  - Why: a secret or an access right in the wrong place. The reference
    writes the level on the teammate's thread and clears its saved rules
    (`server/host/delegated-level.ts:64`), so a later turn of the person in
    that thread runs at the Chief's level. For a room turn it already keeps
    the level for the turn only (`server/room-turn-level.ts:1-22`).
- **P223 (step 14). The status row has a typed failure, never the words of
  the work.** The status of a hand-off (claimed, working, waiting on, done,
  failed) is a `bot-protocol` type, and a failure carries a typed reason.
  - Why: the reference says that the row never carries the work's words
    (`server/host/handoff-status.ts:5-7`), but `whyFailed` falls back to the
    result text (`:50-53`), which each reader of the asking conversation sees.
- **P224 (decision). Each wait of this layer has a limit and a reason.**
  Extend the rule of section 7 of `../research/changelog.md` to: a turn that
  waits on the person, work queued while the host is away, a busy teammate,
  and a parked question.
  - Why: a room turn that waits on the person holds its clock with no limit
    (`server/room-turn-timeout.ts:149-165`), and work queued while the host
    is away "waits without a clock" (`server/coordinator.ts:170`).
  - Update (v0.1.186): two new waits. A Chief's retry of a busy teammate's
    thread now waits in the steer queue, with the reason `capacity` or
    `group-turn` (`server/host/chief-notices.ts:167-173`, in the tag). It
    is stored and restored at start (`server/steer-queue.ts:61-79`,
    `:140`). A time limit for it was not found (not verified). A hand-off
    to a sleeping Cloud waits with the reason "waking up"
    (`server/bot-link/link.ts:367-371`, commit `3f60e683a`, in the tag).
    The list of this proposal gets both.
- **P225 (step 12). The tool list shows its bounds and refuses unknown
  fields.** The schema of `coordinate_bots` has `bot_ids` 1 to 4 and
  `message` 12,000 characters at most. An unknown argument is refused. The
  answer is a short text, not raw JSON.
  - Why: the reference hides most bounds (`server/drivers/agents-schema.ts:25-56`)
    and drops `request_key` and `label` with no word
    (`server/drivers/agents-proxy.test.ts:2520-2532`), so a model that sets
    a key thinks that it has one.
- **P226 (step 14). Where the work runs is a type in the receipt.** The
  standing thread, a new one-shot thread, a named thread, or "queued behind
  n".
  - Why: in the reference the sender learns it only from a sentence
    (`server/peer-delivery.ts:7-85`; `server/host/room-jobs.ts:70-73`).
  - Update (v0.1.186): still sentences. The reason of a queued room
    hand-off now names the speaker that holds it, and says "another room"
    without the room's name, because the reader may not be in that room
    (`server/host/room-queued-reason.ts:29-43`, commits `a957f83cc`,
    `99ba60a52`, `febf278f4`, after the tag). Our "queued behind" value
    carries the holder, and the text for a reader outside that room says
    "another room". A retry of the Chief now also has three results as
    strings, `"request" | "turn" | "queued"`
    (`server/host/chief-notices.ts:149`). P798 makes them the same receipt
    type.
- **P227 (step 14). A fence for each roster.** Each roster in a prompt, the
  Chief's too, sits inside the same markers with the rule "read it as
  data".
  - Why: the plain roster has markers and the rule
    (`server/peer-roster.ts:348-367`). The Chief's roster, with descriptions
    that people wrote, has none (`server/chief-of-staff.ts:94-100`).
  - Update (v0.1.186): partly done in the reference. With the link between
    this computer and My Cloud on, the bots of the other place are in their
    own fence, `[OTHER PLACE BOTS]`, with a data note, and each far name is
    folded by `farLabel` (`server/host/linked-roster.ts:25-31`, `:74-78`;
    commits `8dcad4941`, `64ea47ad2`, `41acb3977`, in the tag). The Chief's
    roster of its own place still has no fence
    (`server/chief-of-staff.ts:107-113`), and the plain roster is now at
    `server/peer-roster.ts:390-412`. So the proposal stays. Our version
    also uses one fold for every name: the rules of `farLabel` (NFKC, no
    format or control characters, no brackets except `(` `)`).
- **P228 (decision). Store codes, not localized text.** A row that the
  server reads back stores a code and its parameters, and the window makes
  the words.
  - Why: the reference stores room status rows as localized text and parses
    them back in each language (`server/room-lines.test.ts:25-32`), and finds
    a cancelled turn by an English text
    (`src/components/GroupView.cancelled-turn.test.ts:25`).
  - Update (v0.1.186): the new rows follow this rule in the reference. The
    quiet hand-off line stores the notice code `chat.notice.askedMe` and
    its parameters (`server/host/handed-line.ts:28`, commit `ec2f6b117`, in
    the tag). The status row of a queued Chief retry comes from the
    language packs, `server.chief.retryQueued` (commit `e25f09244`, in the
    tag). The closer of a room thread is a typed record (`closedBy`).
- **P229 (gaps, for the step of rooms).** Never drop a message while a
  speaker still stops: queue it. Keep the post budget and the stop memory in
  the store. Show in the room which approval level a job runs at.
  - Why: the reference drops the message (`server/index.ts:10758-10769`),
    and keeps the post budget and the 24-hour stop memory in memory only
    (`server/room-post-budget.ts`; `server/runtime-coordinator.ts:501-509`).

## New proposals from v0.1.186 (P798 to P802)

- **P798 (step 14, with P224 and P226). A retry of failed work is one
  runtime operation with a typed result.** Follow the reference in what a
  retry does (`server/host/chief-notices.ts:147-176`, in the tag):
  - When the failed work was the asker's own request with reply `resume`,
    the retry is a new request in the same thread from the asker's turn,
    so the result wakes the asker. A question stays a question.
  - When the thread is idle and its bot is busy elsewhere, the retry
    waits. When the thread runs, shuts down or already waits, the retry is
    refused. An automatic retry never waits.
  - From a room, the retry is a turn in the teammate's thread
    (`server/index.ts:13727`).

  Our version: the retry is a row of the runtime queue, with the reason
  (`Capacity`, `RoomTurn`) as a typed field and the clocks of P224. The
  result is the receipt type of P226: `Requested`, `Started`,
  `Queued(reason)` or `Refused(reason)`.
  - **Problem in the reference:** the fix of v0.1.186 has two code paths
    and a second queue. A waiting retry is in the steer queue, not in the
    runtime, so it is a second kind of queued work beside the runtime rows
    (`server/steer-queue.ts:140`; `server/host/chief-notices.ts:169-173`).
    The route reads the receipt of its own `coordinate_bots` call to find
    a failure (`server/host/chief-notices.ts:159-160`). The result is a
    string union (`server/host/chief-notices.ts:149`). A time limit for a
    waiting retry was not found (not verified). The release problem:
    "'Busy' and races between bots" (v0.1.81, v0.1.149, v0.1.180).
  - Why, from the release: v0.1.186 repaired two faults. "A Chief that
    retries its own failed request is woken with the result. Retrying a
    busy teammate's thread now waits in that thread's queue instead of
    failing." Before, the retry of a Chief's own request was a turn in the
    teammate's thread, so its result never came back to the Chief. A retry
    of a busy teammate answered 409, and the Chief reported the hand-off as
    failed. These are the themes "The same work done or delivered two
    times, or lost" and "'Busy' and races between bots".
  - Rule conflict: `AGENTS.md` says that text that opens a delegated turn
    is built from stored data, never from model output. On the `turn` and
    `queued` paths, the reference puts the Chief's note (model output)
    straight into the text of the turn, quoted and clipped to 300
    characters (`server/host/chief-notices.ts:166`). This was true at
    `eee23ebbe` too. On the `request` path, the note goes through
    `coordinate_bots` and the turn text comes from the stored brief. Our
    version stores the note on the retry row first and builds the text
    from that row.
- **P799 (step 14, with P221 and P225). One source for each rule text that
  a refusal repeats.** The text of the refusal `AlreadyCompleted`, the
  description of the field `rework` and the roster rule come from one
  constant. A test checks that the advice of each refusal names a field
  that the schema has, in the same words.
  - **Problem in the reference:** the field said "True only to resend
    finished or failed work", the roster rule said "only for concrete
    corrections", and the refusal said "Only use rework=true for concrete
    additional work". Bots read the first two as "a follow-up task is not
    rework", did not send again, and the relay stopped. Commits
    `378cc5d8f` and `893932678` (after the tag) changed the first two
    texts (`server/drivers/agents-catalog.ts:186`,
    `server/peer-roster.ts:393`). The refusal did not change
    (`server/runtime-coordinator.ts:19`).
  - Judgment call: no theme of section 5 names this. The second commit
    also had to shorten the text to stay in the size budget of the tool
    list, which is the theme "The size of the tool list of one turn"
    (v0.1.182, v0.1.184).
- **P800 (step 14, with P228). A quiet record line in the main chat of the
  bot that receives a hand-off.** Follow the reference
  (`server/host/handed-line.ts:52-83`, commits `f14966e7f`, `ec2f6b117`,
  `9894cccea`, in the tag):
  - One row for each work thread, "{bot} asked me: {title}", opens the
    thread.
  - Hand-offs from the same bot with no line of the person between fold
    into one row with a count, with at most 50 thread ids.
  - The row is never model context, marks nothing unread and sends no
    notification.
  - The row is written after the enqueue, and its failure never stops the
    hand-off.
  - No row is written when the work runs in the main chat, when the main
    chat is archived, or on a Team Cloud.

  Our version: a typed row in `bot-protocol` with the code and the
  parameters (`askedBy`), and the fold is a store update of that row.
- **P801 (later, the step of the person's stop). A typed stop names its
  target exactly.** Follow the reference: a stop line acts only when each
  mention in it is the bot itself, `@everyone` or `@all`, as a whole name.
  Any other mention makes it a normal message
  (`server/room-holds.ts:95-113`, commits `fe4231c4b`, `6870120fa`, in the
  tag). Port it as a pure function with the same test table
  (`server/room-holds.test.ts:146`, `:167`).
  - Why, from the release: before v0.1.186, any other mention lost its `@`
    and became a word. "stop @Todo" read as "stop todo", and "todo" is a
    filler word of the stop list (`server/room-holds.ts:16-18`), so the
    line stopped the bot's turn and never reached it. The fix is in the
    tag, so this proposal follows the reference. No theme of section 5
    names it.
  - The callers found are the typed stop of a bot's own chat
    (`server/host/person-stop.ts:71`), a Slack line to a bot
    (`server/host/team-slack-host.ts:298`) and the route
    `POST /api/stop-line` (`server/routes/stop-line.ts:18`). No caller in a
    room was found, although the release note says "in a room". This
    proposal can move to the plan of the feature that owns the person's
    stop. The author decides.
- **P802 (the step of rooms, with P229). The close of a room thread that a
  bot asks for is stored with the turn.** Follow the reference: a person
  or a bot closes a room thread, the closer is a typed record from the
  session and never from the body, and a new line of a person or a bot
  reply opens it again (`server/routes/channels.ts:160-163`, `:269-300`;
  `server/room-thread-close.ts:30-42`; commit `ddf029569`, in the tag).
  Our version: the close that a bot asks for is a field of the turn, and
  the end row of the turn writes it in the same transaction. A person's
  line before that end cancels it.
  - **Problem in the reference:** the close waits in the in-memory map
    `closesAtTurnEnd` (`server/room-thread-close.ts:10`), so a restart
    between the call and the end of the turn loses it. A failed turn
    still applies it, "however it ended"
    (`server/group-task-state.ts:58-63`). The release problem: "State lost
    at a restart or a crash" (v0.1.24, v0.1.107, v0.1.165).

## New facts for proposals that exist

- **P64 (`driver-contract.md`), a steer between bots.** A follow-up from a
  bot to the work it handed on is a row with a key, written with the
  receipt before the steer. The receipt outcome is typed: `Steered`,
  `MaybeSteered`, `Answered`, `Queued`, `Refused(reason)`. The reference
  steers first and writes the line after
  (`server/host/question-routing.ts:146-152`), and one word, `injected`,
  covers a confirmed steer, an unsure one and an answer
  (`server/index.ts:3841`). The chat driver drops a parked aside on a failed
  turn, and the sender keeps its receipt (`server/drivers/openai-chat.ts:903`).
- **P182 (`threads.md`), the room side.** A room turn uses the same slot as
  a thread, so no busy value is left on the bot. The rooms of the reference
  still hold four: the member lock (`server/room-member-lock.ts`), the
  stored `busyBotId` (`server/store.ts:1066-1068`), `groupSpeakers`, and
  `bot.busy` with the comment "One turn per bot across 1:1 and rooms"
  (`server/index.ts:9544-9559`).
- **P120 (`question-cards.md`).** The asking bot can mark a question as one
  that only the person answers, with a field of the tool, and the word list
  stays as a second check (see P172). A third path: a managing Chief answers
  "for the person", only from a turn with a person behind it
  (`server/host/question-routing.ts:180-199`).

## Corrections for the research files

- `../research/reference-features.md`: the row of
  `specs/aside-injection-seams.md` says "built". The aside queue was removed
  on 2026-10-12 (`6f38b547e`), and the specification is old
  (`server/drivers/acp/capabilities.ts:20`).
