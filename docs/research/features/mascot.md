# The mascot: body shapes, faces and the vendored avatar engine

The reference project at commit `e1cc6a290` (2026-11-28, v0.1.186 is the
latest release). This record covers three rows of
[`reference-features.md`](../reference-features.md), part 46:

- "Ten mascot body shapes for a bot, made by a generator"
  (`docs/superpowers/plans/2026-08-31-04-mascot-shape-catalog.md`).
- "The 25 face expressions, the gaze and the mouths of the mascot" (the same
  plan).
- The vendored Open Bot Avatar engine
  (`packages/phone-protocol/src/open-bot-avatar/README.md`).

Our group for this feature is "later". It has no plan step yet. Its crate is
`bot-desktop`. `bot-protocol` can hold the shared shape data and the look
types.

The author gave a new input during this work: **our mascot is an ant.**
Sections 7 and 8 say how an ant fits each part of the reference design.

### What this file adds to earlier research

- [`look-and-design.md`](look-and-design.md) has mascot motion as a design
  rule (`DESIGN.md:305-333`) and reduced motion (its 3.15). This file adds
  the motion code itself: the shared clock, the frame rates, the beats and
  the engine animator (3.6 to 3.8). The reduced-motion hook stays in
  look-and-design.md.
- [`bot-settings-ui.md`](bot-settings-ui.md) has the avatar editor card: its
  tabs, the body grid, Reset and "Give this body to the other bots". This
  file adds the three pickers inside the card (5.2), the validation of the
  look fields (3.9) and the gaps in persistence (3.10).
- [`bot-profile.md`](bot-profile.md) lists the avatar fields of the bot
  record. This file adds the value lists, the wire types and the paths that
  drop some fields (4.1, 3.10).
- All new: the generator and its face solver, the three face systems, the
  vendored engine, the object and festival bodies, the license facts.

The feature "avatars" runs at the same time in another worktree. It owns the
avatar picture storage, the picture providers, AI pictures and the "Living"
avatar (an uploaded picture as the body with the live face on it). This file
names them only where the mascot code touches them.

## 1. In short

A bot in the reference project has a **mascot**: a small animated figure
with a face. The mascot shows the state of the bot. For example, it looks
busy when the bot works and it shows "!" when a tool step failed. The person
chooses how the mascot looks in the avatar editor of the bot.

Terms used in this file:

- **Body**: the outline of the mascot. The code says "body", not "shape". A
  lint rule enforces this (spec `:3-8`). A bot stores the id of its body in
  `mascotBody`.
- **The ten mascot bodies**: `cursor`, `blob`, `circle`, `squircle`,
  `capsule`, `drop`, `shield`, `hexagon`, `diamond`, `star`
  (`packages/phone-protocol/src/mascot-bodies.ts:18`). `cursor` is the
  default. It is the original artwork of the product: a mouse cursor.
- **Generator**: a script that builds the ten outlines and finds where the
  face fits inside each one (`scripts/gen-mascot-bodies.ts`). It writes a
  committed TypeScript file, and Swift or Kotlin on request.
- **Open Bot Avatar** (or "the engine"): an MIT library by another author.
  The reference copies its source into the repository (it "vendors" it) at
  version 0.4.0. The engine turns one flat outline into a 3D-looking body
  with eyes, and animates it (`open-bot-avatar/README.md:3-5`).
- **Object bodies**: 21 extra bodies drawn by the engine, such as a mug, a
  cat or a rocket (`packages/phone-protocol/src/object-bodies.ts:11-16`).
- **Carved (festival) bodies**: 20 costume bodies, 10 for Halloween and 10
  for Diwali (`packages/phone-protocol/src/carved-bodies.ts:12`, `:17`).
- **Mascot state**: one of 39 names of what the bot does, such as `idle`,
  `working` or `alerting` (`src/components/CursorAvatar.tsx:285-324`). The
  person can pin one of 10 of them (`src/lib/mascot.ts:124-135`).
- **Expression**: one of 25 drawn face shapes. Each one is two eye outlines
  of 48 points and one mouth (`packages/phone-protocol/src/cursor-face-data.ts:12`,
  `:73-99`). Expressions have numbers (0 to 24), not names. A state shows
  one expression from a list (its "pool").
- **Gaze**: where the eyes look. It is a value from -1 to 1 on each axis.
- **Material**: the surface of an engine body: flat, `fluffy` (fur),
  `matte` or `metallic`.

The most important fact: **the reference has three face systems, not one.**

1. The `cursor` body uses the 25 expressions, the generator's face position
   and its own SVG renderer (`CursorAvatar.tsx`).
2. The nine other mascot bodies and the 21 object bodies use the engine. The
   engine has no 25 expressions. It has 6 states and 2 moods, and the app
   maps the 39 mascot states onto them (`src/components/ObjectAvatar.tsx:20-30`).
3. The 20 festival bodies use hand-placed eyes and a small pose model of
   their own (`src/components/CarvedAvatar.tsx:20-32`).

So on the desktop, "the 25 expressions" show on the `cursor` body only. The
generator checks all 25 expressions for all ten bodies, but on the desktop
its face data draws only the `cursor` body. Whether the phone apps still use
it for the other nine is not verified (section 9). The nine other
mascot bodies were drawn again by hand for the engine in v0.1.178 (3.2).

## 2. Files read completely

Eight readers (Opus 5.5) read the files in eight groups. Each reader wrote a
report to `.research/<group>.md` (not tracked by git). Paths are relative to
the reference project.

### 2.1 Read completely

| Group | Files (line count) |
|---|---|
| Plan and spec | `docs/superpowers/plans/2026-08-31-04-mascot-shape-catalog.md` (1,831, in ranges 1-300, 301-600, 601-900, 901-1200, 1201-1520, 1521-1831), `docs/superpowers/specs/2026-08-31-mascot-shape-catalog-design.md` (222) |
| Engine geometry | `open-bot-avatar/README.md` (38), `LICENSE` (21), `types.ts` (118), `validate.ts` (286), `path.ts` (463), `contour.ts` (360), `distance.ts` (352), `volume.ts` (691), `color.ts` (105), `examples.ts` (112), `NOTICE` (137), `.oxlintrc.json` (38), `packages/phone-protocol/tsconfig.json` (20) |
| Engine motion | `open-bot-avatar/render.ts` (831), `effects.ts` (450), `motion.ts` (431), `eyes.ts` (157), `mood.ts` (45), `follow.ts` (81), `animator.ts` (89) |
| Engine DOM and objects | `open-bot-avatar/dom/index.ts` (6), `reduced.ts` (18), `eye.ts` (38), `pointer.ts` (51), `clock.ts` (78), `paint.ts` (241), `mount.ts` (377), `dom/fluffy/marks.ts` (54), `dye.ts` (62), `socket.ts` (126), `mesh.ts` (260), `shaders.ts` (326), `renderer.ts` (450), `packages/phone-protocol/src/object-bodies.ts` (162), `shared/object-bodies.ts` (1), `src/components/ObjectAvatar.tsx` (106), `ObjectAvatar.dom.test.ts` (79), `shared/object-bodies.test.ts` (37), `shared/fluffy-coat-edge.test.ts` (72), `shared/avatar-tooltip.test.ts` (13), `scripts/sync-phone-protocol.mjs` (70), `scripts/sync-phone-protocol.test.mjs` (96) |
| Body generator | `scripts/gen-mascot-bodies.ts` (522), `scripts/gen-carved-bodies.ts` (308), `scripts/mascot-bodies/geometry.ts` (163), `sdf.ts` (108), `raster.ts` (102), `solve.ts` (137), `draw.ts` (289), `builders.ts` (262), `carved.ts` (43), `halloween.ts` (134), `diwali.ts` (176), and the tests `builders.test.mjs` (44), `carved-bodies.test.mjs` (83), `catalog.test.mjs` (62), `generated.test.mjs` (108), `geometry.test.mjs` (69), `raster.test.mjs` (54), `sdf.test.mjs` (44); `packages/phone-protocol/src/mascot-bodies.ts` (127), `carved-bodies.ts` (321), `shared/mascot-bodies.ts` (1), `shared/carved-bodies.ts` (1) |
| Desktop logic | `src/lib/mascot.ts` (203), `mascot.test.ts` (70), `mascot-names.ts` (23), `mascot-names.test.ts` (37), `src/components/mascot-motion.ts` (408), `mascot-motion.test.ts` (104), `mascot-clock.ts` (186), `mascot-clock.test.ts` (223), `mascot-beat.ts` (55), `mascot-beat.dom.test.ts` (97) |
| Avatar components | `src/components/CursorAvatar.tsx` (1,064, in ranges 1-360, 360-719, 719-1064), `CursorAvatar.clock.test.ts` (204), `CursorAvatar.motion.test.ts` (346), `CarvedAvatar.tsx` (361), `CarvedAvatar.test.ts` (64) |
| Pickers, preview, persistence | `src/components/MascotFaceColorPicker.tsx` (27), `MascotMaterialPicker.tsx` (29), `MascotBodyColorSwatch.tsx` (56), `src/mascot-preview.tsx` (379), `src/mascot-preview.css` (534), `mascot-preview.html` (12), `server/mascot-face-color.e2e.test.ts` (96), `packages/phone-protocol/src/bot-avatar.ts` (97), `src/components/Avatar.tsx` (342) |

