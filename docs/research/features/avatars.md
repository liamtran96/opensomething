# Bot avatars

The research of the feature "Bot avatars". It records how a bot's own
picture is stored in the attachment store and how the AI picture providers
make an avatar. It also records the "Living" avatar, which the reference
project built and then removed. Rows `avatar-storage.md`, `avatar-providers.md` and the Living
avatar row of `reference-features.md`. Group "later", part 46, crates
`bot-desktop` and `bot-core` (for the storage). The reference project is the
clone at commit `e1cc6a290` (2026-11-28). Its latest release is v0.1.186.
Six readers read the files of six groups. The lead checked the key findings
against the code.

Borders with the files that are done. This file adds only what they do not
have:

- [`bot-attachments.md`](bot-attachments.md) has the attachment store: the
  upload route, the size limit, the MIME list, the `wx` partial file and the
  hard link, the serving rules, the "Clear" action and the visibility of an
  attachment. This file adds only the avatar use of the store: the URL
  rule, the check that the file exists, and why an old avatar file stays.
- [`bot-profile.md`](bot-profile.md) has the bot record and the profile
  parser. This file adds the five avatar fields, their limits and the load
  migration of a bad value.
- [`bot-settings-ui.md`](bot-settings-ui.md) has a summary of the look
  editor card (section 3, item 3). This file adds the full upload, remove,
  reset and generate flows, the framing control and the draft of a new bot.
- [`onboarding.md`](onboarding.md) and
  [`look-and-design.md`](look-and-design.md) show where avatars appear. This
  file adds nothing to them.
- The mascot (body shapes, faces, motion, the vendored Open Bot Avatar
  engine, `CursorAvatar`, `CarvedAvatar`, `ObjectAvatar` internals) is the
  feature "mascot" of another worktree. This file names the mascot only
  where an avatar picks it instead of a picture.
- The bot tools `generate_image` and `edit_image` are the feature
  `image-generation.md` (part 59). This file records only the parts of the
  image providers that an avatar uses, and where their keys are kept.

## 1. In short

A bot in the reference project shows one of two faces: the **mascot** (an
animated drawn body with a live face) or a **picture** that the person
gives it. The picture can come from three places: an upload from the
computer, an icon of the organization, or an **AI picture provider** that
makes a new picture from a short text. All pictures go into the same
**attachment store** as the images of a chat. The bot record keeps only the
address of the file.

Special terms, each one explained one time:

- **Avatar**: the face of a bot in the window, on the phone and in a
  notification. It is the mascot or a picture.
- **Attachment store**: one flat folder of files on the server. Each file
  has a random name, such as `3f2a….png`. The address of a file is
  `/api/attachments/<name>`.
- **`avatarUrl`**: the field of the bot record that holds the address of
  its picture. It is `null` when the bot has no picture.
- **Crop** (`avatarCrop`): how the window shows the bot. `mascot` shows the
  mascot, even when the bot has a picture. `circle`, `rounded` and `square`
  show the picture with that shape, and no mascot.
- **Framing**: the zoom (1 to 3) and the focus point (x and y, 0 to 1) that
  place the picture in its shape. The fields are `avatarZoom`,
  `avatarFocusX` and `avatarFocusY`.
- **AI picture provider**: an outside service that makes a picture from a
  text: OpenAI, Grok (xAI), Gemini, OpenRouter, Higgsfield, or a custom
  gateway that speaks the OpenAI Images API. The person sets a **base**
  provider and an optional **backup** in Settings → Image generation. The
  same settings serve the chat tool `generate_image` and the avatar.
- **Direction**: the optional text, at most 400 characters, that the person
  types to guide an AI avatar.
- **Draft**: a new bot that the "New bot" dialog holds in the memory of the
  window. It is not on the server until the person creates it.
- **Living avatar**: a removed mode. The bot's picture filled the mascot's
  body, and the live mascot face was drawn on top. It had the crop value
  `face` and the label "Living". It lived about 14 hours on a branch, and
  no release had it.

The main facts:

1. The server accepts an avatar address only in one form:
   `/api/attachments/<letters, digits, dashes>.<png|jpg|gif|webp>`. The file
   must also exist. No outside address, no SVG and no `data:` address can
   become an avatar (`packages/phone-protocol/src/bot-avatar.ts:59-70`,
   `server/index.ts:3448-3449`).
2. A new picture is always a new file. The server never writes over a
   picture, and it never deletes an old avatar file, because no record says
   which files are avatars (`docs/avatar-storage.md:17-33`).
3. An AI avatar is one HTTP request that waits for the provider (up to 120
   seconds). It writes the file and the bot record only after the provider
   answers, and only when nobody changed the avatar in the meantime. Else
   it answers 409 (`server/routes/bot-settings.ts:77-107`).
4. The provider keys are on the server only. The window gets booleans (and,
   for an admin, the last four characters of a long key). The three
   image-only keys are removed from the environment of each engine process
   (`server/credential-env.ts:31-33`).
5. The "Living" avatar was designed on 2026-08-31, built in the night, and
   removed at 11:09 on 2026-09-01 (`eb6fad2c0`). The reason: "a bot's own
   picture should be shown as it is, with no eyes or mouth painted over it".
   The first release after it, v0.1.48, had only the ten mascot bodies.

## 2. Files read completely

All paths are in the reference project. No reader opened a file in its
`enterprise/` directory.

Server and wire types:

| File | Lines |
|---|---|
| `server/avatar-image.ts` | 82 |
| `server/avatar-image.test.ts` | 290 |
| `server/bot-avatar.test.ts` | 62 |
| `shared/bot-avatar.ts` | 1 |
| `packages/phone-protocol/src/bot-avatar.ts` | 97 |
| `server/routes/bot-settings.ts` | 254 |
| `server/routes/image-settings.ts` | 86 |
| `docs/avatar-storage.md` | 33 |

AI picture providers and keys:

| File | Lines |
|---|---|
| `server/image-generation.ts` | 385 |
| `server/image-generation-config.ts` | 74 |
| `shared/image-generation.ts` | 105 |
| `server/routes/image-tools.ts` | 191 |
| `src/components/ImageGenerationSettings.tsx` | 399 |
| `docs/image-generation.md` | 112 |
| `docs/verification/avatar-providers.md` | 73 |
| `scripts/verify-avatar-providers.ts` | 49 |
| `src/testing/avatar-providers.tsx` | 22 |
| `server/key-hint.ts` | 37 |

Window, display:

| File | Lines |
|---|---|
| `src/components/Avatar.tsx` | 342 |
| `src/components/Avatar.test.ts` | 166 |
| `src/components/ObjectAvatar.tsx` | 106 |
| `src/components/ObjectAvatar.dom.test.ts` | 79 |
| `src/lib/avatar-marks.ts` | 7 |
| `shared/avatar-tooltip.test.ts` | 13 |
| `src/components/BotIdentityAvatars.test.ts` | 92 |

Window, editing:

| File | Lines |
|---|---|
| `src/components/avatar-editing.tsx` | 210 |
| `src/components/AvatarImageGenerator.tsx` | 70 |
| `src/components/bot-panel/AvatarEditorCard.tsx` | 306 |
| `src/components/BotProfileAvatarCard.tsx` | 240 |
| `src/components/BotProfileAvatarCard.test.ts` | 135 |
| `src/lib/bot-creation-draft.ts` | 157 |
| `src/lib/create-configured-bot.ts` | 118 |

