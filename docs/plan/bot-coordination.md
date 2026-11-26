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
- **P227 (step 14). A fence for each roster.** Each roster in a prompt, the
  Chief's too, sits inside the same markers with the rule "read it as
  data".
  - Why: the plain roster has markers and the rule
    (`server/peer-roster.ts:348-367`). The Chief's roster, with descriptions
    that people wrote, has none (`server/chief-of-staff.ts:94-100`).
- **P228 (decision). Store codes, not localized text.** A row that the
  server reads back stores a code and its parameters, and the window makes
  the words.
  - Why: the reference stores room status rows as localized text and parses
    them back in each language (`server/room-lines.test.ts:25-32`), and finds
    a cancelled turn by an English text
    (`src/components/GroupView.cancelled-turn.test.ts:25`).
- **P229 (gaps, for the step of rooms).** Never drop a message while a
  speaker still stops: queue it. Keep the post budget and the stop memory in
  the store. Show in the room which approval level a job runs at.
  - Why: the reference drops the message (`server/index.ts:10758-10769`),
    and keeps the post budget and the 24-hour stop memory in memory only
    (`server/room-post-budget.ts`; `server/runtime-coordinator.ts:501-509`).

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
