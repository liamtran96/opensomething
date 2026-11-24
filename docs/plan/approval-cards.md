# Plan: Approval cards

The proposals from the research file
[`../research/features/approval-cards.md`](../research/features/approval-cards.md)
(batch 5, reference commit `ad27f0716`). The steps, the pull requests and the
order are in [`README.md`](README.md). The author decides each proposal.
Then it becomes a decision, a pull request or a choice, and its text leaves
this file.

- **Steps:** 6, 7, 10, 11 to 15, 16.
- **State:** all open.
- **The main finding:** the engine owns the wait, not the server. The open
  request lives in the memory of the driver, and the first answer deletes it
  (`server/drivers/claude.ts:499-500`, `:571-577`). A restart does not close
  an engine permission card (`server/index.ts:9461-9465`). The outbound rule
  reads only the tool name, so a saved shell command that sends runs with no
  question (`server/auto-approve.ts:114-115`).

## Proposals

- **P139 (step 10, `bot-desktop`). "Sending" on a card.** When the person
  clicks a button on a card, the buttons are disabled until the answer is
  accepted or refused.
  - Why: the answer action of the reference does not change the card in the
    store, and the buttons have no busy state. A double click sends two
    answers, and only the server refuses the second.
  - Source: `src/state/store.tsx:1085-1086`,
    `src/components/PendingApproval.tsx:337-363`.
- **P140 (decision). "Sends" is a flag on each tool.** Each of our own tools
  states "sends: yes or no". A request that sends gets "Allow once" and
  "Deny" only, never "Always allow" or "Allow for this session".
  - Why: our tools come from our own MCP server (step 12), so each tool can
    state the flag. The release note of v0.1.176 says a saved approval is
    "never remembered for anything that sends, posts or moves money". The
    reference decides "sends" from the tool name only, and keeps the rule
    for MCP grants only.
  - Open risk: a flag on a tool cannot mark a shell command. `Bash` is never
    "sends", so a saved command that sends runs with no question at each
    level. Only the safety floor and the hold for a command line that cannot
    be read still apply. The author decides if saved commands stay at all.
  - Source: `packages/phone-protocol/src/outbound.ts:14-43`,
    `shared/outbound.test.ts:56-60`, `:77`, `server/drivers/claude.ts:1245`,
    `server/request-card.ts:29`, `src/components/PendingApproval.tsx:315`,
    `server/auto-approve.ts:114-115`, `server/index.ts:6499-6501`,
    `server/safety-floor-gate.ts:98-100`.
- **P141 (step 10 or 16). A grant is saved only after the answer is
  accepted.** "Always allow" and "Always allow this command" write the grant
  in the same transaction as the accepted answer.
  - Why: one order for both kinds, so no grant stays for a card that was then
    denied or closed. The window of the reference saves an MCP grant before
    it sends the answer. The server saves a command rule only after the
    engine answers `allowed-once`.
  - Source: `src/state/store.tsx:2436-2448`, `server/index.ts:4766-4775`,
    `server/routes/bot-settings.ts:225-236`.
- **P142 (steps 11 to 15). A change that a bot makes to itself writes one
  receipt with its Undo data.** The change, its receipt and its Undo data go
  in one transaction. Each kind of change keeps a revision, and Undo refuses
  when the revision is different.
  - Why: `AGENTS.md` says "Every state change in the runtime writes the row
    and its event in one transaction". In the reference, the receipt patch
    swallows errors, and then Undo is lost. Team setup Undo deletes bots one
    by one with no rollback. Model Undo compares only the current selection,
    so a value that changed away and back counts as "not changed".
  - Source: `server/direct-apply.ts:1-4`, `server/profile-requests.ts:371-385`,
    `server/routine-requests.ts:1089-1090`, `:1119-1123`,
    `server/team-setup-requests.ts:480-490`, `server/model-requests.ts:258-261`,
    `server/index.ts:9339-9344`.
- **P143 (steps 11 to 15). Undo data never holds a raw secret.** A receipt
  keeps a pointer to a copy in the bot folder, not the text of the file.
  - Why: a stored card must never hold a secret. A skill-delete receipt of
    the reference keeps the full `SKILL.md`, and the card scrub does not mask
    that field.
  - Source: `server/host/skill-switch-host.ts:60`, `:72`,
    `server/skill-request-card.ts:90-110`.
- **P144 (steps 6 and 12). One guard on each route of the secret card.**
  Each route of `request_credential` checks that the person can see the
  thread and may answer the card.
  - Why: the routes `save`, `saved` and `use` of the reference check this.
    The routes `provided`, `resume` and `dismiss` do not, and `resume` and
    `dismiss` are open to a member. D10 keeps a server possible, and the
    guard holds in both cases.
  - Source: `server/routes/secret-cards.ts:60-62`, `:76-78`, `:114-163`,
    `server/request-auth.ts:393`, `server/drivers/agents-catalog.ts:452-475`.

## New facts for proposals that exist

- **P44 (step 10).** Add to "done when": "After a restart, no card is open
  for a request that no engine waits for." The start sweep of the reference
  closes only peer cards, "your computer" cards and computer asks. A later
  click on an engine card gets "Couldn't deliver that answer". Stop writes
  `answered: "unavailable"`, but the wire has a `stopped` flag.
  - Source: `server/index.ts:9461-9465`, `:4795-4811`, `:4878`,
    `packages/phone-protocol/src/wire.ts:665-666`.
- **P45 (step 10).** A second answer gets "already answered", with the
  first answer and who gave it. An unknown id gets "no such request". The
  reference gives both the same HTTP 200 `{ok: true, outcome: "unavailable"}`.
  - Source: `server/respond-replay.e2e.test.ts:117-127`,
    `server/drivers/claude.ts:499-500`, `:571-577`.
- **P25 (steps 6 and 7).** The masking of the live event also covers the
  replay of missed events and the Inspector. The facts are in
  [`chat-ui.md`](chat-ui.md).
- **P128 (gap).** The Inspector route of the reference reads `command`,
  `commandLine` and `reads` from disk, which the live event hides. The
  proposal is in [`chat-ui.md`](chat-ui.md).
  - Source: `server/index.ts:6309`, `server/thread-events.ts:200-208`.
- **P121 (docs).** When step 10 adds the approval page, it describes the
  real rule for routines and shows a real approval card. The docs of the
  reference say that a routine for another bot asks unless the conversation
  has Full access. The code applies each routine change with no card, and a
  test checks this. The screenshot `approval-card.png` shows a question card.
  - Source: `apps/docs/content/docs/features/approvals-and-inspector.mdx:21`,
    `server/routine-requests.ts:1008-1010`, `:1022-1025`,
    `server/routine-requests.test.ts:1973-1988`.
- **P136.** The point "one fail-safe timeout, owned by the core" is merged
  into P136 of [`question-cards.md`](question-cards.md).
- **The changelog row of v0.1.126.** `../research/changelog.md:358` quotes
  "Question and approval cards no longer expire". A search of
  `announcements/releases.json` did not find this text, and commit
  `b82764109` keeps a 15-minute fail-safe for permission cards. A check of
  the row can correct it.
