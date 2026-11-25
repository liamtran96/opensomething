# App settings: the `app_settings` bot tool

Feature row `app-settings.md` of [`../reference-features.md`](../reference-features.md),
group 3, parts 13 and 61 of [`../README.md`](../README.md). Step 12 of
[`../../plan/README.md`](../../plan/README.md). Crates: `bot-engine` (the
tool), `bot-core` (the settings and the Undo record) and `bot-desktop` (the
window preferences and the cards).

Read on 2026-11-26 at commit `96ff84455` of the reference project. HEAD of
the clone was that commit, so the readers read the working tree. All paths
are in the reference project unless a line says "ours". The `enterprise/`
directory was not opened. Six subagents read six groups of files. The main
session checked 16 key claims against the code (section 9 lists what is not
checked).

In quoted text from the reference, `<product>` replaces the product name of
the reference.

## What this file adds to earlier research

- [`agent-tools.md`](agent-tools.md) has the tool bridge, the catalog, the
  profiles and the 128-tool limit. This file does not repeat them. It adds
  only how `app_settings` is registered: a core tool in every profile, and
  its size (section 3.10).
- [`write-only-secrets.md`](write-only-secrets.md) has the secure card and
  the store of keys. Its section 9 left "the tool that lets a bot change
  settings" open for part 61. This file adds how a `set` on a key opens that
  card. It also adds one path where the server copies a saved key into a
  new engine that a bot asks for (section 3.6).
- [`approval-levels.md`](approval-levels.md) and
  [`approval-cards.md`](approval-cards.md) have the levels, the cards and
  the decision log. This file adds that `app_settings` does not use the
  approval level at all. Each change applies at once with a card that is
  already answered, and the gate is "the owner's own turn" (section 3.4).
- [`newer-config-unavailable.md`](newer-config-unavailable.md) has how the
  config file is saved. This file adds what that save means for a settings
  change after a config that did not load (section 8, problem P2).

## 1. In short

A bot of the reference project can find, read and change the settings of
the application from the chat. The person says "make it dark" or "use
another model for Clive", and the bot calls one tool, `app_settings`. The
change applies at once. A one-line card in the chat says what changed and
has an Undo button. Keys never pass through the bot: a `set` on a key opens
the secure card, and the person types the key there. Settings that can lock
the person out or that delete data are "owner-only": the bot only tells the
person where they are in Settings.

The special terms of this file:

- **Setting entry**: one row of the registry. It has an id (for example
  `rooms.turnTimeoutMinutes`), a label, a help text, a place in Settings,
  synonyms for search, a tier and functions to read and write the value
  (`server/app-settings/registry.ts:28-68`).
- **Registry**: the list of all setting entries that the tool can reach
  (`createSettingsRegistry`, `registry.ts:149-347`).
- **Tier**: the policy of one entry. There are three tiers
  (`packages/phone-protocol/src/app-settings.ts:5`). The file calls the tier
  "the whole policy" (`:1`).
  - `safe`: a `set` applies at once, with Undo.
  - `secret`: a key. A `set` never takes a value. It opens the secure card.
  - `owner-only`: the bot can read it. A `set` is refused with one line that
    names where in Settings the person changes it.
- **Place**: a named page or row of the Settings window, for example
  "Settings → AI → Providers". The tool names only places that exist in the
  index of the Settings window (`server/app-settings/places.ts:1-5`).
- **Applied card**: the chat message that a change makes. It is an approval
  card that is already answered "allow" and marked `autoApplied`. The window
  draws it as one line with an Undo button
  (`packages/phone-protocol/src/wire.ts:683-686`).
- **Undo record**: what the server keeps to undo one change: the entry, the
  value before and a tag of the value after (`server/app-settings/host.ts:52-56`).
- **Owner's own turn**: a turn that started from a message of the owner of
  the server (or from a routine that the owner wrote). Only such a turn can
  change a setting (`host.ts:96-97`, `:163-164`).
- **Turn generation**: the id of one turn of a thread. The write budget
  counts per generation (`host.ts:99-104`).
- **Settings card**: a different card. It puts the real control of the
  Settings window in the chat, for example the switch "Your other
  computers". The person works it. The bot never sees what it shows
  (`packages/phone-protocol/src/app-settings.ts:25-29`).
- **Window preference**: a setting that lives in the window (its
  localStorage) or in the desktop shell, not in the config file of the
  server. Examples: the skin, the font, "open at login". The server reaches
  it through an event to the window (`app-settings.ts:54-55`, `:89-93`).
- **Way in**: a route from another device to this computer: Wi-Fi, the
  relay or Tailscale (`server/app-settings/registry-window.ts:11-14`).

History: the release v0.1.158 (2026-11-14) added "Bots change settings, with
Undo" ([`../changelog.md`](../changelog.md), row v0.1.158). The design spec
is dated 2026-11-12. A rework on 2026-11-13 removed the planned `confirm`
tier and its Change and Cancel card. The reason in the spec: "on the
owner's rule of no new asks, cards or confirm steps at Full access"
(`docs/superpowers/specs/2026-11-12-app-settings-tool-design.md:5-12`).

## 2. Files read completely

The six reports are in `.research/` of this worktree (not in git). Line
counts are from `wc -l`.

**Group A, the tool core:**
`server/app-settings/host.ts` (298), `server/app-settings/registry.ts`
(402), `server/app-settings/cards.ts` (53), `server/app-settings/places.ts`
(35), `shared/app-settings.ts` (1, a re-export),
`packages/phone-protocol/src/app-settings.ts` (96), `server/direct-apply.ts`
(32).

**Group B, the registries:**
`server/app-settings/registry-bots.ts` (307),
`server/app-settings/registry-config.ts` (210),
`server/app-settings/registry-pictures.ts` (65),
`server/app-settings/registry-window.ts` (60),
`server/app-settings/picture-file.ts` (73), `server/themes/tool.ts` (265).

**Group C, the wiring, the routes, the approval and the secrets:**
complete: `server/drivers/agents-app-settings-tool.ts` (27),
`server/routes/app-settings.ts` (51), `server/host/setting-nudges.ts` (76),
`server/host/engine-hints.ts` (120), `server/drivers/agents-tool-groups.ts`
(53). Ranges: `server/drivers/agents-call.ts` (996) 1-222, 940-996.
`server/drivers/agents-catalog.ts` (886) 1-60, 790-886.
`server/index.ts` (15258) 594-596, 601, 608, 639, 2765, 8312, 9073,
9257-9332, 12180-12183, 12231, 12690-12800, 14040-14110.
`server/host/secret-cards.ts` (692) 101-108, 172-190, 241-246, 391-424,
480-578. `server/surface.ts` (363) 200-240. `server/activity.ts` (361)
70-100. `server/decision-log.ts` (275) 20-75. `server/replies.ts` (210)
1-60. `server/user-errors.ts` (269) 140-155.
`server/bot-link/far-side.test.ts` (230) 155-200. the `app_settings` rows of
`server/drivers/agents-catalog-goldens/profiles.json` (2039) and
`full.tools-list.json` (2549) 2470-2549, both parsed whole as JSON. Extra
ranges for the call path: `server/drivers/agents-client.ts` 8-56,
`server/host/outside-fence.ts` 1-100, `server/bot-link/far-side.ts` 70-78,
`server/host/phones.ts` 60-125, `server/routes/undo.ts` (23) complete.

