# Plan: Bot avatars

The proposals from the research file
[`../research/features/avatars.md`](../research/features/avatars.md)
(batch 14, reference commit `e1cc6a290`). The steps, the pull requests and
the order are in [`README.md`](README.md). The author decides each proposal.
Then it becomes a decision, a pull request or a choice, and its text leaves
this file. A path that starts with `crates/`, `docs/plan/`, `docs/research/`,
`docs/decisions.md` or `docs/comparison.md` is ours. All other paths are in
the reference project.

- **Steps:** part 46 (avatars) has no step. P710 gives it a step in the
  group "later", after the attachment store (P301). P711 to P719 go to that
  step. P716 goes to step 8 (the store). P720 to P722 are decisions. P721
  also goes to step 6 (the keys). P723 is a question about `changelog.md`.
- **State:** all open. Decide P710 first: it gives the step. Decide P720
  with P301, P302 and P304 of [`bot-attachments.md`](bot-attachments.md),
  because an avatar is a file of the same store.
- **The main finding:** the AI-avatar route is correct for a late result: a
  picture that comes back after the avatar changed writes no file and does
  not win (`server/routes/bot-settings.ts:81-82`, `:90-92`). But two
  requests for one bot both pay the provider, and the second picture is
  thrown away (`:87-92`). Also, the load of the store deletes an avatar
  value that it does not accept and saves the file with no action of the
  person (`server/store.ts:376-383`, `:534`). This is how the stored crop
  `face` of the removed "Living" avatar disappeared.
- **Ours today:** `crates/bot-desktop/ui/src/features/bots/BotAvatar.tsx`
  shows the first letter of the name on the colour of the bot. The bot
  type of the window, `crates/bot-desktop/ui/src/features/bots/types.ts`,
  has no picture field. No Rust crate has avatar code.

## Proposals

Decide P710 first.

### P710. A step for avatars in the group "later" (after P301)

- Kind: a gap. Follows the reference.
- What: add a step in the group "later" for avatars:
  - `bot-protocol`: the avatar types.
  - `bot-core`: the storage, the command that sets an avatar, and the
    command that makes an avatar with AI.
  - `bot-desktop`: the display, the editors and the Tauri commands.

  Also extend three proposals of `bot-attachments.md` to avatars:
  - P301 (`bot-core::attachments`): an avatar picture is a file of this
    store.
  - P302 (a message holds its attachments as an `AttachmentId` or a path):
    the avatar of a bot uses the same choice.
  - P304 (a table of attachment references): the avatar of a bot is a
    reference too, so that the cleanup can see it.
- Options:
  - (a) A new step in the group "later", after the attachment store step
    (P301) (recommended).
  - (b) No separate step. The avatar fields go into the bot settings step
    of [`bot-settings-ui.md`](bot-settings-ui.md), and the store goes
    into P301.
- Why: part 46 has "none yet" as its step in `docs/plan/README.md`.
  Without a step, no proposal of this file has a place.
- Note: P726 of [`mascot.md`](mascot.md) also adds a step for part 46 (the
  mascot). Decide the two together: P726 option (a) makes one step with two
  parts.
- Reference: "Bot avatars intentionally reuse the image attachment store.
  Uploads and generated images therefore get the same size checks,
  owner-only filesystem permissions, immutable serving URL, and raster-only
  MIME allowlist as message images." (`docs/avatar-storage.md:3-6`). The
  generate route saves with `saveImage` (`server/routes/bot-settings.ts:93`).
  The kept set of the cleanup lists the `avatarUrl` of each bot
  (`server/index.ts:11953`).
- Changelog problem: none. This is the structure of the plan.

### P711. Follow the address rule of the reference, or a stronger type (the step of P710)

- Kind: a choice. Option (a) follows the reference. Option (b) is better
  than the reference, as a judgment call.