Where the avatar goes:

| File | Lines |
|---|---|
| `server/notify.ts` | 115 |
| `packages/phone-protocol/src/notification.ts` | 66 |
| `electron/team-profile-seed.mjs` | 91 |
| `src/lib/bot-duplicate.ts` | 44 |
| `server/host/delete-leftovers.many-uploads.test.ts` | 134 |

The Living avatar:

| Item | Lines |
|---|---|
| `docs/superpowers/specs/2026-08-31-mascot-shape-catalog-design.md` | 222 |
| `git show d78ce45c9` | 162 |
| `git show c63edaf8c` | 166 |
| `git show 3a2deecf3` | 247 |
| `git show 23746fefc` | 442 |
| `git show eb6fad2c0` | 1,246 |
| `git show 03547e964` | 134 |

Files read in ranges (the lines that were read):

- `server/index.ts` (15,217): 73-74, 96, 1804, 2680-2712, 2855-2882,
  3438-3462, 11520-11610, 11635-11657, 11950-11967, and each line that has
  "avatar".
- `server/config.ts` (1,227): 9-10, 40, 330-372, 400-416, 690-810, 860-999,
  1090-1140.
- `server/attachments.ts`: 23, 66-71, 118-131, 220-237, 378-390, 620-700,
  751-765.
- `server/store.ts`: 370-390.
- `server/credential-env.ts` (112): 1-80.
- `server/request-auth.ts`: 313-440 (the list `CLIENT_ALLOW`), 540-560.
- `server/routes/bot-patch.ts` (810): 116, 185-235.
- `server/routes/bots-create.ts` (316): 150-175, 232-250.
- `server/package-import.ts` (519): 1-80, 225-420, 470-519.
- `server/package-export.ts`: 355-366, 580-600.
- `server/package-import.test.ts` (270): 15-100, 151-183.
- `server/package-export.test.ts` (545): 240-300, 339-358.
- `server/workspace-backup.test.ts` (998): 15-70, 156-215.
- `shared/team-backup.ts` (237): 1-160.
- `server/host/delete-leftovers.test.ts` (385): 1-134.
- `server/host/share.ts`: 40-52. `server/share.ts` (576): 85-100, 195-222,
  370-436, 532.
- `server/bot-visibility.ts` (678): 160-180, 300-345.
- `server/default-bot.ts` (180): 1-30, 98-180.
- `packages/phone-protocol/src/wire.ts` (1,000): 10, 258-305.
- `src/components/NewBotDialog.tsx` (397): 90-160, 200-215, 280-330.
- `src/components/bot-settings/IdentitySection.tsx` (116): 1-46.
- `docs/superpowers/plans/2026-08-31-04-mascot-shape-catalog.md` (1,831):
  1-30, 40-68, 1300-1610, 1700-1831.
- `src/locales/en.json`: the keys `botIdentity.*`, `botPanel.avatar.*`,
  `newBot.avatar.*` and 10828-10880.

## 3. How it works

### 3.1 The rules for an avatar address

1. `botAvatarUrlSchema` accepts only
   `^/api/attachments/[A-Za-z0-9-]+\.(?:png|jpg|gif|webp)$`
   (`packages/phone-protocol/src/bot-avatar.ts:65-70`). The comment gives the
   reason: a profile stays portable, and it cannot be "a tracking pixel or
   script-capable SVG" (`:59-64`). There is no `.jpeg`, no dot or slash in
   the name, and no outside address.