**Group D, the UI, the wire and the desktop:**
complete: `src/components/SettingsCard.tsx` (29),
`src/components/RichMessageRow.tsx` (74), `src/lib/window-prefs.ts` (125),
`src/lib/window-pref-changes.ts` (17), `src/components/ApprovalCard.tsx`
(598), `electron/desktop-prefs.mjs` (237). Ranges:
`packages/phone-protocol/src/wire.ts` (1000) 15-30, 455-485, 600-700, 993.
`electron/preload.cjs` (820) 68-130, 166-260, 348-365, 455-470, 760-820.
`src/state/store.tsx` (3260) 55, 75-125, 3120-3175.
`src/components/SecretRequestCard.tsx` (311) 50-60, 140-200.
`src/components/AppSettingsRows.tsx` (423) 1-40 and a search for shared
setters. `src/locales/en.json` (12062) the keys of the cards. small ranges
of `electron/talk-main.mjs`, `open-at-login.mjs`, `place-look.mjs`,
`chrome-rail.mjs`, `updates-consent.mjs`, `src/lib/place-look.ts` and
`src/lib/approval-summary.ts`.

**Group E, the server tests:**
`server/app-settings/host.test.ts` (831), `cards.test.ts` (142),
`picture-file.test.ts` (99), `places.test.ts` (93),
`server/routes/app-settings.test.ts` (43),
`server/app-settings.e2e.test.ts` (371), `server/direct-apply.test.ts`
(30), and the `app_settings` block of `server/drivers/agents-call.test.ts`
(780) 1-22, 248-265.

**Group F, the documents and the other tests:**
`docs/superpowers/specs/2026-11-12-app-settings-tool-design.md` (253),
`docs/verification/app-settings.md` (68), `server/themes/tool.test.ts`
(275), `server/themes.tool.e2e.test.ts` (123),
`server/host/setting-nudges.test.ts` (120),
`src/components/SettingsCard.dom.test.ts` (98),
`src/lib/window-prefs.test.ts` (57). The screenshot
`docs/screenshots/app-settings.png` is named only.

**Checked by the main session:** `host.ts:18-21`, `:86-104`, `:116-149`,
`:160-172`, `:259-277`. `registry.ts:114-122`, `:130-161`, `:247-263`,
`:311-346`, `:365-386`. `registry-bots.ts:10-17`, `:84-100`, `:196-212`.
`registry-window.ts:9-14`. `agents-tool-groups.ts:26-37`.
`routes/app-settings.ts:28-49`. `electron/desktop-prefs.mjs:88-99`.
`src/lib/window-prefs.ts:100-104`. `ApprovalCard.tsx:162-165`.
`server/config.ts:884-904`. `server/index.ts:9280-9332`, `:12178-12184`.
The spec `:5-12`. From the tests: `host.test.ts:452-456`, `:479-487`,
`app-settings.e2e.test.ts:141-148`. `shared/settings-places.ts:1-12`.

## 3. How it works

### 3.1 The parts

| Part | File | Job |
|---|---|---|
| Tool schema | `server/drivers/agents-app-settings-tool.ts` | The schema that a model sees. "The tiers and every guard live in server/app-settings/" (`:1-2`) |
| Proxy branch | `server/drivers/agents-call.ts:963-967` | Sends the arguments to the server, returns the text |
| Internal route | `server/routes/app-settings.ts:9-18` | `POST /api/internal/app-settings`, inside the internal capability gate |
| Host | `server/app-settings/host.ts` | The actions, the guards, the write budget, the applied card, the Undo records |
| Registry | `registry.ts`, `registry-bots.ts`, `registry-config.ts`, `registry-pictures.ts`, `registry-window.ts` | The setting entries |
| Pictures | `server/app-settings/picture-file.ts` | Copies a picture file of the bot into the attachment store |
| Themes | `server/themes/tool.ts` | Five theme actions of the same tool |
| Places | `server/app-settings/places.ts` | Search in the index of the Settings window |
| Settings cards | `server/app-settings/cards.ts`, `src/components/SettingsCard.tsx` | `show_card` |
| Window preferences | `server/routes/app-settings.ts:23-51`, `src/lib/window-prefs.ts` | The server side and the window side |
| Undo | `server/routes/undo.ts`, `server/index.ts:9283-9332`, `host.ts:259-277` | The Undo button |
| Applied card UI | `src/components/ApprovalCard.tsx:162-164`, `:270-341` | The one-line card with Undo |

All parts are made in one long line of the composition root
(`server/index.ts:12231`). The registry is `routeBackedRegistry` with the
route handlers that the Settings window uses: config, bot order, bot patch,
sidebar sections, instances, starter awake and skills. The host gets
`turnOwner` and `ownerRefusal` from `phones`, `guestDriven`, `automated`,
`requestCredential` from the secret cards, and `pictures`.

### 3.2 A call, from the engine to the host

1. The engine calls the MCP tool `app_settings` of the `agents` server (see
   [`agent-tools.md`](agent-tools.md)).
2. The proxy checks the arguments against the full schema, with its
   `maxLength` limits (`agents-call.ts:216-222`).
3. The proxy sends `POST /api/internal/app-settings` with the raw
   arguments only, and the bearer token of the turn
   (`agents-call.ts:964`, `agents-client.ts:42`). The body has no bot id
   and no thread id.
4. The internal gate finds the capability of the token. No capability:
   401 `unauthorized` (`server/index.ts:12726-12729`). The capability holds
   the bot, the thread, the generation (the turn), the depth and the grants.
5. The gate applies the fences (`index.ts:12737-12738`):
   - A turn that "came in from outside" (guest-driven): the route is not on
     the allow list of `server/host/outside-fence.ts`. The gate refuses it
     with "This work came in from outside, so it can't do that here.
     ..." (`outside-fence.ts:75`).
   - A bot-API thread, a read-and-draft turn and a linked bot are also
     refused.
6. The gate refuses a query or body that names another bot or thread:
   "the internal capability belongs to a different bot"
   (`index.ts:12759-12769`).
7. After the body is read, a turn that ended gets `TURN_ENDED_REFUSAL`
   (`index.ts:12770-12779`).
8. The route calls `appSettings.handle(body, internalCapability)`
   (`index.ts:14098-14100`). The whole capability is the `turn` of the host.
   So the bot, the thread and the turn come from the token, never from the
   arguments.
9. The proxy returns `{ text }` on success, or `{ text: error, isError:
   true }` (`agents-call.ts:965-966`). All words come from the host.

### 3.3 The actions

The action list is in the schema (`agents-app-settings-tool.ts:14`):
`find`, `get`, `set`, `show_card`, `places`, `theme`, `set_theme`,
`add_theme_asset`, `theme_history`, `undo_theme`. There is no `list` action
and no `undo` action. Undo is the button on the card (section 3.7).