Two long data lines were read cut at 200 characters: the path strings of
`carved-bodies.ts` and `CURSOR_D` in `builders.ts:242`.

### 2.2 Read in ranges

- `DESIGN.md` (448): 18-24, 155-200, 214-219, 240-256, 315-345, 370-385.
- `announcements/releases.json` (1,285): 160-168, 208-216, 304-312,
  396-404, 610-618, 860-866. The repository has no CHANGELOG file.
- The mascot ranges of `packages/phone-protocol/src/wire.ts` (1,000),
  `server/store.ts` (2,254), `server/routes/bot-patch.ts` (810),
  `server/routes/bots-create.ts` (316), `shared/package-format.ts` (1,000),
  `src/state/store.tsx` (3,258), `src/styles.css` (3,990),
  `src/components/Sidebar.tsx` (1,653), `src/components/ChatView.tsx`
  (1,180) and `src/components/bot-panel/AvatarEditorCard.tsx` (306). The
  report `.research/pickers-preview-persistence.md`, section 1, lists each
  range.

### 2.3 Claims that the lead checked against the code

- `NOTICE:133-137` names "Open Bot Avatar 0.3.0". The vendored README says
  commit `323ce6ab8bc6b0bc9603a418ee3d91442e4996fc`, which npm publishes
  as 0.4.0 (`open-bot-avatar/README.md:3-5`). One reader said that the two
  agree. That reader did not read `NOTICE`, so the claim is wrong.
- `Avatar.tsx:99-135` tries a festival body first, then `engineBody()`,
  then `GradientAvatar`. `engineBody` finds all nine non-cursor mascot
  bodies in `SHAPE_BODIES` (`object-bodies.ts:144-162`).
- The face data has 25 expressions (a count of the `ENCODED` lines of
  `cursor-face-data.ts`). The four mouth numbers are the half-width, the
  depth, the drop below the eyes and the tilt in degrees (`mouthFrame`,
  `cursor-face-data.ts:103-121`).
- `patchBot` changes the bot in memory before it saves
  (`server/store.ts:1483-1484`, `:1499`).
- The package appearance schemas have only `color`, `mascotExpression`,
  `mascotBody` and `avatar` (`shared/package-format.ts:234-238`, `:321-326`).
  Unknown fields are stripped (`:6`).
- `ObjectAvatar.dom.test.ts:38` and `:52` wait with `vi.waitFor` and no fake
  timers.
- The engine `Pose` moves the whole body only (`open-bot-avatar/motion.ts:19-51`).
- The spider body draws legs as stroked lines (`scripts/mascot-bodies/halloween.ts:70-77`,
  `:126-133`).
- The generator starts the face search at the largest circle inside the
  outline (`gen-mascot-bodies.ts:77-83`, `scripts/mascot-bodies/sdf.ts:92-108`).

## 3. How it works

### 3.1 The design and its history

1. The plan and the spec of 2026-08-31 set the aim: ten bodies for each bot,
   the same on the desktop and the phone (spec `:10-11`). Before this work,
   the desktop and iOS put the face at different places: `{93,101,0.74}`
   against `(87.04,98.65,0.84)` (spec `:32-34`).
2. The spec put these out of scope: sliders, custom outlines, "surface
   styles", "face variants" and accessories (spec `:43-45`).
3. The ids are persisted and must not change (spec `:54-65`, plan `:28`).
4. The timeline, from git and the release notes (`announcements/releases.json`):
   - 2026-09-01: the catalog, the rename to "body", and the "Living" body,
     which was built and removed on the same day (`eb6fad2c0`).
   - 2026-10-21: Halloween bodies. 2026-10-28: face colour. 2026-11-08:
     Diwali bodies.
   - 2026-11-14: the code moved into `packages/phone-protocol`.
   - 2026-11-18: the face is cut out of the body (`16bb791ea`).
   - v0.1.175: "Mascots hold still at rest" (`releases.json:615`).
   - v0.1.178 (2026-11-23): 21 object bodies, the engine, a custom body
     colour, "Our own shapes are redrawn to match" (`releases.json:401`).
   - v0.1.180 (2026-11-24): Fluffy, "drawn by Open Bot Avatar 0.4.0"
     (`releases.json:309`).
   - v0.1.182 (2026-11-26): Matte and Metallic (`releases.json:165`).

### 3.2 The generator builds the ten bodies

1. `BODY_DEFS` lists the ten bodies in the persisted order
   (`scripts/mascot-bodies/builders.ts:244-260`). A test checks the order
   (`builders.test.mjs:5-13`).
2. Each builder draws on a 200-unit stage and writes absolute M, C and Z
   commands only, because the iOS parser reads nothing else
   (`builders.ts:1-5`, `:43-49`):
   - `blob`: 24 samples with a sine wobble of 0.35, no random numbers
     (`:137-158`, `:249`).
   - `squircle`: a rounded box with radius 50. `capsule`: 150 × 200 with
     radius 75. `drop`: `(156, 194, 0.62)` (`:251-253`).
   - `shield`: `buildCone(190, 200, 0.45, 0.9)`. `hexagon` and `diamond`:
     6 or 4 sides with corners 0.12. `star`: 5 points (`:254-259`).
   - `cursor`: the original artwork, copied byte for byte (`:237-242`).