- What the reference does:
  - `botAvatarUrlSchema` accepts only
    `^/api/attachments/[A-Za-z0-9-]+\.(?:png|jpg|gif|webp)$`
    (`packages/phone-protocol/src/bot-avatar.ts:65-70`). The comment gives
    the reason: a profile stays portable, and it cannot become "a tracking
    pixel or script-capable SVG" (`:59-64`).
  - `botAvatarUrlFromStoredPath` makes the address from the last segment
    of the path. It gives `null` when the address fails the schema
    (`:72-77`).
  - Each route that sets the address checks that the file exists:
    `storedAvatarExists` calls `attachmentExists`, with the same name rule
    and `statSync(...).isFile()` (`server/index.ts:3448-3449`;
    `server/attachments.ts:751-758`). A missing file gives 400 "avatarUrl
    must reference an existing stored image"
    (`server/routes/bot-settings.ts:112-114`;
    `server/routes/bot-patch.ts:199-201`;
    `server/routes/bots-create.ts:163-165`).
  - An empty address clears the picture, with no check
    (`server/routes/bot-settings.ts:112`).
  - The other four fields: the crop is one of
    `mascot | circle | rounded | square` (`bot-avatar.ts:28`), the zoom is
    1 to 3 with 2 decimals (`:40-50`), and the focus is 0 to 1 with 3
    decimals (`:43`, `:52-57`).
  - A client session can change these five fields
    (`server/request-auth.ts:550-558`).
- **Problem in the reference (for option b):** the same rule is a regular
  expression in three places: the schema (`bot-avatar.ts:65-70`),
  `attachmentExists` (`server/attachments.ts:751-758`) and the seed of the
  team picture (`electron/team-profile-seed.mjs:8`). When one place
  changes and the others do not, a bad value passes or a good value is
  refused. No release names this problem. It is near "A secret or an
  access right in the wrong place" only in a small way: an outside address
  is a tracking pixel.
- Options:
  - (a) Follow the reference: an address string, one validation function
    in `bot-protocol`, and a check in the command that the file exists.
  - (b) A type: `avatar: Option<BotAvatar>`, with
    `BotAvatar { attachment: AttachmentId, crop: AvatarCrop, zoom,
    focus_x, focus_y }`. Only `bot-core::attachments` makes an
    `AttachmentId`, and only for a raster file. `AvatarCrop` is an enum.
    The window gets an address that is made from the id. This is the same
    choice as P302.
- Why (b): an `AttachmentId` that only the store makes cannot hold an
  outside address, a `data:` address or an SVG. The compiler refuses the
  wrong state, and the three regular expressions go away.
- Crates: `bot-protocol` (the types), `bot-core` (the set command checks
  that the attachment exists).

### P712. Follow the AI-avatar route of the reference (the step of P710)

- Kind: a choice. Follows the reference.
- What the reference does, `POST /api/bots/:id/avatar/generate`
  (`server/routes/bot-settings.ts:77-107`):
  1. It reads the bot. No bot gives 404 "no such bot" (`:79-80`).
  2. Before the first `await`, it copies `avatarUrl` and `avatarCrop` "so a
     late result cannot win" (`:81-82`; `server/avatar-image.ts:44-53`).
  3. It parses `{ prompt }`: trimmed, at most 400 characters, `""` by
     default. A longer prompt gives 400 "prompt must be at most 400
     characters" (`:83-86`; `server/avatar-image.ts:10`, `:13-15`).
  4. It calls the provider (`:87`). The prompt is a fixed brief: square,
     one subject, "Keep every important feature inside the center 70%", no
     text, logos or real people, and "Do not imitate a named living
     artist". The name, title, description and direction are quoted as
     JSON and cut to 100, 200, 500 and 400 characters. An empty direction
     becomes "A friendly, capable character that reflects the agent role"
     (`server/avatar-image.ts:56-69`). The call sets `draft: true`
     (`:80`). For OpenAI, that is 1024 × 1024, quality `low`, WebP
     (`server/image-generation.ts:77`, `:93`).
  5. It reads the bot again. No bot gives 404 (`:88-89`).
  6. When `avatarUrl` or `avatarCrop` changed, it gives 409 "avatar changed
     while generation was in progress" and writes nothing (`:90-92`).
  7. It saves a new file with `saveImage`. A `null` address gives 500
     (`:93-95`).
  8. The crop is the copied crop when it is set and is not `mascot`. Else
     it is `circle` (`:96-98`).
  9. It patches `avatarUrl` and `avatarCrop`. When the bot is gone, it
     deletes the new file and gives 404 (`:99-103`).
  10. It broadcasts the change and answers 201 `{ avatarUrl, bot }`
      (`:104-106`).
