# Plan: The mascot

The proposals from the research file
[`../research/features/mascot.md`](../research/features/mascot.md)
(batch 14, reference commit `e1cc6a290`). The steps, the pull requests and
the order are in [`README.md`](README.md). The author decides each proposal.
Then it becomes a decision, a pull request or a choice, and its text leaves
this file. A path that starts with `crates/`, `docs/plan/`, `docs/research/`,
`docs/decisions.md`, `docs/comparison.md`, `NOTICE` or `AGENTS.md` is ours.
All other paths are in the reference project.

- **The ant:** the author chose an ant as our mascot (decision D23 of
  [`../decisions.md`](../decisions.md), 2026-11-28). P724, P725, P732 and
  P733 are about the ant.
- **Steps:** part 46 has no step. P726 adds a step for the mascot after step
  8 and the window steps. P710 of [`avatars.md`](avatars.md) also adds a step
  for part 46. They can be one step with two parts (see P726). P727 and
  P729 to P735 go to that step. P729 and P730 also go to steps 2 and 8. P728
  is a gate before any port of the generator.
- **State:** all open. Decide P724 and P725 first: they choose the body and
  the renderer. Then P726 (the step) and P727 (the engine copy).
- **The main finding:** the reference draws its bodies with three
  renderers. On the desktop, the face data of its generator draws only the
  `cursor` body (`src/components/Avatar.tsx:118-135`,
  `packages/phone-protocol/src/object-bodies.ts:144-156`). The vendored
  engine can draw an ant: it takes up to 16 subpaths
  (`packages/phone-protocol/src/open-bot-avatar/path.ts:19-25`) and puts the
  eyes on a chosen part (`open-bot-avatar/volume.ts:635-642`). The NOTICE of
  the reference names the wrong version of that engine (`NOTICE:133-137`).
- **Ours today:** `crates/bot-desktop/ui/src/features/bots/BotAvatar.tsx`
  shows a coloured initial. No crate has mascot code.

## Key facts that the proposals use

- The reference has three face systems:
  1. The `cursor` body: 25 numbered expressions (two eye rings of 48 points
     and one mouth each), the face position of the generator, and its own
     SVG renderer (`packages/phone-protocol/src/cursor-face-data.ts:12`,
     `:73-99`, `src/components/CursorAvatar.tsx`).
  2. The nine other mascot bodies and the 21 object bodies: the vendored
     Open Bot Avatar engine, with 6 states and 2 moods
     (`open-bot-avatar/motion.ts:54-55`). The application maps its 39
     mascot states onto them (`src/components/ObjectAvatar.tsx:20-30`).
  3. The 20 festival bodies: eyes placed by hand, and the pose
     `{gx, gy, wide, shut, smile}` (`src/components/CarvedAvatar.tsx:20-32`).
- On the desktop, `Avatar.tsx:118-135` asks `engineBody()` first, and
  `SHAPE_BODIES` has outlines drawn by hand for nine of the ten bodies
  (`object-bodies.ts:144-156`). The research did not check if the phone
  applications still use the generator data (the clone has no `ios/` or
  `android/`).
- `NOTICE:133-137` names Open Bot Avatar 0.3.0. The vendored code is 0.4.0
  at commit `323ce6ab8bc6b0bc9603a418ee3d91442e4996fc`
  (`open-bot-avatar/README.md:3-5`).

## How an ant fits the reference design

An ant has a head, a thorax, a thin waist, a large abdomen (the "gaster"),
six legs and two antennae. The face goes on the head. Section 7.4 of the
research file has the full notes.

### The generator path (the `cursor` way, with the 25 expressions)

- What an ant can use again:
  - the 25 expressions, the gaze, the mouths and their morph
    (`cursor-face-data.ts`, `CursorAvatar.tsx:654-671`, `:928-934`);
  - the state pools and the effects (`CursorAvatar.tsx:105-122`,
    `:326-450`);
  - the clock (`src/components/mascot-clock.ts:41-137`);
  - the clip check with each expression at four pointer aims
    (`scripts/gen-mascot-bodies.ts:22-30`).