1. **`find`** (`host.ts:235-241`): a search by words over the id, the
   label, the synonyms and the help (`registry.ts:349-362`). It returns up
   to 8 entries (`FIND_LIMIT`, `host.ts:21`) as JSON: `id`, `label`,
   `tier`, `value`, `where`. With no match, it searches the places and says
   `No setting you can change matches "<words>". Where the person finds it
   in the app: <places>` (`host.test.ts:135`).
2. **`places`** (`host.ts:242-246`): up to 6 places for the words
   (`places.ts:20-30`), or the full list. "name a menu only as find or
   places gives it, never a guessed one" (the tool description).
3. **`get`** (`host.ts:247-252`): one entry with its help, its allowed
   values and a `change` line by tier: "set applies at once, with Undo on
   the card", "set with no value opens a secure card", or "only the person,
   in <place>". Unknown id: 404 "No setting with id X. Use action find
   first."
4. **`set`**: section 3.4.
5. **`show_card`**: section 3.8.
6. **The theme actions**: section 3.9.
7. Any other action: 400 with the list of actions (`host.ts:256`).

`find`, `places` and `get` work in any turn that the internal gate admits.
They do not check the owner (`host.ts:235-252`). The refusal of a `set`
says "you may still read settings" (`host.ts:164`).

### 3.4 `set`: the guards, in order

`host.ts:157-188`:

1. Find the entry. None: 404 "No setting with id ... Use action find
   first."
2. The bot must exist: 404 "This bot no longer exists."
3. Tier `owner-only`: 403 `<label> is changed only by the person, in
   <place>. Tell them where in one line; do not try another way.`
   (`registry.ts:114`). This refusal comes before the owner check, so it
   holds in every turn.
4. Not the owner's own turn: 403 "Settings change only in the owner's own
   conversation. Nothing changed; you may still read settings." and a
   reason (`host.ts:163-164`). The reason comes from `whyNotOwners`
   (`host.ts:284-298`):
   - `shared`: "Several people share this server, so bots never change its
     settings."
   - `service`: the server is set up as a shared or hosted server.
   - `guest`: "A guest writes in this conversation".
   - `someone-else`: asking again here does not work. The person must start
     a new conversation that only they write in.
   - `not-owner`: the turn was started by a routine, webhook or app that the
     owner did not write.
   - `memory-changed`: the memory of the bot changed in a conversation that
     the owner did not write: "tap Mark reviewed and ask again".
   - `unproven` and `unknown`: the turn "can't be tied to a message the
     owner sent here".
5. Tier `secret`: section 3.6.
6. Parse the value (`host.ts:33-43`, `:174-175`). The schema of the entry
   (zod) reads the value. If that fails and the value is text, the host
   reads it as JSON and tries again. So `"45"` becomes 45. Failure: 400
   `<label> takes <allowed>. <issues>`.
7. A routine or automation turn may not set `bots.settings` with
   `computer: "local"`: 403 "A routine or automation can't keep a bot on
   this computer. Nothing changed ..." (`host.ts:176-178`). Other changes
   in such a turn are not refused by this step. The owner check of step 4
   refuses a routine that the owner did not write.
8. The `describe` function of the entry can refuse: 409 (`host.ts:179-180`).
9. Spend one write of the budget: 429 "This turn has already changed 10
   settings. Ask the user to send a new message before changing more."
   (`host.ts:99-104`, `:181-182`). The budget is 10 writes for each turn
   generation (`WRITE_BUDGET`, `host.ts:19`). The map keeps 200
   generations, and it removes the oldest (`host.ts:103`).
10. An entry that takes a file (a picture): copy the file first
    (section 3.11). Refusal: 400.
11. Apply (section 3.5). If the apply fails after a picture was copied, the
    copy is removed (`host.ts:186`).

The approval level of the bot is not read in this flow. The tests and the
spec say so:

- "every other setting applies at once with Undo, Full access or not"
  (`host.test.ts:452`).
- "No card waits on an answer, at every approval level" (spec `:71`).

`server/direct-apply.ts` states the same rule for the other tools that
change a bot: a change "applies at once at every level, with an Undo
notice" (`direct-apply.ts:1-5`). `app_settings` does not call its
functions. It imports only the text `UNDO_STALE` (`host.ts:8`).

### 3.5 Apply: the change, the card and the log

`host.ts:116-155`:

1. **Many bots in one call** (`writeBatch` and a value with `botIds`,
   `host.ts:121-129`): the entry writes each bot, skips a bot that refuses,
   and returns the change text, the values before and the skipped bots.
   If all bots refuse, the host gives back the write of the budget
   (`releaseWrite`, `:124`) and returns 409.
2. **One value** (`host.ts:130-135`):
   1. `before = await entry.current(value)`: the value that Undo writes
      back.
   2. `was = entry.read()`: the text for the card.
   3. `refusal = await entry.write(value)`. A refusal returns 409. This
      path does **not** give back the write of the budget (`:134`). The
      batch path does (`:124`). The spec says a refused set "does not spend
      it" (spec `:129-130`). The code differs.
3. `after` is `entry.undoTag(before)` when the entry has one, or else
   `entry.read()` (`host.ts:136-137`). Undo compares the value at that time
   with this tag.
4. A new `requestId` (a random UUID) (`host.ts:139`).
5. The host appends a bot message of kind `options` to the thread
   (`host.ts:143-147`):
   - `card.title` "Changed {label}", `card.subtitle` `<before> → <after>`
     (or "not set"), `options: []`, `requestId`, `tool: "app_settings"`,
     `fixedOptions: true`,
   - `appSettingRequest: { settingId, label, before?, after, tier }`,
   - `answered: "allow"`, `dismissed: true`, `autoApplied: true`.
   - In a group thread, the card has `from` (the id, name and colour of the
     bot) (`host.ts:98`).
6. `undoable.set(requestId, { entry, before, after })` (`host.ts:148`).
   This map is in memory (`host.ts:88`).
7. `appendDecision` writes a decision row: `summary "<id>: <before> →
   <after>"`, `decision: "auto-approved"`, `source: "app-settings"`
   (`host.ts:149`).
8. The reply is 200 "Changed X from A to B." or "Done: <change>. X now:
   Y.", a note of skipped bots, and "The user can undo it from the card in
   the conversation." (`host.ts:150-154`).

The value in the card is display text only, "never a key"
(`app-settings.ts:7`). A test checks that a key is in no reply, message or
decision row (`host.test.ts:335`, `:361-362`).

### 3.6 A secret: the secure card

`host.ts:165-172`:

1. A `set` on a secret entry with a value: 400 "Never send a key or token
   as a value. Call set on <id> with no value: a secure card asks the user
   for it, and you never see it."
