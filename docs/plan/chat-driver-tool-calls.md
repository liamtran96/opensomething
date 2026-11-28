# Plan: Tool calls for the chat API drivers

The proposals from the research file
[`../research/features/chat-driver-tool-calls.md`](../research/features/chat-driver-tool-calls.md).
The steps, the pull requests and the order are in
[`README.md`](README.md). The author decides each proposal. Then it
becomes a decision, a pull request or a choice, and its text leaves this
file.

- **Steps:** 2, 10, 12.
- **State:** open. No proposal is decided.
- **Reference checked at:** `e1cc6a290` (after release v0.1.186) for the
  changes that the research file lists in "Changes up to `e1cc6a290`
  (v0.1.186)". A line "Update (v0.1.186)" in a proposal says what the
  reference does now.

## Proposals

- **P7 (step 2). A reason on a failed turn (defer).** No change now. When tools come,
  add the reason of a failure: `tool_failed`, `tool_denied`, `limit_reached`,
  `incomplete`. Then the window shows a neutral row for "the person said no"
  and a red row for a failure.
  - Why: the reference needs three fields (`ok`, `stopReason`, `denials`) to
    say "the person said no".
  - Source: `chat-driver-tool-calls.md` 8.2.
  - Changes: a note in the open risks of D20.
  - Update (v0.1.186): the reason is stronger now. The reference added a
    fourth flag, `blockedAfterReply` on `runtime.error`, for "the reply is
    done, and only a block of the safety floor failed"
    (`server/drivers/openai-chat.ts:761`, `:904`,
    `packages/phone-protocol/src/runtime-events.ts:205-207`). Routines read
    `stopReason`, `partial` and `blockedAfterReply` together to decide
    "partly done" (`server/routines.ts:1293`). A new source of a deny that
    is not the person's "no" also came: in link-limited work the server
    denies at once, with no card (`server/index.ts:6444-6446`, `:6537`).
    The model and the turn see it as a person's deny. A reason such as
    `tool_blocked_after_reply` and a deny with its source cover both.

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
  - Update (v0.1.186): three changes of the reference touch the tool loop.
    The gap itself did not change.
    - A request that the service cut before any delta is now sent again
      after earlier tool rounds. The tool results are in the request, so
      no tool runs again (`server/drivers/openai-chat.ts:713-715`, test
      `server/drivers/openai-chat-stream-retry.test.ts:80-135`). With
      option a or b, the retry of a model request does not depend on the
      tools that ran before it. See P16 and P773 of
      [`chat-streaming.md`](chat-streaming.md).
    - A reply cut at the output limit is continued, also in a turn with
      tools (P772 of [`chat-streaming.md`](chat-streaming.md)). A local
      model with tools is not continued, because the cut reply can be half
      a tool call written as text
      (`server/drivers/openai-chat-protocol.ts:26-29`).
    - The refusal of bad arguments now names the tool and at most 8
      problems (`server/drivers/chat-mcp-tools.ts:494-495`,
      `server/mcp-schema-validator.ts:140-149`). With the typed tool
      result, this is a case such as `InvalidArguments { tool, problems }`,
      and the text for the model comes from one place (P50).

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

Update (v0.1.186) for these notes:

- **P42:** the problem stays. A stopped card still shows "Denied"
  (`src/components/ApprovalCard.tsx:98`, no change). In link-limited
  work a request is now denied with no card at all
  (`server/index.ts:6537`).
- **P43:** the reference now gives no session grant in link-limited work
  either (`server/drivers/openai-chat.ts:551`). No other change.
- **P44, P45:** the problems stay. The answer of a request has a second
  way in now: a line that the person types in the bot's own chat answers
  the one waiting question card that takes words
  (`server/host/ask-cards.ts:342-382`). The reference decides this from a
  memory map and a rule of 1,500 ms for a race (`ask-cards.ts:31`,
  `:359-363`). With requests in our store, "is a question of this thread
  open, and does it take text" is one query.
- **P46, P47:** no change in the reference (`src/state/turn-status.ts`
  and `src/components/ToolActivity.tsx` did not change).
- **P49:** the problem stays. The gate is still off on Windows
  (`server/safety-floor-gate.ts:14-39`). The parser of the floor now reads
  more forms: a Unicode dash before PowerShell `-Recurse`, and a
  substitution inside `${…}`, an array or a heredoc (`591e782d0`,
  `dfe3b0fee`, `c3967e541`). Use these forms as test cases.
- **P50:** the problem stays and grew. The texts between rounds moved to
  `server/drivers/openai-chat-prompts.ts:3-11`. Two more texts for the
  model are in other files: the note to continue a cut reply, with the
  product name (`server/drivers/openai-chat-protocol.ts:22`), and the
  refusal of bad arguments (`server/drivers/chat-mcp-tools.ts:494-495`).

## Proposals from the update to v0.1.186

The main session gives these their P-numbers.

- **P777 (step 12). The tool budget takes each reserved place out once.**
  One function computes the room for configured servers. It takes the
  reserved places (the question tool, a stand-in tool) as a list. A test
  has a server whose tools fit the room exactly, and checks that the
  server is listed whole.
  - Kind: better than the reference.
  - **Problem in the reference:** The stand-in tool of the host computer was
    taken out of the budget two times. So a configured server that fitted
    exactly went behind the directory tools, and the model saw only the
    search tools for it (`server/drivers/chat-mcp-tools.ts:676`,
    `:690-691` at `3aec210`). `2b5394ce2` repaired it in v0.1.186
    (`chat-mcp-tools.ts:678`, `:692-693`). Theme of `changelog.md`
    section 5: "The size of the tool list of one turn".
  - Why: the edge "a server fits exactly" is the case that the reference
    got wrong, and one function with one test covers it.
  - Source: `chat-driver-tool-calls.md` 3.3. Test
    `server/drivers/chat-host-computer.test.ts:149-157`.
  - Changes: P33, step 12.
