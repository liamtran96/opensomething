# Wire types

The types that all crates share: identifiers, messages and events.
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

## Events

`Event` is one thing that happens while an engine runs a turn (decision
D20). It has two parts, and in JSON the two parts are one object:

| Field | Type | In JSON |
|---|---|---|
| `thread_id` | `ThreadId` | a string |
| `turn_id` | `TurnId` | a string |
| `kind` | `EventKind` | a `type` field, and the fields of that event |

`EventKind` has two events now:

| `type` | Fields | When |
|---|---|---|
| `turn.started` | none | The first event of a turn |
| `turn.completed` | `outcome` | The last event of each turn that started |

```json
{ "thread_id": "thread-1", "turn_id": "turn-1", "type": "turn.completed", "outcome": "failed" }
```

`Outcome` says how a turn ended: `completed`, `failed` or `interrupted` (a
person stopped the turn).

- An unknown `type` is an error when the JSON is read.
- The order of the events of one turn is in
  [`plan/README.md`](plan/README.md), step 2.

## Code

- `crates/bot-protocol/src/ids.rs`: the identifiers and their tests.
- `crates/bot-protocol/src/message.rs`: `Role`, `Message` and their tests.
- `crates/bot-protocol/src/event.rs`: `Event`, `EventKind`, `Outcome` and
  their tests.

## Not built

- The events `content.delta`, `item.completed` and `runtime.error`: step 2.5
  of the plan. Add them to the "Events" section in the pull request that
  adds the code.
- An event has no identifier and no time. Add them with the event log in
  step 8.
- The desktop window does not use these types yet. It has its own mock types
  (see [`desktop-window.md`](desktop-window.md)).
