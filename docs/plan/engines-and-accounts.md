# Plan: Engines and accounts

The proposals from the research file
[`../research/features/engines-and-accounts.md`](../research/features/engines-and-accounts.md)
(batch 9, reference commit `140172d88`). The steps, the pull requests and the
order are in [`README.md`](README.md). The author decides each proposal.
Then it becomes a decision, a pull request or a choice, and its text leaves
this file. A path that starts with `crates/`, `docs/plan/`, `docs/research/`,
`docs/decisions.md` or `docs/comparison.md` is ours. All other paths are in
the reference project.

- **Steps:** 3, 4, 6, 7 and 9, and a new step for accounts.
- **State:** all open.
- **The main finding:** each engine finds "signed in" in its own way. When a
  check cannot finish, some engines count as signed in and others as signed
  out. The registry shares one status read for each engine, with a limit of
  60 s, and keeps the last status when a read cannot finish. A named account
  is a config entry with its own engine home
  (`server/harness/registry.ts:96-114`; `server/harness/probe-hold.ts:34-40`;
  `server/drivers/acp/cursor.ts:298-311`; `server/claude-accounts.ts:71-89`).

## Proposals

- **P499 (plan, steps 3 and 4, with P62). The sign-in state is one type with
  three values:** `SignedIn { account }`, `SignedOut` and
  `Unknown { why }`. A timeout, a stopped process or a lack of processes is
  always `Unknown`, as in `server/harness/probe-hold.ts:34-40`. One contract
  test runs on each driver: a status command that times out gives
  `Unknown`. A status check makes no blocking call.
  - **Problem in the reference:** a check that cannot finish counts as
    signed in for some engines (`server/drivers/acp/grok-sign-in.ts:19-23`,
    `:56-61`; `server/drivers/acp/copilot.ts:25-31`) and as signed out for
    others (`server/drivers/acp/cursor.ts:298-311`; `kimi.ts:43-50`;
    `cline.ts:138-141`; `deepseek.ts:124-128`). Codex shows an unknown
    status as signed out but lets a turn run
    (`server/drivers/codex-login.ts:22-74`). So the person sees "sign in"
    for an engine that is signed in, or a bot gives its turn to the backup.
    One check blocks the event loop for up to 2 s
    (`server/drivers/acp/mistral-vibe.ts:52-66`). The release problem:
    "Sign-in to an engine, and engine CLIs that change" (v0.1.177,
    v0.1.178).
- **P500 (plan, step 3, PR 3.2). `DriverError` has a `SignedOut` variant.**
  Each adapter makes it from its own protocol (an ACP error code, an exit
  code), never from words in a message.
  - **Problem in the reference:** the live check finds "signed out" with a
    regular expression on the error text (`server/engine-check.ts:14`), and
    one driver finds its sign-in errors by words
    (`server/drivers/antigravity.ts:113-130`). A CLI that changes its words
    gives "other", and the person gets no prompt to sign in. The release
    problem: "Sign-in to an engine, and engine CLIs that change" (v0.1.101,
    v0.1.153).
- **P501 (decision, new step for accounts). A named account is a config
  entry with its own engine home.** Follows the reference:
  - An entry has an id, a driver kind, a name and a home folder. The
    built-in entry uses the shared sign-in of the computer and cannot be
    removed (`server/routes/instances.ts:577-579`;
    `server/claude-accounts.ts:71-89`).
  - A new account copies only the CLI path, never the environment or the
    sign-in of another account (`server/routes/instances.ts:180-184`;
    `server/routes/antigravity-accounts.ts:24-35`).
  - Two accounts cannot share one home, and each home has one sign-in at a
    time (`server/routes/instances.ts:540-550`;
    `server/drivers/device-auth.ts:15-16`, `:124-128`).
  - An account that a bot, a backup, a task or the history uses cannot be
    removed or get a new home (`server/routes/instances.ts:82-91`,
    `:540-549`, `:580-582`).
  - For a named account, each account key of the parent leaves the engine
    environment (`server/drivers/claude.ts:119-135`).
