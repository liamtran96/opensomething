# Plan: Chat widgets and proposals

The proposals from the research file
[`../research/features/chat-widgets-and-proposals.md`](../research/features/chat-widgets-and-proposals.md)
(batch 7, reference commit `96ff84455`). The steps, the pull requests and the
order are in [`README.md`](README.md). The author decides each proposal.
Then it becomes a decision, a pull request or a choice, and its text leaves
this file. A path that starts with `crates/`, `docs/plan/`, `docs/research/`,
`docs/decisions.md` or `docs/comparison.md` is ours. All other paths are in
the reference project.

- **Steps:** 10, 11 to 15, and a new step for chat widgets after 12 (P394).
- **State:** all open.
- **The main finding:** a bot shows an interactive card with `show_widget`,
  and a press becomes the next message. The server builds the text of a
  press from the stored label and the checked values, never from the window.
  But a press does not go through the answer rule of cards
  (`cardAnswerRefusal`), the press message and the settle are two writes,
  and the double-press guard is in memory
  (`server/routes/bot-messages.ts:191-192`, `:232-235`, `:238-277`,
  `:355-361`; `server/index.ts:1047-1061`).

## Proposals

- **P394 (plan, new step after 12, and step 10). A step for chat widgets.**
  It needs our MCP server (step 12) and the store (step 8). Step 10 gets a
  note: the answer rule for every card belongs there.
  - Why: no step owns this feature (part 48). The widget tool is a tool of
    our MCP server, and the answer rule is the rule of step 10.
  - Source: `server/drivers/agents-widget-tools.ts:2-17`;
    `server/chat-widgets.ts:131-172`; `server/index.ts:1047-1061`.
- **P395 (decision). One function decides every answer.** It decides every
  card, every widget press and Undo, and it returns typed refusals. An answer
  comes only from the window, through the desktop shell, never from an
  engine process or a bot's tool.
  - **Problem in the reference:** A widget press does not go through the
    answer rule of cards, and the meeting Leave press does not read who
    pressed it. On a headless server the bot's own shell reaches the press
    route, so a bot can press a widget or end a meeting without the person
    (`server/routes/bot-messages.ts:270-272`, `:343-344`;
    `server/host/meetings-host.ts:154-161`). The release problem: "A secret
    or an access right in the wrong place" (v0.1.113, v0.1.130).
  - Why: better than the reference. A widget press there skips the answer
    rule of cards, a plain choice card has its own path, and the meeting
    Leave press has no check. A bot's shell reaches the press route.
  - Source: `server/index.ts:1047-1061`, against
    `server/routes/bot-messages.ts:238-277`, `server/index.ts:14679-14711`
    and `server/host/meetings-host.ts:154-161`;
    `server/routes/bot-messages.ts:341-342`.
- **P396 (plan, step of P394). A press is one transaction.** Write the press
  message, `settled` and the queue link in one transaction. Check `rev` and
  "not settled" inside it.
  - Why: our rule in `AGENTS.md`. In the reference, `settle()` runs after
    `acceptDirectSend` and does not compare `rev`. A crash between them
    leaves a live widget.
  - Source: `server/routes/bot-messages.ts:355-361`;
    `server/chat-widgets.ts:240-246`.
- **P397 (plan, step of P394). The double-press guard is a store
  constraint.** A unique key on (thread, widget message) for a press that
  settles, and a unique `send_id` for each thread.
  - Why: the guard of the reference, `pressesInFlight`, is a map in memory.
  - Source: `server/routes/bot-messages.ts:191-192`, `:297-300`.
- **P398 (plan, step 10). A plain choice card.** The answer names an option
  index. The core checks it, stores one answer only, and writes the next
  message from the stored option.
  - Why: a plain choice card of the reference takes any answer, and it can
    be answered two times.
  - Source: `server/index.ts:14679-14711`, `:14702-14709`;
    `src/state/card-answer-recovery.test.ts:133-143`.
