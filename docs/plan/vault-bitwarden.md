# Plan: Bitwarden in the Vault

The proposals from the research file
[`../research/features/vault-bitwarden.md`](../research/features/vault-bitwarden.md)
(batch 11, reference commit `42f86aefd`). The steps, the pull requests and
the order are in [`README.md`](README.md). The author decides each proposal.
Then it becomes a decision, a pull request or a choice, and its text leaves
this file. A path that starts with `crates/`, `docs/plan/`, `docs/research/`,
`docs/decisions.md` or `docs/comparison.md` is ours. All other paths are in
the reference project.

- **Steps:** none yet. A linked password manager needs the Vault of the
  write-only secrets (step 6, P19 and P20), the store (step 8), the process
  code of step 9 and the MCP keys of step 16. It can come in a new step
  after step 16. P564 goes to step 6, P565 to step 8, and P562 to step 9.
- **State:** all open. Decide P574 and P573 first. P574 is the license
  border of `AGENTS.md`, and P573 puts the I/O outside `bot-core`, as
  `AGENTS.md` says.
- **The main finding:** the reference links two Bitwarden products. The
  vault provider runs the `bw` tool (GPL-3.0) as a child process from a
  pinned download. The Secrets Manager provider speaks the public HTTP API
  with its own client. No Bitwarden code is in the reference
  (`server/host/bitwarden-cli.ts:1-5`,
  `server/host/bitwarden-secrets-api.ts:1-2`). Every item of both providers
  is for every bot (`server/host/bitwarden-vault.ts:3-4`,
  `server/host/bitwarden-secrets.ts:3-4`). A `bw://` reference gives a bot a
  website password and its one-time code
  (`server/host/bitwarden-vault.ts:142-147`, `:360`).

## Proposals

- **P559 (plan, later). One rule for the reach of a
  reference, the same for each manager.** A reference reaches only a secret
  field. A Login's password, username and one-time code go only to
  `fill_login`, never to a bot by reference. A `bws://` reference to a
  login secret is refused. One test runs over each provider.
  - **Problem in the reference:** a bot gets a website password and its
    current one-time code as a value with `bw://GitHub/password` or
    `bw://GitHub/totp` (`server/host/bitwarden-vault.ts:142-147`, `:360`,
    `server/cloud-team-bitwarden.e2e.test.ts:82`,
    `server/host/bitwarden-vault.test.ts:67`, `:70`). The bot can then use
    them outside the login fill. The same reference for 1Password does
    not give the value. The server makes a card (status 201), and a Login's
    password never reaches the bot
    (`server/cloud-team-onepassword.e2e.test.ts:76`, `:84-86`). The team
    doc says "The same rules" (`docs/team-cloud.md:97`, `:100`). A
    `bws://` reference reads the password of a login secret with no site
    check and no username check (`server/host/bitwarden-secrets.ts:237-240`,
    `:252-255`). The read of a login item does these checks (`:249`). The
    release problem: "A secret or an access right in the wrong place"
    ("Automations stay within the accounts each bot may use.", v0.1.178.
    "each bot reaches only its own AI account's sign-in", v0.1.181).
  - Where: `bot-core::vault`, the lookup.
- **P560 (plan, later). Bot grants for the items of each manager.** An item
  of a linked manager has a list of bots, as each Vault item has.
  - **Problem in the reference:** every Bitwarden and Secrets Manager item
    is for every bot, and the UI has no bot choice for these items
    (`server/host/bitwarden-vault.ts:3-4`, `:335`, `:344`,
    `server/host/bitwarden-secrets.ts:3-4`, `:217`, `:227`,
    `src/components/VaultSettings.tsx:218-221`). 1Password has grants for
    each vault and each item (`server/bot-logins.ts:195-210`). The release
    problem: "A secret or an access right in the wrong place" (v0.1.178,
    v0.1.181).
  - Options for the default of a new connection:
    - a. All bots, as the reference does.
    - b. No bots. The person adds each bot.
  - In both options, the own bot of a team member is never in a team grant
    by default.
  - Where: `bot-core::vault` and `bot-desktop`.
