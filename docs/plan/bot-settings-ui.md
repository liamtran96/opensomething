# Plan: The bot settings dialog

The proposals from the research file
[`../research/features/bot-settings-ui.md`](../research/features/bot-settings-ui.md)
(batch 12, reference commit `42f86aefd`). The steps, the pull requests and
the order are in [`README.md`](README.md). The author decides each proposal.
Then it becomes a decision, a pull request or a choice, and its text leaves
this file. A path that starts with `crates/`, `docs/plan/`, `docs/research/`,
`docs/decisions.md` or `docs/comparison.md` is ours. All other paths are in
the reference project. This file adds to [`bot-profile.md`](bot-profile.md).

- **Steps:** P680, P681 and P686 go to step 11. P682 and P683 go to step 6.
  P684 goes to step 16. P685 goes to the accounts step of P501. P687 adds
  new facts to P411, and P688 (the Bot API key) has no step.
- **State:** all open. Decide P680 first, with P513 (one UI mode): in the
  reference, the same click on a model changes the bot default in Simple
  mode and only the thread in Advanced mode.
- **The main finding:** the dialog saves each field with a PATCH that has
  no revision, so the last write wins (`server/routes/bot-patch.ts`). The
  screen shows a field before the save, and the save waits 400 ms in memory
  (`src/state/bot-patch-queue.ts:160`). A model switch is right: the thread,
  the bot default and the reset to Ask go in one write
  (`server/store.ts:2049-2066`).

## Proposals

The proposals are in order of importance.

### P680. One scope rule for a model change, the same in each view

- Target: `docs/plan/README.md` step 11 (threads, `bot-core` and
  `bot-desktop`). New facts for P513 (`docs/plan/engines-and-accounts.md`).
- Kind: better than the reference.
- **Problem in the reference:** the same click of an owner or an admin
  changes the bot default in Simple, but only the thread in Advanced. The
  scope starts at "thread" on each mount (`src/components/ModelPicker.tsx:230`).
  The full pane opened from the Simple list starts at "bot" (`:427-432`). A
  pick in the Simple list always writes the bot default for an owner or an
  admin (`:469`). The verification text of the reference gives only the
  default of Advanced (`docs/verification/bot-continuity.md:32`). A person
  who moves between views cannot know what a click does.
- Release problem: "A feature added, then removed or reversed". The UI mode
  changed in v0.1.94, v0.1.151, v0.1.152 and v0.1.182 (changelog.md
  section 6, row "The UI mode").
- Reason: one view (P513) and one rule remove the difference. The scope is
  data of the request, not a state of the view.
- Options:
  - a. One default for each person: "Only this thread". The person picks
    "Thread + bot default" each time. The server refuses the bot scope from
    a person who is not an owner or an admin, as the reference does
    (`server/routes/tasks.ts:280-282`).
  - b. One default: "Thread + bot default" for an owner or an admin, and
    "Only this thread" for a guest.
  - c. Follow the reference: the default depends on the view.
- Recommendation: a. It changes the least by surprise, and it matches the
  verification text of the reference.
- Also follow the reference for these parts:
  - With no thread (the model section of the settings), the change is
    always the bot default (`src/components/ModelPicker.tsx:469`).
  - A guest changes only the thread. The client treats each person as a
    guest until the owner check loads (`:233-234`).
  - After a change of the bot default, a notice names the threads that keep
    their own model (`:985-994`; `shared/thread-model.ts:17-22`).
  - The row "Use <bot>'s model" moves a thread back to the bot model
    (`src/components/ModelPicker.tsx:449-462`).

### P681. Follow the reference: a model switch is one write

- Target: `docs/plan/README.md` step 11, with step 10 for the reset to Ask.
- Kind: follows the reference.
- What the reference does:
  - The store writes the thread, the bot default and the reset to Ask in
    one save, before it changes memory (`server/store.ts:2049-2066`). Its
    doc comment says: "One write: never publish a new provider before its
    approval downgrade." (`:2049`).
  - "Only this thread" keeps a model on the thread only when it differs
    from the bot model (`:2056`).
  - "Thread + bot default" writes the current approval level onto each
    thread that follows the bot. A following thread that the new driver
    cannot keep at its level gets Ask. A thread with its own model does not
    change (`:1396-1404`, `:2059-2061`).
  - `ASK_NOW` is `{ approvalMode: "ask", autoApprove: false,
    alwaysAllow: [] }` (`:112`).
  - A failed write changes nothing. The desktop channel answers "The model
    switch could not be saved. No settings were changed."
    (`server/index.ts:3383-3391`).
