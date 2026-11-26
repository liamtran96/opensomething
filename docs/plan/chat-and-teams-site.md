# Plan: Chat and teams site

The proposals from the research file
[`../research/features/chat-and-teams-site.md`](../research/features/chat-and-teams-site.md)
(batch 7, reference commit `96ff84455`). The steps, the pull requests and the
order are in [`README.md`](README.md). The author decides each proposal.
Then it becomes a decision, a pull request or a choice, and its text leaves
this file. A path that starts with `crates/`, `docs/plan/`, `docs/research/`,
`docs/decisions.md` or `docs/comparison.md` is ours. All other paths are in
the reference project.

- **Steps:** 8, 12, 13 and 14, three new steps (P353, P355, P360), and the
  gaps of team mode (P351) and rooms (P361).
- **State:** all open.
- **The main finding:** most features of the docs page are a second view of
  state that already exists: a reaction is a reply, an inbox line is a card
  or a message, a usage chip is a sum of turn rows, a map edge is an open
  assignment. The page and the code disagree in many places. The Chief's
  text becomes the person's answer (`server/host/team-messages.ts:171-178`).
  A missing cache count is zero in the bot total
  (`server/store.ts:1817-1821`). The rework limit holds only for a remote
  teammate (`server/host/remote-teammate-handoff.ts:36-38`).

## Proposals

- **P351 (decision). Is team mode in scope?** Team mode is several people on
  one server. Proposed: one person only. The team inbox, the people in the
  sidebar, presence and the assistant then become a recorded gap, and the
  place inbox becomes our model.
  - Why: follows D10. The place inbox has one person and copies no card.
  - Source: `server/host/person-inbox.ts:132`;
    `server/host/team-messages.ts:333-338`; `server/host/place-inbox.ts:1-5`.
- **P352 (decision, extends the `AGENTS.md` rule on stored data). A bot's
  text never counts as the person's answer.** Mark it as relayed by the bot,
  or take the person's own line as the source.
  - Why: the person tells the Chief "tell Cleo Friday works". The Chief's `message_person` text is stored as an answer
    `by: "person"` and opens the asking bot's turn as "Ben replied…".
  - Source: `server/host/team-messages.ts:171-178`, `:184-185`;
    `server/host/person-inbox.ts:367-369`.
- **P353 (plan, new step after 15). The person's inbox.** A query over open
  requests plus a news-lines table, which never copies a card. One waiting
  count is computed in `bot-core`, and an `inbox.changed` event replaces
  polling. The step includes "answering is replying".
  - Why: the place inbox reads each ask live, so one answer settles every
    surface. The team inbox copies the card and needs a subscription and
    `answeredIn` to keep each copy in step. Both inbox files start empty
    after a bad read, and the next save writes over them. Five surfaces
    count the waiting lines five ways.
  - Source: `server/host/place-inbox.ts:1-5`, `:98-102`, `:144-193`,
    `:282-284`; `server/host/person-inbox.ts:134-147`, `:404-446`,
    `:420-422`; `server/index.ts:3835`, `:4824`, `:11944`;
    `src/components/SidebarInboxRow.tsx:25`;
    `src/components/SidebarPeople.tsx:76`.
- **P354 (plan, step 8, extends P124). One usage table.** One `turn_usage`
  table, written in the turn-end transaction, with an optional cache count
  and the cost source (reported or estimated). Each row has a kind: turn,
  keep-warm, compaction or helper. Book "not reported" instead of using the
  last live figure as the total.
  - Why: after one turn reports a cache count, a later turn with none adds
    0 cached input to the bot total (the test expects 1010). The group total
    keeps it unknown, and the page promises "not treated as zero"
    (`chat-and-teams.mdx:31`). Keep-warm rows change the turn count.
  - Source: `server/store.ts:1817-1821`; `server/store.test.ts:900-912`;
    `server/group-thread-usage.ts:16-18`; `server/index.ts:5128-5141`,
    `:6696`; `server/usage-ledger.ts:123`.
- **P355 (plan, new step after 11). Reactions.** One command updates the
  reaction, cancels the old queued answer and queues the new one in one
  transaction. A table keyed by message and person enforces one reaction for
  each person. The store makes the send id.
  - Why: a reaction is a patch of a settled bot line, and `turnSettled` runs
    on each such patch. Its duplicate check is an in-memory set of 2,000
    entries, so an @mention can be delivered again after a restart (found
    by reading, not run). The send id is a clock stamp in memory.
  - Source: `server/reactions.ts:83-90`, `:125`, `:139-152`;
    `server/store.ts:1049-1054`, `:1248`;
    `server/host/team-messages.ts:259-263`, `:286-294`.
