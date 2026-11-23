# Write-only secrets in the reference project

The feature row in [`../features.md`](../features.md): "Rule: secrets are
write-only; the UI sees only `configured`". Document of the reference:
`docs/superpowers/plans/2026-08-31-00-control-plane-roadmap.md`. Part 11 of
[`../README.md`](../README.md).

Read on 2026-11-23 by five subagents, one for each group of files. The key
findings of each group were checked again against the code. All paths are in
the reference project unless a path starts with `crates/` or `docs/`. Nobody
opened its `enterprise/` directory. No real key is in this file.

## 1. In short

A person gives the server an API key for an AI provider or for another
service. The server keeps the key and uses it for turns. The server never
sends the key back to a client. In place of the key, a client gets a flag,
`configured: true` or `false`. This is what "write-only" means: a client can
write a secret, but it cannot read it.

The rule comes from the roadmap of the reference project
(`docs/superpowers/plans/2026-08-31-00-control-plane-roadmap.md:32-34`):

> Secrets are write-only. The UI only ever sees a `configured` boolean. No
> endpoint may return a key, token, or secret it stores.

`CONTRIBUTING.md:341-345` and `SECURITY.md:35-42` repeat it. `SECURITY.md`
calls each path that echoes a stored secret a vulnerability: an API response,
an event, a log line, or a command line that `ps` can show.

The code does not obey the rule exactly. An admin client also gets the last
four characters of each key that has 12 characters or more
(`server/key-hint.ts:4-15`). A comment in the route still says "booleans
only" (`server/routes/config.ts:135`).

Terms used in this file:

- **Config file:** `config.json` in the data folder. It holds the settings
  and, on a server without the desktop app, the keys in plain text.
- **Patch:** the body of `PUT /api/config`. It names only the fields that
  change.
- **Status:** the body that `GET /api/config` returns. It has flags in place
  of keys.
- **Desktop store:** `credentials.bin`, a file that the desktop app encrypts
  with the operating system. The packaged desktop app keeps most keys there.
- **Tombstone:** an empty string `""` that the server writes in place of a
  key in `config.json`, when the real key is in the desktop store.
- **Hot reload:** a changed key reaches the running server and its engines
  without a restart.
- **Admin scope and client scope:** the two levels of a client session. The
  owner and admins have the admin scope. A paired phone or a member has only
  the client scope.

## 2. Files read completely

88 files, by group. The numbers are line counts.

- **Storage:** `server/config.ts` (1228), `server/config.test.ts` (2500),
  `server/config-backup.ts` (195), `server/config-backup.test.ts` (203),
  `server/config-cli.ts` (117), `server/credential-env.ts` (106),
  `server/instance-fleets.ts` (87), `server/atomic.ts` (142),
  `server/sign-in-env.ts` (38), `server/settled-file.ts` (31),
  `server/anthropic-key-env.ts` (8), `server/image-generation-config.ts` (74),
  `server/live-config.ts` (120), `server/decider/config.ts` (93),
  `server/unreadable-aside.ts` (22), `server/data-dir.ts` (56),
  `server/mcp-registry.ts` (551), `server/vps-config.ts` (43),
  `server/local-vm-settings.ts` (66), `server/schema.ts` (17),
  `server/legacy-feature-flags.ts` (27), `server/postiz/connection.ts` (80),
  `server/tts/hearing-config.ts` (8), `server/browser/config.ts` (60).
- **HTTP API:** `server/routes/config.ts` (718),
  `server/routes/config-engine-effect.ts` (30) and its test (138),
  `server/routes/config-browser-proxy.test.ts` (25),
  `server/routes/instances.ts` (597) and its test (360),
  `server/request-auth.ts` (737), `server/key-hint.ts` (37) and its test (35),
  `server/live-settings.ts` (91), `server/composio-share.ts` (121),
  `server/decider/config-errors.ts` (13),
  `server/openai-compat-endpoints.ts` (114), `server/claude-endpoints.ts`
  (174), `server/codex-endpoints.ts` (77),
  `server/live-config-auth.e2e.test.ts` (73),
  `server/session-credentials.e2e.test.ts` (202),
  `server/mistral-key-flow.test.ts` (98).
- **Key use and hot reload:** `server/harness/registry.ts` (595),
  `server/harness/http.ts` (81), `server/contracts.ts` (663),
  `server/drivers/openai-chat.ts` (999), `server/drivers/openai-compat.ts`
  (457), `server/engine-entry.ts` (15) and its test (35),
  `server/key-rejections.ts` (47) and its test (44),
  `server/provider-key-flow.test.ts` (191),
  `server/key-rejected.e2e.test.ts` (105).