2. `botAvatarUrlFromStoredPath(path)` changes `\` to `/`, takes the last
   segment and builds `/api/attachments/<name>`. It gives `null` when the
   result fails the schema (`:72-77`).
3. A route that sets `avatarUrl` checks that the file exists:
   `storedAvatarExists` cuts the prefix and calls `attachmentExists`, which
   applies the same name rule and a `statSync(...).isFile()`
   (`server/index.ts:3448-3449`; `server/attachments.ts:751-758`). The
   profile route, the bot route and the create route answer 400 "avatarUrl
   must reference an existing stored image" when the file is missing
   (`server/routes/bot-settings.ts:112-114`;
   `server/routes/bot-patch.ts:199-201`;
   `server/routes/bots-create.ts:163-165`).
4. An empty `avatarUrl` clears the picture. It skips the check
   (`server/routes/bot-settings.ts:112`). After a create, `""` becomes "no
   picture" (`server/routes/bots-create.ts:242`).
5. A client session (a phone or a shared window) may change the five avatar
   fields of a bot: they are in `CLIENT_BOT_PATCH_FIELDS` and in
   `SHARED_LOOK_FIELDS` ("How a bot looks to everyone who sees it")
   (`server/request-auth.ts:550-558`).

### 3.2 Upload a picture for a bot that exists

The hook `useAvatarImage().upload` (`src/components/avatar-editing.tsx:146-168`):

1. It stops at once if there is no file or the hook is busy (`:147`).
2. It sets "uploading" and clears the error (`:148-149`).
3. It sends the bytes to the general attachment upload
   (`imageAttachmentFromFile`, the route `POST /api/attachments`), and
   builds the avatar address from the stored path (`:151-152`). That upload
   returns `null` for a file that is not an image, and refuses a file over
   10 MiB (`src/lib/composer-attachments.ts:364-375`).
4. When there is no address, it throws "The uploaded image could not be used
   as an avatar" (`:153`; `botIdentity.uploadUnusable`).
5. On success it sends one patch: the new address, the crop (`circle` when
   the crop was `mascot`, else the crop that the person has now), zoom 1 and
   focus at the center (`:154-161`). The crop comes from a ref, so a crop
   change during the upload stays (`:142-143`).
6. On an error it shows the message and sends no patch. The old picture
   stays on the bot (`:162-163`).
7. At the end it clears "uploading" and empties the file input, so the
   person can pick the same file again (`:164-167`).

Limits and edge cases:

- The file picker accepts `image/png,image/jpeg,image/gif,image/webp`
  (`AvatarEditorCard.tsx:253-259`; `BotProfileAvatarCard.tsx:67-82`). A
  drag and drop on the panel card skips that filter. The upload then
  checks the type (`AvatarEditorCard.tsx:266-269`).
- The window shows no preview before the upload ends. The picture appears
  when the patch with the server address arrives.
- If the window closes before the patch is saved, the file is in the store
  and no bot uses it. `bot-attachments.md` has what happens to such a file.

### 3.3 Remove, reset and shape

1. **Remove** (the trash button) sends `avatarUrl: null`, crop `mascot`,
   zoom 1 and focus at the center. It asks no question, and it does not
   delete the file (`src/components/avatar-editing.tsx:170-179`).
2. **Reset** ("Reset" in the panel, "Reset mascot" in settings) sends
   `RESET_MASCOT_PATCH`: crop `mascot`, colour green, body `cursor`, and no
   face colour, body colour, material or expression
   (`src/components/avatar-editing.tsx:24`). It **keeps** `avatarUrl`. The
   picture only stops showing. When the person picks Circle, Rounded or
   Square later, the old picture comes back.
3. **Shape**: the panel card offers Circle, Rounded and Square. They are
   off while busy and when the bot has no picture
   (`AvatarEditorCard.tsx:276-284`). The settings card offers all four
   crops, and turns them off only while busy, so a person can pick Circle
   with no picture (`BotProfileAvatarCard.tsx:101-118`). The window then
   shows the mascot (section 3.6, step 3).
4. **Organization icon**: when the organization branding has icons, a click
   decodes `icon.image.slice(22)` as base64 and uploads it as `<id>.png`
   (`src/components/avatar-editing.tsx:120-132`). The fixed 22 is the length
   of `data:image/png;base64,`. Another prefix gives wrong bytes.

### 3.4 Framing: zoom and focus

`AvatarFraming` (`src/components/avatar-editing.tsx:35-118`) is a frame of
168 px (`:33`):

1. It reads zoom and focus from the bot and clamps them. A missing value
   gives zoom 1 and the center (`:44-46`).
2. A drag with the left button moves the focus. Each pointer move sends a
   patch: new focus = start focus − pixel change ÷ 168 ÷ zoom, clamped
   (`:50-62`).
3. Each wheel step changes the zoom by 0.08 (`:66-70`). The slider has a
   step of 0.01, from 100% to 300% (`:88-102`).
4. "Reset framing" shows only when zoom or focus is not the default
   (`:47`, `:105-114`).
5. "Disabled" blocks a new drag, the wheel and the slider. A drag that
   started before continues (`:51`, `:55-62`, `:67`, `:94`).

The limits come from the wire type: zoom 1 to 3, rounded to 2 decimals.
Focus is 0 to 1, rounded to 3 decimals. A value that is not a finite number
gives zoom 1 or focus 0.5 (`packages/phone-protocol/src/bot-avatar.ts:40-57`).
Each change goes out at once through `onPatch`. The store's patch queue
holds and saves it (`bot-settings-ui.md` has that queue).

### 3.5 Make an avatar with AI, for a bot that exists

The window (`src/components/avatar-editing.tsx:181-207`):

1. It stops if busy. It sets "generating" and clears the error
   (`:182-185`).
2. It keeps the crop at the start (`:188`).
3. It waits for `flushBotPatches(bot.id)`, so that the pending profile edits
   are saved first (`:186-189`).
4. It sends `POST /api/bots/:id/avatar/generate` with
   `{ prompt: direction.trim() }` (`:190-193`).
5. On success it patches `avatarUrl` again, and the crop: the server's crop
   (or `circle`) when the person did not change the crop, else the person's
   crop (`:194-201`). It does not reset zoom and focus, so the framing of
   the old picture stays on the new one.
6. On an error it shows the message text. It has no special case for 409
   (`:202-203`).

The server route (`server/routes/bot-settings.ts:77-107`):

1. It reads the bot. A missing bot gives 404 "no such bot" (`:79-80`).
2. Before the first `await`, it keeps a copy of `avatarUrl` and
   `avatarCrop` "so a late result cannot win" (`:81-82`;
   `server/avatar-image.ts:44-53`). Zoom and focus are not in the copy.
3. It parses `{ prompt }`: a string, trimmed, at most 400 characters,
   default `""`. A longer one gives 400 "prompt must be at most 400
   characters" (`:83-86`; `server/avatar-image.ts:10`, `:13-15`).
4. It calls the provider with `generateAvatarImage` (`:87`). The prompt is
   a fixed brief: a square avatar with one subject in the center, "Keep every
   important feature inside the center 70%", no text, no logos, no real
   people, and "Do not imitate a named living artist". The bot's name,
   title, description and the direction are quoted as JSON and cut to 100,
   200, 500 and 400 characters. An empty direction becomes "A friendly,
   capable character that reflects the agent role"
   (`server/avatar-image.ts:56-69`). The call sets `draft: true`
   (`:80`). The route gives no cancel signal, so a closed window does not
   stop the call.
5. It reads the bot again. A deleted bot gives 404 (`:88-89`).
6. When `avatarUrl` or `avatarCrop` changed during the wait, it answers 409
   "avatar changed while generation was in progress" and writes nothing
   (`:90-92`).
7. It saves the bytes with `saveImage` as a new file (`:93`). It builds the
   address. A `null` address throws 500 "Could not store the generated
   avatar" (`:94-95`). That cannot happen for a name that `saveImage`
   makes, because its MIME map has only png, jpg, gif and webp
   (`server/attachments.ts:66-71`).
8. The crop: the crop of step 2 when it is set and not `mascot`, else
   `circle` (`:96-98`). A mascot bot thus changes to a round picture.
9. It patches the bot with `avatarUrl` and `avatarCrop` (`:99`). When the
   patch finds no bot, it deletes the new file and answers 404
   (`:100-103`).
10. It sends the bot to all windows and answers 201 `{ avatarUrl, bot }`
    (`:104-106`).

Steps 6 to 9 have no `await` between them, so no other request can change
the bot in that interval.

Error paths of the provider (each one throws before step 7, so no file is
written and the bot does not change):

| Case | Status | Text | Source |
|---|---|---|---|
| The selected provider has no key, URL or model | 409 | "Add an OpenAI image API key first" and similar | `server/image-generation.ts:79-131`, `:248` |
| A custom URL that breaks the URL rules | 409 | before any network call | `server/avatar-image.test.ts:144-155` |
| Cannot connect | 502 | "Could not reach <Provider> image generation" | `server/image-generation.ts:291-296` |
| Time-out (120 s) | 502 | "Image generation timed out" | `:8`, `:291-296` |
| HTTP error | 401 stays 401, else 502 | "<Provider> image generation failed (HTTP <n>, model <m>)", with no body | `:312-317` |
| A redirect | 502 | "HTTP 302". The key does not go to the new host | `:288`. Test `:204-211` |
| Response over 15 MiB | 502 | "Generated image exceeded the response limit" | `:9`, `:198-232` |
| Only a URL, no `b64_json` | 502 | "must return base64 image data (b64_json)". The URL is never fetched | `:340-343` |
| Bad JSON, bad base64, SVG, HTML, or a GIF that nobody asked for | 502 | "returned an invalid image response" and similar | `:331-352`; test `:172-192` |
| Decoded image over 10 MiB, or not PNG, JPEG or WebP | 502 | "returned invalid or oversized image data" | `:349-352`; `server/generated-image.ts:30-44` |

Base and backup (`server/image-generation.ts:356-385`): the server tries
the base first. It uses the backup only when the base "never started": not
set up, connection refused or host not found, or HTTP 401, 402, 403 or 429
(`:141-151`, `:374`). A time-out, a 5xx or a 400 stays on the base, because
the provider can already have charged for it (`docs/image-generation.md:66-82`).
When both fail, the error names both (`:380-382`).

Who may call the route: it is not in `CLIENT_ALLOW`
(`server/request-auth.ts:313-440`), so `requiredScope` gives "admin"
(`:540-547`). Only the owner's session can spend the image key on an
avatar. Avatars do not count in the daily cap of 50 images
(`docs/image-generation.md:23-26`). The per-reply limit and the "only a
person's turn" rule are for the bot tool only
(`server/routes/image-tools.ts:81-128`).

Two requests at the same time: the route has no lock. Both pay the
provider. The one that finishes second sees a changed avatar and answers
409, so its picture is lost.

### 3.6 Show an avatar

`BotAvatar` (`src/components/Avatar.tsx:251-310`):

1. It parses the bot with `botAvatarProfile`. A bad address is dropped. A
   crop that is not one of the four becomes `mascot`
   (`:252`; `packages/phone-protocol/src/bot-avatar.ts:79-97`).
2. It keeps `imageFailed` in React state, and clears it when the address
   changes (`:254-256`).
3. `resolveBotAvatarOutcome` (`:239-249`) picks one of two outcomes:
   - no address → mascot
   - crop `mascot` → mascot, also with an address
   - the image failed to load → mascot
   - else → the picture (`flatImage`).
4. The mascot path draws `MausAvatar` with the bot's body, colours and name
   (`:264-279`). The mascot worktree has the rest.
5. The picture path draws a `<span>` with `overflow-hidden` and the radius
   of the crop (circle 50%, rounded 22%, square 0). In the `<span>` is an
   `<img>` with `object-fit: cover` and `object-position` at the focus. When
   zoom is not 1, the `<img>` also gets `transform: scale(zoom)` from the
   focus
   (`:281-306`; `packages/phone-protocol/src/bot-avatar.ts:33-37`). The
   picture is not changed or encoded again.
6. When the image fails to load, `onError` sets `imageFailed` (`:298`). The
   next render shows the mascot. Nothing is written to the bot or the file.

Edge cases:

- When the address changes after a failure, an effect clears the flag
  (`:256`). So the first render with the new address still shows the
  mascot. `InitialsAvatar` (a person's face) keeps the failed address
  instead, and has no such frame (`:328-330`).
- The `alt` text is the label, else "{name} avatar", else "Bot avatar"
  (`:294`; `src/locales/en.json:9098-9099`). A person's picture has an
  empty `alt` (`:331`).
- `avatarMarks(kind, drawn)` adds `data-avatar` (`picture`, `mascot` or
  `initials`) and `data-avatar-kind` (`bot` or `person`), so that a theme
  can style faces (`src/lib/avatar-marks.ts:1-7`). On a bot picture the
  marks are on the `<span>`. On a person's picture they are on the `<img>`
  (`Avatar.tsx:288`, `:331`).
- The engine SVG of a mascot has no `<title>`, so a hover shows the row's
  tooltip ("Open Juniper"), not the body name ("Mug")
  (`shared/avatar-tooltip.test.ts:7-12`;
  `packages/phone-protocol/src/open-bot-avatar/render.ts:673-676`).
- About 60 components draw `BotAvatar`: the sidebar, the chat, rooms, the
  Inbox, the team map, usage rows, and more (git grep, names only).

### 3.7 A new bot (the draft)

The "New bot" dialog holds a `BotCreationDraft` in memory
(`src/lib/bot-creation-draft.ts`; `src/components/NewBotDialog.tsx:92-101`).
The editors get `uploadAvatar` from the draft, so the hook takes the draft
path (`NewBotDialog.tsx:209`; `avatar-editing.tsx:151-152`).

Upload in a draft (`bot-creation-draft.ts:85-92`):

1. Only `image/png`, `image/jpeg`, `image/gif` and `image/webp`, else
   "Choose a PNG, JPEG, GIF, or WebP image" (`:86`).
2. At most 10 MiB, else "Choose an image smaller than 10 MiB" (`:87`).
3. It frees the previous `blob:` address (`:88`).
4. It keeps the `File` and returns a new `blob:` address as the preview
   (`:89-91`). Nothing goes to the server.

A failed check throws before step 3, so the old preview stays.

AI avatar in a draft (`bot-creation-draft.ts:138-145`):

1. It sends `POST /api/bot-defaults/avatar` with the draft's name, title
   and description and the direction (`:140-142`).
2. The server checks the body and the prompt, calls the same
   `generateAvatarImage`, and answers 200 `{ dataUrl }`. It writes no file
   and changes no bot (`server/routes/image-settings.ts:64-75`). This route
   is also admin-only. The header comment of the file, "nothing here makes
   an image" (`:1`), is wrong for this route.
3. The window turns the `data:` address into a blob and passes it to
   `uploadAvatar` as `avatar.png`, so the type and size checks apply
   (`:143-144`).
4. The draft gets the `blob:` address and crop `circle` (`:145`).

Create (`src/lib/create-configured-bot.ts:9-48`):

1. `preparedBotTemplate` runs first. When the profile address is a `blob:`
   address, it uploads the kept file. No file gives "Choose the avatar
   image again". No address gives "Could not store the avatar image"
   (`:11-16`).
2. Then the name check (`:32`), then `POST /api/bots` without the avatar
   (`:35-41`), then a patch with the rest of the profile, the avatar fields
   included (`:46-48`).
3. When a later step fails, the code deletes the bot and its routines
   (`:90-100`). It does not delete the uploaded picture. A second try
   uploads the same file again, because the draft still has the `blob:`
   address (`:16` changes only a copy).

The "New bot defaults" mode stores the uploaded address in the config
(`PATCH /api/config` with `newBotDefaults`, `NewBotDialog.tsx:133`). A
preset with a picture runs it through `uploadAvatar` and sets the preset's
crop. A preset with no picture after one with a picture sets
`avatarUrl: ""` (`NewBotDialog.tsx:308-317`).

### 3.8 Settings → Image generation (the provider)

The page (`src/components/ImageGenerationSettings.tsx`) is the only place
that sets the provider. The avatar card shows "Uses {provider}, as set in
Image generation." or "No image provider is set up yet.", and a link
"Open image settings" (`src/components/AvatarImageGenerator.tsx:22-42`).
The page and its intro text: "Bots use this when you ask for an image in a
chat, and bot avatars use it too" (`src/locales/en.json:10828`).

1. The person picks a base and an optional backup. The backup list leaves
   out the base provider (`:124`, `:187`).
2. Each chosen provider gets a key card: a password field that is never
   filled, "Key saved", "Key optional" (custom) or "No key yet", and the
   buttons Remove key, Test and Save (`:285-398`; `en.json:10868-10870`).
3. Save a key: the xAI and OpenRouter keys go through the engine key save,
   because they are the same keys as the engines use (`:317`;
   `en.json:10871-10872`). The other three go through the desktop bridge
   `window.ogb.setCredential`, else `PUT /api/config` (`:318-320`).
4. Test: `POST /api/images/test { provider }`. The answer is a typed
   verdict, never the key and never the provider's body
   (`server/routes/image-settings.ts:40-58`). The test refuses a custom key
   when the base URL is not set yet: "Add the base URL first, so the key is
   only sent to your endpoint." (`en.json:10855`).
5. A custom URL must be HTTPS, or HTTP to a local or private host, with no
   user name, password, query or fragment. `0.x` and `169.254.x` are always
   refused (`shared/image-generation.ts:88-105`).
6. A model field that holds a key is refused at save: "This is an API key,
   not a model ID: paste the key in the key field instead"
   (`server/image-generation-config.ts:51-74`). The read side also treats a
   model that looks like a key as empty (`server/image-generation.ts:164-168`).

### 3.9 Where an avatar goes outside the editor

1. **The wire**: `WireBot.avatarUrl` is always present, `null` when the bot
   has none. `avatarCrop`, `avatarZoom`, `avatarFocusX` and `avatarFocusY`
   are optional (`packages/phone-protocol/src/wire.ts:289-299`;
   `server/index.ts:2866`).
2. **Notifications**: done, failed, delegation and routine notices carry
   `avatarUrl: bot.avatarUrl` (`server/index.ts:3509`, `:3976`, `:5554`,
   `:6756`, `:7938`, `:8495`). `buildNotification` copies it when it is not
   empty (`server/notify.ts:74`). The phone shows it as the icon of the
   system notification (`packages/phone-protocol/src/notification.ts:46-48`).
   It does not look at the crop. So after a Reset (section 3.3), the window
   shows the mascot and the notification shows the old picture.
3. **Duplicate**: the copy takes the five avatar fields. Both bots then use
   the same file (`src/lib/bot-duplicate.ts:38-42`). This is safe only
   because nothing deletes an old avatar file.
4. **Templates and packages**: `botPicture` reads the file and gives a
   `data:` address, but not for crop `mascot`, not for an address that is
   not in the standard form, and not when the file is missing (no line in
   "skipped") (`server/host/share.ts:43-49`). The package holds
   `appearance.avatar = { mime, data, crop }`. The limits are PNG, JPEG or
   WebP (no GIF), at most 64 KB, and magic bytes that agree with the MIME.
   A picture that fails is left out, with a line in "skipped"
   (`server/package-export.ts:358-366`, `:582-593`). The crop becomes
   `circle` unless it is `rounded` or `square` (`:589`). Zoom and focus are
   not in the package.
5. **Package import** saves each picture with `saveImage` and sets the
   address and crop on the new bot (`server/package-import.ts:317-348`;
   `server/index.ts:2696-2701`). When a later step of the import fails, the
   rollback deletes the bots, groups, routines and servers, but not the
   saved picture files (`server/package-import.ts:506-518`).
6. **Backups**: the encrypted workspace backup carries the attachments
   folder. After a restore the bot has the same address and the same file
   (`server/workspace-backup.test.ts:156`, `:206-209`). The JSON team backup
   has no `avatarUrl` and no `avatarCrop`. Its text says "custom avatars …
   are not included" (`shared/team-backup.ts:13`, `:126-149`).
7. **Cleanup**: "Clear" keeps each file that a bot's `avatarUrl` or the
   person's profile picture names (`server/index.ts:11953`). When the kept
   set cannot be read, Clear deletes nothing and warns (`server/host/delete-leftovers.test.ts:126-133`).
   The delete of one upload refuses a file that a bot avatar uses
   (`attachmentInUse`, `server/index.ts:11965`). That check leaves out the
   person's own profile picture.
8. **Visibility**: a file that several bots use is served when any of those
   bots is visible to the viewer (`server/bot-visibility.ts:322-337`).
9. **The default bot**: a set `avatarUrl` counts as "the person made this
   bot their own", so a move does not retire it
   (`server/default-bot.ts:142-150`).
10. **The person's picture on a Team Cloud**: the window copies the local
    profile picture to an empty team profile one time. It checks the
    address form, the type and a size of at most 10 MB, uploads the bytes
    with the window's own session, and sends `fillEmpty: true`
    (`electron/team-profile-seed.mjs:36-77`).

### 3.10 The "Living" avatar: added, then removed

All six commits are by one author, on the branch `feat/mascot-shape-catalog`.
`git tag --contains` gives v0.1.48 as the first release tag for each one.
v0.1.46 (2026-09-01 17:28) has none of them, and there is no v0.1.47 tag.

| Commit | Time (+0530) | Subject |
|---|---|---|
| `d78ce45c9` | 2026-08-31 21:33 | docs: add image-as-living-body mode to the shape catalog design |
| `c63edaf8c` | 2026-09-01 01:31 | feat: uploading an image keeps the bot's face |
| `3a2deecf3` | 2026-09-01 01:36 | fix: fall back to the gradient mascot when a face-crop image 404s |
| `23746fefc` | 2026-09-01 02:04 | feat: the living image body on iOS |
| `eb6fad2c0` | 2026-09-01 11:09 | feat!: drop the living-body avatar mode |
| `03547e964` | 2026-09-01 11:28 | Fix five leftovers from the living-body removal |

What it was meant to do (the design text that `d78ce45c9` added): "an image
*replaces* the mascot, so the bot loses its face. A bot wearing a photo is a
static sticker in a list where every mascot beside it blinks and reacts.
This adds a mode where the image becomes the mascot's **body** — filling a
catalog shape, with the live animated face painted on top".

How it was built:

1. One new crop value, `face`, with "no new field, no new axis"
   (`d78ce45c9`, diff lines 65-75). The picker showed it as "Living" on the
   desktop and on iOS (`23746fefc`, diff lines 42-54).
2. An upload from `mascot` went to `face`, not `circle` (`c63edaf8c`). The
   AI avatar went back to `circle`, because the AI prompt already asks for a
   picture "that already has a face". The test comment said "This is the
   regression that has happened twice" (the "-" lines of `eb6fad2c0`, diff
   lines 512-517, 708-712).
3. The desktop drew the picture as an SVG `<image>` in the mascot's clip
   path, with `preserveAspectRatio="xMidYMid slice"`, and a dark radial scrim
   (0.42 → 0.14 at 65% → 0) so a white face stays visible on a pale picture.
   The address went in as a typed React `href`, not as text in the raw SVG,
   because "interpolating an attachment URL into raw HTML would be an
   injection path". A test checked that `"/><script>` comes out escaped
   (`eb6fad2c0`, diff lines 113-132, 1166-1173, 1200-1239).