- What must change:
  - The face goes to the wrong part. The search starts at the largest
    circle inside the outline (`gen-mascot-bodies.ts:77-83`,
    `scripts/mascot-bodies/sdf.ts:92-108`). It keeps the position with the
    most room (`gen-mascot-bodies.ts:130-166`). On an ant, the widest part
    is the gaster, so the face goes there. The search must stay in the head.
  - The 25 expressions were drawn for the cursor proportions, in a box of
    228.541 units (`cursor-face-data.ts:3`). A small ant head needs a small
    face scale. The size floor "never smaller than the cursor" fails
    (`gen-mascot-bodies.ts:450-458`).
  - The turn puts the eyes on a sphere with a fixed centre for the cursor
    (`SPHERE_C` 114.2705, `SPHERE_R` 105, `CursorAvatar.tsx:54-55`,
    `:791-833`). The centre must move to the head.
  - The builders write only M, C and Z (`scripts/mascot-bodies/builders.ts:1-5`).
    Thin legs and antennae are possible as filled outlines. The mask is 256
    px wide (`scripts/mascot-bodies/raster.ts:62-102`), so a very thin leg
    can lose pixels.
  - The body is one flat SVG path with a gradient. The legs and the
    antennae cannot move apart from the body.

### The engine path (the shape and object way)

- What an ant can use again: the validation with typed errors
  (`open-bot-avatar/validate.ts:202-286`), the 3D look, the materials
  (flat, fluffy, matte, metallic), the 6 states and 2 moods, the gaze and
  the pointer follow (`open-bot-avatar/follow.ts:39-71`), the ribbons and
  marks (`open-bot-avatar/effects.ts`), reduced motion, and the state map
  (`ObjectAvatar.tsx:20-30`).
- Animal examples: the bull, bunny and cat bodies add ears or horns as more
  subpaths (`packages/phone-protocol/src/object-bodies.ts:36-64`). An ant
  can use the same method. The head, thorax, waist, gaster, 6 legs and 2
  antennae are 12 subpaths. The limit is 16 (`open-bot-avatar/path.ts:19-25`).
- The face: `eyes.x` and `eyes.y` are set by hand. The eyes sit on the
  highest part under both eye centres (`open-bot-avatar/volume.ts:635-642`).
  So the head must be its own subpath, and it must be the highest part
  under the eyes.
- The size of the head: an estimate from the constants, not a run. At eye
  scale 1, the two eyes need about 17 × 17 units of the 0..100 box:
  - the eye size 4 × 11 (`validate.ts:6-7`);
  - a space of at least `EYE_W × scale × 1.75` = 7 (`validate.ts:235-239`);
  - the gaze 1.5 and 1.1 (`validate.ts:17-18`);
  - the clearance 1.5 (`validate.ts:26`).

  The mouth needs more room below the eyes. The full eye boost (1.45) needs
  a gap of 3 (`volume.ts:88`, `:94`). The result is a cartoon ant with a
  large head.
- Other limits of the engine for the outline: inside 6..94
  (`validate.ts:9-10`, `:259-262`); long side 40 or more, short side 14 or
  more, area 600 or more (`validate.ts:265-268`); 400 segments and 6,000
  characters (`path.ts:19-25`). Compact arc flags such as `011` are refused
  (`path.ts:87`).
- What must change:
  - Legs and antennae are thin. They get more slices (`THIN` 4,
    `volume.ts:104-113`). The research does not know how the fur coat looks
    on a leg that is 3 units wide.
  - The `Pose` moves the whole body (`open-bot-avatar/motion.ts:19-51`).
    Walking legs or moving antennae are new work in `motion.ts` and
    `volume.ts`.
  - The engine has no 25 expressions. It has the pill, the happy arc and
    the slit (`motion.ts:12-17`), and one smile
    (`open-bot-avatar/render.ts:370-380`). The smile is a local change of
    the reference (`open-bot-avatar/README.md:15-32`).

### The festival path (the carved way)

- What an ant can use again: the spider is the nearest body to an ant. It
  draws 8 legs as mirrored lines and one thread line above the head
  (`scripts/mascot-bodies/halloween.ts:70-77`, `:126-133`). Antennae can be
  drawn in the same way.
- What must change: the eyes are placed by hand, with no clip check
  (`scripts/gen-carved-bodies.ts` has none). The pose has only `gx`, `gy`,
  `wide`, `shut` and `smile` (`CarvedAvatar.tsx:20-32`). Carved bodies take
  no material and no body colour (`src/components/Avatar.tsx:99-116`).

### What each path uses again

- The state rules and the beats (`src/lib/mascot.ts:160-203`,
  `src/components/mascot-beat.ts:12-25`).
