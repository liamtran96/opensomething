# Plan: Onboarding

The proposals from the research file
[`../research/features/onboarding.md`](../research/features/onboarding.md)
(batch 12, reference commit `42f86aefd`). The steps, the pull requests and
the order are in [`README.md`](README.md). The author decides each proposal.
Then it becomes a decision, a pull request or a choice, and its text leaves
this file. A path that starts with `crates/`, `docs/plan/`, `docs/research/`,
`docs/decisions.md` or `docs/comparison.md` is ours. All other paths are in
the reference project.

- **Steps:** none yet. The first run needs the chat driver (step 5), the
  settings (step 6) and the event bus to the window (step 7). P626 adds a
  new step after step 7. P627 and P628 change step 6. P632 (the terminal
  wizard) and P635 (where the import lives) are gaps. P633 is a note for
  D10.
- **State:** all open. Decide P626 first: it says if the first run follows
  the reference. Then decide P627, because it is a rule of `AGENTS.md`.
- **The main finding:** the reference has three first-run flows: the desktop
  welcome, the terminal wizard and the Cloud welcome. The desktop welcome is
  two screens, "Meet {app}" (connect one AI and test it) and the Chief
  introduction, then the chat of that bot
  (`src/components/onboarding/WelcomeFlow.tsx:69-133`). The welcome opens the
  chat first and saves its end after, and it ignores a failed save
  (`WelcomeFlow.tsx:96-102`). The import from other AI tools reads the
  skills and the MCP server lists of seven tools. It copies the skills once
  and adds the MCP servers switched off (`server/setup-import.ts:97-386`).

## Proposals

- **P626 (plan, new step after step 7, `bot-core`, `bot-desktop`). A first
  run that follows the reference: two screens, then the chat.**
  - What:
    - an onboarding record in the settings of step 6;
    - a gate that is a pure function of the settings;
    - screen 1 connects one AI and sends one test turn;
    - screen 2 introduces the first bot as the Chief;
    - then the chat of that bot opens;
    - a replay of the welcome from the settings;
    - a clean data folder never shows the welcome again after it ends.
  - D10 asks for this order: "connect one AI provider, make a bot and send
    it a task".
  - Why: follows the reference. The step comes after step 7, because the
    test turn needs the chat driver (step 5), the settings (step 6) and the
    event bus to the window (step 7).
  - Crates: `bot-core` (the record and the gate), `bot-desktop`
    (`ui/src/features/onboarding/`).
  - Source: `src/lib/onboarding.ts:55-113`,
    `src/components/onboarding/WelcomeFlow.tsx:69-133`,
    `src/components/onboarding/MeetScreen.tsx:67-147`,
    `src/components/onboarding/ChiefIntro.tsx:78-100`,
    `electron/clean-workspace.mjs:26-44`.
- **P627 (decision, step 6 and P626, `bot-core`). The core saves the end of
  the welcome before the window moves on.** A failed save shows an error and
  keeps the welcome open. No browser mark stands for the settings.
  - **Problem in the reference:** the welcome opens the chat first and saves
    after. A failed save shows nothing: the `catch` block is empty
    (`WelcomeFlow.tsx:96-102`). A browser mark then hides the welcome in
    that browser, so the record stays incomplete there for good, and
    `met-chief-v1` is never saved. Another browser shows the welcome again
    (`src/lib/analytics.ts:208-210`, `src/lib/onboarding.ts:65`,
    `scripts/verify-onboarding-ui.ts:82-125`). No release of the changelog
    names this problem. The reason is the rule of `AGENTS.md`: "writes the
    row and its event in one transaction before anything acts on it".
  - Why: better than the reference. The window acts on the end only after
    the core confirms it. One owner keeps the state, not two (the settings
    and the browser). Our window has one origin, so a browser mark gives
    nothing that the settings do not give.
  - Source: `WelcomeFlow.tsx:88-105`, `src/lib/analytics.ts:203-210`,
    `src/lib/onboarding.ts:55-67`, `src/lib/corner-popup.ts:24-29`.