- More facts:
  - Only the owner can call the route. The route is not in `CLIENT_ALLOW`
    (`server/request-auth.ts:313-440`), so `requiredScope` gives "admin"
    (`:540-547`).
  - The base provider and the backup provider: the backup runs only when
    the base "never started": no key, connection refused, host not found,
    or HTTP 401, 402, 403 or 429. A time-out, a 5xx or a 400 stays on the
    base (`server/image-generation.ts:141-151`, `:356-385`;
    `docs/image-generation.md:66-82`).
  - Limits: 120 s (`server/image-generation.ts:8`), a response of 15 MiB
    (`:9`), a decoded PNG, JPEG or WebP of 10 MiB
    (`server/generated-image.ts:30-44`), `redirect: "error"` (`:288`).
    Only `b64_json` is accepted, and a returned URL is never fetched
    (`:340-343`). The body of the provider is never returned (`:314`).
  - The draft route `POST /api/bot-defaults/avatar` makes the same picture
    for a bot that does not exist yet. It answers `{ dataUrl }`, and it
    writes no file and changes no bot
    (`server/routes/image-settings.ts:64-75`).
  - Avatars do not count in the daily limit of 50 images
    (`docs/image-generation.md:23-26`).
- Options:
  - (a) Follow the reference as it is.
  - (b) Follow it, with P713, P717, P718 and P719 (recommended).
- Why: the route is correct for a late result. A stale picture writes no
  file and does not win. A failed provider call changes nothing. So it
  already avoids "A file written over after a failed read" for the
  picture.
- Crates: `bot-core` (a generate command that takes an `ImageProvider`
  trait, see P720), `bot-desktop` (the Tauri command and the `reqwest`
  provider).

### P713. One AI avatar at a time for each bot (the step of P710)

- Kind: a choice. Better than the reference.
- **Problem in the reference:** two generate requests for one bot both call
  the provider, and both pay. The request that ends second sees a changed
  avatar. It answers 409, and its picture is thrown away
  (`server/routes/bot-settings.ts:87-92`). The route has no lock and no
  busy mark. The busy flag of the window guards only that window
  (`src/components/avatar-editing.tsx:182`). The release problem: "The
  same work done two times, or lost" (for example "prevent duplicate jobs
  across restarts", v0.1.74, and "A Claude turn is never sent twice",
  v0.1.150). Here the provider charges two times and one picture is lost.