- The 12 colours, the face colours and the materials
  (`src/lib/mascot.ts:51-64`, `packages/phone-protocol/src/bot-avatar.ts:3`,
  `:8`).
- The look fields of the bot and their validation
  (`server/bot-profile.ts:74-77`).

## Proposals

Decide P724 and P725 first.

### P724. One ant, or ant variants (with D23)

- Kind: a choice. D23 says that the mascot is an ant. This proposal chooses
  its form.
- **Problem in the reference:** the body set changed four times in three
  months: ten bodies (2026-09-01); the "Living" body, added and removed in
  one day (commit `eb6fad2c0`); 20 festival bodies (2026-10-21 and
  2026-11-08); then 21 object bodies and the ten bodies drawn again for the
  engine (v0.1.178, "Our own shapes are redrawn to match",
  `announcements/releases.json:401`). Shield and Star moved from the object
  list to the shapes (`object-bodies.ts:135-140`). The release problem: "A
  feature added, then removed or reversed".
- Options:
  - (a) One ant for all bots. Bots differ by colour, face colour, material
    and expression. The body picker goes away. This is the least art and
    the least data. Before its catalog, the reference had one body for all
    bots: "The mascot has one body"
    (`docs/superpowers/specs/2026-08-31-mascot-shape-catalog-design.md:26`).
  - (b) Ant variants in place of the ten shapes, for example a worker, a
    soldier with a large head, and a queen. On the engine path, each
    variant is one validated definition in a table, as `SHAPE_BODIES` is
    (`object-bodies.ts:145-155`). On the generator path, each variant needs
    a run of the solver. The ids are stored, so they must not change (spec
    `:54-65`).
  - (c) Start with (a), and keep the body id as an enum with one value,
    `ant`, so that variants can come later with no change to the data
    (recommended).
- Why (c): one body first keeps the data small while we learn what a
  person wants. An enum body id lets variants come later with no migration.
- Crates: `bot-protocol` (the body id enum, P730), `bot-desktop/ui` (the
  ant definition as data, or `bot-protocol` if a Rust part reads it).
- When the author decides, D23 gets the chosen form.

### P725. Decision: draw the ant with the engine, with its mouth (the step of P726)

- Kind: a decision about the renderer. Better than the reference.
- **Problem in the reference:** two face systems draw the same ten bodies in
  two ways. The generator solves a face for nine bodies that the desktop
  does not use (`Avatar.tsx:118-135`, `object-bodies.ts:144-156`). The two
  definitions of one shape are different (`builders.ts:249-259` and
  `object-bodies.ts:146-154`). The generated file still says that each body
  wears the largest face that it holds (`mascot-bodies.ts:8-9`). The engine
  bodies have 6 states and 2 moods, so most of the 39 mascot states look
  the same on them (`ObjectAvatar.tsx:20-30`). The release problem: "A
  feature added, then removed or reversed": v0.1.178 ("Our own shapes are
  redrawn to match", `releases.json:401`), and the shared face size of the
  spec was replaced by a size for each body in v0.1.178 (spec `:78-93`,
  `gen-mascot-bodies.ts:58-66`).
- Options:
  - (a) The engine path: the head is its own subpath, the eyes are placed
    by hand, with the 3D look and the materials. The gap: 2 eye shapes and
    one mouth, not 25 expressions (recommended).
  - (b) The generator path: 25 expressions. The face search must stay in
    the head, the size floor changes, and the centre of the sphere moves
    (`gen-mascot-bodies.ts:77-83`, `:450-458`, `CursorAvatar.tsx:54-55`).
  - (c) The engine path, with more eye shapes from the 25 expressions. This
    is new work in `eyes.ts` and `motion.ts`, and it needs P728 first.
- Why (a): an ant has many parts. The engine takes 16 subpaths
  (`path.ts:19-25`) and puts the eyes on a chosen part (`volume.ts:635-642`).
  One renderer is less code than three.
- Dependency: the smile of the engine is a local change of the reference
  (`open-bot-avatar/README.md:15-32`). Option (a) with a mouth needs P727
  option (a). With P727 option (b), we must write the mouth again.