- **P628 (plan, step 6, `bot-core`). The onboarding record is a typed
  struct, and a hint is a closed enum with an "add" operation.**
  - What: `Onboarding { completed: Option<Completed>, hints: BTreeSet<Hint> }`,
    where `Hint` is an enum. The core adds a hint to the stored set. It
    never takes a whole list from the window. A field or a hint that has no
    writer cannot exist in our code, because the enum names each one. An
    unknown hint on disk stays in the file as a string, and each save keeps
    it, as P22 asks ("Keep what this version does not know"). So an older
    build never deletes the hints of a newer build.
  - **Problem in the reference:**
    - The reel was removed (commit `19ab6384f`), but `reelSeen` stays in
      the schema and the status, with no writer (`server/config.ts:233`,
      `server/index.ts:11630`).
    - The "one release" legacy gate is still active
      (`src/lib/onboarding.ts:65`).
    - Two of the four spotlights are always "seen", so their code and texts
      are dead (`src/components/onboarding/FirstConversationTour.tsx:25`).
    - Each save replaces the whole hint list, so two windows can drop a hint
      (`server/config.ts:892-901`). This is inferred from the code and not
      tested.
    - No release of the changelog names these. This is a judgment call. The
      reason is a wrong state that the compiler refuses.
  - Why: better than the reference.
  - Source: `server/config.ts:230-236`, `:892-901`,
    `src/lib/onboarding.ts:86-96`,
    `src/components/onboarding/beats/shared.tsx:5-51`.
- **P629 (decision, P626, `bot-engine`, `bot-desktop`). A test turn that does
  not answer is "not checked", never "working".**
  - What: the result of the test turn is an enum: `Passed`,
    `Failed(reason)` or `NotChecked(reason)`. Screen 1 shows `NotChecked`
    with "Test again". The welcome can go on, but it does not say that the
    AI works.
  - **Problem in the reference:** a test call that does not reach the
    server, or that times out after 120 s, reads as "untestable". The
    welcome counts "untestable" as a working AI, and it hides the sign-in
    buttons (`src/components/onboarding/welcome-ai.ts:48-51`,
    `src/lib/onboarding.ts:228-230`). The changelog theme "Sign-in to an
    engine" has the opposite mistake: a brief sign-in failure read as signed
    out (v0.1.177, v0.1.178). Both read a check result wrong. This exact case
    is in no release, so it is a judgment call.
  - Why: better than the reference. A person with no working AI does not
    see "Next" as if all were ready.
  - Source: `src/components/onboarding/welcome-ai.ts:13-15`, `:48-62`,
    `src/lib/onboarding.ts:228-230`, `MeetScreen.tsx:72-76`, `:138-142`.
- **P630 (plan, P626, `bot-core`). "Set up later" is recorded as a skip.**
  - What: the end of the welcome records `Completed { ai_connected: bool }`.
    When no AI is connected, the chat shows the "no AI" state of the
    reference (`noEnginesDue`).
  - **Problem in the reference:** "Set up later" and Escape call the same
    path as "Next". Each end is `"completed"`, and nothing records that the
    AI step was skipped (`MeetScreen.tsx:147`, `WelcomeFlow.tsx:113`,
    `:141-145`, `:170`). No release names this. This is a judgment call.
  - Why: better than the reference, by a small amount. A later screen can
    offer the AI again without a guess.
- **P631 (plan, with P428, `bot-core`). The import from other AI tools
  follows the read rules of the reference, and it also checks `SKILL.md`
  for keys.**
  - Follow the reference:
    - the fixed list of paths, and the absolute-path rule for environment
      paths;
    - only the top-level `mcpServers` of `~/.claude.json`;
    - one link hop at a time, no link out of the home folder, and the macOS
      privacy folders refused;
    - no secret names, no links, no hard links;
    - copy once, with the files read-only;
    - detection gives names only;
    - MCP servers come in off;
    - one save;
    - `busy` while an MCP change runs.
  - Better: `SKILL.md` goes through the same credential check as the files
    next to it. The "left out" line names the secret files too.
  - **Problem in the reference:** the credential check runs on the files
    next to `SKILL.md`, not on `SKILL.md` itself
    (`server/setup-import.ts:283-293`, `:374`). A key that a person wrote
    into a skill is copied into the data folder and is available to each
    bot. The skill scanner does not look for secrets either
    ([`../research/features/skills.md`](../research/features/skills.md),
    point 6 of its section 1). The UI says only "Large or non-text files …
    were left out" (`src/locales/en.json:3782`). The release problem: "A
    secret or an access right in the wrong place" (v0.1.19, v0.1.101,
    v0.1.154).
  - Source: `server/setup-import.ts:97-386`, `:700-731`,
    `server/imported-skills.ts:213-294`, `shared/redact.ts:96-98`.