- **P561 (plan, later, before step 16 uses linked MCP keys). Ask only the
  manager that holds the secret. Turn start never waits for a manager.** A
  lookup by name uses the cached lists and refreshes only the manager that
  matched, with its own deadline. A manager that failed is held down for a
  period. Turn start uses the last value and refreshes in the background,
  or mounts the MCP server as "key not ready".
  - **Problem in the reference:** `fresh()` waits for all managers with
    `Promise.all` (`server/bot-logins.ts:101-103`). A tool call, a login
    fill and turn start wait for it (`server/bot-logins.ts:107`, `:141`,
    `server/index.ts:7784`, `:9674`,
    `server/host/mcp-servers-host.ts:205-211`,
    `server/vault/mcp-keys.ts:122-127`). Thus a slow Bitwarden holds a
    1Password secret and a turn for minutes. A failed refresh has no
    hold-down, so each call tries again
    (`server/host/bitwarden-vault.ts:207`, `:252`, `:258-259`). The release
    problem: "One slow or stuck part blocks all the others" (v0.1.114,
    v0.1.153, v0.1.177, v0.1.178).
  - Where: `bot-core::vault`.
- **P562 (plan, step 9). A CLI runner with one deadline and a typed
  result.** One deadline covers the install, the unlock and the read. A
  call to a tool that is still in download fails at once with a typed "not
  ready" refusal. A time-out kills the process group, and a hard kill comes
  after a short grace. The result tells a time-out, an output overflow and
  an outside kill apart. Calls on one settings folder run one at a time.
  The secrets are a separate typed field, so they cannot go into the
  argument list.
  - **Problem in the reference:** the first call waits for the download (10
    minutes) before its 60 s start (`server/host/bitwarden-cli.ts:27`,
    `:105`). One unlock can make 6 calls of 60 s, one after the other
    (`server/host/bitwarden-vault.ts:275-293`). Each kill counts as a
    time-out (`server/host/bitwarden-cli.ts:117`). The release problems:
    "One slow or stuck part blocks all the others" (v0.1.114) and "A turn
    or a wait that does not end" ("A stuck engine stops in minutes, not
    15.", v0.1.132).
  - Where: the I/O crate of P573, with the process code of step 9 (P41,
    P68).
- **P563 (plan, step 9). Read the answers of `bw` by exit code and JSON,
  and keep recorded answers for each pinned version.** A test plays the
  recorded answers of the pinned version. A change of the pin needs new
  recordings.
  - **Problem in the reference:** the error mapping reads the English text
    of `bw` (`server/host/bitwarden-vault.ts:72-85`), and the fake copies
    those texts (`server/testing/fake-bw.ts:28-65`). A new wording becomes
    "could not be read", and no test fails. The release problem: "Sign-in
    to an engine, and engine CLIs that change" ("failed on Codex 0.160",
    v0.1.101).
  - Where: the I/O crate of P573.
- **P564 (plan, step 6). One rule for the life of a read value.** A read
  value has a type that gives its kind (password, code, other) and its time
  to live. The masking uses the kind. The MCP cache keeps a value for a
  stated time, and the provider documentation says so.
  - **Problem in the reference:** a one-time code that `bw://x/totp` reads
    is held as a "password" for the life of the process
    (`server/index.ts:744`). A value of less than 4 characters is never
    masked, and the set of 500 values drops the oldest value
    (`server/vault-store.ts:591-593`, `:635-636`). The MCP cache keeps a
    value for 15 minutes, but the providers say that a value is "never
    kept" (`server/vault/mcp-keys.ts:16`, `:51`, `:61`,
    `server/host/bitwarden-vault.ts:2`). The release problem: "A secret or
    an access right in the wrong place" (masking, v0.1.154).
  - Where: `bot-core`, with the redaction of step 6.