- Crate: `bot-desktop/ui/src/features/mascot/`.
- Proposed text for `docs/decisions.md`:

  > **The mascot is drawn by the Open Bot Avatar engine.** The ant is one
  > engine definition: an outline in a 0..100 box, with the head as its own
  > subpath and the eyes on the head. The window draws it with the engine
  > (3D volume, materials, 6 states, 2 moods, gaze, pointer follow and a
  > smile). We do not port the body generator, the 25 cursor expressions or
  > the festival renderer. Why: the reference draws its bodies with three
  > renderers, and on the desktop the output of its generator draws one
  > body only. An ant has many parts, and the engine takes up to 16
  > subpaths and puts the eyes on a chosen part. The generator puts the
  > face on the gaster, the widest part. Alternatives: the generator path
  > with the 25 expressions (it needs a face search in the head, a new size
  > floor and a new turn centre), or the engine with more eye shapes from
  > the 25 expressions (new work, and the license of their source is not
  > known). The reference: `src/components/Avatar.tsx:118-135`,
  > `packages/phone-protocol/src/object-bodies.ts:144-156`,
  > `open-bot-avatar/volume.ts:635-642`, `open-bot-avatar/path.ts:19-25`,
  > `scripts/gen-mascot-bodies.ts:77-83`.

### P726. A step for the mascot (after step 8 and the window steps)

- Kind: a gap. Part 46 has no step.
- What: one step after step 8 (the store) and after the window steps. Each
  part is one or more pull requests:
  1. The look types in `bot-protocol` (P730).
  2. The look columns of the bot in `bot-core`, saved with their event in
     one transaction (P729).
  3. The ant definition and the renderer in
     `crates/bot-desktop/ui/src/features/mascot/`, with the injected clock
     (P731), the face on the head (P732) and static legs (P733).
  4. The pickers (colour, face colour, material) in the avatar editor of
     [`bot-settings-ui.md`](bot-settings-ui.md).
  5. `crates/bot-desktop/ui/src/features/bots/BotAvatar.tsx` (a coloured
     initial today) shows the ant in the sidebar (36 px) and in the chat
     header (24 px).
- Gates: P728 before a port of the generator, the builders or the 25
  expressions. P727 before the copy of the engine.
- Options:
  - (a) One step for part 46 with two parts: the mascot (this proposal) and
    the pictures (P710 of [`avatars.md`](avatars.md)) (recommended).
  - (b) Two separate steps, one for the mascot and one for the pictures.
- Why: the renderer needs the stored look, and the look needs the bot row
  of step 8. The mascot and the picture share the five avatar fields and
  the editor card, so one step keeps them together.
- Reference: `server/store.ts:1265-1289`; `src/components/Avatar.tsx:251-310`;
  `DESIGN.md:194-195` (rows of 36 px, pinned tiles of 60 px).
- Changelog problem: none. A gap, not a release problem.

### P727. Decision: copy the engine with a correct NOTICE, and choose the form of the copy (with D2)

- Kind: a decision, added to D2 of `docs/decisions.md`. Better than the
  reference.
- **Problem in the reference:** the NOTICE names version 0.3.0, but the code
  is 0.4.0 (`NOTICE:133-137`, `open-bot-avatar/README.md:3-5`). The last
  change to the NOTICE came with the commit that vendored 0.3.0. The update
  commit `93348be49` did not change it. The local changes must be applied
  again by hand at each update (`open-bot-avatar/README.md:37-38`). The
  local changes carry a comment mark with the name of the reference
  (`README.md:15-32`): the smile (`mouthMark`), the flat mouth on the fur
  coat, the `matte` and `metallic` materials, the rainbow ribbon colours,
  no `<title>` in the SVG, and comments in other words. The release
  problem: "A feature added, then removed or reversed": the engine changed
  in v0.1.178 (0.3.0 vendored), in v0.1.180 (0.4.0, "drawn by Open Bot
  Avatar 0.4.0", `releases.json:309`) and in v0.1.182 (Matte and Metallic,
  `releases.json:165`).
- License facts: MIT, "Copyright (c) 2026 Dominik Scholz"
  (`open-bot-avatar/LICENSE:3`). The notice must stay in all copies or
  substantial portions (`LICENSE:12-13`). The NOTICE of the reference
  credits the engine, with the wrong version. The root README credits it
  with no version (`README.md:277`, `:555-558`).
- What our `NOTICE` needs for a port:
  1. the name "Open Bot Avatar" and its URL;
  2. the version 0.4.0 and the commit `323ce6ab`;
  3. the copyright line and the words "used under the MIT License";
  4. the LICENSE file, copied next to the ported code;
  5. a line in "Adapted components" that names
     `packages/phone-protocol/src/open-bot-avatar/` (`AGENTS.md`).