- **Desktop store:** `electron/credential-patch.mjs` (48) and its test (37),
  `electron/secure-credentials.mjs` (93) and its test (195),
  `electron/secure-credential-state.mjs` (78), its `.d.mts` (17) and its test
  (109), `electron/workspace-credentials.mjs` (82) and its test (258),
  `electron/workspace-credentials-save.node-test.mjs` (34),
  `server/vault/mcp-keys.ts` (146), `SECURITY.md` (54),
  `apps/docs/content/docs/security/permissions-and-secrets.mdx` (311).
- **UI:** `src/components/keys/` (all 13 files: `key-catalog.ts` 293 and its
  test 163, `key-focus.ts` 42, `KeyPanels.tsx` 340, `KeyRow.tsx` 503 and its
  three tests 171, 54 and 176, `key-save.ts` 68 and its test 49,
  `KeysLink.tsx` 15, `KeysPage.tsx` 236 and its test 589),
  `src/components/LiveKeyNeeded.tsx` (51), `src/components/LiveKeySetup.tsx`
  (90), `src/components/NoEngines.tsx` (113),
  `src/components/OpenAiCompatServers.tsx` (405),
  `src/components/EngineAccounts.tsx` (360),
  `src/components/settings/settings-index.ts` (317),
  `src/state/config-status.ts` (254), `src/lib/config-status-frame.ts` (61),
  `docs/cli-onboarding.md` (86).

Read in ranges only: `server/index.ts` (15,276 lines: `configStatus` and
`configForAccess` at 11578-11680, `reloadProviders` at 11790-11904, the
broadcast at 4660-4719, and the wiring lines), `electron/main.mjs` (3,124
lines: 262-293, 355-464, 494-536, 872-889, 1085-1194, 2690-2751, 2838-2882),
`server/drivers/claude.ts` and `server/drivers/codex.ts` (the parts that
build a child environment), `src/components/EngineSetup.tsx` (420-634),
`src/state/store.tsx`, `DESIGN.md` (306-395) and `src/locales/en.json` (the
strings that the key UI uses).

## 3. How it works

### 3.1 Where a key is stored

There are three places. Which one holds a key depends on how the server runs.

| How the server runs | Where a key is | Protection |
|---|---|---|
| A server without the desktop app, or a build that is not packaged | `config.json`, plain text | Mode `0600`, written atomically (`server/config.ts:991`, `server/atomic.ts:58-67`). The mode has no effect on Windows (`server/atomic.ts:99`). The folder gets no mode (`server/config.ts:989`). |
| The packaged desktop app | `credentials.bin` in the Electron user-data folder, encrypted with `safeStorage` (`electron/main.mjs:364`, `:385-398`) | The operating system: Keychain, DPAPI, or the Linux secret store. On Linux with no secret store, Electron uses a fixed key (`docs/cli-onboarding.md:82`). |
| A key that a bot asked for on a secret card, for an MCP server | The Vault (`logins.json.enc`), and `config.json` holds only a pointer `vault:<id>` | A key file beside the encrypted file (`server/vault-store.ts:18-19`). See section 3.9. |

Some keys stay in plain text in `config.json` also on the desktop:
OpenCode provider keys, the `environment` and `key` values of one engine
instance, MCP environment and header values, and `mcp-oauth.json`
(`SECURITY.md:37-40`, `docs/cli-onboarding.md:82`). The code and the
documents give no reason.

`config.json` also has up to 10 dated backups, `config.json.bak.<time>`
(`server/config-backup.ts:16`, `:88-111`). Each backup is the full old text,
with each key (`server/config-backup.ts:3`). Thus a removed or replaced key
stays on disk until 10 more saves delete its backups.

### 3.2 The fields that hold a secret

All provider keys are `z.string().optional()`, with no length limit and no
format check (`server/config.ts:40`, `:304-355`). The list:

- One `key` field for each provider section: `xai`, `anthropic`, `mistral`,
  `cerebras`, `groq`, `greenference`, `modelgo`, `meta`, `deepseek`,
  `openai`, `openrouter`, `openaiCompat`, `treg`, `postiz`.
- `composio.apiKey`, `box.token`, `opencodeGo.apiKey`.
- `opencodeGo.providerKeys`: a map from a name such as `VENICE_API_KEY` to a
  value. Limits are in functions, not in the schema: a name pattern, a value
  of 1 to 4,096 printable characters, at most 20 entries
  (`server/config.ts:821-834`).