- Options:
  - (a) `bot-core` keeps in memory the set of bots with a generation in
    progress. A second start gets a typed refusal ("a picture is being made
    for this bot"). The entry goes at the end, also after an error
    (recommended). A restart loses the provider call in any case (section
    8 of the research file, "State lost at a restart").
  - (b) Keep the reference: 409 after the call.
- Why: a check before the provider call saves the second payment. The
  person gets a clear answer at once, and not a 409 after up to two
  minutes.
- Crate: `bot-core`.

### P714. A failed import or create deletes the pictures that it saved (the step of P710, and part 44)

- Kind: a choice. Better than the reference.
- **Problem in the reference:**
  - The import of a package saves each picture with `saveImage`
    (`server/package-import.ts:317-321`; `server/index.ts:2696-2701`). When
    a later step fails, the rollback deletes the routines, groups, bots,
    presets and servers, but not the picture files
    (`server/package-import.ts:506-518`). The test "leaves nothing behind
    when the last step fails" does not look at the attachments folder
    (`server/package-import.test.ts:51-52`, `:174-182`).
  - The create of the window uploads the draft picture before the name
    check, and before the bot exists
    (`src/lib/create-configured-bot.ts:9-19`, `:30-32`). When a later step
    fails, it deletes the bot and its routines, but not the file
    (`:90-100`). The draft keeps its `blob:` address (only a copy changes,
    `:16`), so a second try uploads the same file again.
  - These files have no record of where they came from, so they stay on
    disk for all time (`docs/avatar-storage.md:17-33`).
  - The release problem: "The same work done two times, or lost": a second
    try uploads the same file again.
- Options:
  - (a) The create and import commands of `bot-core` own the full
    operation. They write the picture file and the bot row in one
    operation, and the rollback deletes the file (recommended).
  - (b) With the reference table of P304, a sweep at start-up deletes the
    files that nothing references, after a grace period.
  - (c) Keep the reference.
- Why: each failed try leaves one more file on disk that nothing uses and
  nothing deletes.
- Crate: `bot-core` (create, and import with part 44).

### P715. Reset and the notification show the same face (the step of P710)

- Kind: a choice. Better than the reference, as a judgment call. No
  release names this problem.
- **Problem in the reference:** "Reset" sends `RESET_MASCOT_PATCH`. It sets
  the crop to `mascot` and keeps `avatarUrl`
  (`src/components/avatar-editing.tsx:24`; used at
  `src/components/bot-panel/AvatarEditorCard.tsx:131-139` and
  `src/components/BotProfileAvatarCard.tsx:39-47`). A notification copies
  `bot.avatarUrl` and does not look at the crop (`server/notify.ts:74`;
  called at `server/index.ts:3509`, `:3976`, `:5554`, `:6756`, `:7938`,
  `:8495`). The phone shows that picture as the icon of the system
  notification (`packages/phone-protocol/src/notification.ts:46-48`). So
  the window shows the mascot, and the banner of the phone shows the old
  picture. The template export already looks at the crop
  (`server/host/share.ts:43-49`), so the two paths do not agree.
- Options:
  - (a) One function `shown_picture(bot) -> Option<AttachmentId>` in
    `bot-protocol`. It gives none when the crop is `mascot`. The window,
    the notifications and the export use it. Reset keeps the file, so a
    later pick of a shape brings it back, as in the reference
    (recommended).
  - (b) Reset also clears the address, as Remove does
    (`src/components/avatar-editing.tsx:170-179`). The person loses "pick a
    shape to bring it back".
- Why: one rule, in one place, for "this bot shows a picture".
- Crates: `bot-protocol`, `bot-core` (the notifications, later),
  `bot-desktop`.

### P716. The load of the store does not delete avatar fields (step 8, with P419)

- Kind: a rule of the store step. Better than the reference, as a judgment
  call.
- **Problem in the reference:** at load, the store compares `avatarUrl` and
  `avatarCrop` with `botAvatarProfile`. It deletes a field that is
  different, and then it saves `bots.json` (`server/store.ts:376-383`,
  `:534`). It also deletes a zoom of 1 (`:384-390`). This is how a stored
  `avatarCrop: "face"` disappeared after the removal of the Living avatar
  (`eb6fad2c0`). If a later version makes the address rule narrower, the
  first start deletes a value that an older version wrote, and a downgrade
  cannot get it back. The read does not fail: the load parses the file and
  then drops a value. So this is only near "A file written over after a
  failed read" (v0.1.103, v0.1.151).
- Options:
  - (a) Read the stored value into a type that can hold "not known"
    (`AvatarCrop::Unknown(String)`, or the raw string). Show the mascot
    for it. Refuse it only when a person writes the bot again
    (recommended).
  - (b) Follow the reference: drop it at load.
- Why: a load that writes changes the data of the person with no action of
  the person. When we keep the value and show the fallback, nothing is
  lost.
- Crates: `bot-protocol` (the type), `bot-core` (the store, step 6 or 8,
  with P419 of [`bot-profile.md`](bot-profile.md)).
- Note: P730 of [`mascot.md`](mascot.md) asks for closed enums with typed
  refusals for the look fields. Decide the two together: a refusal at the
  edge for a new write, and a kept "not known" value for an old row.

### P717. Cancel the provider call when the person leaves (the step of P710)

- Kind: a choice. Better than the reference, as a judgment call. The call
  has a limit of 120 s, so it is not "a wait that does not end".
- **Problem in the reference:** `generateAvatarImage` calls
  `generateImage` with no cancel signal (`server/avatar-image.ts:80`). A
  closed window does not stop the call. The call runs for up to 120 s
  (`server/image-generation.ts:8`), it pays, and it can still change the
  bot after the person left. The image tool of a bot does cancel: it
  aborts the provider call when the HTTP response closes
  (`server/routes/image-tools.ts:174-175`).
- Options:
  - (a) The generate command takes a cancel token. The Tauri command
    cancels it when the window drops the request or the editor closes
    (recommended).
  - (b) Keep the reference: the call stops by itself in 120 s or less.
- Why: no payment and no change that the person does not wait for.
- Crates: `bot-core` (the command and the `ImageProvider` trait take a
  cancel token), `bot-desktop`.

### P718. Two small fixes in the AI-avatar flow of the window (the step of P710)

- Kind: a choice. Better than the reference, as a judgment call.
- **Problem in the reference:**
  1. The server already saves the new address and the crop
     (`server/routes/bot-settings.ts:99`). Then the window sends a second
     patch with `avatarUrl` and the crop
     (`src/components/avatar-editing.tsx:194-201`). One change makes two
     writes and two events.
  2. The route and the window do not reset the zoom and the focus for a new
     AI picture (`server/routes/bot-settings.ts:99`;
     `src/components/avatar-editing.tsx:194-201`). An upload does reset them
     (`:158-160`). So the framing of the old picture shows on the new
     picture.
- Options:
  - (a) The command sets the address, the crop, zoom 1 and focus 0.5 in one
    write. The window only shows the answer. It sends a crop patch only
    when the person changed the crop during the wait (recommended).
  - (b) Keep the reference.
- Why: one write is less code. The reset of the framing makes generate and
  upload do the same thing.
- Crates: `bot-core` (the command), `bot-desktop` (the editor).

### P719. One test of the AI-avatar command (the step of P710)

- Kind: a choice. Better than the reference, as a judgment call. It is a
  gap in the tests, not a test that fails by chance.
- **Problem in the reference:** the provider client has many tests
  (`server/avatar-image.test.ts:29-289`). No test covers the route: the
  409 for a changed avatar, the save, the crop rule, or the delete of the
  file when the bot is gone (`server/routes/bot-settings.ts:77-107`). The
  tests of the card check only the markup
  (`src/components/BotProfileAvatarCard.test.ts`). The manual check
  `docs/verification/avatar-providers.md:18-33` describes an older card
  with its own provider fields. It expects "Custom image generation failed
  (HTTP 401)", but the code now adds ", model <m>"
  (`server/image-generation.ts:315`). That document is out of date.
- What the test proves, with a fake `ImageProvider` and an in-memory
  store:
  - a change during the wait gives the typed refusal and no file;
  - a success sets the address, the crop (`circle` in place of `mascot`),
    the zoom and the focus (P718);
  - a deleted bot deletes the file;
  - a provider error writes nothing;
  - a second start is refused (P713);
  - a cancel writes nothing (P717).
- Options:
  - (a) Add the test with the command of P712 (recommended).
  - (b) No test.
- Why: `AGENTS.md` says: "Test the runtime with a fake driver and an
  in-memory store." A fake provider makes these tests cheap.
- Crate: `bot-core` (tests).

### P720. Decision: avatars use the attachment store and the image providers

- Kind: a decision. Follows the reference.
- What the reference does: avatars use the image attachment store
  (`docs/avatar-storage.md:3-6`). Avatars use the same providers and keys
  as the images of a chat: "Bots use this when you ask for an image in a
  chat, and bot avatars use it too." (`src/locales/en.json:10828`;
  `docs/image-generation.md:4`). The provider client is one module
  (`server/image-generation.ts:79-131`, `:239-385`).