- Options:
  - (a) Copy the source with its LICENSE into `bot-desktop/ui`, and keep our
    changes as a list of patches that a test checks. This keeps the mouth
    and the materials (recommended).
  - (b) Use the npm package `open-bot-avatar` 0.4.0. We lose the mouth,
    matte and metallic, and P725 option (a) then needs a mouth of our own.
    Check the license of the npm package before we add it.
- In both options: no comment marks or names of the reference in our code
  (`AGENTS.md`). The `dom/` folder needs DOM types. The reference keeps it
  out of its protocol type check (`packages/phone-protocol/tsconfig.json:19`)
  and out of lint (`.oxlintrc.json:21`).
- Why: a NOTICE that a test checks against one version file cannot go
  stale. A list of patches makes an update a check, not a manual task.
- Proposed text, added to D2 of `docs/decisions.md`:

  > - **Vendored MIT code (Open Bot Avatar):** the mascot engine is a copy
  >   of Open Bot Avatar 0.4.0, commit
  >   `323ce6ab8bc6b0bc9603a418ee3d91442e4996fc`,
  >   https://github.com/DominikScholz/open-bot-avatar, Copyright (c) 2026
  >   Dominik Scholz, MIT. Its LICENSE file stays next to the copy.
  >   `NOTICE` names the version and the commit, and "Adapted components"
  >   names the reference path `packages/phone-protocol/src/open-bot-avatar/`.
  >   Our changes to the copy are a list of patches. A test checks that the
  >   NOTICE version is the version of the copy. The NOTICE of the
  >   reference names 0.3.0 for 0.4.0 code (`NOTICE:133-137`), and we do not
  >   copy that error.

### P728. Find the license of "Blob Studio" before a port of the generator, the builders or the 25 expressions (a gate before P726)

- Kind: a gap, a license gate. A judgment call: it is about a license, not
  a release problem.
- **Problem in the reference:** comments say that the builders and the
  cursor artwork come from "Blob Studio"
  (`scripts/mascot-bodies/builders.ts:2`,
  `scripts/mascot-bodies/geometry.ts:143`, and
  `src/components/CursorAvatar.tsx:1` "Made with Blob Studio"). The plan
  says that two files were "copied verbatim from Blob Studio"
  (`docs/superpowers/plans/2026-08-31-04-mascot-shape-catalog.md:48-49`).
  The NOTICE of the reference does not name it. The face data of the 25
  expressions can also come from it. Its source and its license are not
  known.
- Options:
  - (a) A gate: find the source and the license before a port of these
    files (P725 options b and c only) (recommended).
  - (b) No gate, because P725 option (a) does not use these files.
- Why: `AGENTS.md` asks us to check the license of each source before we
  use it. An ant that we draw on the engine path (P725 option a) does not
  need these files.

### P729. One look record, saved with its event in one transaction, and carried whole by an export (steps 2 and 8)

- Kind: a choice. Better than the reference.
- **Problem in the reference:**
  - The export of a package drops the face colour, the body colour and the
    material. The appearance schemas have only `color`,
    `mascotExpression`, `mascotBody` and `avatar`, and the parse strips
    unknown fields (`shared/package-format.ts:6`, `:234-238`, `:321-326`).
  - Share and the team manifest carry only the body (`server/share.ts:93`,
    `server/team-manifest.ts:44`). The team backup and bot links keep all
    the fields (`server/team-backup.ts:118`, `:188`,
    `server/bot-link/link.ts:217-218`).
  - `patchBot` changes the memory before the save, so a failed save shows a
    look that a restart loses (`server/store.ts:1483-1484`, `:1499`).
  - The load casts `bots.json` and does not parse it
    (`server/registry-store.ts:111`). A bad value is dropped only when the
    window draws it (`Avatar.tsx:51`, `:124`, `:169`).
  - The release problem: "State lost at a restart or a crash". Each look
    field came in a release with no change to the export: the face colour
    (2026-10-28, commits `6a5cb9df7` and `b069b7e2d`), the custom body
    colour (v0.1.178, `releases.json:401`), Fluffy (v0.1.180,
    `releases.json:309`), Matte and Metallic (v0.1.182,
    `releases.json:165`).