3. For each body, `solveBody` finds the face position and size
   (`gen-mascot-bodies.ts:68-110`):
   1. Flatten the path and fit it into `FACE_BOX` 228.541
      (`geometry.ts:83`, `:147-156`).
   2. Draw a 256 × 256 mask with the non-zero rule (`raster.ts:62-102`).
   3. Make an exact signed distance field (`sdf.ts:18-81`).
   4. Start at the largest circle inside the outline (`sdf.ts:92-108`).
   5. Search a 5 × 5 grid, coarse to fine, for 8 levels. At each point, find
      the largest face scale by bisection (`gen-mascot-bodies.ts:84-96`,
      `solve.ts:108-119`).
   6. Round the numbers, then make the scale smaller until no expression
      clips (`:100-107`).
4. The test of a face position uses all 25 expressions, all 25 mouths with
   their stroke width, and four pointer aims at ±1 × `GAZE_TRAVEL`
   (`gen-mascot-bodies.ts:22-30`, `solve.ts:38-79`). `PAD` is 2 units
   (`solve.ts:19`).
5. Size rule: the `cursor` scale is capped at 1.0. Each other body gets 0.9
   of its largest fit, capped at 1.5, and never smaller than the `cursor`
   (`gen-mascot-bodies.ts:58-66`, `:450-458`). `anchorAt` then picks the
   position with the most clearance (`:130-166`).
6. Error path: when any expression clips at any aim, the script exits with
   a non-zero code (`:494-500`, `:517-522`).
7. Output: `packages/phone-protocol/src/mascot-bodies.ts`, and Swift or
   Kotlin with `--swift` or `--kotlin` (`:502-514`). `pnpm gen:bodies` runs
   it (`package.json:58`).

**What the desktop draws now.** `Avatar.tsx:118-135` asks `engineBody()`
before `GradientAvatar`. `SHAPE_BODIES` has hand-drawn engine outlines for
the nine non-cursor bodies (`object-bodies.ts:144-156`). So the desktop uses
the generator output for the `cursor` body only. The two definitions of one
shape differ (`builders.ts:249-259` against `object-bodies.ts:146-154`).
The header of the generated file still says that each body wears the
largest face it holds (`mascot-bodies.ts:8-9`).

### 3.3 The festival bodies

1. 20 bodies: pumpkin, ghost, witch, bat, cat, skull, monster, mummy,
   vampire, spider, and rocket, anaar, chakri, sparkler, bomb, laddu,
   chakli, jalebi, katli, karanji (`carved-bodies.ts:12`, `:17`).
2. Each drawing is made of signed distance shapes: circle, ellipse, box,
   polygon, strokes, smooth union, subtract and mirror (`draw.ts:18-112`).
   The outline is traced on a 0.5-unit grid and fitted with cubic curves
   (`draw.ts:115-171`, `:194-289`).
3. The eyes are placed by hand (`halloween.ts:79-134`, `diwali.ts:124-175`).
   `gen-carved-bodies.ts` does no geometry check of its own.
4. The spider draws 8 legs as stroked polylines, mirrored, and one thread
   line above the body (`halloween.ts:70-77`, `:126-133`).
5. The app shows a festival body in place of the chosen body during the
   festival (`wornBody`, `src/lib/festival-dress.ts:84-88`, `Avatar.tsx:253`,
   `:267`).

### 3.4 How a bot gets its state and its face

1. `stateForBot` checks these rules in order (`src/lib/mascot.ts:160-203`):
   1. A pinned `mascotExpression` (`:161-162`). An unknown stored value
      becomes null, and the next rules apply with no error (`:118-122`).
   2. The last message that is not a receipt is a failed tool step:
      `alerting` (`:166`).
   3. The bot is busy: `working` (`:167`).
   4. The bot shows unread work: `notifying` (`:168`).
   5. The last message is a pending options card: `curious` (`:169`).
   6. English keywords in the name, title and description select a face,
      for example `working`, `searching` or `drowsy` (`:171-200`).
   7. Else `idle` (`:202`).
2. A pinned face wins over the live states. A pinned bot never shows
   `alerting`, `working` or `notifying` (`:161` comes before `:166-168`).
3. `LEGACY_STATES` maps 10 old face names to current ones, for example
   `deadpan` to `idle` (`:103-114`).
4. Beats are short faces for an event, 1,400 ms each
   (`src/components/mascot-beat.ts:5`, `:12-25`). For example, `success`
   shows `happy` with a blink, and `failure` shows `sad`. The store raises
   them with `withMascotMotion` (`src/state/store.tsx:794-806`). A beat is
   never persisted (`store.tsx:1859`).

### 3.5 The cursor face: 25 expressions, gaze and mouth

1. `POOLS` gives each of the 39 states a list of expression numbers. The
   first one is the default (`CursorAvatar.tsx:326-366`, `:693`).
2. `EXPR_CADENCE` sets the time between automatic face changes. `BLINK` sets
   the blink interval or null (`:368-450`). The automatic changes use a
   `setTimeout` chain with random delays (`:696-713`). They stop when an
   expression is pinned, at rest, or under reduced motion.
3. A change of expression morphs the eye rings with a critically damped
   spring (`:928-934`). The first draw is a cut, not a morph (`:667`).
4. Gaze: eyes move by gaze × `lookAround` (default 0.5) × `GAZE_TRAVEL`
   `{x: 13.2, y: 8.4}` (`:779-786`, `cursor-face-data.ts:7`).
5. The turn and the spin put the eyes on a pseudo-sphere with centre
   `SPHERE_C` 114.2705 and radius `SPHERE_R` 105 (`CursorAvatar.tsx:54-55`).
   An eye hides behind the sphere when its depth is 0.02 or less
   (`:791-833`).
6. Pointer: the mascot follows the pointer only when the pointer is over
   the nearest link or button. It reaches 2 box widths and ignores touch
   (`:720-773`, `:539-543`).
7. The mouth is a quadratic curve. `mouthFrame` puts it below the middle of
   the two eyes, at the eye half-height plus `spec[2]`, turned by `spec[3]`
   degrees (`cursor-face-data.ts:103-121`). The stroke is 7.5
   (`:101`).
8. Effects: confetti for `celebrate`, `excited` and `laughing`. Orbit trails
   for 7 states. A "!" or "?" for `alerting`, `notifying` and `confused`
   (`CursorAvatar.tsx:105-122`). Effects hide at 36 px or less, at rest, or
   when the mascot is not engaged (`:954-955`).
9. The face is a hole through the body by default. With a face colour it is
   painted on top (`:986`, `:989`).

### 3.6 The engine: from an outline to an animated body

1. A definition is `{version: 1, id, name, body: {path}, eyes: {x, y,
   spacing, scale}}` in a 0..100 box (`types.ts:10-29`).
2. `validateAvatar` collects all errors in one pass (`validate.ts:202-286`):
   - Unknown keys are refused (`:28-29`, `:206`, `:221`, `:230`).
   - The id matches `^[a-z0-9](?:[a-z0-9-]{0,38}[a-z0-9])?$` (`:210`). The
     name has 1 to 40 characters, with no control characters and no `<` or
     `>` (`:213-216`).
   - `scale` is 0.6 to 1.8. `spacing` is from `EYE_W × scale × 1.75` to 40
     (`:235-239`).
   - The body stays inside 6..94 (`:9-10`, `:259-262`). The message says
     "8..92", which is not the checked rule (`:263`).
   - The long side is 40 or more, the short side 14 or more, and the area
     600 or more (`:265-268`).
   - The eyes fit inside the body with a margin of 1.2 (`:271`). This checks
     the plain eye only, not the happy arc and not the 1.45 boost.