- **P502 (plan, accounts step). Keep the sign-in tokens that the app holds
  in a folder of their own, not next to an engine home.** A judgment call:
  no release problem. The refresh token of a ChatGPT plan is in the parent
  folder of its `CODEX_HOME` (`server/drivers/codex-account-home.ts:14-21`;
  `server/drivers/chatgpt-plan-auth.ts:110`). The bot box hides that folder
  (`server/bot-box/plan.ts:204`, `:255-265`, `:303-309`). With P19 (the
  keychain), this can be unnecessary.
- **P503 (plan, step 9). Each sign-in flow ends on the server, and the
  window cancels a flow that it leaves.** Follow the limits of the
  reference: 30 s to get a code, 15 minutes of life, 1.5 s to stop, then a
  stop of the process tree (`server/drivers/device-auth.ts:137-141`,
  `:373-386`). Better: a timer of the core ends a flow at its expiry, and
  no other work waits on a sign-in.
  - **Problem in the reference:** sign-in sessions expire after 15 minutes,
    but no timer removes them (`server/provider-auth-sessions.ts:41`,
    `:150-152`). The pill of the first screen has no Cancel, so the login
    process runs until the expiry
    (`src/components/onboarding/SignInPill.tsx:117-158`). An account that
    leaves the list drops its sign-in with no cancel
    (`src/components/EngineAccounts.tsx:372-376`). The Google poll has no
    limit (`src/components/EngineSetup.tsx:314-348`). While a sign-in runs,
    a restore, a data move and maintenance wait up to 15 minutes
    (`server/index.ts:9350`, `:11892`, `:15115`). The release problem: "A
    turn or a wait that does not end" (v0.1.124).
- **P504 (plan, step 9, with P103). The files of the person that a server
  engine home gets come from an allow list.** A failed link or home fails
  the account check with a reason, and never falls back to the home of the
  person.
  - **Problem in the reference:** the shared Codex home links each file of
    the person's Codex home, except a deny list
    (`server/drivers/codex-shared-home.ts:14-33`, `:107-115`), so a file
    that a new Codex version adds is linked too. In four cases the turn
    runs in the person's own home and reads the person's `AGENTS.md`
    (`codex-shared-home.ts:145-158`). The release problem: "The person's own
    engine config reaches the bots" (v0.1.170, v0.1.175).
- **P505 (plan, steps 4 and 6, corrects P88). Follow the reference for the
  status read and the probe hold.**
  - One read for each engine at a time, shared by all callers. A finished
    read answers for 3 s. Each read has 60 s
    (`server/harness/registry.ts:96-114`, `:285-305`).
  - A timeout, a stopped process or a lack of processes keeps the last
    status. A first read that cannot finish, with the program file present,
    gives "available, unverified", which never runs a turn
    (`server/harness/probe-hold.ts:34-40`, `:64-73`).
  - Tries again after 30 s, 60 s, 120 s, 300 s and 600 s. On a calm machine,
    the third read in a row that cannot finish is believed
    (`probe-hold.ts:13-16`; `registry.ts:613-622`).
  - The statuses go to `providers/engine-status.json` (mode 0600) at most
    one time each second, with display fields only. At start they show the
    list until the first read, and never choose where a turn runs
    (`server/harness/engine-status-file.ts:35-60`, `:98-128`;
    `registry.ts:418-421`).
  - Better, a judgment call: the read checks the `v` field of the file
    (`engine-status-file.ts:98-114` does not).
  - Correction: P88 and the row "One slow or stuck part" of section 7 of
    `../research/changelog.md` say that the hold is in the container probe.
    At `140172d88` the registry holds these reads itself
    (`registry.ts:594-650`), and the 60 s limit is at `registry.ts:96-114`.
- **P506 (plan, step 7, PR 7.6). Test a saved API key with one read-only
  request.** Follows the reference: one GET to `{base}/models`, 10 s, no
  redirect, https or loopback only. 401 or 403 is "rejected", a network
  error or a timeout is "unreachable", and another status is "unexpected"
  (`server/provider-key-check.ts:89-135`). The UI says that a pass proves
  only the model list (`src/locales/en.json:4205-4206`). The result never
  has the key (`server/routes/status.ts:146-181`).