- **P632 (plan, gap, `bot-cli`, `bot-core`, `bot-engine`). A terminal wizard
  that follows the reference.**
  - Follow the reference:
    - a `SetupIo` trait for all input and output, so that tests give a
      script;
    - nothing is written before "Save this setup?", then one save;
    - "setup complete" comes from the saved default model, not from a flag;
    - the data-folder lease, and a refusal of a file that the strict schema
      cannot read;
    - a native engine runs its own login in the terminal, and the wizard
      checks the sign-in again after it;
    - an API key gets one test message that the person agrees to, and the
      errors come from the HTTP status;
    - the recovery menu;
    - `displayText` removes control codes from each line.
  - Different, because of P19 and P232: the key goes to the same secret
    store as the desktop, and the wizard says where. See "New facts" below.
  - Why: follows the reference for the flow. Our `bot-cli` is the
    composition root (`AGENTS.md`), so the questions stay there. The save
    and the probe stay in the library crates.
  - Source: `server/cli-setup.ts:41-332`, `server/cli-api-setup.ts:9-124`,
    `server/cli-prompts.ts:6-193`, `server/cli.ts:907-972`,
    `server/data-dir-lease.ts:1-33`.
- **P633 (note for D10). The Cloud welcome, the first hour, the phone step
  and the move from the other product are not planned.**
  - What: D10 has no Cloud and no remote access, and we hold no data. So
    the Cloud welcome, the first hour of a personal Cloud and the phone step
    of the wizard have no place. The move from the other product is a
    separate choice. If we port it one day:
    - `NOTICE` carries the MIT credit that the reference carries for it:
      "the agent-importers plugin in hermes-official-plugins … Copyright (c)
      2026 Nous Research" (the `NOTICE:43-48` of the reference, for
      `shared/grok-import.ts` and `server/grok-local.ts`);
    - the names of the other product leave our identifiers and texts
      (`AGENTS.md`);
    - we follow its secret rule: refuse the whole document when it has a
      key, and keep the header names only.
  - Why: follows D10. The license line follows `AGENTS.md`.
  - Source: `src/components/cloud-welcome/`, `server/host/first-hour.ts:1-6`,
    `:546-559`, `server/cli-phone-setup.ts:59-112`, `shared/grok-import.ts`,
    `server/grok-move-tunnel.ts:1-6`.
- **P634 (plan, P626, `bot-desktop`). The app tour follows the reference,
  and a replay continues at the first step that is not seen.**
  - Follow the reference: start only from the settings. Save each step
    before its exit effect. Build the scene again on enter. Skip a missing
    anchor. Use one save chain, so that "Skip" waits for "Next".
  - Better: "Replay" opens the tour at the first step that is not seen.
    "Start again" is a separate choice.
  - **Problem in the reference:** a restart closes a running tour, and a
    replay first removes all tour ids, so the tour starts at step 1
    (`src/state/store.tsx:1840`, `src/components/AppSettingsRows.tsx:172`).
    The plan of the reference says "a reload lands on the same step"
    (`docs/plans/2026-09-09-onboarding.md:50-51`). No release names this.
    This is a judgment call.
  - Source: `src/lib/guided-tour.ts:40-90`, `GuidedTour.tsx:98-177`,
    `Spotlight.tsx:15-151`.
