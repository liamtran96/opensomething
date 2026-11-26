# Plan: Mentions

The proposals from the research file
[`../research/features/mentions.md`](../research/features/mentions.md)
(batch 7, reference commit `96ff84455`). The steps, the pull requests and the
order are in [`README.md`](README.md). The author decides each proposal.
Then it becomes a decision, a pull request or a choice, and its text leaves
this file. A path that starts with `crates/`, `docs/plan/`, `docs/research/`,
`docs/decisions.md` or `docs/comparison.md` is ours. All other paths are in
the reference project.

- **Steps:** 2 and 14, the gap of rooms, and later (the team map).
- **State:** all open.
- **The main finding:** the reference keeps a message as plain text. It does
  not store which bot a tag meant, and it reads the text again each time: on
  the server to choose who answers, and in the window to draw the chips. In
  a room, `@everyone` comes first, then the tagged bots, then the default
  responder. A bot can tag another bot in its reply, for at most 3 hops
  (`server/store.ts:217-248`; `server/index.ts:9409`).

## Proposals

- **P326 (decision, with P218, before step 2.5). A message keeps its
  resolved tags.** For example `mentions: Vec<{bot: BotId, start, end}>`.
  Chips, routing and history then use one stored answer. It extends D17 and
  D18, and adds new facts to P218.
  - Why: the reference reads the text again with today's bots. The chip of a
    second bot with the same name has the colour of the first, a renamed bot
    shows as plain text, and a line taken from the queue has lost its picks.
    With stored tags, a rename does not change history.
  - Source: `server/routes/channels.ts:619-630`;
    `server/index.ts:10626-10665`; `src/lib/mentions.ts:60-70`;
    `docs/verification/mentions.md:190-191`.
- **P327 (plan, step 14). A send carries its picks.** Follows the reference:
  `mentions: Vec<BotId>`, at most 20, each `^[\w-]{1,128}$`, repeats
  removed. One bad entry refuses the whole list. A pick never adds a bot that
  the line does not tag.
  - Why: a pick tells two bots with the same name apart.
  - Source: `shared/room-mentions.ts:4`, `:16-17`, `:42-47`;
    `server/routes/channels.ts:396-397`.
- **P328 (plan, step 14). The one-to-one prompt part about tags.** Follows
  the reference: "The user named these existing teammates: name (id)" is
  built from stored records. Person tags are removed first. Only bots that
  the bot can reach are listed.
  - Why: our rule in `AGENTS.md`: the text of a turn comes from stored data.
  - Source: `server/index.ts:8136-8148`, `:8285`;
    `server/contracts.ts:179-180`.