3. Path limits: 6,000 characters, 400 segments, 16 subpaths, coordinates
   -20 to 120 (`path.ts:19-25`). Compact arc flags such as `011` are valid
   SVG but are refused (`path.ts:87`). The output path is written again from
   parsed numbers only, so no input text reaches the markup (`path.ts:5-6`,
   `:158-171`).
4. `buildVolume` makes each filled subpath a part: `inflate`, `revolve-x` or
   `revolve-y` (`volume.ts:29`). Thin regions get extra slices
   (`THIN` 4, `volume.ts:104-113`).
5. The eyes sit on the part that is highest under both eye centres
   (`volume.ts:635-642`). The eyes grow up to `EYE_BOOST` 1.45 when the body
   has room (`volume.ts:88`, `:664-669`).
6. `render.ts` validates again, and throws a plain `Error` on a bad
   definition (`render.ts:125-126`).
7. Three outputs: plain frame data for a canvas, an SVG string, and CSS 3D
   markup (`render.ts:1-21`). The local mouth is in the canvas and SVG
   outputs only (`render.ts:370-380`, `:603-610`).

### 3.7 The engine: states, moods, gaze and motion

1. 6 states: `idle`, `thinking`, `working`, `waiting`, `blocked`, `done`
   (`motion.ts:54`). 2 moods: `neutral`, `happy` (`motion.ts:55`). An
   unknown value becomes `idle` or `neutral` with no error (`motion.ts:69-74`).
2. The eyes blend three shapes: the pill, the happy arc and the waiting slit
   (`motion.ts:12-17`, `:287`, `:378`). `eyes.ts` samples each shape at 40
   points and mixes them (`eyes.ts:25`, `:119-131`).
3. Each state has its motion (`motion.ts:304-409`). For example, `working`
   bobs every 0.7 s and makes a ribbon turn every 7.5 s plus jitter
   (`:225-231`, `:237-248`). `done` makes celebration cycles of 6.2 s
   (`:210-217`).
4. Blink: one slot every 4.2 s, 0.19 s long, 20% double (`motion.ts:113-126`).
5. A state change blends over 420 ms (`mood.ts:9-19`).
6. Pointer gaze: measured from the eyes, with a reach of the larger of the
   box width, the box height and 160 px (`follow.ts:30-51`). Easing uses
   `TAU` 0.12 s (`follow.ts:22`).
7. The motion is a pure function of time. "No wall clock, no Math.random"
   (`motion.ts:1-5`). The animator takes `now` as input (`animator.ts:14`).
8. The `Pose` has yaw, pitch, roll, lift, squash, gaze, blink, eye shape,
   ribbons and marks (`motion.ts:19-51`). It has no transform for one part.
   The whole body moves as one.
9. The app maps the 39 mascot states to the engine. For example `writing`
   and `searching` become `working`, `alerting` becomes `waiting`, `sad`
   becomes `blocked`, `laughing` becomes `idle` with the `happy` mood
   (`ObjectAvatar.tsx:20-30`). After `working` or `thinking`, the bot shows
   one `done` cheer for 4,170 ms (`ObjectAvatar.tsx:33-51`).

### 3.8 The engine in the window

1. `mountAvatar(host, opts)` returns `update` and `destroy`
   (`dom/mount.ts:181-377`). The host gets `role=img` and a label
   (`:220-239`).
2. One shared `requestAnimationFrame` loop draws all avatars
   (`dom/clock.ts:33-51`). The animator reads a second clock,
   `performance.now()` (`dom/mount.ts:267`). No caller can inject a clock.
3. Limits: under 128 px an avatar draws at 30 fps (`dom/mount.ts:168-169`).
   An avatar off screen draws only after a change (`:171`, `:204-216`).
4. A render error logs once, clears the host and stops the frames
   (`dom/mount.ts:331-338`).
5. Fluffy, matte and metallic use one shared WebGL2 context
   (`dom/fluffy/renderer.ts:1-11`). The fallbacks:
   - No WebGL2: the avatar is painted flat (`renderer.ts:193`).
   - The shader does not compile: a warning, then flat for the whole page
     (`renderer.ts:439-450`).
   - The context is lost: flat until it comes back (`renderer.ts:195-196`).
     A still avatar may stay flat after that, because no frame is requested
     (inferred, see section 9).
   - No 2D canvas: the CSS 3D renderer (`dom/paint.ts:87-93`).
6. The coat is deterministic: a seeded generator and seeded textures
   (`dom/fluffy/mesh.ts:52-71`).
7. The desktop app has its own clock for the cursor and festival bodies
   (`src/components/mascot-clock.ts:41-137`). A frame function returns its
   next due time, and `Infinity` means sleep. The clock can be injected
   (`:17-26`). It pauses while the page is hidden (`:89-96`). Bodies of
   64 px or less draw at 30 fps, others at 60 fps
   (`src/components/mascot-motion.ts:4-5`, `:366-368`).

### 3.9 Change the look

1. The pickers call `pickMascot`, which also sets `avatarCrop: "mascot"`
   when a picture crop is active (`AvatarEditorCard.tsx:71`, `:178-188`).
2. The client sends `PATCH /api/bots/:id`. The server parses it with
   `parseBotProfilePatch` (`server/routes/bot-patch.ts:197-203`):
   - `mascotBody`: one of the 51 body ids (`server/bot-profile.ts:74`).
   - `mascotFaceColor`: `white`, `black` or null.
   - `mascotBodyColor`: `#rrggbb`, stored in lower case
     (`packages/phone-protocol/src/bot-avatar.ts:13-16`).
   - `mascotMaterial`: `fluffy`, `matte`, `metallic` or null
     (`bot-avatar.ts:8`).
   - Errors are 400 with a message, for example "mascotFaceColor must be
     white, black, or null" (`bot-profile.ts:133-141`).
   - `mascotExpression`: a string of at most 80 characters
     (`bot-patch.ts:140-142`). The value is not checked against the states.
3. The server does not tie a material to a body. A material on the `cursor`
   body is accepted and has no effect.
4. `store.patchBot` changes memory, then saves `bots.json`
   (`server/store.ts:1483-1484`, `:1499`).
5. A new bot gets a random starter colour that no bot wears yet, and the
   default body (`server/bot-look.ts:11-18`).

### 3.10 What survives a restart, and what is lost

1. Kept: `color`, `mascotExpression`, `mascotBody`, `mascotFaceColor`,
   `mascotBodyColor` and `mascotMaterial` are fields of the bot in
   `<dataDir>/bots.json` (`server/store.ts:646-649`, `:1265-1289`). The e2e
   test reads them from the file (`server/mascot-face-color.e2e.test.ts:27-28`).
2. Kept by team backups (`server/team-backup.ts:118`, `:188`) and bot links
   (`server/bot-link/link.ts:217-218`).
3. Lost by package export and import: face colour, body colour and material
   (`shared/package-format.ts:234-238`, `:321-326`). Share and team manifest
   carry only `mascotBody` (`server/share.ts:93`, `server/team-manifest.ts:44`).
4. At risk: `patchBot` changes memory before the save. If the save fails, the
   window shows the new look, and the old look comes back at a restart
   (`server/store.ts:1484`, `:1499`).
5. Not validated at load: `bots.json` is cast, not parsed
   (`server/registry-store.ts:111`). A bad value is dropped only when drawn
   (`Avatar.tsx:51`, `:124`, `:169`).
6. Lost by design: the current beat, the derived face, the motion seed and
   the cheer. The seed comes from a React id, not from the bot
   (`mascot-motion.ts:176-181`, `CursorAvatar.tsx:582-583`).