2. Spend one write of the budget (429 if none is left).
3. Call `deps.requestCredential(bot, threadId, { credentialId, reason })`.
   This is the same function as the tool `request_credential`
   (`server/index.ts:12231`, `server/host/secret-cards.ts:531-576`). See
   [`write-only-secrets.md`](write-only-secrets.md). For this path:
   - The secret entries are made from `CREDENTIAL_TARGETS`, with the id
     `keys.<credentialId>` (`registry.ts:265-272`). The spec counts 19
     (spec `:122`).
   - `reason` is cut to 240 characters (`secret-cards.ts:546`). The schema
     has the same limit.
   - The card is a `kind: "secret"` message with a named target, not the
     custom secret card (`src/components/SecretRequestCard.tsx:52`). The
     window saves the key in the desktop store or through the config route
     (`SecretRequestCard.tsx:147-181`).
4. The key is already set: 200 `<label> is already set. To replace it, the
   user changes it in <place>.`
5. The card could not be posted: the status and the error, or "The secure
   card could not be shown."
6. Else 200: `A secure card for <label> is ready in <product>. End this
   turn now and say in one line that you are waiting for it; <product>
   resumes you when the user saves it or declines. You never see the key.`
7. The person saves or declines. The secret cards resume the turn
   (`secret-cards.ts:409-423`).

Other guards for keys:

- `withoutKeys` refuses any value with a field name that matches
  `/key|token|secret|password/i` (`registry.ts:116-122`): "Never put a key
  or token in the value. Save it first with set on keys.<id> (a secure card
  asks the user), then name that id in keyFrom."
- The read of a secret entry is "set" or empty (`registry.ts:270`).
- The read of a config section removes the fields with such names, at all
  depths (`registry-config.ts:15-18`).

**A saved key goes to an address that the bot gives.** To add an
OpenAI-compatible engine, the bot sends a `url` (free text, 1 to 512
characters) and `keyFrom`, the name of a saved provider key
(`registry.ts:133`, `:138`). The server reads the saved key and gives it to
the new engine (`registry.ts:313-315`). The bot never sees the key
(`host.test.ts:331-335`). But the engine sends that key to the address of
the bot. The e2e test shows the key in the config of the new instance
(`server/app-settings.e2e.test.ts:143-145`). The comment at
`registry.ts:134-135` still says the server reads the key "at the moment
the owner taps Change". That tap was removed on 2026-11-13 (spec `:5-6`).

### 3.7 Undo

The button calls `POST /api/threads/:id/undo` with `{ requestId }`
(`ApprovalCard.tsx:274`, `server/routes/undo.ts:13-21`).

1. No `requestId`: 400 "requestId is required".
2. The route checks the right to tap the button with
   `cardAnswerRefusal(auth, threadId, requestId, "allow")`: the same check
   as an answer to that card (`index.ts:12181`). Refusal: 403.
3. `undoAppliedChange` finds the message with that `requestId`. None: 404
   "this change is no longer in the conversation"
   (`index.ts:9286`). The bot comes from the conversation, "never from the
   card payload" (`:9287`).
4. A card with `appSettingRequest` goes to `appSettings.undo`
   (`index.ts:9321`), which does these steps (`host.ts:259-277`):
   1. The card is already undone: `already_undone`.
   2. No Undo record in memory, or the card is not "allow": 409 "This
      change can't be undone here." (`:265-266`).
   3. The value now differs from the stored `after` tag: 409 `UNDO_STALE`,
      "Changed since, so it can't be undone here."
      (`:267-268`, `direct-apply.ts:15`).
   4. `before` is undefined: "The earlier value is not one that can be set
      back."
   5. Write `before`. A refusal: the host updates the stored `after` to the
      value now, so that a retry compares with the new value, and returns
      409 (`:270-273`).
   6. Success: remove the record, and patch the card with `undone: true`
      (`:274-275`).
5. Not claimed: 409 "Only a change that applied on its own can be undone
   here." (`index.ts:9322`).
6. Stale: the reply has the code `changed-since` (`index.ts:9324`).
7. Success: a decision row `decision: "user-undone", source: "user"`
   (`index.ts:9329`), and 200 `{ ok: true, undone: true }`.

Edge cases:

- **A restart.** The Undo records are in a `Map` in memory (`host.ts:88`).
  The card stays in the stored thread, and the window still draws its Undo
  button (`ApprovalCard.tsx:164`). After a restart, a tap gets "Couldn't
  undo: This change can't be undone here." The spec knows this: "After a
  server restart an older applied card's Undo answers 'This change can't be
  undone here.'" (spec `:116-118`). No test covers it.
- **Many bots.** The Undo of a batch writes each bot back. A bot that
  refuses stays in the list, and the list is changed in place, so a retry
  writes only the rest (`registry-bots.ts:174-188`). The reply is
  `invalid` with the refusal of that bot (`host.test.ts:789-803`).
- **Stale per field.** For `bots.settings`, the tag holds only the fields
  that the change touched, so a change of another field does not block
  Undo (`registry-bots.ts:286-303`, `host.test.ts:769-787`).
- **Archive.** Archiving a Chief of Staff also clears `chiefOfStaff`
  (`registry-bots.ts:253`). The Undo restores only `archived`
  (`:252`), so the bot is no longer Chief of Staff after the Undo.
- **Approval mode.** The Undo of a bot that put itself on Ask puts it back
  on Full access with no question (`app-settings.e2e.test.ts:207-215`).
  That is the tap of a person, so it is correct.
- **First change.** A setting that was never saved reads as the default,
  so the Undo of its first change writes the default
  (`host.test.ts:225-237`).

### 3.8 `show_card`: a real control in the chat

`host.ts:216-231`, `server/app-settings/cards.ts`:

1. Only two cards exist: `other-computers` and `ai-sign-in`
   (`app-settings.ts:22`). Another id: 404 "No settings card X. Cards:
   other-computers, ai-sign-in." The test tries `__proto__` and
   `constructor` too (`cards.test.ts:49-57`).
2. The bot must exist, and the turn must be the owner's own: 403 "A
   settings card shows only in the owner's own conversation, when they
   asked. Nothing was shown."
3. The card is not on this computer (a Cloud, a server with no desktop
   app): 200 `No card shown: <label> is set in the <product> desktop app on
   the computer itself, in <where>.` (`cards.ts:51-53`).
4. In a room: 200 "No card shown: a settings control is not drawn in a
   room." (`cards.ts:47-49`).
5. Spend one write of the budget (`host.ts:227`).
6. Append a `kind: "text"` message with the fixed text of the card and
   `settingsCard: { id }` (`host.ts:229`).
7. Reply with a fixed status (`cards.ts:41-44`): "Card shown: <label>.",
   then "on" or "not known", never "off", and "Only the user can change it;
   you cannot, and you never see what the card shows."

The security rule: "what the control shows (code, link, address) is read
by the window and never stored or sent to a bot" (`app-settings.ts:25-26`).
A test checks that the reply, the row and the transcript of the engine have
no address, link or pairing code (`cards.test.ts:91-98`). The replay of the
row to the engine is a fixed block of records of the app
(`server/replies.ts:34-38`, `cards.test.ts:102-105`).

### 3.9 The theme actions

`server/themes/tool.ts`. A theme belongs to the person who started the
turn, not to the bot (`:1-3`, `:25-26`). With no such person, the actions
are refused with 403 (`host.ts:205-206`).

1. `theme`: the current theme, the built-in skins, the saved themes and a
   guide to write a theme (`tool.ts:90-103`). No write.
