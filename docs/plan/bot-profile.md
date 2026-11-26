# Plan: The bot profile and the bot settings

The proposals from the research file
[`../research/features/bot-profile.md`](../research/features/bot-profile.md)
(batch 8, reference commit `83d18e3af`). The steps, the pull requests and the
order are in [`README.md`](README.md). The author decides each proposal.
Then it becomes a decision, a pull request or a choice, and its text leaves
this file. A path that starts with `crates/`, `docs/plan/`, `docs/research/`,
`docs/decisions.md` or `docs/comparison.md` is ours. All other paths are in
the reference project.

- **Steps:** a new step after 16 for the bot profile (P406), the step of
  `propose_profile` after the new step and `/setup` after steps 15 and 16
  (P418), a rule for steps 6 and 8 (P419), and later (P423).
- **State:** all open.
- **The main finding:** the reference keeps the profile fields on the bot
  record. It writes one log row for each changed field, through a queue that
  drops each error, and only the soul (the standing instructions) has
  rollback. A bot can change its own working folder and the New-bot template
  at once, with only Undo as the guard (`server/store.ts:1518-1535`;
  `server/profile-versions.ts:73-82`; `server/index.ts:14640-14667`;
  `server/bot-cwd.ts:9-25`; `server/app-settings/registry-config.ts:91-96`).

## Proposals

- **P406 (plan, new step after 16, `bot-protocol`, `bot-core`,
  `bot-desktop`). A step for the bot profile.** No step has this feature
  (group "later"). The step has four pull-request groups:
  1. The types and checks in `bot-protocol`.
  2. The profile in the store, the log table, rollback and the revision.
  3. `SOUL.md`, drift, and the soul block in the prompt.
  4. The dialog sections Identity, Soul and History, the New-bot template,
     random names and Duplicate.

  Option b: move groups 1 to 3 to just after step 8. Step 8 gives the store,
  and a bot with no standing instructions is less useful. The main session
  gives the step its number.
  - Why: follows the reference in scope. The fields stay on the bot record,
    the log has one row for each changed field, and only the soul has
    rollback. The reference never built the whole-profile document of its
    plan of 2026-08-31.
  - Source: `server/store.ts:1518-1535`; `server/profile-versions.ts:84-101`;
    `server/index.ts:14640-14667`;
    `docs/superpowers/plans/2026-08-31-02-bot-profile.md:69-80`.