- **P356 (plan, step 14 with step 13). Enforce the rework limit for every
  teammate.** Store the count with the assignment.
  - Why: the page says that the app refuses more than four reworks
    (`chat-and-teams.mdx:119`). A local checker gets no limit ("no round
    limit, the worker decides when to stop"), and the remote count is in
    memory.
  - Source: `server/host/remote-teammate-handoff.ts:36-38`, `:85`;
    `server/checked-handoff.e2e.test.ts:107-123`.
- **P357 (plan, step 12). The `message_person` tool.** It gives typed
  refusals, a stored limit of 10 an hour for each conversation, and the
  answer comes back through the queue of P34.
  - Why: the reference returns a status and a sentence, and its hourly limit
    is in memory, so a restart lifts the limit that stops two bots that
    ping-pong.
  - Source: `server/host/team-messages.ts:39`, `:129-207`, `:150-153`;
    `server/host/relayed-turn.ts:25-29`.
- **P358 (plan, step 12, extends P186). `list_models` and `start_thread`.**
  The list and the `start_thread` refusal come from one typed function. A
  thread that the bot opened for itself is marked by a stored origin, not by
  the latest person line. From a room, refuse `model_selection` too.
  - Why: a person's line in a self-opened thread lifts "cannot open more".
    The code refuses only `report_back` from a room, and the page says both.
  - Source: `server/routes/internal-models.ts:107-118`;
    `server/host/own-threads.ts:40`; `server/host/self-threads.ts:10-12`;
    `server/index.ts:13877-13880`;
    `server/thread-aware-bots.e2e.test.ts:354-358`.
- **P359 (plan, the table "The problems of the reference" of `README.md`).
  Add rows.** "A file written over after a failed read": both inbox files.
  "The same work done two times": the duplicate checks of tags live in
  memory. "Usage and cost numbers": P354. "A feature added, then removed":
  the inbox tabs (`bef6fd7c4`) and "Who reports to whom" (`103f1c82d`).
  - Why: the table maps each problem of `changelog.md` section 5 to its
    proposals.
  - Source: `server/host/person-inbox.ts:134-147`;
    `server/host/place-inbox.ts:98-113`;
    `server/host/team-messages.ts:259-263`, `:286-294`.
- **P360 (plan, new step after 14). The team map.** A read-only view first.
  The hand-off lines come from runtime events and show four states, not
  "running" for every state that is not "queued" (extends assignment-runtime
  research A7). It depends on the departments of the `team-structure`
  research.
  - Why: "waiting" and "needs input" show as "Running", which hides that
    the person blocks the work. The 3 s poll lags and scans all open work.
  - Source: `server/runtime-coordinator.ts:560-561`;
    `src/components/TeamMapPage.tsx:311-327`.
- **P361 (gaps, for the rooms step, with P224 and P229).** The group usage
  badge; a typed refusal for a missing room folder; a typed refusal for a 👍
  on a card in a room; a room inbox answer that starts no turn.
  - Why: a missing room folder throws an `Error`. The page says that the
    answer goes back to the bot that asked, but in a room it is a relay line
    that starts no turn.
  - Source: `server/room-folder.ts:5-9`; `server/reactions.ts:98`;
    `server/host/person-inbox.ts:362-364`.
- **P362 (decision). A check loop is runtime state, not prompt text.**
  - Why: the writer and checker templates rely on the model to stop after 3
    rounds, while the "Check before done" setting enforces the loop in code.
    Two paths do one job.
  - Source: `src/lib/ready-bots.ts:186-197`; `server/host/check-work.ts`.
- **P363 (decision, step 14). Pick the checker's other provider by a
  capability of the engine.**
  - Why: our rule in `AGENTS.md`. The reference compares `driverKind`, and
    one driver kind can serve many providers.
  - Source: `server/checker-model.ts:12`.
- **P364 (decision, naming). Give the four "inboxes" separate names.** The
  person inbox, the place inbox, hand-off file folders and mail triage share
  one word in the reference. For example `attention`, `handoff_files` and
  `mail_triage`.
  - Why: review and search.
  - Source: `server/host/handoff-inbox.ts`; `server/host/inbox-triage.ts`.