2. `set_theme`: save a theme from JSON and wear it, or wear a built-in skin,
   or `none` to go back to the default (`tool.ts:106-131`). The CSS may not
   load anything from the internet (`tool.test.ts:103-106`). It goes
   through `apply`, so it has the applied card and Undo, and it spends the
   budget (`host.ts:211-213`).
3. `add_theme_asset`: copy a picture from the bot's folders or from an
   attachment of this conversation into a theme (`tool.ts:216-260`). It has
   no card and no Undo. A HEIC photo is refused with a hint to convert it.
   The limit is 10 MB (`tool.test.ts:272-273`).
4. `theme_history`: the look changes, newest first (`tool.ts:133-139`).
5. `undo_theme`: go back by `steps` or to an `index` of the history
   (`tool.ts:142-157`). It writes a new change with an applied card.

The theme store is on disk (`createThemeStore({ dataDir })`,
`tool.test.ts:47`). So `undo_theme` works after a restart, but the Undo
button of a theme card does not (it uses the same memory map).

### 3.10 How the tool is registered, and its size

- `APP_SETTINGS_TOOL_DEFINITION` is the last entry of `TOOL_DEFINITIONS`
  (`agents-catalog.ts:12`, `:804`).
- It is in `CORE_TOOLS`: "What every bot keeps" (`agents-tool-groups.ts:27-36`).
  No tool group that a person can turn off removes it.
- No filter of the catalog removes it: not the room filter, not the Chief
  filter (`agents-catalog.ts:814-886`). It is in all 33 golden profiles
  (`profiles.json`).
- Its size in the golden file: 2,387 characters as compact JSON (the
  description is 1,074, the schema 1,258). That is about 3.2% of the full
  list of 68 tools (74,752 characters). Only `trigger` (5,609) is larger,
  and `coordinate_bots` has the same size (`full.tools-list.json:2479-2547`).
- The advertised schema drops the `maxLength` of `query` (200), `value`
  (4,000), `reason` (240), `theme` (120,000) and `path` (1,024). Only `id`
  keeps `maxLength: 80`. The proxy still checks all limits on a call
  (`agents-call.ts:219`, `agents-catalog.ts:850-855`).
- The schema has no bot id and no thread id. A per-bot setting names its
  bot inside `value`.
- The spec planned "one tool with a short schema" with three actions
  (spec `:32`, `:79-86`). It grew to 10 actions.

Two hints of the server tell a bot to use the tool:

- After two failed turns of the AI in a conversation, the turn gets a note:
  "offer to switch you to another model; if they agree, choose one with
  list_models and change it with app_settings set bots.model." Only in the
  owner's turn. Else the note says the owner can switch it
  (`server/host/setting-nudges.ts:34-38`). Its state is a file in the data
  folder, written atomically (`:41-51`).
- When a person keeps a bot on "This computer", the bot is told to set
  `bots.settings` `computer: "local"` for itself (`server/surface.ts:224-226`).

### 3.11 Pictures

`bots.picture` (`{ botId, path }`) and `profile.photo` (`{ path }`) take a
file (`registry-pictures.ts:28-62`). `picture-file.ts:46-67`:

1. Open the file with `openMessageFile` in the bot's working folder, its
   workspace or the attachment store, with "no link at the end" and a size
   limit (`:43-49`).
2. Refusals: not found (404 text), outside the folders ("is outside your
   workspace, your working folder and this conversation's files"), more
   than 5 MB ("That file is over 5 MB. Use a smaller picture.") (`:33-39`).
3. A file in the attachment store must belong to this conversation
   (`:54-55`).
4. The type comes from the bytes, never from the name. Only PNG, JPEG, GIF
   and WebP (`:56-58`). An SVG with a script is refused
   (`picture-file.test.ts:58`).
5. The file is copied into the attachment store, and the value becomes an
   `avatarUrl` (`:59-63`).
6. An empty path takes the picture off (the mascot face) (`registry-pictures.ts:20`, `:48`).

The old picture file is not deleted on a replace or an Undo.

The spec makes `profile.photo` owner-only (spec `:10`). The code makes it
`safe` (`registry-pictures.ts:55`), and the tests set it
(`host.test.ts:421`, verification `:36-43`).

### 3.12 Window preferences

26 preferences live in the window or in the desktop shell, not in the
config file (`app-settings.ts:56-83`): the skin, the font, the chat width,
the send key, the sounds, bubbles, threads, the tools layout, pinned
circles and pages, the computers rail, the window frame, the sidebar
colour, follow-up, notifications, analytics, "open at login", the talk
shortcut, product emails, and the ways in (Wi-Fi, relay, Tailscale, keep
awake).

1. The window reports the values that it can read with `PUT
   /api/window-prefs` `{ values }`, 200 ms after a change
   (`src/lib/window-prefs.ts:106-123`). Only the owner or an admin may
   report: else 403 "Only the owner's window reports its preferences."
   (`server/routes/app-settings.ts:32`). Unknown ids and bad values are
   dropped (`:35-37`).
2. The server keeps the reported values in a map in memory (`:29`). A
   `read` of the entry is that map.
3. A `set` calls `write(id, value)` (`:43-49`):
   1. No window of the owner holds the event stream: "Open <product> on
      this computer first; this setting lives in the app window."
   2. The window never reported that id (for example, a browser with no
      desktop bridge): "The open <product> window can't change this here.
      It is changed in <product>'s desktop app on this computer."
   3. Else the server **first stores the new value**, then sends the event
      `{ kind: "window-pref", id, value }` to admin windows, and returns
      success.
4. The window checks the value against the same schema and calls the
   setter of that preference (`window-prefs.ts:100-104`). A bad value, a
   refused bridge call or an error is ignored with no message. Then the
   window reports again.

So the bot can be told "Changed" while the window did not change. The spec
names this gap: a bridge that refuses "leaves the old value in the next
report while the bot was told it changed" (spec `:250-252`). After a server
restart the map is empty, and a `set` is refused until the window reports
again.

On the desktop, the preload gates some setters with "a local page or a
click of the person" (`electron/preload.cjs:178-181`, `:226-227`,
`:253-257`, `:459-462`). The event of a bot has no click. On the app's own
page the gate passes, so the bot can change the window frame, the rail, the
place colour and "open at login". On a page of another server it fails.

A **way in** can be turned on by a bot, but only the person can turn it
off: "turning it off can cut off the device the person is using now"
(`registry-window.ts:11-14`, `host.test.ts:379-390`).

### 3.13 Limits