- Options:
  - (a) A trait `ImageProvider` in `bot-core`. Its input: the brief, the
    aspect, the draft flag and a cancel token. Its output: the bytes and
    the MIME type, or a typed error with no body of the provider. The
    `reqwest` implementation is in `bot-desktop`, or in a small module
    that `bot-cli` connects (recommended).
  - (b) The HTTP client is in `bot-core`. This breaks the rule that
    `bot-core` does no network I/O.
- Why: one store, one size limit and one set of file modes. One place for
  the keys. `AGENTS.md` says that the runtime in `bot-core` "does no I/O
  beyond its own store", so the provider client is a trait.
- Crates: `bot-core`, `bot-desktop`, `bot-cli` (connects them).
- Proposed text for `docs/decisions.md`:

  > **Bot avatars use the attachment store and the image providers.** A
  > bot's picture is a file of the attachment store, the same store as the
  > images of a chat. The bot record holds its attachment id, its crop
  > (`mascot`, `circle`, `rounded`, `square`), its zoom (1 to 3) and its
  > focus (0 to 1). The window shows the mascot for the crop `mascot`, for
  > a missing picture and for a picture that does not load. A picture made
  > with AI uses the base and backup image providers of the settings, the
  > same ones that bots use for the images of a chat. `bot-core` calls a
  > provider through a trait `ImageProvider`, and the HTTP client is in
  > `bot-desktop`, because `bot-core` does no network I/O. The reference:
  > `docs/avatar-storage.md:3-6`,
  > `packages/phone-protocol/src/bot-avatar.ts:23-70`,
  > `server/routes/bot-settings.ts:77-107`, `docs/image-generation.md:4`.