4. An SVG `<image>` gives no `onError`, so a deleted file left an empty
   body. `3a2deecf3` added a hidden `Image()` probe: the living face showed
   only after the probe loaded, else the gradient mascot.
5. iOS drew the same thing in a Canvas, with a three-way outcome
   `flatImage`, `livingMascot`, `gradientMascot` (`23746fefc`).

Why it was removed, from the commit `eb6fad2c0`: "Reviewed visually and
rejected: a bot's own picture should be shown as it is, with no eyes or
mouth painted over it. The "face" crop and every mechanism that painted a
mascot face onto a user's image are removed — custom images are flat
circle/rounded/square crops again, exactly as before this branch." The ten
mascot bodies stayed. The design document got a "Dropped (2026-09-01)" note
(`docs/superpowers/specs/2026-08-31-mascot-shape-catalog-design.md:13-22`).
The visual check of the plan's last task ("Confirm it lands on **Living**,
fills the body, and the face blinks", plan `:1794-1796`) is where the mode
failed.

What stays today:

- `resolveBotAvatarOutcome` stays with two outcomes. The commit kept it
  because it "keeps the only test of the image-failed fallback"
  (`renderToStaticMarkup` fires no `onError`) (`Avatar.tsx:236-249`;
  `Avatar.test.ts:140-165`).