| Limit | Value | Source |
|---|---|---|
| Writes for each turn | 10 (a `set`, a secret card, a `show_card`, a theme write. A batch counts as 1) | `host.ts:19`, `host.test.ts:599-627` |
| Turns kept in the budget map | 200 | `host.ts:103` |
| `find` results | 8 | `host.ts:21` |
| `places` results | 6 | `places.ts:20` |
| `query`, `id`, `value`, `reason` | 200, 80, 4,000, 240 characters | `agents-app-settings-tool.ts:15-23` |
| `theme`, `path` | 120,000, 1,024 characters | same |
| Bots in one batch | 1 to 200, or `"all"` | `registry-bots.ts:13` |
| Bot instructions (`soul`) | 4,000 characters | `registry-bots.ts:39` |
| Picture file | 5 MB, PNG, JPEG, GIF, WebP | `picture-file.ts:11-12` |
| Theme file | 10 MB | `tool.test.ts:272-273` |
| Pinned web pages | 6, http(s) only, 2,048 characters | `app-settings.ts:52`, `:68` |
| Engine models | 64 | `registry.ts:138` |
| Provider address | http(s), 2,048 characters, or empty | `registry.ts:101` |

## 4. The data

**The tier and the entry** (`registry.ts:28-68`):

```ts
type SettingTier = "safe" | "secret" | "owner-only";
Base     = { id, label, help, where: SettingsPlaceId, synonyms, read(): string };
Writable = { tier: "safe", value: zod, allowed, fromFile?, current(value), write(value) -> refusal | null,
             writeBatch?, describe?, undoTag? };
Secret   = { tier: "secret", credentialId };
OwnerOnly = { tier: "owner-only" };
SettingEntry = Base & (Writable | Secret | OwnerOnly);
```

The spec says: "The tier is the whole policy. Handlers branch on the tier,
never on the id." (spec `:56`). One exception exists in the host: the guard
for `bots.settings` with `computer: "local"` (`host.ts:176-178`).

**The settings.** The registry joins nine lists in this order
(`registry.ts:346`): safe, providers, engines, bots, pictures, config,
window, secret, owner. `writable()` gives every entry of the first seven
lists the tier `safe` (`registry.ts:153`).

| Group | Ids (examples) | Tier | Written through |
|---|---|---|---|
| App (`registry.ts:166-245`) | `appearance.skin`, `general.language`, `bots.order`, `bots.pinned`, `bots.groups`, `threads.maxConcurrentPerBot`, `threads.eventLogRetentionDays`, `rooms.turnTimeoutMinutes`, `mcp.callTimeoutMinutes`, `bots.defaultModel` | safe | config, bot order, sidebar routes, window |
| Providers (`:247-263`) | `providers.anthropic.url`, `providers.xai.url`, `providers.groq.url`, `providers.meta.url`, `providers.openaiCompat.url`, `providers.openaiCompat.model`, `voice.baseUrl` | safe | `PUT /api/config` |
| Engines (`:282-320`) | `engines`: add `ollama`, `lmstudio`, `openai-compat` (with `keyFrom`), `bedrock`. `remove` is refused as owner-only text | safe | instances routes |
| Bots (`registry-bots.ts:196-305`) | `bots.approvalModes`, `bots.name`, `bots.color`, `bots.model`, `bots.archived`, `sidebar.showHelper`, `bots.tools`, `bots.settings` (about 20 fields: title, description, instructions, computer, memory, voice, browser, connected apps and more) | safe | `PATCH /api/bots/:id` |
| Pictures (`registry-pictures.ts`) | `bots.picture`, `profile.photo` | safe | bot patch, config |
| Config (`registry-config.ts:45-208`) | `ai.backupModel`, `ai.routing`, `ai.images`, `profile.name`, `profile.email`, `profile.aboutMe`, `bots.everyBotRules`, `bots.newBotTemplate`, `bots.keepWarm`, `bots.skillAuthoring`, `threads.eventLogMaxBytes`, `desktops.browserProxy`, `desktops.privateDesktop`, `computer.sharing`, `desktops.browserProfiles`, `bots.awake`, `skills.library`, `bots.skills` (about 25) | safe | `PUT /api/config` and other routes |
| Window (`registry-window.ts`) | 20 preferences, with `remote.wifi`, `remote.relay`, `remote.tailscale` (on only) | safe | window event |
| Secret (`registry.ts:265-272`) | `keys.<credentialId>` | secret | secure card |
| Owner (`registry.ts:322-344`) | `cloud.account`, `vault.logins`, `data.backups`, `phone.pairing`, `computer.lending`, `data.keepHere`, `appearance.sidebarPicture`, `account.organization`, `people.signIn`, `remote.domain`, `remote.httpsAddress` | owner-only | none |

Before the rework the spec counted 104 settings: 15 safe, 62 confirm, 19
secret and 8 owner-only (spec `:154`). Now the 62 are safe.

**How a per-bot setting names its bot** (`registry-bots.ts:12-17`):
`botId` (`/^[\w-]{1,120}$/`) or `botIds` (1 to 200 ids, or `"all"`), one of
the two. The file does not compare the target with the bot that calls
(`:85-100`). The host does not either (`host.ts:112-129`). So a bot can
change any bot, or all bots at once. The tests show a bot that renames
another bot and sets another bot to Full access (`host.test.ts:455-487`).

**The applied card on the wire** (`app-settings.ts:7-18`, `wire.ts:635-688`):

```ts
AppSettingRequest = { settingId, label, before?, after, tier };   // display values only, never a key
OptionCardData += { appSettingRequest?, autoApplied?, undone? };
WireMessage += { settingsCard?: { id: "other-computers" | "ai-sign-in" } };
WindowPrefFrame = { kind: "window-pref", id, value: unknown };
```

**The Undo record** (`host.ts:52-56`), in memory only:

```ts
Undoable = { entry, before /* what Undo writes */, after /* the tag of the value once applied */ };
```

**What is stored, and where:**

| Data | Where | After a restart |
|---|---|---|
| The applied card | the thread messages | kept |
| The Undo record | `Map` in `host.ts:88` | lost |
| The write budget | `Map` in `host.ts:89` | lost (a new turn starts at 0 anyway) |
| The decision rows | `appendDecision(dataDir, ...)` | kept |
| The window preference values that the server knows | `Map` in `routes/app-settings.ts:29` | lost until the window reports |
| The window preferences | the window's localStorage, or `desktop-prefs.json` of the shell | kept |
| The themes and their history | the theme store in the data folder | kept |
| The nudge state | `setting-nudges.json` | kept |

## 5. The UI

**The applied card** (`src/components/ApprovalCard.tsx`):

1. A card with `autoApplied`, `answered: "allow"` and not `held` is drawn
   as one line (`:462-465`).
2. The text is `"{name} changed {title}"`, with the title `<label>:
   <before> → <after>`, for example "Bob changed Font: inter → serif"
   (`:163-164`, `en.json:1135`). With no bot name: "Someone".
3. The icon is a green check, or an Undo icon when undone (`:288`). An
   undone card adds " · Undone" (`:294`).
4. The Undo button shows when the card is not undone and has a thread
   (`:296-305`). Its states are "Undo" and "Undoing…". The window always
   allows Undo for a settings card (`canUndo: true`, `:164`). It does not
   know if the server still has the record.
5. "Details" and "Hide details" show the subtitle in a block with the label
   "What changed" (`:316-340`).
6. An error shows in a line with `role="alert"` (`:331`): "Changed since, so
   it can't be undone here." for the code `changed-since`, else "Couldn't
   undo: {error}" (`:278-281`).
7. After a successful Undo the window changes nothing itself. The line
   changes when the patched message comes from the server.