- `tts.key`, `tts.fishKey`, `tts.geminiKey`. `decider.key`,
  `decider.openrouterKey`, `decider.customKey`, `decider.workersAiToken`.
  `imageGen.key`, `imageGen.geminiKey`, `imageGen.customApiKey`. `live.key`.
- `instances[id].environment` and `instances[id].config` (free maps).
- `mcpServers[name].env`, `.headers` and `.oauth.clientSecret`
  (`server/mcp-registry.ts:126-127`, `:211-241`).

### 3.3 Give a key (no desktop app)

1. The client sends `PUT /api/config` (or `PATCH`) with a patch, for example
   `{"openai":{"key":"<value>"}}` (`src/components/keys/key-save.ts:26`).
2. Only a caller with the admin scope passes. A client-scope session gets 403
   "this session lacks the admin scope" (`server/request-auth.ts:509-516`,
   `:679-682`). A bot shell on a shared server gets 403 (`:714-725`).
3. The route checks the patch against `appConfigPatchSchema`
   (`server/config.ts:413-414`, `:562-568`). A bad patch gets 400 with the
   field path and the schema message, not the value (`server/schema.ts:12-17`).
4. The route refuses a second save while one runs: 409 "provider settings
   are already being updated" (`server/routes/config.ts:207`, `:276`, `:713`).
5. For five services, the route tests the key with the provider before the
   save: Composio, Postiz, the Boat token, the voice keys and the decider key
   (`server/routes/config.ts:395-503`). A refused key gets 400, sometimes with
   `code: "key_rejected"`. The AI provider keys are not tested here.
6. `saveConfig(patch)` merges the patch into the raw file
   (`server/config.ts:876-1000`). Section 3.4 gives the steps.
7. `syncCredentialEnv(patch)` copies each key to `process.env` of the server
   (`server/config.ts:772-816`). This is necessary because `loadConfig()`
   prefers the environment to the file (`server/routes/config.ts:609`).
8. `Object.assign(cfg, loadConfig())` refreshes the config in memory
   (`server/routes/config.ts:611`).
9. Hot reload of the changed engines (section 3.7).
10. The server sends a `config` event to each client
    (`server/routes/config.ts:690-691`).
11. The response is the status, the same shape as `GET /api/config`. It
    never holds the key (`server/routes/config.ts:704`).

### 3.4 `saveConfig`, step by step

1. Read `config.json` raw (`server/config.ts:885`). An unreadable or invalid
   file stops the save with 503. An invalid file is first copied aside as
   `config.json.unreadable-<hash>` (`server/config-backup.ts:61-70`).
2. Check the patch again with a wider schema (`server/config.ts:888`).
3. For each section in the patch, copy the stored section and assign the
   patch fields over it. A field with `null` is deleted
   (`server/config.ts:893-904`). The merge is one level deep.
4. Write a dated backup of the old text. If the backup fails, write nothing
   (`server/config.ts:990`).
5. Write the new file atomically with mode `0600` (`server/config.ts:991`).
6. Tell each `onConfigSaved` listener. Each listener gets the full file
   before and after, with all keys (`server/config.ts:889`, `:993-999`).

### 3.5 Change a key, remove a key

- **Change:** send the new value in the same field. The old value is not
  shown and not removed first.
- **Remove:** send `""`. The field stays in the file as `""`. It is not
  deleted (`server/config.test.ts:2225-2232`). `syncCredentialEnv` deletes the
  environment variable (`server/config.ts:799-803`). The flag becomes
  `configured: false`.
- `null` cannot remove a key. The key fields are not nullable, so the schema
  refuses `null` (`server/config.ts:40`, `:900-902`).
- A missing field changes nothing.
- One OpenCode provider key: `{"opencodeGo":{"providerKeys":{"NAME":""}}}`.
  The route merges the map first, so the other names stay
  (`server/config.ts:844-865`, `server/routes/config.ts:526-530`).
- An instance key (an added OpenAI-compatible server) cannot be blank
  (`min(1)`). The person changes it with `PATCH /api/instances/:id` and
  removes the whole instance with `DELETE` (`server/routes/instances.ts:469-594`).
- Whitespace: the route trims `box.token` and `tts.geminiKey` only
  (`server/routes/config.ts:263`, `:492`). It does not trim the other keys.
  `configured` comes from the trimmed value (`server/key-hint.ts:14`). The
  window trims and cleans a key before it sends it (section 5.3).

### 3.6 How a turn reads a key

`docs/research/driver-contract.md` section 4 covers the chat driver. This
section adds the path of the key.