- Its comment points to `ios/Sources/CompanionCore/BotAvatarRendering.swift`
  (`Avatar.tsx:238`). The `ios/` folder was deleted in `0d6708c56`
  (2026-10-06, first in v0.1.97). The comment points to nothing.
- The plan `docs/superpowers/plans/2026-08-31-04-mascot-shape-catalog.md`
  still states the Living mode as a goal (`:12`, `:14`) and as tasks 12, 13
  and 16 (`:1361-1575`, `:1704-1773`). It has no "Dropped" note.
- Of the "five leftovers" of `03547e964`, three are about Living: an iOS doc
  comment, a stray blank line in `shared/bot-avatar.ts`, and an iOS fallback
  after a failed crop save that used `.mascot` and so hid the new picture
  (now `.circle`). The other two are about the mascot generator.
- A stored `avatarCrop: "face"` is deleted when the store loads: the store
  compares each field with `botAvatarProfile` and deletes a field that
  differs, then saves the file (`server/store.ts:376-383`, `:534`). The bot then
  shows the mascot, and its `avatarUrl` stays. No release had `face`, so
  only development data could hold it.

## 4. The data

### 4.1 The avatar fields of a bot

| Field | Type | Limits | Default | Source |
|---|---|---|---|---|
| `avatarUrl` | string or null | the address rule of 3.1, and the file exists | none (mascot) | `packages/phone-protocol/src/bot-avatar.ts:65-70` |
| `avatarCrop` | `mascot` \| `circle` \| `rounded` \| `square` | the enum | `mascot` | `:28` |
| `avatarZoom` | number | 1 to 3, 2 decimals | 1 | `:40-50` |
| `avatarFocusX`, `avatarFocusY` | number | 0 to 1, 3 decimals | 0.5 | `:43`, `:52-57` |