### P721. Decision: follow the reference for the image keys in engine processes (step 6, with P19 and P20)

- Kind: a decision. Follows the reference, with the key storage of P19.
- What the reference does:
  - The environment of each engine process does not get the three
    image-only variables `OMB_OPENAI_IMAGE_KEY`, `OMB_CUSTOM_IMAGE_KEY` and
    `OMB_GEMINI_IMAGE_KEY`: "spawned engine CLIs must never inherit them"
    (`server/credential-env.ts:4`, `:31-33`, `:57-60`).
  - The xAI and OpenRouter image keys are the engine keys `xai.key` and
    `openrouter.key` (`server/image-generation.ts:98`, `:113`). They reach
    the Grok and OpenRouter engines on purpose (`server/config.ts:1116`,
    `:1121`). The UI says so: "This is the same Grok (xAI) key as under
    API keys" (`src/locales/en.json:10871-10872`).
  - The window gets booleans. An admin also gets `last4` of a key of 12 or
    more characters. A client session gets no `last4`
    (`server/avatar-image.ts:21-41`; `server/key-hint.ts:4-15`, `:33-37`;
    `server/index.ts:11643-11655`).
  - A bot can only name the base or the backup provider. It never sees a
    key (`server/routes/image-tools.ts:97-104`).
  - An error names only the provider, the HTTP status and the model. The
    body is never returned (`server/image-generation.ts:312-317`).
