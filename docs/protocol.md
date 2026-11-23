# Wire types

The types that all crates share: identifiers, messages and, later, events.
They are in the `bot-protocol` crate. Each type has one fixed form in JSON,
and a test shows that form.

## Rules

- `bot-protocol` depends on no other crate of ours and does no I/O.
- The crate does not make an identifier and does not check its form
  (decision D17).

## Identifiers

`BotId`, `ThreadId`, `TurnId` and `MessageId`. Each one is a struct around a
`String`, so the compiler refuses a thread identifier where a bot identifier
belongs.

- `new(value)` makes one from a string. `as_str()` reads it.
- In JSON each one is a plain string: `"bot-1"`.
- A thread is one conversation with a bot. A turn is one request to an
  engine and its reply.

## Messages

Step 2.3 of the plan adds this type. Its code is not merged yet.

`Message` is one message of a thread. It has three fields:

| Field | Type | In JSON |
|---|---|---|
| `id` | `MessageId` | a string |
| `role` | `Role` | `"user"` or `"assistant"` |
| `text` | `String` | a string |

```json
{ "id": "message-1", "role": "user", "text": "hello" }
```

`Role` says who wrote the message: the person (`user`) or the bot
(`assistant`). There is no `system` role: the system prompt is not a message,
and a failed turn does not get a third role (decision D18). How a failed turn
is stored is not decided. Decide it with the store in step 8.

## Code

- `crates/bot-protocol/src/ids.rs`: the identifiers and their tests.
- `crates/bot-protocol/src/message.rs`: `Role`, `Message` and their tests
  (step 2.3, not merged yet).

## Not built

- The events of a turn: steps 2.4 and 2.5 of the plan. The design is in
  decision D20, and the order of the events is in
  [`plan/step-02-protocol-types.md`](plan/step-02-protocol-types.md). Add an
  "Events" section to this page in the pull request that adds the code.
- An event has no identifier and no time. Add them with the event log in
  step 8.
- The desktop window does not use these types yet. It has its own mock types
  (see [`desktop-window.md`](desktop-window.md)).