- **P399 (decision, a note under the `AGENTS.md` rule on turn text). The
  text of a press comes from stored data.** It comes from the stored tree and
  the checked values. Labels are folded to one line. The widget goes inside
  a fence marked untrusted, and a closing fence in bot text is rewritten.
  - Why: follows the reference, which ignores `body.text` for a press and
    joins the stored label and the checked values.
  - Source: `packages/phone-protocol/src/widget.ts:165-171`, `:806-892`;
    `server/replies.ts:60-107`; `server/routes/bot-messages.ts:232-235`.
- **P400 (plan, step of P394). `show_widget` is idempotent for each tool
  call.** The core keys the row by the turn and the tool call id.
  - Why: in the reference each call adds a new row, with no idempotency
    key. An engine can send a tool call again after a reconnect.
  - Source: `server/chat-widgets.ts:149-155`.
- **P401 (plan, step of P394). One source for the limits.** The tool
  description takes its numbers from the limit constants, and a test checks
  them.
  - Why: the description of the reference says "At most 8 rows" and "at
    most six", and the constants allow 40 list items.
  - Source: `server/drivers/agents-widget-tools.ts:6`, against
    `packages/phone-protocol/src/widget.ts:12-32`.
- **P402 (plan, step of P394). A typed origin.** `Bot(BotId)` or `Core`
  replaces `serverCard: true`. Only the core can write `Core`.
  - Why: the reference uses a boolean and guards it in two places. An enum
    makes the guard part of the type.
  - Source: `server/chat-widgets.ts:157-163`; `src/lib/widget-text.ts:64-68`.
- **P403 (plan, step of P394). Mask secrets in a widget field.** The words
  that a person types in a widget field are masked as in a typed message.
  The settled card shows the stored copy.
  - Why: the reference only trims them. A later mask is not verified. A
    widget cannot hold a password field, but a person can type a secret in
    a text field.
  - Source: `packages/phone-protocol/src/widget.ts:380-383`, `:856-858`;
    `src/components/widget/WidgetMessage.tsx:117`.
- **P404 (plan, steps 11 to 15, a note on P142). A profile proposal applies
  at once with Undo.** It applies at every approval level, also a Chief's
  change to a teammate. A Confirm card opens only on a thread that a Cloud
  guest drives. Undo refuses with `changed-since`.
  - Why: follows the reference at this commit. Its proposals moved from
    Confirm with expiry to auto-apply with Undo (commit `761102925`).
  - Source: `server/direct-apply.ts:17-20`; `server/index.ts:3037-3039`,
    `:9283-9333`, `:13225-13245`; `server/profile-requests.ts:339-366`;
    `server/profile-card-lifecycle.e2e.test.ts:42-43`.
- **P405 (plan, our docs pages, D19). Our pages say what the code does.**
  A widget in a room is view-only, and a profile proposal applies at once
  with Undo.
  - Why: the design and the verification documents of the reference say
    that `show_widget` is refused in rooms, and that a proposal waits for
    Confirm and expires. The code and the tests do the other thing.
  - Source: `docs/verification/widget-prompts.md:3`;
    `docs/verification/proposal-cards.md:9-13`;
    `docs/superpowers/specs/2026-10-13-chat-widgets-design.md:30`, against
    `server/chat-widgets.test.ts:96-105`,
    `server/routes/bot-messages.ts:243` and
    `server/profile-card-lifecycle.e2e.test.ts:38-77`.

## The problems of the reference

- **A secret or an access right in the wrong place:** P395, P398, P403
  (`server/routes/bot-messages.ts:199-374`).
- **The same work done two times, or lost:** P397, P398, P400.
- **State lost at a restart:** P396. The window's edits are lost by design
  (`src/components/widget/WidgetMessage.tsx:85-93`).
- **A feature added, then removed or reversed:** P404, P405.
- **The approval model changed:** P404.

The credential request has none of these problems in the files of this
batch. A value never goes through a widget or the transcript, and a newer
request supersedes an older one.