7. An unknown or removed body id becomes `cursor` with no log
   (`mascot-bodies.ts:125-127`, `packages/phone-protocol/src/bot-body.ts:20-22`).

## 4. The data

### 4.1 Types and value lists

| What | Values | Lines |
|---|---|---|
| Mascot body ids | 10: cursor, blob, circle, squircle, capsule, drop, shield, hexagon, diamond, star | `packages/phone-protocol/src/mascot-bodies.ts:18` |
| All body ids | 51 = 10 mascot + 20 carved + 21 object | `packages/phone-protocol/src/bot-body.ts:10` |
| Named colours | 12: green, blue, red, orange, purple, cyan, pink, yellow, teal, coral, silver, chrome | `wire.ts:71-74`, hex values in `src/lib/mascot.ts:51-64` |
| Face colours | white (#ffffff), black (#000000), or null | `bot-avatar.ts:3`, `:18-21` |
| Materials | fluffy, matte, metallic, or null for flat | `bot-avatar.ts:7-8` |
| Body colour | `#rrggbb` in lower case, or null | `bot-avatar.ts:13-16` |
| Mascot states | 39, in 4 groups with French labels | `CursorAvatar.tsx:285-324`, `:452-457` |
| Pickable states | 10: idle, happy, curious, drowsy, working, thinking, listening, sleeping, suspicious, proud | `src/lib/mascot.ts:124-135` |
| Engine states and moods | 6 states, 2 moods | `open-bot-avatar/motion.ts:54-55` |

The wire `Bot` (`packages/phone-protocol/src/wire.ts:284-288`):

```ts
color: MausColor;
mascotExpression?: MausExpression | null;   // MausExpression = string (:82)
mascotBody?: BotBodyId | null;
mascotFaceColor?: MascotFaceColor | null;
mascotBodyColor?: string | null;            // plain string on the wire
mascotMaterial?: MascotMaterial | null;
```

### 4.2 Generated body record

`MascotBody` (`mascot-bodies.ts:24-36`): `id`, `name`, `fit` (a
`translate(...) scale(...)` string), `body` (SVG markup with
`fill="{{GRADIENT}}"`), `clip` (the same path) and `anchor` `{x, y, scale}`.
The `cursor` scale is 0.791. The others are 0.845 or more (`:48-120`).

### 4.3 Face data (drawn on the cursor body only, on the desktop)

`packages/phone-protocol/src/cursor-face-data.ts`:

| Name | Value | Line |
|---|---|---|
| `FACE_BOX` | 228.541 | `:3` |
| `FACE_CENTRE` | [120, 122.5] | `:5` |
| `GAZE_TRAVEL` | {x: 13.2, y: 8.4} | `:7` |
| Expressions | 25 × 2 eyes × 48 points | `:12` |
| `GAZE` | the middle of the two eye centres, for each expression | `:60-64` |
| `MOUTHS` | 25 rows: half-width, depth, drop, tilt | `:73-99` |
| `MOUTH_STROKE` | 7.5 | `:101` |

### 4.4 Engine definition

`AvatarDefinition` and `RenderOptions` (`open-bot-avatar/types.ts:10-29`,
`:73-114`): body colour and eye colour as `#rgb` or `#rrggbb`, depth 0 to
14 (default 6), view yaw and pitch, `time` as an input ("Same inputs always
produce the same SVG", `:87`), gaze, state, mood, `stateAge`,
`reducedMotion`. Defaults: body `#ff6a1a`, eyes `#151515`
(`render.ts:38-42`).

### 4.5 Where it is stored

| What | Where | Lines |
|---|---|---|
| The look of a bot | `<dataDir>/bots.json`, in the bot record | `server/store.ts:646-649`, `:1265-1289` |
| Body catalogs | Constants in committed generated files | `mascot-bodies.ts`, `carved-bodies.ts` |
| Beat, derived face, seed, cheer | Memory only | `store.tsx:1859`, `mascot-motion.ts:176-181` |
| Browser storage | None for the look | `src/state/store.tsx` has no `localStorage` call for it |

## 5. The UI

### 5.1 Where the mascot shows

- Sidebar rows (36 px) and pinned tiles (60 px) (`DESIGN.md:194-195`).
  `BotAvatar` is used by `Sidebar.tsx:735` and `ChatView.tsx:933`, `:970`.
- An avatar gets a round shape and is the only item with a plate
  (`DESIGN.md:164`, `:249-250`).
- Accessibility: `role="img"` and a label from the body name or a title.
  Else the SVG is hidden from screen readers (`CursorAvatar.tsx:984`,
  `:1005-1007`). The engine host also gets `role=img` (`dom/mount.ts:220-239`).

### 5.2 The pickers in the avatar editor

The card itself is in [`bot-settings-ui.md`](bot-settings-ui.md) 3.3.

1. **Face colour** (`MascotFaceColorPicker.tsx`): a segmented control with
   "white" and "black" (`:19-23`). With no value, the header shows the
   default text (`:16`). The control cannot clear a choice
   (`src/components/bot-panel/rows.tsx:216`). Only the whole Reset clears it
   (`src/components/avatar-editing.tsx:24`).
2. **Material** (`MascotMaterialPicker.tsx`): "off", "matte", "metallic",
   "fluffy" (`:8`). "off" sends null (`:24`). The row hides when the body is
   not an engine body (`:16`), but a stored material stays.
3. **Custom body colour** (`MascotBodyColorSwatch.tsx`): a button that opens
   a hidden colour input (`:25-29`, `:45-50`). Each change of the input sends
   a patch (`:52`). A named colour swatch clears the custom colour
   (`AvatarEditorCard.tsx:170`).
4. The "customize" beat plays only for a change of `color` or
   `mascotExpression`, not for the body, face colour, body colour or
   material (`store.tsx:1527-1531`).

### 5.3 The preview page (developers only)

`mascot-preview.html` loads `src/mascot-preview.tsx`. It is not in the build
(`vite.config.ts:50`). It tunes the `cursor` body with sliders, shows 12
motion cards that replay every 4,600 ms, and a colour × state grid. It
saves nothing. Two labels are out of date: "100 combinations" (now 12 × 10 =
120, `:338`) and a fixed "25 expressions" (`:296`).

## 6. The tests

| Test | What it guarantees | Real time? |
|---|---|---|
| `scripts/mascot-bodies/builders.test.mjs` | The order of the ten bodies, and M/C/Z output | No |
| `geometry.test.mjs`, `raster.test.mjs`, `sdf.test.mjs` | The path, mask and distance math | No |
| `catalog.test.mjs` | The generated catalog has the ten ids and anchors | No |
| `generated.test.mjs` | A new run gives the same bytes as the committed file, and no expression clips | A child process with a 120 s limit (`:52`, `:86`, `:107`). It rewrites the tracked file, and does not restore it when the generator fails (`:56-63`) |
| `carved-bodies.test.mjs` | The same for the festival bodies, and the eyes and smile are inside the outline | A 120 s limit (`:39`). It restores the file on a failure (`:32-35`) |
| `shared/object-bodies.test.ts` | The object id list matches the definitions, `obj-shield` is gone | No |
| `shared/fluffy-coat-edge.test.ts` | The scissor clear of `EDGE_PIXELS` removes a thin line | No (a fake WebGL2) |
| `shared/avatar-tooltip.test.ts` | The SVG has no `<title>` | No |
| `src/components/ObjectAvatar.dom.test.ts` | The state mapping, the label, the custom fill, one cheer | **Yes**: `vi.waitFor` at `:38` and `:52`. The cheer test uses fake timers (`:57`) |
| `src/lib/mascot.test.ts`, `mascot-names.test.ts` | Face rules, colour list equal to the Electron copy, locale keys for each body and face | No |
| `src/components/mascot-motion.test.ts` | Pure motion functions at a fixed `NOW` (`:17`) | No |
| `src/components/mascot-clock.test.ts` | Clock scheduling with an injected environment (`:16`, `:45-65`) | No |
| `src/components/mascot-beat.dom.test.ts` | A beat ends after 1,400 ms | No (fake timers, `:19`) |
| `src/components/CursorAvatar.clock.test.ts` | 12 working mascots stay in a frame budget, small ones at 28-33 fps, a still one costs 0 frames | No (fake timers, `:37`). The random cadence is not seeded |
| `src/components/CursorAvatar.motion.test.ts` | Blink length, spring, pointer follow, listener cleanup | No (fake timers, `:30`). `Math.random` is mocked once only (`:158`) |
| `src/components/CarvedAvatar.test.ts` | The carved geometry and markup | No |
| `server/mascot-face-color.e2e.test.ts` | PATCH of face colour, body colour and material: the reply, `bots.json`, the 400 errors | A real server process with a 60 s limit for each test (`:36`, `:66`, `:96`) |
| `scripts/sync-phone-protocol.test.mjs` | The phone copy excludes `dom/` and tests, and writes `SOURCE` | No |

## 7. Ours compared

### 7.1 What we have

Our desktop has no mascot. `BotAvatar`
(`crates/bot-desktop/ui/src/features/bots/BotAvatar.tsx`, 32 lines) shows the
first letter of the name on a coloured square with rounded corners. The
sidebar uses it at 36 px and the chat header at 24 px. Our `Bot` type
(`crates/bot-desktop/ui/src/features/bots/types.ts`) has `color` as a plain
string and no look fields. `bot-protocol` has no look types.

### 7.2 Where each part goes

| Part | The reference | Ours |
|---|---|---|
| Look types: body id, colour, face colour, material, hex colour | `packages/phone-protocol/src/bot-avatar.ts`, `mascot-bodies.ts:18`, `wire.ts:71-74`, `:284-288` | `bot-protocol`: closed enums and a hex newtype, no I/O (T6, T7) |
| The look of a bot, stored and validated | `server/bot-profile.ts:74-77`, `server/store.ts:1265-1289`, `:1484` | `bot-core`: columns of the bot row in the store of step 8, one transaction with its event (T6) |
| State to face | `src/lib/mascot.ts:160-203`, `ObjectAvatar.tsx:20-30` | `bot-desktop/ui`, a pure function of the typed thread state (T12) |
| Body shape data | `scripts/gen-mascot-bodies.ts`, `object-bodies.ts`, `carved-bodies.ts` | Ant definitions as data. `bot-protocol` can hold them if a Rust part reads them, else `bot-desktop/ui` (T2, T3) |
| The renderer | `open-bot-avatar/` (engine), `CursorAvatar.tsx`, `CarvedAvatar.tsx` | `bot-desktop/ui/src/features/mascot/`. The engine draws on a canvas and WebGL2, so it stays TypeScript in the window (T2, T4) |
| The clock and beats | `src/components/mascot-clock.ts`, `mascot-beat.ts`, `dom/clock.ts` | `bot-desktop/ui`, one injected clock (T8) |
| The pickers | `MascotFaceColorPicker.tsx`, `MascotMaterialPicker.tsx`, `MascotBodyColorSwatch.tsx` | `bot-desktop/ui`, with the avatar editor of `bot-settings-ui.md` |

### 7.3 The license of the vendored engine

- The engine is MIT, "Copyright (c) 2026 Dominik Scholz"
  (`open-bot-avatar/LICENSE:3`). MIT requires the notice in all copies or
  substantial portions (`LICENSE:12-13`).
- The NOTICE of the reference credits it, but with the wrong version:
  "Open Bot Avatar 0.3.0" (`NOTICE:133-137`). The vendored code is 0.4.0 at
  commit `323ce6ab8bc6b0bc9603a418ee3d91442e4996fc` (`README.md:3-5`).
- A port to our repository needs, in our `NOTICE`:
  1. the name "Open Bot Avatar" and its URL.
  2. the version 0.4.0 and the commit `323ce6ab`.
  3. the copyright line and the words "used under the MIT License".
  4. the LICENSE file, copied next to the ported code.
  5. a line in "Adapted components" that names
     `packages/phone-protocol/src/open-bot-avatar/` (`AGENTS.md`).
- The local changes of the reference are marked with the comment
  `MausBot:` (`README.md:15-32`). Our `AGENTS.md` forbids that name in our
  code. A port must remove the marks and record our own changes in another
  way.
- The reference also credits nothing for "Blob Studio". Comments say that
  the builders and the cursor artwork come from it (`builders.ts:2`,
  `geometry.ts:143`, `CursorAvatar.tsx:1`). Its license is not known
  (section 9).

### 7.4 How an ant fits the reference design

An ant has a head, a thorax, a thin waist and a large abdomen (the
"gaster"), six legs and two antennae. The face goes on the head. The
reference has three paths to draw a body. Each path fits an ant in a
different way.

**The generator path (the `cursor` way, with the 25 expressions)**

- Reuse: the 25 expressions, the gaze, the mouths and their morph
  (`cursor-face-data.ts`, `CursorAvatar.tsx:654-671`, `:928-934`). The
  state pools and the effects (`CursorAvatar.tsx:105-122`, `:326-450`). The
  clock (`mascot-clock.ts:41-137`). The clip check with every expression at
  four pointer aims (`gen-mascot-bodies.ts:22-30`).
- Change:
  - The face goes to the wrong part. The search starts at the largest
    circle inside the outline (`gen-mascot-bodies.ts:77-83`,
    `sdf.ts:92-108`) and keeps the position with the most room
    (`:130-166`). On an ant, the widest part is the gaster, so the face would
    go there. The search must be limited to the head.
  - The 25 expressions were drawn for the cursor proportions, in a
    228.541-unit box (`cursor-face-data.ts:3`). A small ant head needs a
    small face scale. The size floor "never smaller than the cursor" would
    fail (`gen-mascot-bodies.ts:450-458`).
  - The turn puts the eyes on a sphere with a fixed centre for the cursor
    (`CursorAvatar.tsx:54-55`, `:791-833`). The centre must move to the
    head.
  - The builders write M, C and Z only (`builders.ts:1-5`). Thin legs and
    antennae are possible as filled outlines. The mask is 256 px wide
    (`raster.ts:62-102`), so a very thin leg may lose pixels.
  - The body is one flat SVG path with a gradient. Legs and antennae do not
    move apart from the body.

**The engine path (the shape and object way)**

- Reuse: validation with typed errors (`validate.ts:202-286`), the 3D look,
  the materials, the 6 states and 2 moods, the gaze and the pointer follow
  (`follow.ts:39-71`), the ribbons and marks (`effects.ts`), reduced motion,
  and the state mapping (`ObjectAvatar.tsx:20-30`).
- Animal precedents: the bull, bunny and cat bodies add ears or horns as
  extra subpaths (`object-bodies.ts:36-64`). An ant can use the same method.
  Head, thorax, waist, gaster, 6 legs and 2 antennae are 12 subpaths. The
  limit is 16 (`path.ts:19-25`).
- The face: `eyes.x` and `eyes.y` are set by hand. The eyes sit on the
  highest part under both eye centres (`volume.ts:635-642`). So the head
  must be its own subpath, and it must be the highest part under the eyes.
- Head size: from the constants, at eye scale 1, the two eyes need about
  17 × 17 units of the 0..100 box. That is the eye size 4 × 11
  (`validate.ts:6-7`), a spacing of at least 7, the gaze 1.5 and 1.1
  (`:17-18`) and the clearance 1.5 (`:26`). The mouth needs more room below
  the eyes, and the full eye boost needs a gap of 3 (`volume.ts:94`). This
  is an estimate from the constants, not a run. It gives a cartoon ant with
  a large head.
- Change:
  - Legs and antennae are thin. They get extra slices (`volume.ts:104-113`).
    How a fur coat looks on a leg 3 units wide is not known.
  - The `Pose` moves the whole body (`motion.ts:19-51`). Walking legs or
    moving antennae are new work in `motion.ts` and `volume.ts`.
  - The engine has no 25 expressions. It has the pill, the happy arc and
    the slit (`motion.ts:12-17`) and one smile (`render.ts:370-380`).

**The festival path (the carved way)**

- Reuse: the spider is the nearest body to an ant. It draws legs as
  mirrored stroked polylines and one thread line above the head
  (`halloween.ts:70-77`, `:126-133`). Antennae can be drawn the same way.
- Change: the eyes are placed by hand with no clip check
  (`gen-carved-bodies.ts` has none). The pose has only `gx`, `gy`, `wide`,
  `shut` and `smile` (`CarvedAvatar.tsx:20-32`). Carved bodies take no
  material and no body colour (`Avatar.tsx:99-116`).

**What every path reuses**

- The state rules and beats (`src/lib/mascot.ts:160-203`,
  `mascot-beat.ts:12-25`).
- The 12 colours, the face colour and the material lists
  (`src/lib/mascot.ts:51-64`, `bot-avatar.ts:3`, `:8`).
- The look fields of the bot and their validation (`bot-profile.ts:74-77`).

**One ant, or ant variants**

- Option a, one ant for all bots: bots differ by colour, face colour,
  material and expression. The body picker goes away. This is the least
  art and the least data. Before the body catalog, the reference had one
  body for all bots: "The mascot has one body" (spec `:26`).
- Option b, ant variants in place of the ten shapes, for example a worker,
  a soldier with a large head, a queen and others. On the engine path each
  variant is one validated definition in a table, the same as
  `SHAPE_BODIES` (`object-bodies.ts:145-155`). On the generator path each
  variant needs a solver run. The ids are persisted, so they must not
  change (spec `:54-65`).
- Option c: start with option a, and keep the body id as an enum so that
  variants can come later without a data change.

## 8. Where we can be better

### 8.1 Proposals

**T1. A decision: our mascot is an ant. Choose one ant or ant variants.**

- New decision. The author gave the ant during this research. The options
  are a, b and c of 7.4. Recommendation: option c (one ant first, the body
  id as an enum).
- Why: the reference changed its body set four times in three months: ten
  bodies, the "Living" body added and removed on one day, 20 festival
  bodies, then 21 object bodies and the ten redrawn (3.1). One body first
  keeps the data small while we learn what a person wants.
- Source: spec `:10-11`, `:54-65`; `releases.json:401`;
  `object-bodies.ts:145-155`.

**T2. Draw the ant with the engine, and add the mouth and more faces to it.**

- Problem in the reference: two face systems draw the same ten bodies in
  two ways. The generator solves a face for nine bodies that the desktop
  then does not use (`Avatar.tsx:118-135`, `object-bodies.ts:144-156`).
  The engine bodies have 6 states and 2 moods, so most of the 39 states
  look the same (`ObjectAvatar.tsx:20-30`). The release problem: "A feature
  added, then removed or reversed" (v0.1.178, "Our own shapes are
  redrawn").
- Options:
  - a. The engine path (recommended): the head as its own subpath, eyes
    placed by hand, the 3D look and the materials. Gap: 2 eye shapes and
    one mouth, not 25 expressions.
  - b. The generator path: 25 expressions, but the face search must be
    limited to the head, and the sphere centre moves (7.4).
  - c. The engine path, plus more eye shapes taken from the 25 expressions.
    This is new work in `eyes.ts` and `motion.ts`.
- Why a: an ant has many parts, and the engine supports 16 subpaths and puts
  the eyes on a chosen part. One renderer is less code than three.
- Dependency: the smile of the engine is a local change of the reference
  (`open-bot-avatar/README.md:15-32`). Option a with a mouth needs T4
  option a. With T4 option b, we must write the mouth again.
- Source: `volume.ts:635-642`; `path.ts:19-25`; `gen-mascot-bodies.ts:77-83`;
  `CursorAvatar.tsx:54-55`.

**T3. A plan step for the mascot.**

- Gap. Part 46 has no step. Proposal: one step after the window steps and
  after step 8 (the store). Its parts:
  1. Look types in `bot-protocol` (T7).
  2. The look columns of the bot in `bot-core` (T6).
  3. The ant renderer and the clock in `bot-desktop/ui/src/features/mascot/`.
  4. The pickers in the avatar editor.
- Why: the renderer needs the stored look, and the look needs the bot row
  of step 8.
- Source: `server/store.ts:1265-1289`; `Avatar.tsx:251-310`.

**T4. Port the engine with a correct NOTICE, and decide the form of the
copy.**

- Problem in the reference: the NOTICE names version 0.3.0, but the code is
  0.4.0 (`NOTICE:133-137`, `open-bot-avatar/README.md:3-5`). The local
  changes must be applied again by hand at each update (`README.md:37-38`).
  The release problem: "A feature added, then removed or reversed" (the
  engine changed in v0.1.178, v0.1.180 and v0.1.182).
- Options:
  - a. Vendor the source with its LICENSE, and keep our changes as a list
    of patches that a test checks.
  - b. Use the npm package `open-bot-avatar` 0.4.0. We lose the mouth, matte
    and metallic, which are local changes (`README.md:15-32`). T2 option a
    then needs a mouth of our own.
- In both: the NOTICE entry of 7.3, the "Adapted components" line, no
  `MausBot:` marks and no `Maus` names (`AGENTS.md`). Check the license of
  the npm package before we add it.
- Source: `LICENSE:3`, `:12-13`; `README.md:15-38`.

**T5. Find the license of "Blob Studio" before we port the generator, the
builders or the 25 expressions.**

- Gap. Comments say that the builders and the cursor artwork come from Blob
  Studio (`builders.ts:2`, `geometry.ts:143`, `CursorAvatar.tsx:1`). The
  NOTICE of the reference does not name it. The face data may also come
  from it.
- Why: `AGENTS.md` asks us to check the license of each source. An ant drawn
  by us on the engine path (T2 option a) does not need these files.

**T6. One look record, saved with its event in one transaction, and carried
whole by export.**

- Problem in the reference: the package export drops face colour, body
  colour and material (`shared/package-format.ts:234-238`, `:321-326`).
  Share and team manifest carry only the body (`server/share.ts:93`,
  `server/team-manifest.ts:44`). `patchBot` changes memory before the save,
  so a failed save shows a look that a restart loses
  (`server/store.ts:1484`, `:1499`). The release problem: "State lost at a
  restart or a crash". Each look field came in a release without a change
  to the export: the face colour (2026-10-28), the custom body colour
  (v0.1.178), Fluffy (v0.1.180), Matte and Metallic (v0.1.182)
  (`releases.json:401`, `:309`, `:165`).
- Why: one `Appearance` type in `bot-protocol` means a new field cannot be
  missed in one of six copy paths. The `AGENTS.md` rule "the row and its
  event in one transaction" removes the memory-first save.
- Source: as above; `server/team-backup.ts:118`, `:188`.

**T7. Closed enums with typed refusals for the body, face colour and
material.**

- Problem in the reference: an unknown body id becomes `cursor` with no log
  (`mascot-bodies.ts:125-127`, `packages/phone-protocol/src/bot-body.ts:20-22`). An unknown expression
  becomes null with no log (`src/lib/mascot.ts:118-122`). The engine turns
  an unknown state into `idle` (`motion.ts:69-74`). `bots.json` is cast at
  load and not parsed (`server/registry-store.ts:111`). `mascotExpression`
  accepts any string of 80 characters (`bot-patch.ts:140-142`). The release
  problem: "A feature added, then removed or reversed". Ten old face names
  stay as aliases after the face set was replaced (`mascot.ts:103-114`,
  commit `b09439bf7`, 2026-08-12). Shield and Star left the object list in
  v0.1.178, and a stored `obj-shield` now falls back with no log
  (`object-bodies.ts:135-140`).
- Why: serde enums refuse a bad value at the edge with a typed error. An old
  value gets an explicit alias, not a silent fallback.

**T8. One injected clock and a seeded random source for all mascot motion.**

- Problem in the reference: the engine reads `performance.now()` in two
  places and no caller can inject a clock (`dom/clock.ts:31`,
  `dom/mount.ts:267`). `CursorAvatar` draws random delays
  (`CursorAvatar.tsx:705`), and a test mocks `Math.random` only once
  (`CursorAvatar.motion.test.ts:158`). Two tests wait in real time
  (`ObjectAvatar.dom.test.ts:38`, `:52`). The release problem: "Tests that
  fail by chance, and a red main branch" (v0.1.99, v0.1.133).
- Why: the reference already has an injected clock for the cursor
  (`mascot-clock.ts:17-26`) and a pure engine motion (`motion.ts:1-5`). One
  clock and one seed for both make every mascot test exact. Seed the motion
  from the bot id, so that the same bot moves the same way after a reload
  (`mascot-motion.ts:170` says "per-bot", but the key is a React id).

**T9. Put the face on the head of the ant, and check it with every face.**

- Gap for the ant. On the engine path, the head subpath must be the highest
  part under the eyes (`volume.ts:635-642`). On the generator path, the
  face search must be limited to the head (`gen-mascot-bodies.ts:77-83`).
- Why: a check like the generator's (every face, four pointer aims,
  `gen-mascot-bodies.ts:22-30`, `:494-500`) stops a face that clips at the
  edge of a small head. The engine validation checks only the plain eye
  (`validate.ts:271`), not the happy arc or the eye boost.

**T10. Static legs and antennae first. Moving legs are a later choice.**

- Gap for the ant. The engine pose moves the whole body (`motion.ts:19-51`).
  The carved pose has no part motion (`CarvedAvatar.tsx:20-32`).
- Why: moving parts are new work in the motion and the volume code, and the
  reference has no example of it. A static ant can use all of the existing
  motion: bob, hop, lean, roll and ribbons.

**T11. Generate shape data in memory with a check, not by rewriting tracked
files.**

- Problem in the reference: `generated.test.mjs` rewrites the committed
  catalog and does not restore it when the generator fails (`:56-63`). The
  heavy tests have 120 s limits (`:86`, `:107`). The release problem: "Tests
  that fail by chance, and a red main branch" ("unblock main" v0.1.77, "the
  five timing flakes" v0.1.99, "not on a clock or a lucky port" v0.1.133).
- Why: a `--check` mode that compares in memory leaves the tree clean. This
  applies only if we keep a generator (T2 option b).

**T12. The face comes from the typed state of the thread, not from English
keywords.**

- A judgment call, not a release problem. The reference picks a face from
  English words in the name and description (`src/lib/mascot.ts:171-200`),
  and a pinned face hides `alerting` and `working` (`:161-168`).
- Why: the live state is the useful signal. A pinned face that hides a
  failure can mislead the person. Keep the reference order if the author
  prefers it.

### 8.2 The problems of `changelog.md` section 5 that the reference has here

| Problem | Here | Lines |
|---|---|---|
| A feature added, then removed or reversed | Yes. The "Living" body was built and removed on 2026-09-01. The shared face size of the spec was replaced by a size for each body in v0.1.178. The nine generator bodies were drawn again for the engine in v0.1.178, and the generator output now draws only the `cursor` on the desktop. Shield and Star moved from the object list to the shapes. 10 old face names stay as aliases. A 20 fps tier for small mascots became 30 fps. The NOTICE still says 0.3.0 after the move to 0.4.0 | spec `:13-22`, `:78-93`; `gen-mascot-bodies.ts:58-66`; `Avatar.tsx:118-135`; `object-bodies.ts:135-156`; `mascot.ts:103-114`; `mascot-motion.ts:5`; `NOTICE:134` |
| Tests that fail by chance, and a red main branch | Partly. Most mascot tests use fake timers or an injected clock. Two engine tests wait in real time. The generator tests run a child process with a 120 s limit and rewrite a tracked file. The e2e test runs a real server with a 60 s limit. The random cadence is not seeded | `ObjectAvatar.dom.test.ts:38`, `:52`; `generated.test.mjs:52-63`, `:86`, `:107`; `mascot-face-color.e2e.test.ts:36`; `CursorAvatar.tsx:705` |
| State lost at a restart or a crash | Partly. The chosen body, colours and material are saved in `bots.json`. `patchBot` changes memory before the save. Package export, share and team manifest drop some look fields. A bad stored value is dropped when drawn, with no log | `server/store.ts:1484`, `:1499`; `shared/package-format.ts:234-238`; `server/share.ts:93`; `server/registry-store.ts:111` |

## 9. Not verified

- Whether the phone apps still use the generator anchors of the nine
  non-cursor bodies. The `ios/` and `android/` folders are not in this
  clone.
- The source and the license of "Blob Studio", and whether the 25
  expressions come from it.
- That the vendored files equal the upstream 0.4.0 apart from the listed
  changes. No upstream copy was compared.
- That a restored WebGL context leaves a still fluffy avatar flat. This is
  inferred from `dom/fluffy/renderer.ts:196`, `:444` and `dom/mount.ts:349`.
  Nobody ran it.
- Whether happy-dom runs `requestAnimationFrame` on real timers, and so the
  exact risk of `ObjectAvatar.dom.test.ts:38` and `:52`.
- Whether vitest runs the generator tests in parallel with the tests that
  import the rewritten files.
- Whether the committed generated files equal a new run. Nobody ran the
  generators or the tests.
- Whether `profileSnapshot` in `bot-patch.ts:794-797` includes the look
  fields.
- Whether a drag of the colour input sends many PATCH requests
  (`MascotBodyColorSwatch.tsx:52`). The patch queue was not traced here.
- The head size of 7.4 is an estimate from the constants. Nobody validated
  an ant definition with the engine.
- How a fur coat looks on thin legs and antennae.
- The 20 fps to 30 fps change rests on commit titles only.