**The secure card** for a key is the card of
[`write-only-secrets.md`](write-only-secrets.md). For a named key it shows
"Stored securely by {app} and never added to chat."
(`SecretRequestCard.tsx:293`). On a desktop that is paired to another
computer, a key that the other computer keeps "can only be typed there"
(`:53-55`).

**The settings card** (`src/components/SettingsCard.tsx`):

1. A message with `settingsCard` is drawn as a widget (`RichMessageRow.tsx:16`, `:26-27`).
2. An unknown id: the English text of the row (`SettingsCard.tsx:20-29`).
3. Not on this computer: one line, "This is set on the computer itself: open
   <product> there, then Settings → Devices → Private network → Your other
   computers." (`en.json:8120`).
4. Else the real control of the Settings window, in its "simple" look. Its
   state is read live each time (`SettingsCard.dom.test.ts:77-82`).

**The window preferences** have no UI of their own. The Settings window and
the tool call the same setters (`src/components/AppSettingsRows.tsx:219-328`,
`src/lib/window-prefs.ts:41-50`). The tool and the Settings window share
two more things:

- On the server side, the tool calls the route handlers of the Settings
  window (section 3.1).
- The places come from `shared/settings-places.ts` (112 lines). A script
  makes that file "from Settings' own index and the English catalog"
  (`shared/settings-places.ts:1`, `scripts/gen-settings-places.ts`). So a
  place that the tool names is a page of the window. Only the first 12
  lines of the file were read.

The screenshot of the feature is `docs/screenshots/app-settings.png`.

## 6. The tests

| File | What it proves |
|---|---|
| `server/app-settings/host.test.ts` | Reads in any turn. A non-owner and a guest are refused, with each reason text (`:144-178`). A value as text is parsed (`:192`). Apply, card, decision row (`:201-209`). Stale Undo, then Undo, then `already_undone` (`:212-222`). Undo of a first change writes the default (`:225`). The budget per generation (`:276-283`). Engines: add, a duplicate, `keyFrom`, a missing key, remove refused (`:287-345`). The secret tier (`:348-363`). Owner-only (`:367`). A way in: on with Undo, off refused (`:379-390`). Pictures (`:396-450`). Every setting applies at once "Full access or not", with approval mode of another bot (`:452-487`). Key fields refused (`:501`). Browser profiles, proxy, skills (`:527-597`). Batches over 12 bots, partial failure, per-field staleness, partial Undo (`:599-803`) |
| `server/app-settings/cards.test.ts` | Only two cards. No secret text in the reply, the row or the transcript. Never "off". Not in a room. Not off the desktop. Owner only. The budget. The schema enum matches the card ids |
| `server/app-settings/picture-file.test.ts` | Type by bytes. HTML and SVG refused. Outside, `..` and a symlink refused. An attachment of another conversation refused. 5 MB |
| `server/app-settings/places.test.ts` | The paths of places. A lint test over all source folders: a text "Settings → ..." must name a real place (`:75-91`) |
| `server/routes/app-settings.test.ts` | A phone may not report (403). Bad values dropped. No window: refused. A preference never reported: refused |
| `server/app-settings.e2e.test.ts` | A real server and the real proxy, a scripted engine, a bot on Full access. Safe, provider, engine add with `keyFrom`, secret, owner-only, rename, approval mode to Ask with Undo to Full, pictures, pins, window preferences with the stream open and closed, theme actions, a webhook run refused (`:356-369`) |
| `server/direct-apply.test.ts` | The rule of the other tools: a change applies at every level, and waits for the owner only in a Cloud turn the owner did not drive |
| `server/drivers/agents-call.test.ts:248-265` | The proxy sends the arguments unchanged and maps an error to `isError` |
| `server/themes/tool.test.ts`, `server/themes.tool.e2e.test.ts` | Themes per person, CSS with no internet, path and symlink checks, history and `undo_theme`, HEIC refused, a forged attachment tag cannot open `config.json` |
| `server/host/setting-nudges.test.ts` | The model nudge after 2 failures, once, owner only, state kept across a restart |
| `src/components/SettingsCard.dom.test.ts` | The person works the switch. Live state. The line when not on this computer |
| `src/lib/window-prefs.test.ts` | A frame calls the setter. A bad value is ignored. The report is debounced. A preference with no bridge is left out. A frame can turn on a way in (`:47-56`) |

Gaps: no test does Undo after a restart. No test sets a setting after a
config that did not load. The branch "the provider refused it" of the fake
`saveConfig` is not used (`host.test.ts:57`). No test checks who may tap
Undo. No test limits a bot to its own settings, because the code does not.
`far-side.test.ts:174-179` checks `PATCH /api/internal/app-settings`, but
the route takes `POST`. `POST` is refused too, by the outside fence.

## 7. Ours compared

Our crates have no settings code yet. `bot-core/src/lib.rs`,
`bot-engine/src/lib.rs` and the `bot-protocol` types of step 2 exist. The
settings file comes in step 6 (`settings.rs`, `atomic.rs`, a `Secret`
type), the Tauri commands for settings in step 7.6, the store in step 8,
the approval box in step 10 and our own MCP tools in step 12. The window
has a settings dialog with no tool behind it
(`crates/bot-desktop/ui/src/features/settings/`, ours). D10 says that the
core runs in the desktop process and that we have no HTTP server.

| Reference | What it does | Ours (crate, module) |
|---|---|---|
| `agents-app-settings-tool.ts`, `agents-call.ts:963-967` | The schema and the proxy branch | `bot-engine`, the tool module of step 12 (`tools/app_settings.rs`) |
| `index.ts:12723-12784`, `:14098-14100` | Bot, thread and turn from the token | `bot-core`, the turn record of P194 |
| `host.ts` | Guards, budget, apply, card, Undo | `bot-core`, `settings/tool.rs` (new). The runtime owns the Undo record |
| `registry*.ts` | The entries and the tiers | `bot-core`, `settings/registry.rs` (new), over `settings.rs` of step 6 |
| `registry.ts:365-402` | Writes through the HTTP routes of the window, as admin | `bot-core`: the same functions that the Tauri commands of step 7.6 call |
| `secret-cards.ts:531-576` | The secure card | `bot-core` and `bot-desktop`, step 7.6 and [`../../plan/write-only-secrets.md`](../../plan/write-only-secrets.md) |
| `routes/undo.ts`, `index.ts:9283-9332` | Undo | `bot-core`, the card answer path of step 10 |
| `routes/app-settings.ts:23-51`, `window-prefs.ts` | Window preferences | `bot-desktop`: a Tauri event to the window and an answer back |
| `ApprovalCard.tsx:270-341` | The applied line | `bot-desktop/ui/src/features/chat` |
| `SettingsCard.tsx` | The settings card | `bot-desktop/ui/src/features/chat`, later |
| `themes/tool.ts` | Themes | not planned (`docs/backgrounds.md` of ours has backgrounds only) |
| `places.ts`, `places.test.ts` | Real places only, with a lint test | `bot-core` and a test over the UI text |

## 8. Where we can be better