The fields are in `bots.json` with the rest of the bot record. The load
deletes a field that `botAvatarProfile` refuses, and a zoom of 1 (the
default). Then it saves `bots.json` (`server/store.ts:376-390`, `:534`).
`profileSnapshot` has only name, title, description, soul, folder,
notifications and spoken replies (`server/profile-revision.ts:5-17`). So the
profile history has no avatar field, and the generate route records no
profile version.

### 4.2 The picture file

A file in `<data>/attachments/` with the name `<uuid><ext>`, mode `0600`,
written with a `wx` partial file and a hard link (`server/attachments.ts:628-681`).
At most 10 MiB (`:23`). An upload can be PNG, JPEG, GIF or WebP. An AI
picture can be PNG, JPEG or WebP (`server/image-generation.ts:349-352`).
For OpenAI the AI avatar is 1024 × 1024, quality `low`, WebP
(`server/image-generation.ts:77`, `:93`).

### 4.3 The provider settings (`imageGen` in `config.json`)

| Field | What | Source |
|---|---|---|
| `primary`, `fallback` | `{ provider, model? }`. Provider is one of `openai`, `xai`, `gemini`, `openrouter`, `higgsfield`, `custom`. `fallback: null` clears it | `shared/image-generation.ts:2`, `:59-77`; `server/image-generation-config.ts:31-37` |
| `maxPerTurn` | 1 to 10, default 4 (bot tool only) | `shared/image-generation.ts:5` |
| `complexity` | `low` \| `medium` \| `high` (GPT-Image-2.6 only) | `:6`, `:10-12` |
| `key` | the OpenAI image key | `:70` |
| `geminiKey`, `customApiKey` | the Gemini key, the custom gateway key | `:71-73` |
| `customUrl`, `customModel` | the gateway base URL (at most 2,048 characters) and model | `server/image-generation-config.ts:12-29` |
| `provider` | the old single provider: `openai` \| `xai` \| `custom` | `shared/image-generation.ts:1` |

The xAI and OpenRouter image keys are not here. They are `xai.key` and
`openrouter.key`, the keys of the engines (`server/image-generation.ts:98`,
`:113`). Default models: `gpt-image-2`, `grok-imagine-image-2.0`,
`gemini-2.5-flash-image`, `google/gemini-2.5-flash-image`,
`nano_banana_pro`, and none for custom (`shared/image-generation.ts:15`).

### 4.4 Where the keys are, and who sees them

1. In `config.json` as plain text, written atomically with mode `0600`
   (`server/config.ts:990`). Each config backup also has them, also `0600`
   (`server/config-backup.ts:103`).
2. Environment variables win over the file: `OMB_OPENAI_IMAGE_KEY`,
   `OMB_CUSTOM_IMAGE_KEY`, `OMB_GEMINI_IMAGE_KEY` (`server/config.ts:750-753`).
   The desktop shell puts the keys of its own store into these variables at
   start (`:715`). After a key save, `syncCredentialEnv` changes the
   variable of the server process, or deletes it for `""` (`:793-795`).
3. Engines: the three image-only variables are removed from the
   environment of each engine process (`server/credential-env.ts:4`,
   `:31-33`, `:57-60`). The xAI and OpenRouter keys go to the Grok and
   OpenRouter engines on purpose, because they are engine keys
   (`server/config.ts:1116`, `:1121`).
4. The window: `configStatus` sends `imageGen: avatarImageStatus(cfg)`,
   which has booleans and no key (`server/index.ts:11556`, `:11588`;
   `server/avatar-image.ts:21-41`). `savedKeys` has `last4` for a key of 12
   or more characters, for an admin only. A client session gets the status
   without any `last4` (`server/key-hint.ts:4-15`, `:33-37`;
   `server/index.ts:11643-11655`). `customUrl` goes to each session, also a
   client one (`server/avatar-image.ts:33`).
5. A bot never gets a key. The bot tool can only name a provider, and only
   the base or the backup (`server/routes/image-tools.ts:97-104`).
6. Errors never hold the provider's body: "never return the body because it
   can repeat auth headers or signed URLs" (`server/image-generation.ts:314`).
7. The encrypted workspace backup leaves out the provider keys of
   `config.json` (`server/workspace-backup.test.ts:51`, `:173`, `:199`).
8. Redaction: when `config.json` cannot be parsed, the warning says only
   "invalid JSON", because "JSON.parse errors can quote the input; a
   credential must never reach the log" (`server/config.ts:704-710`). The
   shared redaction has patterns for OpenAI (`sk-`), xAI (`xai-`) and Google
   (`AIza`) keys (`shared/redact.ts:18`, `:20`, `:32`). The text of a failed
   turn goes through `redactSecretsInText` before a notification
   (`server/index.ts:7938`). An avatar error never holds a key, because it
   names only the provider, the HTTP status and the model.

## 5. The UI

### 5.1 The look editor in the bot panel (`AvatarEditorCard.tsx`)

- A dialog "Edit avatar" with three tabs: Bot, Generate, Upload
  (`botPanel.avatar.tabBot/tabGenerate/tabUpload`). It opens on Upload when
  the bot shows a picture, else on Bot (`:64-65`). Escape closes it
  (`:99-104`).
- "Reset" at the top, off while busy (`:131-139`).
- Bot tab: the mascot picker (the mascot worktree). A pick there also sets
  crop `mascot` when a picture showed (`:71`).
- Generate tab: `AvatarImageGenerator`, off while an upload runs
  (`:238-246`).
- Upload tab (`:251-298`):
  - organization icons
  - the framing frame, when a picture shows
  - a drop zone "Drop a picture here, or choose one", with a spinner
  - "PNG, JPEG, GIF, or WebP · up to 10 MB"
  - the shape control Circle, Rounded, Square
  - the trash button "Remove picture"
  - the hint "After uploading, drag the picture to reposition it and scroll
    to zoom."