- **P565 (plan, step 8). A linked id that a reference reached stays after a
  restart.** The stored MCP pointer row keeps the provider and the item id,
  not only a hash.
  - **Problem in the reference:** the map `referenced` is in memory only
    and has no limit (`server/bot-logins.ts:69`, `:147`). After a restart,
    an MCP server with such a pointer reports "its key is no longer in the
    Vault", but the item is still in Bitwarden
    (`server/vault/mcp-keys.ts:45`, `:57-58`). The release problem: "State
    lost at a restart or a crash" (v0.1.24, v0.1.165).
  - Where: `bot-core::vault`, with the store of step 8.
- **P566 (plan). A bounded Secrets Manager list.** Set a maximum size for
  the answer. Skip and count an entry that does not decrypt. Give the full
  refresh one deadline. Read a value only when a bot uses it, and do not
  decrypt 1000 values to read their notes.
  - **Problem in the reference:** the list has no paging and no size
    limit, and one bad name fails the full list
    (`server/host/bitwarden-secrets-api.ts:82`, `:112-118`). A refresh of
    more than 1000 secrets makes 12 or more requests, one after the other,
    with no total deadline (`:123`, `:130-134`). The release problem: "One
    slow or stuck part blocks all the others" (an address "is left out of
    turns and named once, instead of slowing every turn", v0.1.178).
  - Judgment call for the notes part: no release names it
    (`server/host/bitwarden-secrets.ts:165-166`).
  - Where: the I/O crate of P573.
- **P567 (plan, `bot-desktop`). The connect form has a time limit and
  stage text.** The form shows "Downloading the tool", then "Checking the
  account". A connect that goes past the limit shows a fixed error, and the
  person can try again.
  - **Problem in the reference:** the client sets no time limit. Only a
    spinner shows while the server downloads about 40 MB and checks the
    account (`src/lib/logins.ts:29-51`,
    `src/components/BitwardenConnection.tsx:70`). The release problem: "A
    turn or a wait that does not end" ("waits forever on 'Reserving your
    machine'", v0.1.123).
- **P568 (plan). Only fixed text leaves the server.** An error that goes to
  a bot or to the window is a fixed text for its class, never the message
  of a wrapped error.
  - Judgment call: no release problem is proven here. The research did not
    verify that the message can hold output of the tool.
  - Reason: `load` keeps the message of any other error
    (`server/host/bitwarden-vault.ts:256`). The route and the tool answer
    send it on (`server/routes/logins.ts:182`,
    `server/host/secret-cards.ts:642`). The admin report already uses only
    fixed classes (`server/cloud-team-admin.ts:34-36`).
- **P569 (plan). The item names from a manager are untrusted text.** Remove
  the bidi marks, keep the caps of 80 and 40 characters, and say in the
  prompt that they are names, not instructions.
  - Judgment call: no release names it.
  - Reason: a Bitwarden item name is text from the outside account. It
    goes into the prompt with less cleaning than the own text of the person
    (`server/system-prompt.ts:18-28`, `:173`, `:237`).
- **P570 (plan). A name collision is a typed "ambiguous" refusal.** The
  same rule for names and references, with the ids of the candidates.
  - Judgment call: no release names it.
  - Reason: two items with the same `bw://` name read nothing, and the bot
    gets no reason (`server/host/bitwarden-vault.ts:358`). Two listed
    secrets with the same name key read the first one, in provider order,
    with no warning (`server/vault/providers.ts:68-71`,
    `server/bot-logins.ts:78`).
- **P571 (plan). One list of provider kinds for the admin report and for
  the member-denied test.** A new provider then fails the test until
  somebody adds it.
  - Judgment call: no release names it.
  - Reason: Secrets Manager has no row in the admin report
    (`server/host/team-vault-report.ts:26-33`,
    `server/cloud-team-admin.ts:37-40`). The member test of Bitwarden does
    not check `GET /api/logins`, but the 1Password test checks it
    (`server/cloud-team-bitwarden.e2e.test.ts:95-98`,
    `server/cloud-team-onepassword.e2e.test.ts:98`).