1. `loadConfig()` reads `config.json`, then lets each set environment
   variable win, one for each key (`server/config.ts:716-754`). The test is
   `!== undefined`, so an empty variable also wins.
2. `instanceConfigs(cfg)` makes one config for each engine instance
   (`server/config.ts:1136-1198`). `injectedEnvironment` puts each key only
   into the instances of the driver that reads it, as an environment value
   (`server/config.ts:1108-1134`). An instance with its own address or its
   own key gets no workspace key, because that key would go to another host
   (`server/config.ts:1065-1106`).
3. The registry calls `driver.create` with that environment
   (`server/harness/registry.ts:198-204`).
4. The chat driver reads the key one time, at `create`, and keeps it in a
   closure (`server/drivers/openai-compat.ts:207-221`,
   `server/drivers/openai-chat.ts:84-87`). Each request sends
   `authorization: Bearer <key>` (`server/drivers/openai-chat.ts:293`).
5. A CLI engine gets the key as a variable in the environment of its child
   process, for example `ANTHROPIC_API_KEY` (`server/drivers/claude.ts:764-765`,
   `server/config.ts:1118`). A key never goes on the command line. Codex gets
   only the name of the variable on its command line
   (`server/drivers/codex-endpoint-config.ts:19-35`).
6. Each child process loses the workspace variables first
   (`stripWorkspaceCredentialEnv`, `server/credential-env.ts:4-5`, `:57-60`).

A missing key: the chat driver refuses the turn with "No API key — open
Settings → AI → Providers." and its status is `unavailable`
(`server/drivers/openai-compat.ts:222-224`, `server/drivers/openai-chat.ts:517`,
`:945`). A key that the provider refuses (401 and others): the server keeps
a hash of the key, never the key, and the status says "The provider rejected
this key. Change it in Settings → AI." (`server/key-rejections.ts:1-22`).

### 3.7 Hot reload

A changed key reaches the next turn with no restart. A test proves it: the
second request of the same bot carries the new key
(`server/provider-key-flow.test.ts:10-99`).

1. Before the save, the route records `engineLaunches(providerConfigs())`:
   each instance entry with its injected keys, and the values of the
   variables that the driver reads from the process environment
   (`server/routes/config.ts:562`, `server/config.ts:654-673`).
2. After the save, it records the same again and compares each instance
   with a deep compare. The changed instances are `changedEngines`
   (`server/routes/config.ts:666`, `server/config.ts:675-678`).
3. Before any `await`, it revokes the turn capabilities of the bots on the
   changed engines (`server/routes/config.ts:667-668`).
4. `reloadProviders` (`server/index.ts:11830-11896`):
   1. It marks the changed instances as "changing". A new turn on one of
      them gets 409 "this provider account is being updated — try again
      shortly" (`server/index.ts:7495-7497`).
   2. It stops each running turn on them, with the text "turn interrupted —
      provider settings changed" (`server/index.ts:11839`).
   3. It disposes each removed instance and calls `registry.load` for each
      kept one. `load` disposes the old object and creates a new one in the
      same place (`server/harness/registry.ts:178`, `:163-170`).
   4. It records an activity message in each stopped conversation, clears
      the marks and sends the queued messages (`server/index.ts:11855-11895`).
5. A save that changes no engine stops no turn
   (`server/managed-desktop-cleanup.test.ts:350`, `server/index.test.ts:9186`).
6. A save that changes a status but not a launch entry only clears the
   status cache (`server/routes/config-engine-effect.ts:8-30`,
   `server/routes/config.ts:627-628`).
7. A driver that fails to start with the new key becomes "unavailable" with
   its error text. The other engines are not touched
   (`server/harness/registry.ts:207-219`).

The server has no file watcher. A change that a person types into
`config.json` by hand reaches the server only at the next save or restart
(`docs/comparison.md`, Config row).

### 3.8 The desktop store

The packaged desktop app keeps 27 keys in `credentials.bin`, plus the
Composio key (`electron/workspace-credentials.mjs:3-31`,
`electron/credential-patch.mjs:2-32`).

**At start:**

1. The desktop reads and decrypts `credentials.bin`. It tries 5 times, with
   waits of 100, 200, 400 and 800 ms (`electron/secure-credentials.mjs:3-40`).
2. It moves each plain-text key that it finds in `config.json` into
   `credentials.bin`. The encrypted write comes first. If it fails,
   `config.json` keeps the keys and the app still works
   (`electron/workspace-credentials.mjs:57-73`).