- The error line has `role="alert"` (`:302`).
- No Save or Cancel: each control saves at once.

### 5.2 The avatar card in bot settings (`BotProfileAvatarCard.tsx`)

One long card in the Identity section (`IdentitySection.tsx:44`):

1. "Avatar" and "Reset mascot" (`:39-47`).
2. Organization icons (`:51`).
3. The framing frame when a picture shows, else a live 112 px `BotAvatar`
   (`:52-64`).
4. "Upload image" with a spinner, the trash button, "PNG, JPEG, GIF, or
   WebP · up to 10 MB" (`:67-96`). No drag and drop.
5. Shape: Mascot, Circle, Rounded, Square (`:101-118`).
6. For the mascot only: face colour, material, expression, body and festival
   rows (`:120-147`, `:179-202`). Colour always (`:149-177`).
7. The generator at the bottom, off while an upload runs (`:204-209`). The
   error with `role="alert"` (`:211`).

### 5.3 The generator (`AvatarImageGenerator.tsx`)

- "Generate with AI".
- "Uses {provider}, as set in Image generation." or "No image provider is
  set up yet.", with "Open image settings" (`:34-42`). The provider is the
  base when it is set up, else the backup (`:26-27`). The provider names
  are English text in the code, not in the locale files (`:8`).
- A text box "Avatar generation direction", placeholder "Optional direction,
  e.g. “a calm navigator inspired by {name}”", at most 400 characters, with a
  counter `n/400` (`:45-55`). Off while busy or when no provider is ready.
- "Generate avatar", or a spinner and "Generating…" (`:56-66`). An empty
  direction is allowed.

### 5.4 States

| State | What the person sees |
|---|---|
| No provider | "No image provider is set up yet." The text box and the button are off |
| Uploading | A spinner in the upload button. The generator is off |
| Generating | A spinner and "Generating…". Busy also blocks a second upload or generate in this window |
| Error | The message under the card, with `role="alert"`. The server's text shows as it is, for example "avatar changed while generation was in progress" |
| Image does not load | The mascot, with no message |

The text "up to 10 MB" and the draft error "smaller than 10 MiB" name the
same limit of 10 × 1024 × 1024 bytes in two ways
(`bot-creation-draft.ts:87`).

## 6. The tests

| Test | What it proves |
|---|---|
| `server/bot-avatar.test.ts:14-61` | Four crops only. Outside, SVG, `../` and `data:` addresses refused. Windows and POSIX paths make an address. Zoom and focus clamp. Radius per crop. Bad stored data gives the mascot with no address |
| `server/avatar-image.test.ts:29-45` | The direction limit. The brief. The copy of the avatar fields sees a later change |
| `server/avatar-image.test.ts:47-117` | The request of each provider: endpoint, model, size, quality, format. Each key goes only to its provider. A blank custom key sends no header |
| `server/avatar-image.test.ts:119-164` | The status has no key. A custom provider needs a URL and a model. Bad URLs give 409 with no network call. A missing key is never taken from another provider |
| `server/avatar-image.test.ts:166-289` | Each error path of 3.5: no data, bad base64, SVG, HTML, GIF, URL only, bad JSON, HTTP errors with no body, redirects, network errors, size limits, time-outs, stream errors |
| `src/components/Avatar.test.ts` | The picture or mascot choice. Zoom and focus in the markup. Marks. The two outcomes of `resolveBotAvatarOutcome` (static markup, so no real `onError`) |
| `src/components/BotIdentityAvatars.test.ts` | Callers pass the picture through. A deleted bot gives the mascot |
| `src/components/BotProfileAvatarCard.test.ts` | The card markup: body buttons, the framing text and "150%", which rows show for which crop |
| `server/package-import.test.ts:64-81`, `:151` | An imported bot gets a stored picture. Two imports give two files |
| `server/package-export.test.ts:347-358` | A picture over 64 KB, with wrong magic bytes, or a GIF is left out with a reason |
| `server/workspace-backup.test.ts:156-211` | The avatar file and address come back after a restore. The key does not |
| `server/host/delete-leftovers*.test.ts` | Pictures in the kept set stay. An unreadable kept set deletes nothing |
| `docs/verification/avatar-providers.md` | A manual check against a fake Images API that echoes the key and returns a metadata URL. Last run 2026-09-09 |