- Options:
  - (a) One `Appearance` type in `bot-protocol`. Each copy path (export,
    share, backup, link) takes the whole type. `bot-core` writes the look
    and its event in one transaction (recommended).
  - (b) Follow the reference: separate fields, copied path by path.
- Why: with one type, a new field cannot be missed in one of six copy
  paths. The rule of `AGENTS.md` "the row and its event in one
  transaction" removes the save that changes memory first.
- Crates: `bot-protocol` (step 2, the type), `bot-core` (step 8, the bot
  row), the export of a bot when it comes.

### P730. Closed enums with typed refusals for the body, the face colour and the material (steps 2 and 8)

- Kind: a choice. Better than the reference.
- **Problem in the reference:**
  - An unknown body id becomes `cursor`, with no log
    (`packages/phone-protocol/src/mascot-bodies.ts:125-127`,
    `packages/phone-protocol/src/bot-body.ts:20-22`).
  - An unknown stored expression becomes null, with no log
    (`src/lib/mascot.ts:118-122`).
  - The engine changes an unknown state to `idle`
    (`open-bot-avatar/motion.ts:69-74`).
  - `mascotExpression` accepts any string of up to 80 characters
    (`server/routes/bot-patch.ts:140-142`). On the wire it is `string`
    (`wire.ts:82`). The body colour is a plain `string` on the wire
    (`wire.ts:288`), but the server checks `#rrggbb`
    (`bot-avatar.ts:13-16`).
  - Ten old face names stay as aliases after the face set was replaced
    (`src/lib/mascot.ts:103-114`, commit `b09439bf7`, 2026-08-12).
  - Shield and Star left the object list in v0.1.178, and a stored
    `obj-shield` now falls back with no log (`object-bodies.ts:135-140`).
  - The release problem: "A feature added, then removed or reversed": the
    face set was replaced (2026-08-12), and the object list changed
    (v0.1.178).
- Options:
  - (a) serde enums refuse a bad value at the edge with a typed error. An
    old value gets an explicit alias, not a silent fallback. A hex newtype
    puts the colour rule in the wire type (recommended).
  - (b) Follow the reference: strings, with a fallback when the window
    draws.
- Why: `AGENTS.md` asks for typed refusals. The compiler refuses a body or
  a material that does not exist.
- Note: P716 of [`avatars.md`](avatars.md) asks that the load of the store
  does not delete a value that it does not know. Decide the two together:
  a refusal at the edge for a new write, and a kept "not known" value for
  an old row.
- Crates: `bot-protocol` (step 2), `bot-core` (step 8, the validation).

### P731. One injected clock and one seeded random source for all mascot motion (the step of P726)

- Kind: a choice. Better than the reference.
- **Problem in the reference:**
  - The engine reads `performance.now()` in two places, and no caller can
    inject a clock (`open-bot-avatar/dom/clock.ts:31`, `dom/mount.ts:267`).
  - `CursorAvatar` draws random delays (`CursorAvatar.tsx:705`). A test
    mocks `Math.random` only one time (`CursorAvatar.motion.test.ts:158`).
  - Two tests wait in real time with `vi.waitFor` and no fake timers
    (`src/components/ObjectAvatar.dom.test.ts:38`, `:52`).
  - The motion seed comes from a React id, not from the bot
    (`src/components/mascot-motion.ts:176-181`, `CursorAvatar.tsx:582-583`),
    but the comment says "per-bot" (`mascot-motion.ts:170`).
  - The release problem: "Tests that fail by chance, and a red main
    branch" ("unblock main", v0.1.77; "fix the five timing flakes that kept
    blocking releases", v0.1.99; "not on a clock or a lucky port",
    v0.1.133).
- Options:
  - (a) One clock and one seed, injected, for all mascot motion. The seed
    comes from the bot id (recommended).
  - (b) Follow the reference.