3. It starts the server as a child process. Each key goes to the server as
   an environment variable, for example `OMB_OPENAI_API_KEY`
   (`electron/main.mjs:1111-1137`, `electron/workspace-credentials.mjs:75-82`).
   The command line is empty.

**When the person saves a key:**

1. The window calls `window.ogb.setCredential(slot, value)`, not the HTTP
   API (`src/components/keys/key-save.ts:13-27`).
2. The desktop writes the new `credentials.bin` first
   (`electron/main.mjs:2734-2742`).
3. Then it calls `PUT /api/config?secretStorage=external` with the key
   (`electron/main.mjs:2717-2731`).
4. The server writes `""` (a tombstone) in `config.json` in place of the key,
   and puts the real key only in `process.env` (`server/routes/config.ts:564-604`).
5. If the server refuses, the desktop writes the old `credentials.bin` back
   (`electron/secure-credential-state.mjs:60-76`).

**Removal:** the same call with `""`. The desktop deletes the field from
`credentials.bin`. A key removed only through `PUT /api/config` comes back at
the next start, because the store wins over an empty field in `config.json`
(`electron/workspace-credentials-save.node-test.mjs:1-5`).

**An unreadable store:** the server gets no keys, and each save fails
(`electron/secure-credential-state.mjs:40-44`). The window shows "The keys
saved on this computer couldn't be read." with "Reset saved keys". A reset
moves the file aside and restarts the app (`src/components/SavedKeysReset.tsx`,
`electron/secure-credentials.mjs:43-87`).

### 3.9 Where the Vault and the password managers connect

This is a different feature. Only the connection points are given here.

- A bot calls the tool `request_credential`. The person types the secret on
  a secure card, and the bot never sees it (`server/drivers/agents-catalog.ts:451-453`).
- The value goes into the Vault. The bot gets a one-use reference
  `secret-ref:<hex>` that lives one hour (`server/secret-vault.ts:20`,
  `:94-109`).
- When the bot adds an MCP server with that reference, the server writes a
  pointer `vault:<id>` into `mcpServers[name].env`, `.headers` or
  `.oauth.clientSecret` of `config.json` (`server/host/secret-cards.ts:371-381`).
- The server reads the pointer only when it starts, tests or calls that MCP
  server, and only for a server that the item was given to
  (`server/vault/mcp-keys.ts:4-5`, `:93-106`). A bot cannot type a pointer
  itself (`server/routes/internal-mcp.ts:167`).
- 1Password and Bitwarden items connect through the same Vault store
  (`server/index.ts:742`, `server/vault/mcp-keys.ts:116-131`).

## 4. The data

### 4.1 The status of one key

```ts
// server/key-hint.ts:13-15
keyStatus(secret) -> { configured: boolean, last4?: string }
```

- `configured` is `true` when the trimmed value is not empty.
- `last4` is the last four characters, only when the trimmed value has 12
  characters or more (`server/key-hint.ts:6-11`).
- A client-scope caller gets the status after `withoutKeyHints`, which
  removes each `last4` at any depth (`server/key-hint.ts:33-37`,
  `server/index.ts:11672`).

The window type is the same: `SavedKey { configured: boolean; last4?: string }`
(`src/state/config-status.ts:9`).

### 4.2 `GET /api/config`

`configStatus()` builds the full status (`server/index.ts:11578-11663`).
`configForAccess` makes the view for the caller (`server/index.ts:11666-11680`).

- A `keyStatus` for each top-level provider key: `xai`, `mistral`,
  `cerebras`, `groq`, `greenference`, `modelgo`, `meta`, `deepseek`, `treg`,
  `postiz` (with `url`), `anthropic` (with `everyClaudeBot`), `openai`,
  `openrouter`, `openaiCompat` (with `url`), `opencodeGo`.
- `savedKeys`: a `keyStatus` for each key that is inside another setting:
  `ttsKey`, `fishAudioKey`, `geminiTtsKey`, `jevApiKey`,
  `openrouterDeciderKey`, `workersAiToken`, `customDeciderKey`,
  `openaiImageApiKey`, `customImageApiKey`, `geminiImageApiKey`,
  `openaiLiveKey` (`server/key-hint.ts:17-31`).
- Older flags: `tts.configured`, `decider.configured`, `helpers.own.*`,
  `imageGen.*Configured`, `live.configured`.
- `opencodeGo.providerKeys`: the names only, never the values
  (`server/index.ts:11608`). A client gets an empty list.
- `composio`: `{ configured, mode }`, and `last4` only for a key of the
  person's own (`server/index.ts:11602-11605`).