1. **Keep the Undo record in the store, in the transaction of the card.**
   The reference keeps it in memory (`host.ts:88`), and the window still
   shows Undo after a restart (`ApprovalCard.tsx:164`). Reason: a known
   problem ("state lost at a restart", 6 of 6 periods), and the rule of
   `AGENTS.md` that a state change writes the row and its event in one
   transaction. The `before` value is display-safe for most settings. For
   a key or an address, store a reference, not the value.
2. **Make a provider address and an engine with `keyFrom` owner-only.**
   A safe `providers.*.url` (`registry.ts:252-262`) sends the requests,
   with their key, to a new address. `keyFrom` gives a saved key to an
   address that the bot chooses (`registry.ts:133-138`, `:313-315`). The
   spec names this threat: a hijacked bot must not "point a provider at an
   attacker's URL" (spec `:33`). Reason: a known problem (a secret in the
   wrong place, 6 of 6 periods). The code does not do what the spec says.
3. **A bot changes only its own bot settings, and never an approval
   level.** The reference lets a bot change any bot, or all bots, with the
   approval mode to Full access (`registry-bots.ts:12-17`, `:85-100`,
   `:196-212`, `host.test.ts:479-487`). The spec names "raise its own
   permissions" as a threat (spec `:33`). Reason: a known problem (an
   access right in the wrong place) and the approval model that changed
   about 10 times. In our design the turn record knows the caller (P194),
   so a check "target is the caller" is one line.
4. **Opening a way in is owner-only too.** The reference lets a bot turn on
   Wi-Fi, the relay and Tailscale, and `computer.sharing` (a lent folder
   "can be used to reach a shell") (`registry-window.ts:11-14`,
   `registry-config.ts:154-156`). The spec says a hijacked bot must not
   "open the computer to the network" (spec `:33`). Reason: a known
   problem, and the code does not do what the spec says.
5. **One write path with a typed caller, not admin HTTP.** The reference
   calls its own routes with `{ kind: "loopback", scopes: ["admin",
   "client"] }` (`registry.ts:374`), so the routes do not know that a bot
   is the caller. Reason: less code (D10, no HTTP server) and a wrong state
   that the compiler refuses: an `Actor::Bot(id)` cannot pass where
   `Actor::Owner` is needed.
6. **A tier enum that holds its data.** `Tier::Safe { write, current }`,
   `Tier::Secret { credential }`, `Tier::OwnerOnly`. Reason: a wrong state
   that the compiler refuses: a secret entry with a value, or an owner-only
   entry with a write function.
7. **The window answers a preference change.** The reference stores the
   new value before the window applies it, and the window ignores errors
   (`routes/app-settings.ts:46`, `window-prefs.ts:100-104`). Reason: a
   known gap of the reference (spec `:250-252`). Our Tauri command can
   return the result of the setter.
8. **Redaction by type, not by field name.** The reference removes fields
   that match `/key|token|secret|password/i` (`registry-config.ts:15-18`).
   `decider.customBaseUrl` is refused on write as sensitive but shown on
   read (`:54-57`). Reason: the answer of `changelog.md` section 7: a key
   has its own type, and one redaction function runs at each exit.
9. **The budget is in the turn record, and a refusal gives back its
   write.** The reference has two rules: a refused batch gives the write
   back (`host.ts:124`), a refused single write does not (`:134`). Reason:
   one rule is less code, and the spec says a refusal does not spend
   (spec `:129-130`).
10. **Store all fields that a change touches, for Undo.** Archive clears
    `chiefOfStaff`, and Undo does not restore it (`registry-bots.ts:252-253`).
    Reason: a bug that we do not copy.
11. **A smaller tool first.** The reference tool has 10 actions and 2,387
    characters in every profile (section 3.10). The spec planned three
    actions. Reason: the size of the tool list (5 of 6 periods). Themes
    and settings cards can be separate tools later, in their own groups.

**The problems of `changelog.md` section 5 in this feature:**

| Problem | In the reference here | Where |
|---|---|---|
| A secret or an access right in the wrong place | Yes. A bot can change any bot, with approval mode to Full access. A saved key goes to an address that the bot gives. A provider address and a way in are safe. Writes run as admin. Keys themselves never pass through the bot | `registry-bots.ts:12-17`, `:196-212`, `registry.ts:133-138`, `:252-262`, `:313-315`, `:374`, `registry-window.ts:11-14` |
| A file written over after a failed read | Guarded for the config. The save reads the file again and refuses an unreadable or invalid file (`config.ts:884-886`). A risk stays: a provider patch spreads the section from memory (`{ ...cfg().anthropic, url }`, `registry.ts:252-262`), and the save merges it over the file (`config.ts:892-902`). If memory and file differ, the fields of memory win. On the desktop, `desktop-prefs.json` that does not read becomes the defaults, and the next save writes the defaults over it (`electron/desktop-prefs.mjs:92-98`). A bot can start that save (window frame, rail) | as named |
| The approval model changed | Yes. The rework of 2026-11-13 removed the planned card (spec `:5-12`). Every change applies at once at every level (`host.ts:146-149`, `host.test.ts:452`). This follows v0.1.99 and v0.1.115 ("Changes of a bot to itself stop asking", `changelog.md` section 6), and goes further: a bot changes other bots too | `host.ts:143-149`, `direct-apply.ts:1-5` |
| State lost at a restart | Yes. The Undo records and the window values the server knows | `host.ts:88`, `routes/app-settings.ts:29` |
| The size of the tool list of one turn | Yes. A core tool in all 33 profiles, 2,387 characters, 10 actions | `agents-tool-groups.ts:36`, `full.tools-list.json:2479-2547` |

## 9. Not verified

- How `cardAnswerRefusal` decides who may tap Undo (`index.ts:12181`). The
  function body was not read.
- What the bot patch route (`PATCH /api/bots/:id`) checks, and if it
  refuses some fields from a loopback caller while a bot works (the spec
  says so, spec `:246-248`).
- What `cfg()` holds after a config that is valid JSON but fails the
  schema, and so if the P2 risk of the provider patch can happen.
  [`newer-config-unavailable.md`](newer-config-unavailable.md) section 3.6
  says such a file "counts as ok" for the save. `config.ts:885` refuses a
  state named `invalid`. The meaning of `invalid` was not read.
- If the server sends the `window-pref` event to one window or to all admin
  windows, and if a phone applies it.
- Where the window keeps each preference (the localStorage keys).
- The format of the decision log file.
- If the internal gate refuses `app_settings` for a bot-API thread and a
  read-and-draft turn in all cases (the fence lists were read, not run).
- `isReadOnlyAgentTool("app_settings")` is false: inferred from a search,
  the function was not read.
- The values of `BOT_PROFILE_LIMITS`, `TOOL_GROUPS`, `THEME_LIMITS` and the
  rules of `themeCssProblem`.
- `openMessageFile`: how it treats a link in a folder of the path.
- If a settings card can carry `held`.
- `scripts/gen-settings-places.ts` and the rest of
  `shared/settings-places.ts` (lines 13-112) were not read.
- No test was run. All test facts come from reading the test files.