- The refusals to follow (`server/index.ts:2615-2645`):
  - 409 while an approval grant is pending (`:2617`);
  - 409 `botBusy` for a new engine or model while the thread is busy. A
    change of effort only is allowed (`:2577-2580`);
  - 409 for the bot scope while the bot has an active group turn (`:2622-2628`);
  - 403 to leave Custom without the trusted desktop channel (`:2629-2633`);
  - 400 for a switch that needs Ask without `resetApprovalToAsk`
    (`:2634-2638`);
  - 409 for a reset to Ask while the thread or a group turn runs
    (`:2640-2643`).
- The rule for "needs Ask": the new driver cannot keep the current level,
  or the level is Custom and the driver changes
  (`packages/phone-protocol/src/approval-mode.ts:33-39`). The person
  confirms with "Switch with Ask" (`src/components/ModelPicker.tsx:470-477`,
  `:995-1014`).
- Better in one small point, a judgment call: the HTTP route of the
  reference has no `try` around the save (`server/routes/tasks.ts:408-411`).
  The state stays safe, but the error goes to the generic handler. Our
  command returns a typed refusal (`AGENTS.md`, "The runtime returns typed
  refusals").
- Reason: this is our rule of one transaction for each state change
  (`AGENTS.md`). The reference is already right here.

### P682. Save a bot field first, show it after, with no wait in memory

- Target: `docs/plan/README.md` step 6 (settings and the data folder,
  `bot-core`), and step 7 (the settings panel through the event bus).
- Kind: better than the reference.
- **Problem in the reference:** the screen shows a bot field before the
  save (`src/state/store.tsx:1526-1554`). The change then waits 400 ms in a
  queue in memory (`src/state/bot-patch-queue.ts:160`, `:213-219`). A crash
  loses the edits of the last 400 ms. A page close sends the waiting edits
  only when the body is under 60,000 bytes (`:315-333`). A failed save puts
  the server copy back and shows the error only in the global banner, not
  in the section (`:183-201`; `src/state/store.tsx:2070-2077`).
- Release problem: "State lost at a restart". The reference fixed the same
  problem for threads ("Thread changes are saved before they're shown",
  v0.1.115) and for rooms (v0.1.120), but not for bot fields
  (`docs/research/changelog-check.md:191-192`, `:373`).
- Reason: our core runs in the process of the desktop app (D10). A save is
  a local command and needs no wait. The view shows the value that the
  event of the save carries.
- Options:
  - a. Save first, then show. A section shows "saving" and its own error.
  - b. Show first, with the save in the same command and no wait. A failed
    save puts the old value back and shows the error in the section.
  - c. Follow the reference.
- Recommendation: a.

### P683. A field save carries the revision that the person saw

- Target: `docs/plan/README.md` step 6. New facts for P412
  (`docs/plan/bot-profile.md`), which does this only for Undo.
- Kind: better than the reference.
- **Problem in the reference:** the PATCH of a bot has no revision, and the
  route reads none. The last write wins for each field. Two windows, the
  panel and the dialog, or a bot proposal can write over an edit that the
  person did not see. Each 409 of the route is a "busy" refusal, not a
  conflict check (`server/routes/bot-patch.ts:178`, `:349`, `:427`,
  `:465-505`, `:655-656`, `:708`, `:715-730`). A `profile-revision` exists,
  but only for the history snapshot (`:35`, `:159`, `:794-796`).
- Release problem: "Busy" and races between bots (v0.1.131).
- Reason: the revision is already in the profile (`server/profile-revision.ts:5-26`).
  The same check for each save costs little.
- Options:
  - a. Each save sends the revision of the bot. A different revision gives
    a typed refusal, and the view reads the bot again.
  - b. A revision only for the profile fields (name, title, soul and the
    other fields of the revision hash). The other fields keep "last write
    wins".
  - c. Follow the reference.
- Recommendation: a.

### P684. An app switch keeps the meaning of "all apps"

- Target: `docs/plan/README.md` step 16. New facts for P259
  (`docs/plan/connected-apps.md`). P259 covers
  `src/lib/bot-app-access.ts:34-42`. This adds `:28-32` and `:53-55`.
- Kind: better than the reference.
- **Problem in the reference:**
  - On a bot with no `connectorScopes` (all apps), the first "off" writes
    every other app that is connected now, with `"write"`
    (`src/lib/bot-app-access.ts:28-32`). From then on the bot has a fixed
    list. An app that the person connects later is not given to the bot.
  - The list comes from the client at that moment. An app that is not in
    the list yet (for example, while the list loads) drops out of the bot's
    access with no message (`src/components/bot-panel/pages.tsx:64-67`).
  - "On" while `composio === false` brings back the whole old list plus the
    new app (`src/lib/bot-app-access.ts:53-55`). The doc comment at `:45`
    says "only that app". No test covers this case
    (`src/lib/bot-app-access.test.ts:79-84` tests only the case with no old
    list).
- Release problem: "A secret or an access right in the wrong place"
  (v0.1.178, v0.1.181).
- Reason: the switch changes the access of the bot in a way that the person
  did not ask for.
- Options:
  - a. Keep "all apps" as a value with exceptions: `All { except }` and
    `Only { apps }`. "Off" on "all" adds an exception.
  - b. Keep the fixed list, but build it on the server from the real list
    of connections, and tell the person that later apps are not included.
  - c. Follow the reference.
- Recommendation: a. It fits the grant type of P258.

### P685. Follow the reference for a signed-out or absent engine in the picker

- Target: the accounts step of P501, with P499 to P502
  (`docs/plan/engines-and-accounts.md`). The `SignedOut` refusal of
  `bot-engine` is P500.
- Kind: follows the reference, with one better point.
- What the reference does:
  - "Signed out" is `state === "available"` with `authenticated === false`.
    "CLI absent" is `state !== "available"`
    (`src/components/EngineSetup.tsx:23-34`).
  - In the main pane, either state blocks the engine. The pane shows the
    setup card and a count ("2 models will appear after setup."), and it
    hides the model rows, the search and "Show all"
    (`src/components/ModelPicker.tsx:510-514`, `:770-860`).
  - The rail button has a warning dot, and the chip says "Sign-in required"
    or "Setup required" (`src/components/ModelPickerFull.tsx:14-18`,
    `:140-164`).
  - "Use a local model" stays when the engine offers local models
    (`src/components/local-model-probe.ts:23-26`). The probe ends after
    5,000 ms at most and never throws (`:5-21`). Sign-in does not block the
    local pane (`src/components/ModelPicker.tsx:510-513`;
    `src/components/ModelPicker.interaction.test.ts:270-282`).
  - An engine with an absent CLI stays on the rail only when it is the
    instance of the current selection (`src/lib/engine-rail.ts:7-11`;
    `src/components/ModelPicker.interaction.test.ts:181-197`).
  - A ChatGPT plan with an empty catalog asks for sign-in and never offers
    local models (`src/components/ModelPicker.tsx:312-314`).
- **Better, problem in the reference:** the trigger shows "Sign-in
  required" only in Simple (`src/components/ModelPicker.tsx:569-580`). A
  person in Advanced sees no warning until a turn fails.
- Release problem: "Sign-in to an engine, and engine CLIs that change"
  (v0.1.14, v0.1.54, v0.1.101, v0.1.153).
- Reason: the warning is a fact of the engine, not of the view.
- Options:
  - a. Follow the reference, and show the warning in each view.
  - b. Follow the reference fully.
- Recommendation: a. With P513 (one view), a is the only form.

### P686. Follow the reference for the "File locations" text

- Target: `docs/plan/README.md` step 11.
- Kind: follows the reference. The note on limits is a judgment call.
- What the reference does (`server/workspace.ts:138-151`):
  - The system prompt gets a section "File locations" when the engine
    works in a folder (`server/index.ts:8236`, `:10020`).
  - The keys are `currentWorkingFolder`, `sharedBotFolder`,
    `otherThreadFiles` and, only when the bot has a `cwd`,
    `configuredProjectFolder` (`server/workspace.ts:139-143`).
  - The text says: "These paths do not grant additional access." and "Do
    not move old files, edit another active thread's work, or read another
    bot's private folders without authorization." (`:146`).
  - Chat links and images open only files in `currentWorkingFolder` and
    `sharedBotFolder` (`:147`).
- The text is built from stored data, as `AGENTS.md` requires for the text
  that opens a delegated turn.
- Judgment call: the limits are only text. The research found no code that
  enforces them. A note in `docs/decisions.md` (see below) can say that a
  sandbox, not the prompt, is the limit.

### P687. Duplicate refuses a second click

- Target: new facts for P411 (`docs/plan/bot-profile.md`).
- Kind: better than the reference. A judgment call.
- **Problem in the reference:** two clicks make two copies. New bot has a
  guard, with the comment "A double click lands before React paints the
  pending state" (`src/state/store.tsx:2483-2486`). Duplicate has none
  (`:2497-2499`).
- Release problem: none. A judgment call.
- Reason: two copies with the same name and model confuse the person. With
  P411 (one command), the command can hold a pending flag for the source.
- More new facts for P411:
  - Duplicate has no confirm step (`src/components/SidebarBotMenu.tsx:347`,
    `:464-466`).
  - A paired device never sees Duplicate (`:342`, `:426-438`). A team member
    sees it only with edit access to a bot that is not a default bot
    (`src/lib/own-team-bot.ts:12`).
  - The copy keeps `modelSelection` with no `requireAvailableModel`
    (`src/lib/bot-duplicate.ts:36`). A copy of a bot on a signed-out engine
    keeps that engine. The command can check the model, as a configured
    create does (`src/lib/create-configured-bot.ts:34`).

### P688. Keep the Bot API key out of the page after one view

- Target: no step. The Bot API has no step in our plan.
- Kind: better than the reference. A judgment call.
- **Problem in the reference:** the new key stays in the page (in a `<pre>`
  with a `curl` command) and on the clipboard while the view is open. No
  timer clears it (`src/components/bot-settings/BotApiCard.tsx:134-139`,
  `:163`). The server keeps only a SHA-256 of the key, outside the bot
  record (`server/bot-api.ts:28`, `:76-78`, `:115-129`). That part is right.
- Release problem: none. A judgment call.
- Options:
  - a. Show the key one time with a "Copy" button, and clear it from the
    page after a copy or after a time limit.
  - b. Follow the reference.

## New facts for open proposals

Each fact goes to the plan file of its proposal when the author decides it.

| Proposal | New fact | Reference lines |
|---|---|---|
| P76 (`store-and-data-format.md`) | A create of a bot also saves with no guard after a failed read of `bots.json`. A dialog save of an existing bot gets 404 and writes nothing. `bot-api.json` refuses writes with 503 after a failed read, so the reference has the guard in one store and not in the other | `server/store.ts:1251`, `:1312`; `server/bot-api.ts:262` |
| P411 (`bot-profile.md`) | See P687 | `src/state/store.tsx:2483-2499`; `src/lib/bot-duplicate.ts:36` |
| P412 (`bot-profile.md`) | See P683. The field save has no revision at all | `server/routes/bot-patch.ts:35`, `:159`, `:794-796` |
| P445 (`tool-selection.md`) | Confirmed on the server: a member cannot send `settings.toolScope`, so a team User's copy can never have a scope | `server/request-auth.ts:605-609`; `server/routes/bots-create.ts:135-141`; `packages/phone-protocol/src/tool-scope.ts:72-75` |
| P259 (`connected-apps.md`) | See P684 | `src/lib/bot-app-access.ts:28-32`, `:53-55` |
| P513 (`engines-and-accounts.md`) | The mode also changes what a model pick does (P680), not only what the person sees. Both branches stay in the bot menu | `src/components/ModelPicker.tsx:230`, `:429`, `:469`; `src/components/SidebarBotMenu.tsx:58`, `:308-484` |
| P406 and P420 (`bot-profile.md`) | New bot makes the bot at once, with no dialog, since 2026-10-27 (`a9d725204`). A template with Auto on this computer starts the bot on Ask, with a notice. A team User gets an empty template | `src/lib/new-bot.ts:54-79`, `:71-72`; `server/routes/bots-create.ts:140` |
| P418 (`bot-profile.md`) | The "Set up" button sends "/setup" to the current thread of the bot, not to the thread on the screen. The gate is the `agentsMcp` capability | `src/components/BotSettingsDialog.tsx:117-120`; `src/components/bot-settings/useBotSettingsDerived.ts:75` |

## Changes to `docs/decisions.md` after the author decides

No new decision is needed for P680 to P688. Each one fits an existing step or
proposal. Two small changes are possible:

1. D16 (the desktop window follows the layout of the reference): add a note
   that the panel of the reference has three tabs (Details, Library,
   Computer) since 2026-10-27, and opens other pages from rows
   (`src/components/bot-panel/page-registry.ts:4-10`). The verification
   text of the reference still says six tabs.
2. If the author takes the note of P686: a short entry, or a line in the
   security decision, that the prompt text of file locations is not a
   limit, and only the sandbox limits file access
   (`server/workspace.ts:146`).

## Drift in the documents of the reference

For the author only. No change to our files.

- `docs/verification/bot-settings.md:143-149` still describes the role
  popup that `a9d725204` removed.
- `docs/verification/bot-settings.md`, "The Simple panel", lists six tabs.
  The code has three since `d8ad64820` (2026-10-27).
- `docs/verification/bot-continuity.md:32` gives the default scope of
  Advanced only.