- **P572 (plan). Check the installed tool, and remove old versions.** Keep
  the SHA-256 next to the tool, and check it before the first start in a
  run. Delete the folders of older versions after an install. Put the
  settings folder of the tool in the cache class.
  - Judgment call: no release names it.
  - Reason: any file at the install path runs
    (`server/host/bitwarden-cli.ts:57-58`). Old versions stay, about 40 MB
    each (`server/host/bitwarden-cli.ts:20-24`). The storage report calls
    the folder "precious", but a new sign-in makes it again
    (`server/perf/disk-categories.ts:187`).
- **P573 (choice, decide first). Where the provider code goes.** The
  `VaultProvider` trait, the lookup, the grants and the prompt text go in
  `bot-core::vault`. The `bw` runner, the download and the Secrets Manager
  client do I/O, so they go in a different crate. `bot-cli` connects them.
  - This follows the reference: the providers are separate modules behind
    one interface (`server/vault/providers.ts:16-30`). `AGENTS.md` says
    that `bot-core` does no I/O beyond its store.
  - Options for the I/O crate:
    - a. `bot-engine`. It has the child-process code of step 9 and the HTTP
      code of step 5.
    - b. A new crate, when the boundary is proven (D4).
- **P574 (decision, decide first). The license border of Bitwarden.**
  Follow the reference. We never link a Bitwarden SDK or crate. We run `bw`
  (GPL-3.0) only as a separate process from a pinned download. We speak the
  public HTTP API of Secrets Manager with our own client, because its SDK
  and the `bws` tool are under the Bitwarden SDK License. A `cargo deny`
  rule and a test over `Cargo.lock` keep this border.
  - Source: `server/host/bitwarden-cli.ts:1-5`,
    `server/host/bitwarden-secrets-api.ts:1-2`,
    `scripts/testing/no-bitwarden-dependency.test.ts:1-23`.
  - This answers the license rule of `AGENTS.md`. It goes in
    `docs/decisions.md` as the next free decision number. It also corrects
    `docs/comparison.md:183`, which says "No crate checked".
- **P575 (plan, `bot-desktop`). Small changes to the UI.** Judgment calls:
  no release names them.
  - Clear the typed secrets after each answer, and keep the server and the
    id. The reference keeps them after a failure
    (`src/components/BitwardenConnection.tsx:36-37`).
  - One map from provider to label, with a neutral fallback. The reference
    labels an unknown provider "From 1Password"
    (`src/components/VaultSettings.tsx:30`).
  - Ask before Disconnect, as Delete does
    (`src/components/BitwardenConnection.tsx:58-59`,
    `src/components/VaultSettings.tsx:118-119`).
  - One connect component that a description of the provider drives. The
    reference has two near copies (`src/components/BitwardenConnection.tsx`,
    `src/components/BitwardenSecretsConnection.tsx`) and the 1Password form
    (`src/components/VaultSettings.tsx:400-467`).
  - Refuse a self-hosted address that is not `https` in the form, and give
    the reason. The form has only `type="url"`
    (`src/components/BitwardenConnection.tsx:84`).

## New facts for open proposals

- **P19 (the keychain):** the reference keeps the Bitwarden master password
  and the API key in the Vault file, and the key of that file in a file
  next to it (`server/vault-store.ts:19`, `:76`, `:206-217`). A person who
  reads both files gets the full account. An option for us: offer the
  machine-account token first, which Bitwarden limits to chosen projects,
  and keep a master password only in the keychain.
- **P22, P232 and P367 (no write after a failed read):** the Vault store
  has the same problem (`server/vault-store.ts:228-233`, `:518-521`). The
  Bitwarden trap: after the failed read, the vault provider shows "not
  connected" with no error (`server/host/bitwarden-vault.ts:184-186`), and
  a reconnect erases the rest of the Vault.
- **P20 and P480 (the `Secret` type):** the access token, the seed, the
  bearer, the organization key, the master password and the session key
  need it (`server/host/bitwarden-secrets-api.ts:11`, `:93`,
  `server/host/bitwarden-vault.ts:164`).
- **P40 (a key only in the environment of the child):** the `bw` runner is
  a model for it. It builds the environment from nothing, and a fake
  records each secret in an argument (`server/host/bitwarden-cli.ts:109-112`,
  `server/testing/fake-bw.ts:25`).
