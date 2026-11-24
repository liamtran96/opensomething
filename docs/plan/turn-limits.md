# Plan: The limits of one turn

The proposals from the research file
[`../research/features/turn-limits.md`](../research/features/turn-limits.md)
(batch 5, reference commit `ad27f0716`). The steps, the pull requests and the
order are in [`README.md`](README.md). The author decides each proposal.
Then it becomes a decision, a pull request or a choice, and its text leaves
this file.

- **Steps:** 2, 9, 10, 13, and the step of the chat tool loop (P33).
- **State:** all open.
- **The main finding:** the chat driver has no limit of model steps now.
  The limit of 64 came in v0.1.96 (`e5da2fd3e`) and went in v0.1.166
  (`d6788b49c`). The limits that stay are on the chat driver only: 200 tool
  calls in a turn, 32 calls in one reply and 128 tools in a request
  (`server/drivers/openai-chat.ts:143`, `server/drivers/openai-chat-protocol.ts:14`,
  `shared/tool-budget.ts:2`). The CLI drivers run their own loop, so the
  reference can only stop the whole turn.

## Proposals

- **P129 (step 2, amends D20). A typed reason for a turn that stops at a
  limit.** Add `LimitReached { limit, used }` to the outcome of
  `turn.completed` or to the error codes of `runtime.error`. The runtime
  decides from the type if a turn can continue.
  - Why: `AGENTS.md` says that the runtime returns typed refusals. The
    reference throws English text and then reads it with a regular
    expression, and a test must keep old texts so that they still match.
  - Source: `server/drivers/openai-chat.ts:796`, `:887-911`,
    `server/turn-continuation.ts:83-88`, `server/turn-continuation.test.ts:106-122`.
- **P130 (step 9). The ACP retry after a tool-count refusal.** Move this
  part of P48 from step 12 to step 9. An ACP driver learns the tool limit
  from a refusal and keeps it for that engine and model. It sends the turn
  again one time, with each MCP server cut to its share. A second refusal
  ends the turn with a plain message. Step 9 also records that ACP has no
  limit on model steps or tool calls.
  - Why: follows the reference. The retry runs only for a turn that did
    nothing yet.
  - Source: `server/drivers/acp/core.ts:898-899`, `:1355`, `:1370-1374`,
    `server/tool-count-limit.ts:102-115`, `server/drivers/turn-mcp.ts:69-81`,
    `server/chat-notices.ts:41`, `server/drivers/acp/opencode-cloud.test.ts:108-139`.
- **P131 (the first step after step 9 that has steer). One loop guard,
  chosen by a capability flag.** One loop guard in `bot-core`. A capability
  of the driver selects its mode: a driver that runs the tool loop itself
  can refuse a repeated call before it runs, and a driver that runs an
  engine program can only steer a note or stop the turn. D22 applies: the
  flag comes with the step that reads it.
  - Why: `AGENTS.md` says that a capability flag gates engine behaviour,
    never a driver name. In the reference, the host guard acts only on a tool
    start with a `summary` field. The chat driver sends no `summary`, so the
    host guard never acts on a chat turn. The chat repeat guard runs only for
    a local model.
  - Source: `server/host/loop-guard.ts:44`, `:46`, `:61-62`, `:131-141`,
    `server/drivers/openai-chat.ts:599`, `:816-818`, `:844-846`,
    `server/drivers/chat-repeat-guard.ts:6-9`, `docs/self-hosting.md:1790-1793`.
- **P132 (step 13). Redact the handoff file, and type the result of its
  write.** Redact the task, the steered text, the tool arguments and the
  reply text before the handoff file goes to disk. A failed write returns a
  typed error, and the event log keeps the cause. "Tool calls used" counts
  only the calls that ran.
  - Why: `AGENTS.md` says "Redact tokens and keys before text reaches disk".
    In the reference, the writer calls no redaction function. A failed write
    returns `null`, so no `cap.exhausted` goes out and no log line says why.
    The count includes the batch that did not run.
  - Source: `server/turn-continuation.ts:42-69`, `:77-79`,
    `server/drivers/openai-chat.ts:794`, `:797`, `:915`, `:919`.
- **P133 (table of problems). A time limit for a whole turn.** Add to the
  row "A turn or a wait that does not end": a time limit for a whole turn,
  as a setting.
  - Why: problem (1) of `changelog.md` section 5, in 6 of 6 periods. The
    chat loop has no step limit and no time limit, and each steered message
    gives the model one more round.
  - Source: `server/drivers/openai-chat.ts:623`, `:783-786`.
  - Note: the research also proposed a timer for each question. P136 of
    [`question-cards.md`](question-cards.md) proposes the reverse, as the
    reference does since v0.1.126. The author decides between them.
- **P134 (steps 9 and the chat tool loop). A capability for the tool
  deadline.** Each driver states how it applies the deadline of one tool
  call: the driver enforces it (chat), the engine takes a setting (Codex,
  Pi), or none (Claude, ACP). The settings window shows the setting only for
  a driver that applies it.
  - Why: the help text of the reference says "Applies to every tool a bot
    uses from your MCP servers", and four drivers ignore the setting.
  - Source: `server/drivers/openai-chat.ts:614`, `server/drivers/codex.ts:488`,
    `:491`, `server/drivers/pi-mcp-extension.ts:84`, `:262-268`,
    `src/locales/en.json:2012`.

## New facts for proposals that exist

- **P33 (the chat tool loop).** Add these limits, with the values of the
  reference, to options a and b: 200 tool calls in a turn, checked before
  the batch, so the batch that passes 200 does not run; 32 calls and
  256,000 characters of arguments in one reply; 3 announcement nudges; a
  tool deadline of 1 to 60 minutes, default 10; no limit on model steps. The
  `TurnLimits` struct of P33 holds them, because D10 says that no setting is
  a constant in the code.
  - Source: `server/drivers/openai-chat.ts:143-144`, `:623`, `:769-781`,
    `:796`, `server/drivers/openai-chat-protocol.ts:14-15`, `:117`,
    `:145-146`, `server/config.ts:51-53`,
    `server/drivers/chat-mcp-tools.ts:114`, `:863`.
- **Step 5 (a line of the reference).** `docs/plan/README.md:252` cites
  `server/drivers/openai-chat.ts:961-966`. At `ad27f0716` the lines are
  `:960-965`. One blank line above them went away.
- **The title of the row.** The row "Turn limits: 64 model steps and 200
  tool calls" of `../research/reference-features.md` names a limit that the
  reference removed in v0.1.166. The verification document of the reference
  still says 64 (`docs/verification/openai-tools.md:68`).