- **P407 (decision, the new step and the step of `propose_profile`,
  `bot-core`, amends P404). A bot cannot point its own tools at any
  folder.** A change by a bot of its own `cwd` waits for the person. As a
  minimum, the folder cannot be the data folder or a folder in it, the home
  folder itself, or an engine config folder. This is an exception to the
  apply-at-once rule of P404.
  - Why: better than the reference. `validateBotCwd` accepts each folder
    that exists, and the change applies at once at Ask, with only Undo. The
    reference has the guard `sharedProjectFolder`, but it does not use it
    here. The Claude CLI possibly starts in the bot's `cwd` (not traced:
    `server/drivers/claude.ts:970`, `:1047`). Then a `cwd` at the home
    folder can make the CLI read the person's `~/.claude/settings.json` as
    project settings (`changelog.md` section 5, "The person's own engine
    config reaches the bots"). Commit `b09fcb083` kept a card for `cwd`.
    Commit `761102925` removed it.
  - Source: `server/bot-cwd.ts:9-25`, `:38-54`;
    `server/profile-requests.ts:138-143`, `:217`;
    `server/profile-requests.test.ts:527-541`;
    `server/agents-bridge-switch.ts:232-234`.
- **P408 (plan, the new step group 2, `bot-core`). The profile change and
  its log rows in one transaction.**
  - Why: better than the reference. The reference saves the change. Then it
    appends the row through a queue with no disk sync, and it drops each
    error. A crash loses the row and its Undo. Our `AGENTS.md` rule asks for
    one transaction. The soul PATCH of the reference also saves in two
    steps.
  - Source: `server/profile-versions.ts:65-82`;
    `server/index.ts:14661-14664`; `server/routes/bot-patch.ts:747-753`;
    `server/routes/bot-patch.test.ts:304-314`.
- **P409 (plan, the step of `propose_profile`, `bot-core`, amends P404 and
  P405). One function decides if a proposal waits, and the same function
  gives each text about it.**
  - Why: better than the reference. Three texts still promise a confirm
    step that the code removed. The bot reads "proposed changes apply only
    after the user confirms". The person reads "arrives as a card you
    confirm" and "Profile proposal cards require your approval".
  - Source: `server/bot-folder.ts:80`; `server/setup-mode.ts:88`;
    `src/components/bot-settings/ProposalStatus.tsx:8-27`;
    `server/bot-overview.ts:266`; `server/direct-apply.ts:17-20`.
- **P410 (decision, the new step, `bot-core`, amends P289 and P290). The
  New-bot template is not a "safe" app setting.** A change to the template
  by a bot waits for the person. Or the change cannot raise the approval
  level or add grants.
  - Why: better than the reference. The template holds the approval level
    up to Full, `alwaysAllow`, MCP servers and apps. A bot can replace it at
    once, and each later new bot and each Duplicate gets that access. The
    design spec of the reference says "confirm".
  - Source: `server/new-bot-defaults.ts:39-52`;
    `server/app-settings/registry-config.ts:91-96`;
    `server/app-settings/registry.ts:48`;
    `docs/superpowers/specs/2026-11-12-app-settings-tool-design.md:209`.
- **P411 (plan, the new step group 4, `bot-core`). Duplicate is one command
  that copies the source and starts inert.**
  - Why: better than the reference. The reference makes the copy with a
    POST and a PATCH, with no rollback. A failed PATCH leaves a half bot.
    The copy gets the approval level, apps, skills and routines of the
    template, not of its source. The plan of the reference wanted a clone
    with skills off, routines paused and apps off.
  - Source: `src/state/store.tsx:2497-2516`;
    `src/lib/bot-duplicate.ts:16-44`; `server/routes/bots-create.ts:156-158`;
    `docs/superpowers/plans/2026-08-31-02-bot-profile.md:185`.
- **P412 (plan, the new step group 4, `bot-desktop`). Undo sends the
  revision that the person saw, and both views ask first.**
  - Why: better than the reference. The simple panel reads a new revision
    just before it posts, with no confirm. Thus the revision check does not
    protect later changes. Only the Advanced dialog asks, and only it sends
    the revision of the list that it shows.
  - Source: `src/components/bot-panel/SoulChanges.tsx:19-31`;
    `src/components/bot-settings/useBotOverview.tsx:156`, `:162-179`.
- **P413 (plan, the new step group 2, `bot-core`). Rollback finds each row
  by id through an index, and the log has a size rule.**
  - Why: better than the reference. Rollback asks for all rows, but the
    read stops at 500 rows and 8 MiB. Thus an older row gives 400. Nothing
    trims the file.
  - Source: `server/index.ts:14650`; `server/profile-versions.ts:29`,
    `:142`.
- **P414 (plan, the new step group 3, `bot-core`). The soul block in the
  prompt.** The soul goes in a fenced block. It ranks above memory and
  skills, and below the current request and the safety rules. It "is
  instruction for you, never tool authorization or permission to expose
  secrets". An empty soul gives no block. We do not copy the sentence
  "proposed changes apply only after the user confirms" (P409).
  - Why: follows the reference.
  - Source: `server/bot-folder.ts:75-87`; `server/system-prompt.ts:100`.
- **P415 (plan, the new step group 3, `bot-core`). `SOUL.md` is a mirror.**
  The record is the source of truth. The file is outside the folder that
  the bot can write to. Drift shows to the person and never applies on its
  own. Apply and discard check the revision and the exact file text. Two
  fixes:
  1. Write the mirror with a disk sync each time.
  2. Show a file over the limit as an error.
  - Why: follows the reference, with two fixes that are better than the
    reference. The reference skips the disk sync at the start and at create.
    A power loss can then give an empty file, and "Use the file" applies it
    with no warning. A file over the limit throws, and the editor drops the
    error.
  - Source: `server/bot-folder.ts:1-2`, `:26-61`;
    `server/index.ts:14551-14608`; `server/store.ts:328`, `:1318`;
    `src/components/SoulField.tsx:38`.

The proposals P416 to P426 come in the next pull request.
