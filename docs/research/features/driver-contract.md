# The driver contract of the reference project

Read on 2026-11-23, for steps 3 (the `Driver` trait), 4 (the registry) and 5
(the chat driver). All paths are in the reference project, under `server/`
unless a path starts with another folder. The `enterprise/` directory was not
read.

## Files read completely

`contracts.ts` (663), `harness/registry.ts` (595), `harness/bus.ts` (312),
`drivers/builtIn.ts` (66), `instance-fleets.ts` (87), `engine-entry.ts` (15),
`turn-route.ts` (131), `default-model-selection.ts` (99),
`runtime/capabilities.ts` (66), `drivers/openai-chat.ts` (999),
`drivers/openai-compat.ts` (456), `drivers/retry.ts` (258),
`drivers/engine-errors.ts` (234), `drivers/chat-size-limit.ts` (148),
`drivers/openai-chat-refusals.ts` (119), `key-rejections.ts` (47),
`drivers/openai-chat-fetch.ts` (24), `turn-context.ts` (81),
`resume-plan.ts` (37), `automatic-recovery.ts` (33), `auto-approve.ts` (165),
`side-jobs.ts` (230), and the tests `drivers/openai-chat.test.ts` (1160) and
`drivers/openai-chat-stream-retry.test.ts` (135). `index.ts` (15,276 lines)
was read in ranges only.

## 1. The three layers (`contracts.ts`)

- `ProviderDriver` (640): one kind of engine. `decodeConfig` (throws on a bad
  config), `defaultConfig`, `create(input)` (must reject, never throw).
- `ProviderInstance` (597): one configured engine. `models`, `snapshot()`,
  `generateText?`, `dispose()`, and the `adapter`.
- `ProviderAdapter` (253): runs turns. `capabilities`, `sendTurn`,
  `interruptTurn`, `respondToRequest`, `steer?`, `hasSession`, `stopAll`,
  `onEvent`.

## 2. The registry (`harness/registry.ts`)

- The list of drivers: `drivers/builtIn.ts:34-66`, 31 drivers, in a map by
  `driverKind` (`registry.ts:139`).
- The config: `DATA_DIR/config.json`, key `instances`. `driver` is any
  non-empty string (`config.ts:237-251`). A file that fails the schema is
  ignored as a whole, with a warning (`config.ts:699-715`).
- `createEntry` (`registry.ts:173-220`): dispose the old instance, find the
  driver, `decodeConfig` (or `defaultConfig` when `config` is absent),
  `create`.
- A shadow (`:29-36`): `{ instanceId, driverKind, displayName, cli, shadow:
  true, reason }`. It has no adapter. Three causes: an unknown driver
  (`:180-192`), `decodeConfig` throws, `create` rejects (`:207-219`). Each
  entry is independent, and entries are created concurrently (`:153-171`).
- `get()` returns null for a shadow (`:306-308`). A turn on it fails with 409
  `provider instance "<id>" is unavailable` (`index.ts:7519-7522`).
- `describe()` reports a shadow as `state: "unavailable"` with the reason
  (`:517-531`).
- `enabled: false`: the instance is still created. The flag is read later
  (`default-model-selection.ts:35-79`).
- A save keeps the fields of a shadow entry that this version does not know
  (`config.ts:959-974`).
- Reload: only the changed instances (`index.ts:11830-11896`). A running turn
  on a changed instance is stopped, with the row "turn interrupted — provider
  settings changed". While it reloads, a turn gets 409 "this provider account
  is being updated".
- `snapshot()`: one read at a time, reused for 3 s, limit 60 s
  (`registry.ts:71-87`, `:228-239`). No polling timer.

## 3. The event bus (`harness/bus.ts`)

- `attach` subscribes to `adapter.onEvent`, drops an event whose `provider`
  is not the driver kind, and stamps `providerInstanceId` (`:84-99`).
- `publish` (`:101-130`): stamp an item id; merge `content.delta` of one
  stream for `DELTA_MERGE_MS = 50`; flush waiting text before any other event
  of the thread; write; deliver.
- The log: `events/<threadId>.ndjson`, redacted, mode 0600, at most 64 lines
  for each write, queue limits 4096 events and 32 MiB (`:18-23`, `:168-261`).
  A turn end is never dropped. A log failure does not stop live delivery.