- Why: the reference already has an injected clock for the cursor
  (`mascot-clock.ts:17-26`) and a pure engine motion ("no wall clock, no
  Math.random", `open-bot-avatar/motion.ts:1-5`). One clock and one seed
  for both make each mascot test exact. A seed from the bot id makes the
  same bot move in the same way after a reload.
- Crate: `bot-desktop/ui`.

### P732. Put the face on the head of the ant, and check it with each face (the step of P726)

- Kind: a gap for the ant. A judgment call.
- Problem: on the engine path, the head subpath must be the highest part
  under the eyes (`volume.ts:635-642`). On the generator path, the face
  search goes to the widest part (`gen-mascot-bodies.ts:77-83`). The
  validation of the engine checks only the plain eye with a margin of 1.2
  (`validate.ts:271`). It does not check the happy arc, the eye boost (1.45,
  `volume.ts:664-669`) or the mouth.
- What: a test validates the ant definition. It checks that each eye shape
  (pill, happy arc, slit) and the mouth stay inside the head at all gaze
  aims, with the boost. This follows the check of the generator: each face
  at four pointer aims, and a failure stops the build
  (`gen-mascot-bodies.ts:22-30`, `:494-500`).
- Options:
  - (a) Add the test with the ant definition (recommended).
  - (b) No test. Look at the ant by eye.
- Why: a small head has little room. The check stops a face that clips at
  its edge.
- Crate: `bot-desktop/ui`.

### P733. Static legs and antennae first, and moving legs later (the step of P726)

- Kind: a gap for the ant. A judgment call.
- Problem: the engine `Pose` has yaw, pitch, roll, lift, squash, gaze,
  blink, eye shape, ribbons and marks, and no transform for one part
  (`open-bot-avatar/motion.ts:19-51`). The carved pose has no motion of a
  part (`CarvedAvatar.tsx:20-32`). The reference has no example of a part
  that moves.
- Options:
  - (a) Static legs and antennae first (recommended).
  - (b) Moving antennae or walking legs: new work in `motion.ts` and
    `volume.ts`.
- Why: a static ant uses all the motion that exists: bob, hop, lean, roll,
  ribbons and marks.
- Crate: `bot-desktop/ui`.

### P734. Make shape data in memory with a check, not by writing over tracked files (only with P725 option b)

- Kind: a choice. Better than the reference. It applies only if we keep a
  generator.
- **Problem in the reference:** `scripts/mascot-bodies/generated.test.mjs`
  writes over the committed catalog and does not restore it when the
  generator fails (`:56-63`). The heavy tests start a child process with
  limits of 120 s (`:52`, `:86`, `:107`, `carved-bodies.test.mjs:39`). The
  Swift and Kotlin catalogs have no drift check: their tests were deleted
  in `0d6708c56` (2026-10-06). The release problem: "Tests that fail by
  chance, and a red main branch" ("unblock main", v0.1.77; "fix the five
  timing flakes that kept blocking releases", v0.1.99; "not on a clock or a
  lucky port", v0.1.133).
- Options:
  - (a) A `--check` mode that compares in memory (recommended, with P725
    option b).
  - (b) Follow the reference.
- Why: a check in memory leaves the tree clean and needs no child process.
- Crate: `bot-desktop/ui` (scripts).

### P735. The face comes from the typed state of the thread, not from English words (the step of P726)

- Kind: a choice. Better than the reference, as a judgment call. Keep the
  reference if the author prefers it.
- **Problem in the reference:** `stateForBot` picks a face from English
  words in the name, title and description of the bot
  (`src/lib/mascot.ts:171-200`). A pinned face wins over the live states, so
  a pinned bot never shows `alerting`, `working` or `notifying`
  (`:161-168`).
- Options:
  - (a) Follow the order of the reference.
  - (b) The live states first (a failed tool step, busy, unread, a question
    that waits), then the pinned face, and no word rule (recommended).
- Why (b): the live state is the useful signal. A pinned face that hides a
  failure can mislead the person. The word rule matches English only, and
  the window will have more languages (the feature "localization" of
  batch 14).
- Crate: `bot-desktop/ui` (a pure function of the typed thread state).

## The problems of the reference in this feature

- A feature added, then removed or reversed: P724 (the body set changed
  four times), P725 (two face systems for one body set), P727 (the engine
  changed in three releases), P730 (the face set and the object list
  changed).
- State lost at a restart or a crash: P729 (a look field that the export
  drops, and a save that changes memory first).
- Tests that fail by chance, and a red main branch: P731 (the real clock
  and random delays), P734 (a test that writes over tracked files).
- Judgment calls, with no release problem: P728, P732, P733, P735.
- A gap: P726.
- Also for `docs/comparison.md`: the row "Mascot" of section 11.6 says that
  the generator places the face of each body. On the desktop it now does
  this for the `cursor` body only (section 3.2 of the research file). The
  record of batch 14 corrects the row.