No test covers the generate route itself: the 409, the save, the crop rule
or the delete of the file when the bot is gone. No test covers upload,
remove, reset or the error text in the cards. The manual check describes an
older card with its own provider fields ("Connection settings", "Remove
saved key"), and expects "Custom image generation failed (HTTP 401)",
while the code now adds ", model <m>" (`docs/verification/avatar-providers.md:18-33`;
`server/image-generation.ts:315`). That document is out of date.

## 7. Ours compared

We have no avatar code yet. `crates/bot-core/src` has only `lib.rs`. The
attachment store is proposal P301 (`bot-core::attachments`), and the key
storage is P19 to P21 (`docs/plan/write-only-secrets.md`). Part 46 has no
step in `docs/plan/README.md`.

| Reference | What it does | Ours (crate and module) |
|---|---|---|
| `packages/phone-protocol/src/bot-avatar.ts` | Avatar fields, crop enum, address rule, clamps | `bot-protocol::bot` (a `BotAvatar` type with an `AvatarCrop` enum and an `AttachmentId`) |
| `server/attachments.ts` (`saveImage`, `attachmentExists`) | One store for chat images and avatars | `bot-core::attachments` (P301) |
| `server/routes/bot-settings.ts:77-130`, `bot-patch.ts:199`, `bots-create.ts:163` | Set, check and generate an avatar | `bot-core::bots` (a command that sets the avatar), called by `bot-desktop` Tauri commands |
| `server/avatar-image.ts`, `server/image-generation.ts` | The brief and the provider client | A trait `ImageProvider` in `bot-core`, with a `reqwest` client in `bot-desktop` (or `bot-cli`). `bot-core` does no network I/O |
| `server/image-generation-config.ts`, `server/config.ts` (`imageGen`) | Provider settings and keys in `config.json` | Settings in the store. Keys in the keychain (P19) as `Secret` (P20) |
| `server/credential-env.ts` | Image keys removed from engine processes | The allow list of engine variables (`bot-engine`, changelog section 7) |
| `src/components/Avatar.tsx`, `ObjectAvatar.tsx` | Display | `crates/bot-desktop/ui` (React, D13) |
| `src/components/avatar-editing.tsx`, `AvatarEditorCard.tsx`, `BotProfileAvatarCard.tsx`, `AvatarImageGenerator.tsx` | Edit | `crates/bot-desktop/ui` |
| `src/lib/bot-creation-draft.ts`, `create-configured-bot.ts` | Draft avatar, upload before create | `crates/bot-desktop/ui`, with one create command in `bot-core` |
| `src/components/ImageGenerationSettings.tsx` | Provider settings page | `crates/bot-desktop/ui` (later, with part 59) |

## 8. Where we can be better

1. **Store an attachment id, not an address.** The reference keeps an
   address string and checks it with a regular expression in three places:
   the schema, `attachmentExists` and the team seed
   (`packages/phone-protocol/src/bot-avatar.ts:65-70`;
   `server/attachments.ts:751-758`; `electron/team-profile-seed.mjs:8`).
   An `AttachmentId` that only the store makes cannot hold an outside
   address or an SVG, so the compiler refuses the wrong state. This is the
   open choice of P302.
2. **Record which files are avatars, and delete an old one safely.**
   Problem in the reference: each replace or remove leaves the old file on
   disk forever, because "the current attachment record has no provenance"
   (`docs/avatar-storage.md:17-33`). With the reference table of P304, a
   file that no bot, no message and no profile uses can go. Judgment call:
   no release problem of changelog section 5 names it.
3. **Reset clears the picture, or the notification follows the crop.**
   Problem in the reference: Reset keeps `avatarUrl` with crop `mascot`
   (`src/components/avatar-editing.tsx:24`), and the notification sends
   `bot.avatarUrl` with no crop check (`server/notify.ts:74`;
   `server/index.ts:6756`). So the window shows the mascot and the phone
   banner shows the old picture. Judgment call: no release problem names it.
4. **One avatar generation for each bot at a time.** Problem in the
   reference: two requests both pay the provider, and the second one gets
   409 and loses its picture (`server/routes/bot-settings.ts:87-92`). A
   per-bot guard that refuses a second start before the provider call saves
   the cost. Release problem: "The same work done or delivered two times,
   or lost" (v0.1.83, v0.1.150): the provider charges two times, and one
   picture is lost.
5. **Cancel the provider call when the person leaves.** Problem in the
   reference: the avatar call gets no cancel signal, so it runs for up to
   120 seconds after the window closes, and it can still change the bot
   (`server/avatar-image.ts:80`). The bot tool does cancel
   (`server/routes/image-tools.ts:175`). Judgment call: the call has a
   limit of 120 seconds, so it is not "a wait that does not end".
6. **The window does not patch the generated avatar a second time.** The
   server already saved it (`server/routes/bot-settings.ts:99`), and the
   window sends `avatarUrl` and the crop again (`avatar-editing.tsx:194-201`).
   One write is less code and no second event. Judgment call.
7. **Reset zoom and focus for a new AI picture, as upload does.** The
   route and the window keep the framing of the old picture
   (`server/routes/bot-settings.ts:99`; `avatar-editing.tsx:194-201`;
   upload resets it at `:158-160`). Judgment call: a small UI bug.
8. **A failed import or create deletes the pictures it saved.** Problem in
   the reference: the import rollback deletes bots and routines but not the
   saved pictures (`server/package-import.ts:506-518`), and a failed create
   leaves the uploaded file (`src/lib/create-configured-bot.ts:9-19`,
   `:90-100`). Release problem: "The same work done or delivered two times,
   or lost": a retry uploads the same file again.
9. **Keep the load from deleting fields on its own.** The store deletes
   an avatar field that the parser refuses and saves the file
   (`server/store.ts:376-383`). This is how a stored `face` crop disappeared.
   If a later version makes the address rule narrower, an older valid value
   is deleted at the first start. We keep the stored value, show the
   mascot, and refuse it only on the next write. Judgment call: the read
   did not fail. The load parsed the file, then dropped a value. This is
   only near the release problem "A file written over after a failed read"
   (v0.1.103, v0.1.151).
10. **Keys out of `config.json`.** The image keys are plain text in
    `config.json` and in each config backup (`server/config.ts:990`;
    `server/config-backup.ts:103`). P19 and P20 already answer this. Release
    problem: "A secret or an access right in the wrong place" (v0.1.92,
    v0.1.181).
11. **One test of the generate route.** The reference tests the provider
    client well but not the route (section 6). With a fake provider and an
    in-memory store, a test proves the 409, the crop rule and the file
    delete. This follows `AGENTS.md` ("Test the runtime with a fake
    driver"). Judgment call.

### The problems of changelog.md section 5 in this feature

- **A secret or an access right in the wrong place.** Partly. The keys never
  reach the window, a bot or a log, and the three image keys are removed from
  engine processes (section 4.4). But they are plain text in `config.json`
  and its backups, and the xAI and OpenRouter keys are shared with the
  engines on purpose. The avatar routes are admin-only, so a client session
  cannot spend a key (`server/request-auth.ts:540-547`). `customUrl` goes to
  client sessions.
- **A file written over after a failed read.** No for the picture file: a
  new file each time, `wx` and a hard link, and a failed provider call
  writes nothing. Near it for the bot record, but the read does not fail.
  The load deletes avatar fields that it does not accept, and saves
  (`server/store.ts:376-383`, `:534`).
  The config save refuses to write when it cannot read the file
  (`server/config.ts:885`).
- **A feature added, then removed or reversed.** Yes: the Living avatar
  (section 3.10). It was never in a release. Also the per-avatar provider
  fields, which moved to the shared settings page (the stale
  `docs/verification/avatar-providers.md`). `changelog.md` needs no
  correction: section 6 is built from release notes, and Living never
  shipped. The first release after the removal, v0.1.48, has only the ten
  mascot bodies.
- **State lost at a restart.** An AI generation lives only in the HTTP
  request. A restart loses the request and the cost. Nothing is saved, so
  the bot keeps its old picture, and the window shows the request's error.
  A draft picture lives in the window's memory and is lost when the dialog
  or the app closes (`src/lib/bot-creation-draft.ts:26-27`, `:89-90`). An
  upload that ends after the window closes leaves a file and no patch.

## 9. Not verified

- How the route handler turns a thrown error with a `status` into the HTTP
  answer, and if it shows the message as it is.
- What the window shows when the server restarts during a generation (a
  network error text is likely, not checked).
- If startup removes `.partial` files that a crash left (P301 says the
  start-up sweep removes those older than 1 hour. This file did not check it again).
- If `store.patchBot` can throw on a disk error after `saveImage`, which
  would leave a file with no bot.
- How the desktop shell stores the image keys (`electron/workspace-credentials.mjs`
  was seen at one line only), and if it also writes them to `config.json`.
- If a diagnostics bundle includes the image keys.
- If the redaction patterns match each image key form: the save check uses
  `^(sk-|sk_|xai-|gsk_|AIza)` (`shared/image-generation.ts:81`), and only
  `sk-`, `xai-` and `AIza` were seen in `shared/redact.ts`.
- The file and the behaviour of the daily image cap at a restart
  (`server/image-daily-cap.ts` not read). Avatars are not in it.
- The Higgsfield sign-in storage (`server/higgsfield-mcp.ts` not read).
- The diffs of the other branch commits of the Living mode (`807fd7623`,
  `8d35f4fd7`, `abbf843b8`, `6614f8f74`, `18f68bc12`, `f76737b65`). Their
  content comes from their subjects and from the "-" lines of `eb6fad2c0`.
- How the phone fetched the avatar bytes (`Session.avatarData(for:)`). The
  `ios/` folder is gone.
- What the team backup restore does with a bot that has no avatar fields.
- What `server/routes/threads.ts:476-484` does for the person's own profile
  picture, which `attachmentInUse` does not name.
- Which commit removed the per-avatar provider fields from the card
  (`ad3df1a13` is a guess from `git log`).
