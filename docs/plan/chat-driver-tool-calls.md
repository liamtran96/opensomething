# Plan: Tool calls for the chat API drivers

The proposals from the research file
[`../research/features/chat-driver-tool-calls.md`](../research/features/chat-driver-tool-calls.md).
The steps, the pull requests and the order are in
[`README.md`](README.md). The author decides each proposal. Then it
becomes a decision, a pull request or a choice, and its text leaves this
file.

- **Steps:** 2, 10, 12.
- **State:** open. No proposal is decided.

## Proposals

- **P7 (step 2). A reason on a failed turn (defer).** No change now. When tools come,
  add the reason of a failure: `tool_failed`, `tool_denied`, `limit_reached`,
  `incomplete`. Then the window shows a neutral row for "the person said no"
  and a red row for a failure.
  - Why: the reference needs three fields (`ok`, `stopReason`, `denials`) to
    say "the person said no".
  - Source: `chat-driver-tool-calls.md` 8.2.
  - Changes: a note in the open risks of D20.

## Gaps that have no step

- **P33. Tools for a bot on the chat API. This is the largest gap.** D8
  gives tools to an engine as an MCP server. That works only for an engine
  that is an MCP client (ACP). Our first engine is the chat API (D14). With
  the plan as it is, a bot on the chat driver cannot use a tool at any step.
  - Option a: the runtime runs the tool loop for a chat driver, and calls
    our tools in the same process.
  - Option b: the chat driver is an MCP client, as in the reference.
  - Option c: a bot on the chat API has no tools.
  - Source: `chat-driver-tool-calls.md` 7. The reference driver runs the
    loop and starts each MCP server (`chat.ts`).
  - Changes: D8, step 12, and probably a new step before 12. With a or b,
    record these too: a typed tool result enum, and limits in a `TurnLimits`
    struct with defaults. The limit on arguments is for each call
    (`chat-driver-tool-calls.md` 8.1, 8.8, 8.13).

## Notes for later steps

No decision now. "Accept" for a row means: keep it as a choice of its
step when that step is split into pull requests.

| # | Step | Note | Source |
|---|---|---|---|
| P42 | 10 | A card state enum (`Open`, `Allowed`, `Denied`, `Expired`, `Closed { reason }`). A stopped card says "Stopped" | `chat-driver-tool-calls.md` 8.14 |
| P43 | 10 | "Always for this session" is its own answer, and the grant is in our store | `chat-driver-tool-calls.md` 8.4 |
| P44 | 10 | Waiting requests in the store. Start-up closes each open request | `chat-driver-tool-calls.md` 8.5 |
| P45 | 10 | Three typed refusals for an answer: no such request, already answered, turn ended | `chat-driver-tool-calls.md` 8.6 |
| P46 | 10 | One audit row for each tool call that runs, with the reason for the allow | `chat-driver-tool-calls.md` 8.7 |
| P47 | 10 | The tool row shows while the card waits (`waiting_for_approval`) | `chat-driver-tool-calls.md` 8.3 |
| P49 | 12 | The safety floor is designed for Windows too | `chat-driver-tool-calls.md` 8.9 |
| P50 | 12 | Text for the model comes from one place, with no product name | `chat-driver-tool-calls.md` 8.17 |