- An engine instance with a token shows `tokenSaved: true`, never the token
  and never `last4` (`server/claude-endpoints.ts:67-80`).
- The rest are plain settings: addresses, models, voices, the profile.

### 4.3 The `config` event

The server sends `{ kind: "config", ...configStatus(), seq }` on its event
stream (`server/index.ts:4677`). An admin stream gets the admin view. A
client stream gets the client view (`server/index.ts:4679`, `:4687`). The
replay buffer keeps both. A test checks that the REST view, the live event
and the replay agree for both kinds of caller
(`server/remote-sessions.test.ts:490-566`).

### 4.4 Environment variable names

Each key has one variable name that the server reads at start and writes on
save (`server/config.ts:716-754`, `:772-816`). Many names have the prefix
`OMB_` so that a provider CLI does not read them by mistake. The comment
explains it: "Never ANTHROPIC_API_KEY: an operator's stray variable must not
move every Claude bot onto API billing." (`server/config.ts:722`).

## 5. The UI

### 5.1 Where the keys are

The keys are in **Settings → AI**. The AI providers are in the Providers
list of that page. The other keys are under "Other services", one fold row
for each section (`src/components/settings/pages/PlacePages.tsx:123-141`).
The page is for admins only (`src/components/settings/settings-index.ts:49-61`).

The catalog has six sections: "AI providers", "Your own model servers",
"Voice and calls", "Computers and browser", "Apps and tools", "Helpers and
pictures" (`src/components/keys/key-catalog.ts:13-20`). It has 34 rows. Each
key row names the patch that it sends, its slot in the desktop store, a
placeholder such as `sk-ant-…`, and a "Get a key" link
(`src/components/keys/key-catalog.ts:87-216`).

A key prefix is not a gate. It only warns when a key looks like the key of a
different provider: "That looks like the {label}, not this one."
(`src/components/keys/key-catalog.ts:279-284`).

### 5.2 One key row, state by state

| State | What the row shows |
|---|---|
| Not set | A password field, "Paste your key", a "Get a key" link and a "Save" button. Save is off while the field is empty. |
| The person types or pastes | The field is `type="password"`, `autoComplete="off"`, `spellCheck={false}`. The settings window has no show and hide control. A paste that looks like a key saves at once. Enter saves. |
| Saving | The chip "Saving…", then "Checking…" while the server tests the key. |
| Set | `••••••••` and the last four characters, for example `••••••••a1b2`. Screen readers hear "{label} is saved and ends in {last4}". The chip says "Connected" when the key was tested, else "Saved". Buttons: "Replace" and "Remove". |
| Replace | The field comes back with "Paste the new key" and "Cancel". Escape cancels. |
| Remove | One click. No confirmation. |
| Error | "Didn't work: {reason}", with `role="alert"`. A refused key stays saved and in view, with "Replace". |

Sources: `src/components/keys/KeyRow.tsx:16`, `:40-47`, `:169-175`,
`:295-361`, `:420-459`, and `src/locales/en.json` for the strings.

The person can never see a saved key again. A set row has no input
(`src/components/keys/KeyRow.test.ts:47`).

### 5.3 The save from the window

1. `cleanKey` removes zero-width characters, spaces at the ends and one pair
   of quotes (`src/components/keys/key-save.ts:39-43`).
2. `looksLikeKey` refuses an empty key or a key with a space: "That doesn't
   look like an API key: keys have no spaces." (`key-save.ts:35-37`).
3. `saveKey` sends the key to the desktop store or to `PUT /api/config`
   (`key-save.ts:22-27`).
4. The response is the status. The row puts it in the store and clears the
   typed value from React state (`KeyRow.tsx:216-231`).
5. For a key that the server did not test on save, the row calls
   `POST /api/keys/test` with `{ provider }` only. The key is not in that
   request: the server tests the key that it saved (`key-save.ts:54-55`).
6. Analytics get the provider, the place and the result, never any part of
   the key (`src/components/keys/KeyRow.analytics.test.ts:56-59`, `:116`).

No text in the window says that a restart is necessary. The texts say that a
key "saves and checks itself" (`src/locales/en.json:4049`).

### 5.4 Other places where a person types a secret

- An added OpenAI-compatible server: a password field. The list shows only
  the name and the address. The edit field says "Leave empty to keep the
  current key". A new address needs the key again
  (`src/components/OpenAiCompatServers.tsx:89-273`).
- OpenCode provider keys: only the names show. "Keys go only to OpenCode and
  can't be shown again." (`src/components/keys/KeyPanels.tsx:12-105`).