- **P507 (plan, step 4 with P62, and the UI steps). Capability flags replace
  each check by driver name:** the sign-in method, more than one account, a
  home setting, and the rank for the default model. A judgment call: it is
  the rule of `AGENTS.md`, not a release problem. The reference checks names
  in the server (`server/harness/registry.ts:137`; `server/cli-probe.ts:12-18`;
  `server/routes/instances.ts:447`, `:499-501`, `:510`;
  `shared/ai-ranking.ts:21-30`) and in the window
  (`src/components/EngineLibrary.tsx:15-17`;
  `src/components/DeviceSignIn.tsx:21-28`;
  `src/components/EngineSetup.tsx:40-42`, `:276-286`;
  `src/lib/engine-rail.ts:26-32`).
- **P508 (new facts for P61, step 9). The keys of an engine process come
  from an allow list.**
  - **Problem in the reference:** on a server, an added OpenAI-compatible
    server with its own address and no key of its own reads the workspace
    key from the environment and sends it to its own address
    (`server/drivers/openai-compat.ts:205-216`;
    `server/credential-env.ts:62-68`). The docs say it
    (`apps/docs/content/docs/providers/model-providers.mdx:122-123`), but
    the key goes to a host that its vendor does not run. Keys exported in
    the shell of the server reach each engine, an open risk that a test
    names (`server/model-providers-docs.test.ts:185-199`). The release
    problem: "A secret or an access right in the wrong place" (v0.1.19,
    v0.1.92, v0.1.101).
- **P509 (new facts for P462). A failed read of the sign-in resume file
  keeps the old file.**
  - **Problem in the reference:** a read error leaves the lists empty, and
    the next save writes over the file (`server/host/sign-in-resume.ts:89-117`),
    so the messages that wait for a sign-in are lost. The release problem:
    "A file written over after a failed read" (v0.1.103, v0.1.107,
    v0.1.151). P462 puts the waits in the store, which answers this too.
- **P510 (plan, later step). The default model of a new bot is computed, not
  saved.** Follows the reference: a saved default wins if it can be used,
  else new bots go to setup and never to another provider
  (`server/default-model-selection.ts:62-84`). Else: enabled, available and
  ready first, then the rank, then an engine that answered a test message
  (`default-model-selection.ts:22-29`, `:86-92`;
  `server/tested-ai.ts:146-151`). The rank is a capability or a config
  field (P507).
- **P511 (plan, step 9, no I/O). Follow the reference for the parse of a
  device code.** Whole lines only, the last valid pair of page and code
  wins, and the page is https with an exact host and no user, port or
  fragment (`shared/device-sign-in.ts:14-114`). The words of the CLI never
  reach the person: each failure has a fixed sentence
  (`server/drivers/codex-device-auth.ts:12-23`;
  `server/drivers/device-auth.ts:144-147`). A table test with recorded
  outputs of each CLI version.
- **P512 (new facts for P41 and P68, step 9). Process control on Windows.**
  - **Problem in the reference:** a sign-in process stops as a process group
    on POSIX, but only the child stops on Windows
    (`server/drivers/device-auth.ts:373-386`). The records of engine
    processes are off on Windows (`server/engine-records.ts:148`). The
    release problem: "Process control on Windows" (v0.1.140).
- **P513 (note for D16, `bot-desktop`). No switch of the UI mode.** One
  layout, and no mode switch until a need is proven.
  - **Problem in the reference:** the UI mode changed four times (v0.1.94,
    v0.1.151, v0.1.152, v0.1.182). The code keeps both paths
    (`src/lib/simple-only.ts`; `src/lib/new-look.ts:35-59`), and the
    settings show only the Simple list, so the full engine grid shows only
    in tests (`src/components/settings/pages/PlacePages.tsx:133`;
    `src/components/EnginesSettings.tsx:598`). The release problem: "A
    feature added, then removed or reversed", section 6 row "The UI mode".
- **P514 (plan, later step). Follow the reference for `doctor`, and check
  the engines too.** The data doctor has fixed checks, makes a backup before
  each fix, and counts a fix only when a check after it is clean
  (`server/doctor/run.ts:93-137`; `server/doctor/backup.ts:39-113`).
  Better, a judgment call: the doctor of the reference never checks an
  engine sign-in (`server/headless/commands.ts:29`). Ours reads the status
  of each engine through the shared read of P505.