- **Problem in the reference (where the keys are kept):** the keys are
  plain text in `config.json` and in each config backup
  (`server/config.ts:990`; `server/config-backup.ts:103`). Three sources
  can hold them: the file, the environment and the desktop store
  (`server/config.ts:715`, `:750-753`, `:793-795`). The release problem:
  "A secret or an access right in the wrong place" ("Cloud secrets over a
  pipe, not the environment", v0.1.92; "each bot reaches only its own AI
  account's sign-in", v0.1.181).
- Options:
  - (a) Follow the reference for the engines, with the keychain of P19 and
    the `Secret` type of P20 (recommended).
  - (b) Separate image keys for xAI and OpenRouter, so that no engine gets
    an image key. The person must enter more keys.
- Why: follow the reference for who sees the keys. Use P19 (the keychain)
  and P20 (the `Secret` type, no `last4`) for where they are kept.
- Crates: `bot-core` (the settings), `bot-engine` (the allow list of
  engine variables, section 7 of `changelog.md`). Step 6 for the keys.
- Proposed text for `docs/decisions.md`:

  > **Image provider keys.** The keys of the image providers are in the
  > keychain (P19) and have the type `Secret` (P20). The window gets only
  > "set" or "not set" for each key. A bot never gets a key: it can name
  > only the base or the backup provider. An engine process never gets an
  > image-only key. The xAI and OpenRouter keys are the keys of those
  > engines, so those two engines get them, as in the reference. An error
  > from a provider names only the provider, the HTTP status and the
  > model, never its body. The reference: `server/credential-env.ts:4-60`,
  > `server/image-generation.ts:98`, `:113`, `:312-317`,
  > `server/routes/image-tools.ts:97-104`.

### P722. Decision: do not build the Living avatar

- Kind: a decision. Follows the reference (its removal).
- What the reference did: the "Living" avatar (the crop `face`) filled the
  body of the mascot with the picture of the bot and drew the live face on
  top.
  - Designed in `d78ce45c9` (2026-08-31 21:33 +0530). Built in
    `c63edaf8c`, `3a2deecf3` and `23746fefc` (iOS). Removed in
    `eb6fad2c0` (2026-09-01 11:09) and `03547e964` (five parts that were
    left). The first release tag after all six commits is v0.1.48
    (2026-09-02). v0.1.46 has none of them. No release had the feature.
  - The reason in `eb6fad2c0`: "Reviewed visually and rejected: a bot's own
    picture should be shown as it is, with no eyes or mouth painted over
    it. The "face" crop and every mechanism that painted a mascot face onto
    a user's image are removed — custom images are flat
    circle/rounded/square crops again, exactly as before this branch."
  - The spec keeps a note "Dropped (2026-09-01)"
    (`docs/superpowers/specs/2026-08-31-mascot-shape-catalog-design.md:13-22`).
    The plan does not
    (`docs/superpowers/plans/2026-08-31-04-mascot-shape-catalog.md:12`,
    `:14`, `:1361-1575`, `:1704-1773`).
  - The safety rule that it had: the picture address went into the SVG as
    a typed React `href`, not as text in raw markup, because
    "interpolating an attachment URL into raw HTML would be an injection
    path". A test checked that `"/><script>` comes out escaped
    (`eb6fad2c0`, lines 113-132 and 1166-1173 of the diff).
- The release problem: "A feature added, then removed or reversed"
  (section 6 of `changelog.md`). This one is only in the git history, not
  in a release.
- Options:
  - (a) Record the decision (recommended).
  - (b) Leave it to the plan of the feature "mascot"
    ([`mascot.md`](mascot.md)), with D23.
- Why: the reference built it and removed it in about 14 hours. A written
  reason stops a second try. This also matters for the ant mascot of the
  author: the ant is the mascot, and a picture of a bot is never drawn into
  the ant.
- Crate: `bot-desktop` (the display), with the mascot feature.
- Proposed text for `docs/decisions.md`:

  > **A bot's picture is shown as it is.** A bot shows its mascot or its
  > own picture, never both. We do not draw the face of the mascot on a
  > picture. The reference built that mode ("Living", crop `face`) and
  > removed it the next morning, before any release: "a bot's own picture
  > should be shown as it is, with no eyes or mouth painted over it"
  > (commit `eb6fad2c0`, 2026-09-01). When a picture address goes into SVG
  > or HTML, it goes in as a typed attribute, never as text joined into
  > markup. The reference: `eb6fad2c0`,
  > `docs/superpowers/specs/2026-08-31-mascot-shape-catalog-design.md:13-22`.

### P723. A question: a note on the Living avatar in `changelog.md`

- Kind: a question for the author. No change unless the author asks.
- Facts: section 6 of [`changelog.md`](../research/changelog.md) has no
  row for the Living avatar. That is correct, because the file comes from
  the release notes, and no release note names the Living avatar (it never
  shipped, see P722). `MEMORY.md` says that sections 3 to 7 change only
  when a release changes them.
- Options:
  - (a) No change (recommended, by the rule of `MEMORY.md`).
  - (b) Add one sentence to the row "Features that lived for days or
    weeks": "The Living avatar (a picture as the body of the mascot),
    built and removed on a branch on 2026-08-31 and 2026-09-01, before any
    release (`d78ce45c9` to `eb6fad2c0`). Source: the git history, not the
    release notes."

## The problems of the reference in this feature

- The same work done two times, or lost: P713 (two paid calls, one picture
  thrown away), P714 (a second try uploads the same file again).
- A secret or an access right in the wrong place: P721 (the keys are plain
  text in `config.json` and its backups).
- A feature added, then removed: P722 (the Living avatar, in the git
  history only).
- Judgment calls, with no release problem: P711 (option b), P715, P716,
  P717, P718, P719. The author can keep the reference for them.
- Follows the reference: P710, P712, P720. P723 is a question.