- The live call key: a small form in the call notice. When the key is set,
  the form is gone (`src/components/LiveKeySetup.tsx`,
  `src/components/LiveKeyNeeded.tsx:23-42`).
- No UI field takes the `environment` values of an engine instance. A person
  edits `config.json` for them.

## 6. The tests

| What the tests guarantee | Where |
|---|---|
| A saved key is not in the PUT response, the GET response, any event or the server log | `server/mistral-key-flow.test.ts:11-98`, `server/provider-key-flow.test.ts:10-99`, `server/index.test.ts:8331`, `:13185-13220` |
| A changed key reaches the next request of a running bot. `""` makes the engine unavailable | `server/provider-key-flow.test.ts:79-87` |
| A client session sees no `last4`, in REST, live events and replay. An admin sees it | `server/remote-sessions.test.ts:490-566`, `server/key-hint.test.ts:20-34` |
| A client session cannot set or clear a key | `server/live-config-auth.e2e.test.ts:8-72` |
| Each key goes only to the driver that reads it, and never to an instance with its own address | `server/config.test.ts:927-1509` (about 40 tests) |
| The environment wins over the file. `syncCredentialEnv` sets and deletes variables | `server/config.test.ts:1615`, `:1929-2018` |
| A JSON error never puts file text in the log | `server/config.test.ts:2278` |
| A save reloads only the changed engines, and stops only their turns | `server/config.test.ts:2147-2175`, `server/managed-desktop-cleanup.test.ts:350-378` |
| A refused key shows as not working until it changes. Only a hash is kept | `server/key-rejected.e2e.test.ts:11-105`, `server/key-rejections.test.ts` |
| The desktop writes `credentials.bin` before it blanks `config.json`, and rolls back on a refusal | `electron/workspace-credentials.test.mjs:219-248`, `electron/secure-credential-state.test.mjs:85-108` |
| An unreadable store is never treated as empty | `electron/secure-credentials.test.mjs:48-62` |
| The window masks a saved key and has no input for it. Analytics never get a part of a key | `src/components/keys/KeyRow.test.ts:47-67`, `KeyRow.analytics.test.ts` |

`server/config.test.ts` has 185 tests (233 cases with the table rows). The
counts come from the source text. Nobody ran the tests.

## 7. Ours compared

What we have now:

- `crates/bot-desktop/ui/src/features/settings/SettingsDialog.tsx:69`, `:150`:
  an "API key" field, `type="password"`, `autoComplete="off"`. The value is
  React state only. Nothing saves it and no code reads it
  (`docs/settings.md`).
- No Rust code holds a key. `bot-core`, `bot-engine` and `bot-cli` have no
  settings code yet.

What we plan:

- Step 6.4: `redact(text)` replaces known secret values and key patterns
  (`docs/plan/step-06-settings.md:16`).
- Step 6.5: a `Secret` type whose `Debug` output is `[redacted]`
  (`docs/plan/step-06-settings.md:17`).
- Step 6 choice: the key in the settings file, or in the keychain of the
  operating system (`docs/plan/step-06-settings.md:22-23`).
- Step 7.6: Tauri commands to load and save settings. "The window never gets
  the saved key back, only 'a key is set'" (`docs/plan/step-07-event-bus.md`).
- Decision D10: a secret is never written to a log. The core runs in the
  Tauri process. There is no HTTP server (D14).
- `docs/comparison.md`: `keyring` 4 for desktop secrets, `secrecy` for
  redaction.

Where we differ from the reference:

| Point | Reference | Ours (planned) |
|---|---|---|
| Transport | HTTP `PUT /api/config` and a JSON status | Tauri commands. No HTTP server |
| Server process | A child process. Keys go to it as environment variables | The core is in the same process. No hand-off is necessary |
| Store | Three places: `config.json`, `credentials.bin`, the Vault | Not chosen (step 6) |
| What the window sees | `configured`, and `last4` for an admin | "A key is set" only (step 7.6) |
| Clients | Admin and client scopes, phones, members | One person, one window |
| Number of keys | About 40 | One provider key in part 1 |

## 8. Where we can be better

Each point has a reason.

1. **Let the compiler refuse a status with a key in it.** In the reference,
   the rule depends on `configForAccess` and on comments. A comment is
   already wrong: `server/routes/config.ts:135` says "booleans only", but the
   code returns `last4`. We can make the secret type not implement
   `Serialize`, and make the status a separate type with a `bool`. Then a
   Tauri command that returns a key does not compile. This is a wrong state
   that the compiler refuses.