- **P329 (decision). A pick that the sender cannot reach is refused.** It
  gets a typed refusal, at one place.
  - Why: better than the reference. Its access gate does not read
    `mentions`, and the parse checks only the shape ("a secret or an access
    right in the wrong place").
  - Source: `server/host/bot-access-gate.ts:65-87`;
    `shared/room-mentions.ts:42-47`.
- **P330 (new facts for P34 and P218). Picks in the idempotency check and in
  the queue.** The picks are part of the idempotency check. Each queued row
  keeps its own picks. A merge joins only lines of the same sender, and keeps
  the sender of each line.
  - Why: the fingerprint is the text, the reply target and the mode, so a
    resend with other picks returns the first receipt with no error. A merged
    turn joins the picks of all lines and takes the sender of the first line
    ("the same work done two times, or lost"; "who sent a message",
    `changelog.md` section 7).
  - Source: `server/send-idempotency.ts:68-70`;
    `server/channel-queue.ts:214-219`; `server/index.ts:10853-10861`.
- **P331 (decision). One grammar for Rust and TypeScript.** Option a: the
  window calls the `bot-core` parse through a Tauri command. Option b: one
  file of test cases that the Rust tests and the TypeScript tests both run.
  - Why: without it, the chip and the route can disagree. The reference has
    one file for all its parts, but we have two languages.
  - Source: `packages/phone-protocol/src/mention-boundary.ts:1-16`.
- **P332 (plan, step 14, or the step that adds bot names). Reserved names.**
  Refuse `everyone`, `all` and `you` as bot names at create and rename.
  - Why: a bot named "everyone" can never be reached in a room, and "you"
    loses each tie. Less special code in the parse.
  - Source: `server/store.ts:224-234`, `:1279`; `server/bot-profile.ts:42-47`;
    `shared/person-mention.ts:18-24`.
- **P333 (gap, the step of rooms). The brief of a hop comes from stored
  ids.** The message id of the reply and the name from the bot record, never
  the reply text.
  - Why: our rule in `AGENTS.md`. The reference brief is
    `Mentioned by <name> (hop N): <the newest bot text>`, which is model
    output, stored on the assignment.
  - Source: `server/index.ts:9454-9459`, `:9790`;
    `server/runtime-coordinator.ts:380`.
- **P334 (gap, the step of rooms, new facts for P229). Who answers a room
  line.** Follows the reference: who answers, the 3-hop limit, the repeat
  rule, `@everyone` before tags, a person's line with a shared name refused
  before the queue, holds by tag.
  - Why: the research found these rules sound and says to keep them as
    they are (its section 8).
  - Source: `server/store.ts:217-248`; `server/index.ts:9409`,
    `:10356-10412`; `server/routes/channels.ts:473-477`;
    `server/room-holds.ts:103-113`.
- **P335 (gap, the step of rooms). Never skip a tagged bot with no way
  back.** Queue the turn of a bot that is busy at the last check. Write one
  line when the hop limit stops a chain. The "still stopping" case is
  already in P229.
  - Why: in the reference a busy bot is skipped, and a tag in a hop-3 reply
    starts nothing with no line that says so ("busy and races between bots":
    none answers).
  - Source: `server/index.ts:9544-9559`, `:10760-10769`;
    `server/room-roots.e2e.test.ts:569-586`.
- **P336 (gap, the step of rooms). The holds: a credit and one
  transaction.** When we port the holds, add the MIT credit "Hermes Agent's
  desktop group chat" to our `NOTICE`. Write a held skip in one transaction.
  - Why: the credit is only in the source file, not in the reference
    `NOTICE`. `noteHeldSkip` changes the room and appends the line in two
    calls, against our rule in `AGENTS.md`.
  - Source: `server/room-holds.ts:1-4`; `server/index.ts:4219`, `:4224`.
- **P337 (decision, with P331). One rule for code and for case.** A tag in
  code never routes. Rust `str::to_lowercase` everywhere.
  - Why: the bot parse reads tags in code, the person parse and the picker
    do not. `@everyone` uses `toLocaleLowerCase` and the rest `toLowerCase`.
    `str::to_lowercase` does not depend on a locale.
  - Source: `server/store.ts:229`; `shared/room-mentions.ts:30`;
    `shared/person-mention.ts:68-87`; `shared/skill-command.ts:70-82`.
- **P338 (gap, the step of the picker in `bot-desktop`). The @ list.** Warn
  before a send that the server will refuse. The @ list follows the routing
  rule: no hidden members, no view-only bots. Wire the text box as a
  combobox for screen readers.
  - Why: the window already knows that a shared name will be refused, but
    uses it only for images. The room list shows hidden members, who never
    answer, and the one-to-one list shows view-only bots.
  - Source: `src/lib/group-routing.ts:56-57`, `:77`;
    `src/components/Composer.tsx:297-303`, `:350`, `:353`;
    `src/components/MentionMenu.tsx:41-55`.
- **P339 (plan). A row for this file in "Open proposals" of
  [`README.md`](README.md).**
  - Why: each feature file has a row there.
  - Source: none.
- **P340 (later, with the team map). The map sends bot ids.** The map sends
  bot ids, not names, and one shared id for the whole send.
  - Why: the map finds a target by name only, so the second of two bots with
    the same name is never reached, and it makes one send for each bot.
  - Source: `src/lib/map-composer.ts:44-47`;
    `src/components/MapComposer.tsx:87`.