- A listener that throws does not stop the others (`:285-295`).
- Terminal events: `turn.completed`, `cap.exhausted`, `session.exited`, and
  `runtime.error` with `terminal: true` (`:45-50`).

## 4. The chat driver (`drivers/openai-chat.ts`, `drivers/openai-compat.ts`)

- Config (`openai-compat.ts:94-109`): `url`, `apiKeyEnv`, `key?`, `model?`,
  `tools?`, `catalog?`, `provider?`, `managedModels?`, `replyWaitMinutes?`.
  Default URL `https://openrouter.ai/api/v1`.
- Key order (`:209-215`): `config.key`, then the instance environment, then
  the operator environment.
- Before the turn (`openai-chat.ts:517-518`): no key, or a turn already runs
  on the thread. Both reject `sendTurn`; no event.
- Request (`:282-293`): `POST {url}/chat/completions`, `authorization: Bearer`,
  body `model`, `messages`, `stream`, `stream_options: { include_usage: true }`.
- Stream (`:364-448`): lines `data: ...`; `[DONE]` ends. EOF after a
  `finish_reason` is a clean end (some providers send no `[DONE]`). EOF with
  no `finish_reason` is `StreamTruncatedError`. A frame over 2,000,000
  characters is an error. An error object in a 200 body is an error.
- Deltas: `delta.content` is `assistant_text`; `delta.reasoning_content ??
  delta.reasoning` is `reasoning_text` (`:397-410`).
- Retry (`retry.ts`): 3 attempts, delays 1 s, 3 s, 8 s with ±25%. Never after
  text streamed, after a tool ran, or after a stop. Transient: 429, 408, 5xx,
  connection reset, timeout. Terminal: 401, 403, 402, 400, 404, 422.
- Idle timeout: 180 s between bytes, covers connect and first byte
  (`openai-compat.ts:17-23`). No total timeout.
- Error text: `"<label> HTTP <status>: <provider message, 500 chars>"`
  (`openai-chat.ts:297-311`), cut at 2,000 characters (`:889`).
- A rejected key (401): marked by URL and a hash of the key, never the key
  (`key-rejections.ts:9-22`). `snapshot` then says `authenticated: false`,
  "The provider rejected this key." (`openai-chat.ts:946`).
- Secrets (`:526-541`, `:643-657`): the key and each secret environment value
  of 8 or more characters become `[redacted]`. While text streams, the driver
  holds back a suffix that can be the start of a secret.
- `snapshot()` (`:942-948`): no key gives `unavailable`; else `available`.
- Models: `GET {url}/models`, 8 s limit; on failure the seed list stays
  (`openai-compat.ts:283-374`).

## 5. How the server uses the contract

- Capability flags gate mounts and refusals, for example `queueing` (steer or
  queue, `index.ts:7191`), `effortLevels` (`:7566`), `guestTurns` (`:7529`).
  `sessionModelSwitch` has no reader outside the drivers.
- Many decisions still use the driver name: `runtime/capabilities.ts:17-49`
  (a second table by name, for transcript replay), `workspace.ts:16-18`,
  `packages/phone-protocol/src/approval-mode.ts:22-45`,
  `engine-memory.ts:839`, `host/room-sessions.ts:12`.
- `ProviderError` is never constructed. Only its code values are used, inside
  the ACP drivers.
- `TurnNotStartedError` is caught in one place (`index.ts:8397-8517`): the
  server tries each backup engine once, then stores a failure row.
- A permission request: `request.opened`, a card, `respondToRequest`, then
  `request.resolved`. Limit 15 minutes for a permission, none for a question
  (`chat-tool-approval.ts:68`).
- Steer: "steered" is recorded; "refused" is queued; "indeterminate" is
  treated as delivered and never sent again (`index.ts:7180-7249`).
- No shared contract test exists for all drivers.

## 6. Not verified

- The six wrappers around each instance (`registry.ts:198`).
- `acp/core.ts`, `claude.ts`, `codex.ts`: not read.
- `shared/redact.ts`, `chat-tool-approval.ts`, `chat-mcp-tools.ts`,
  `prompt-split.ts`: not read.
- That an idle timeout is retried as a transient error: inferred, no test.
- `config.ts` lines 730-861 and 892-929: not read.