2. **Decide on `last4` and write it in the rule.** The roadmap says
   "only a configured boolean". The code sends the last four characters. Two
   texts disagree. Recommendation: send no part of the key in part 1. If a
   hint becomes necessary, use the reference rule (12 characters or more)
   and change the rule text at the same time.

3. **One store, not three.** The reference has plain text in `config.json`,
   encrypted keys in `credentials.bin`, tombstones, an environment that wins
   over the file, and a migration at each start. This makes a known trap: a
   key removed through the HTTP API comes back at the next start
   (`electron/workspace-credentials-save.node-test.mjs:1-5`). Our core is in
   the Tauri process, so it can read the keychain directly with `keyring`.
   Recommendation: the key goes to the keychain only. The settings file holds
   no key. This is less code and a known problem that we do not copy.

4. **Keys out of the settings file means keys out of its backups.** The
   reference keeps 10 full backups of `config.json`, with every key. A
   removed key stays on disk for 10 more saves (`server/config-backup.ts:3`,
   `:16`). If the file has no key, a backup has no key. Mode `0600` also has
   no effect on Windows, which is our work computer (`server/atomic.ts:99`).

5. **A typed change, not a string with three meanings.** In the reference, a
   missing field means "keep", `""` means "remove", and `null` is refused for
   a key. `""` also stays in the file. We can use an enum: `Keep`,
   `Set(Secret)`, `Remove`. A remove then deletes the entry. This is a wrong
   state that the compiler refuses.

6. **Trim and check a key in one place.** The reference server trims two
   keys of about 40 (`server/routes/config.ts:263`, `:492`). The window
   cleans keys, but another client may not. The constructor of our secret
   type can trim, refuse whitespace inside and refuse an empty value. One
   place, so less code.

7. **Keep the hot reload, but reload one entry.** The reference compares
   launch entries with their plain-text keys held in memory, and replaces only
   the changed engines (`server/config.ts:654-678`). This idea is good, and
   step 4 already makes a registry from entries. For part 1, a save of the
   key can replace the one registry entry that uses it. Stop the running turn
   of that entry with a reason, as the reference does. Do not keep copies of
   the key for the compare: compare a version number or a hash.

8. **Do not put the key in the process environment.** The reference writes
   each key into `process.env` of the server (`syncCredentialEnv`), and then
   must remove 46 names from each child process (`server/credential-env.ts:5-43`).
   Our chat driver gets the key as a constructor argument. When step 9 starts
   a CLI engine, give the key only to that child, never to our own process.
   This is a known problem that we do not copy.

9. **Redact provider error text before it reaches the window.** The
   reference passes some upstream error messages on unchanged
   (`server/routes/config.ts:402`, `:413`, `:486`), and `generateText` has no
   mask (`server/drivers/openai-chat.ts:986-991`). A provider can repeat a key
   in its error body (`server/key-rejections.test.ts:8`). Step 6.4 redaction
   must cover each error that a command returns. The reference also skips a
   key shorter than 8 characters (`server/drivers/openai-chat.ts:526`). Our
   redaction of a known value has no reason for that limit.

10. **Ask before Remove, or give Undo.** The reference removes a key with one
    click (`src/components/keys/KeyRow.tsx:421`). Its own `DESIGN.md:385-386`
    says that a destructive confirmation focuses Cancel. A removed key cannot
    come back, because the window cannot read it. A short confirmation costs
    one dialog.

## 9. Not verified

- How `configChangeRows` writes the admin audit rows from the full config
  before and after a save, and whether a row can hold a key
  (`server/index.ts:1225-1230`).
- `redactSecretsInText` (`server/redact.ts`). Part 11 of the README covers
  redaction.
- Whether each place that starts a child process calls
  `stripWorkspaceCredentialEnv`. Only the function and eight callers were
  read.
- The `dispose` of the Claude and Codex instances. That a running CLI child
  stops on a reload comes from a comment (`server/index.ts:11842`) only.
- How Electron `safeStorage` behaves on Linux without a secret store. The
  code for `credentials.bin` has no check for the `basic_text` backend.
- Whether a crash record of the desktop can hold a key
  (`formatDesktopCrashRecord`).
- The companion process of a paired phone: whether it can call
  `/api/config`.
- The tool that lets a bot change settings (`routeBackedRegistry`,
  `server/index.ts:12249`) passes the config routes to a bot turn. Part 61
  covers it.
- The exact text in the window when the server is offline.
- The text of the `keys.purpose.*` strings.
- No test was run. All test facts come from reading the test files.