- **P635 (choice, with P428). Where the import from other AI tools lives.**
  - Option a: `bot-core`, as `reference-features.md` says. The module takes
    the home folder as a constructor argument. The tests give it a fake file
    system, like `SetupFs` of the reference
    (`server/setup-import.ts:22-37`).
  - Option b: a module of the shell (`bot-desktop`). Only the desktop app
    can call it, which is the rule of the reference
    (`server/routes/setup-import.ts:12-14`, `:87`). The core gets only the
    skills and the servers to store.
  - The reason for the question: `AGENTS.md` says that the runtime in
    `bot-core` "does no I/O beyond its own store". The import reads the home
    folder of the person. The rule names the runtime, not all of
    `bot-core`. [`bot-box.md`](bot-box.md) raised the same question for
    the bot box.

## New facts for open proposals

Each fact goes to the plan file of its proposal when the author decides it.

- **[P232](custom-mcp-servers.md)** (the store of tokens and server
  secrets): the import copies the literal `env` and `headers` values of MCP
  servers into `config.json`, and a test asserts it
  (`server/setup-import.test.ts:603-605`,
  `server/routes/setup-import.test.ts:182-184`). The move from the other
  product keeps the header names only, with empty values
  (`shared/grok-import.ts:300-318`, `server/grok-move.test.ts:87-89`). So
  the reference has two rules for one kind of secret. Our import follows
  P232: a secret value goes to the secret store, or it comes in empty with
  its name.
- **[P429](skills.md)** (one rule for a skill from outside): an end-to-end
  test shows an imported skill with no flag as `enabled: true`, for the
  starter bot and for a bot made later
  (`server/setup-import.e2e.test.ts:100-108`,
  `server/imported-skills.ts:305-308`). The move from the other product
  also switches on each skill that the scan passed, against its own header
  "skills off" (`src/lib/grok-move.ts:160-163`, `shared/grok-import.ts:3`).
  That is a fourth path with its own rule.
- **[P19](write-only-secrets.md)** (the API key in the keychain only): the
  terminal wizard keeps API keys in clear text in `config.json`
  (`server/cli-setup.ts:178`, `:302`). The document of the reference says
  that the desktop app encrypts provider keys in `credentials.bin`, but
  keys from the terminal wizard "stay plaintext in `config.json`, on
  desktop too" (`docs/cli-onboarding.md:80-82`). Each save also leaves the
  old keys in a dated backup (`server/config-backup.ts:88-103`). So one key
  has two stores, chosen by the program that took it. Our `bot-cli` and
  `bot-desktop` use one store.
- **[P61](driver-contract.md) and [P508](engines-and-accounts.md)** (an
  allow list for the environment of an engine): the terminal starts the
  server with the whole environment of the terminal (`server/cli.ts:710-715`).
  So a key, `CODEX_HOME` or `CLAUDE_CONFIG_DIR` in the shell of the person
  reaches the server and, through it, the engines. The wizard removes
  provider keys only from the login command (`server/cli-setup.ts:43-47`).
- **[P513](engines-and-accounts.md)** (one UI mode): the tour has a second
  step list for Simple mode (`src/lib/guided-tour.ts:53-65`), but the replay
  rows show only in Advanced mode
  (`src/components/settings/pages/AppPages.tsx:79`). So the Simple list is
  reachable only when a person changes the mode during a tour. The
  first-conversation spotlights are for Advanced mode only
  (`FirstConversationTour.tsx:18`). The browser check of the reference
  expects "Replay welcome tour" in Simple mode, and the code does not show
  it (`scripts/verify-onboarding-ui.ts:38-45`, `:67`).
- **[`security-model.md`](security-model.md)** (pairing): the text of the
  wizard says that the code "expires after five minutes"
  (`server/cli-phone-setup.ts:130`). The default of the server is 10
  minutes since commit `d818c28aa`. One constant should give both.

## Changes to `docs/decisions.md` after the author decides

- A note under D10 for P633: the Cloud welcome, the first hour of a
  personal Cloud, the phone step of the wizard and the move from the other
  product are not planned. If the move comes, `NOTICE` gets the MIT credit
  of P633.
