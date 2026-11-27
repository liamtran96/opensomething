# Vault: the Bitwarden password manager and Secrets Manager

This file is for the feature row `bitwarden.md` of
[`../reference-features.md`](../reference-features.md) (line 319). It is
part 11 of [`../README.md`](../README.md). Its plan group is "later", and
it has no step of [`../../plan/README.md`](../../plan/README.md) yet. A port
goes to `bot-core` (the provider trait, the lookup rules and the stored
credentials) and to a crate that does I/O for the two providers (section 7).

- **Reference commit:** `42f86aefd` (2026-11-27). It includes the release
  v0.1.184. Each line number in this file is at that commit.
- **Method:** five readers read five groups of files, each completely or in
  recorded ranges. The lead then read the key code again (section 2.6).
- **Names:** "the reference project" is the other project. Paths are
  relative to its root. Quoted strings keep their text, but this file
  writes `<product>` where a string has the product name. "Bitwarden",
  "Vaultwarden" and "1Password" are the names of outside products.
- **Border with the files that are done:**
  - [`write-only-secrets.md`](write-only-secrets.md) has the key store
    (`config.json`, `credentials.bin`) and the `vault:<id>` pointer of an MCP
    server (its section 3.9). This file adds the linked id
    `vault:linked-<32 hex>` and how a linked value is read for that pointer
    (section 3.8). **Correction:** its section 3.9 cites
    `server/index.ts:742`. At this commit the line is `:744`.
  - [`security-model.md`](security-model.md) has the Vault store, its file
    encryption, `routes/vault.ts` and `mcp-keys.ts` in general. Its "new
    facts for P19 and P22" already say that an unreadable Vault reads as
    empty. This file adds the Bitwarden trap of that problem (section 3.10).
  - [`connected-apps.md`](connected-apps.md) and
    [`hosted-app-connections.md`](hosted-app-connections.md) have the app
    connections and the MCP token store. The password manager uses none of
    their code.
  - The streamed text that is masked only after the save (v0.1.154) is
    confirmed in [`chat-ui.md`](chat-ui.md) (line 1291) and
    [`approval-cards.md`](approval-cards.md) (line 1342). This file says
    only that each linked value is registered for masking before the
    hand-off (section 3.9).
  - **bot-box.md** (this batch) owns the credential broker: how a secret
    reaches the boxed process of a bot. This file stops where a value is
    given to `vault.mintRef`, `vault.mintFile` or the environment of an MCP
    server, and writes "→ bot-box.md".

## 1. In short

The **Vault** is the place where the reference project keeps logins and
secrets for bots. A **linked password manager** adds items from an outside
account to the Vault list. The list shows only names and sites. The value
is read from the manager at the moment a bot uses it.

The reference project has three linked managers:

- **1Password**, through its SDK. Other research covers it. This file
  names it only for comparison.
- **The Bitwarden password vault** (here "the vault provider"). A person
  connects a Bitwarden account. The server runs Bitwarden's own command
  line tool, **`bw`**, as a separate process.
- **Bitwarden Secrets Manager** (here "Secrets Manager"). A person connects
  a **machine account** with an **access token**. The server speaks the
  public HTTP API of Bitwarden and decrypts the answers itself.

Terms used in this file:

- **API key**: Bitwarden's personal key for a sign-in with no browser. It
  has a `client_id` (it starts with `user.`) and a `client_secret`.
- **Master password**: the password that unlocks a Bitwarden vault. The
  vault provider keeps it on the server, because `bw` needs it to unlock.
- **Session key**: the key that `bw unlock --raw` prints. The server keeps
  it in memory only and gives it to each later `bw` call.
- **Access token**: the secret of a machine account, in the form
  `0.<id>.<client secret>:<seed>`. The seed makes the key that opens the
  answers of the API.
- **EncString**: Bitwarden's text form of encrypted data,
  `2.<iv>|<data>|<mac>`.
- **Reference**: a text that names an item in a manager. The forms are
  `op://...` (1Password), `bw://<item>[/<field>]` (the vault provider) and
  `bws://<secret>` (Secrets Manager). A bot gives a reference as the label
  of the tool `request_credential`.
- **Linked id**: `linked-<32 hex>`, a stable id for one field of one linked
  item. It names a linked value in a file name and in an MCP pointer.
- **Masking**: the server replaces a known secret value in text that goes
  to a bot or a transcript.
- **Pinned download**: the server downloads `bw` from a fixed release and
  checks its size and its SHA-256 before it uses it.
- **Login, secure note, custom field**: Bitwarden item kinds. A login has a
  username, a password, website addresses (URIs) and maybe a TOTP key. A
  secure note has text. A custom field is a named value on an item. A
  hidden field is a custom field that Bitwarden masks.
- **TOTP**: a one-time code for a sign-in. The item keeps the key, and the
  code is made from the key and the time (`server/host/bitwarden-vault.ts:145-147`).
- **Login place**: one login for one site in the Vault list. A Bitwarden
  login with three sites gives three login places.
- **`fill_login`**: the tool that types a saved password and code into the
  browser of a bot. The bot never sees them.
- **Collection** (the vault provider) and **project** (Secrets Manager):
  Bitwarden's groups of items. An account or a machine account sees only
  its own.
- **Team cloud**: a server that a team shares, with admins and members.
  **Reader**: who reads the Vault in a turn. `TEAM_READER` reads only the
  team's items, not the own secrets of a member.
- **Direct turn** and **room turn**: a turn in a chat with one bot, and a
  turn in a group chat.
- **Hold-down**: a period after a failure in which the server does not try
  again.

What the feature does, in five points:

1. An admin connects an account in Settings → Vault. The server checks the
   credentials against Bitwarden before it keeps them.
2. The server lists the items of the account. Logins with a website join
   the login list. Notes and custom fields join the secret list.
3. The prompt of each bot lists the secret names it may use, and says that
   a `bw://` or `bws://` reference also works as a label.
4. A bot calls `request_credential` with a name or a reference. The server
   reads the value from Bitwarden now, registers it for masking and hands
   it over as a one-use reference or a file. The bot never sees the text.
5. A login fill types a Bitwarden password and one-time code into the
   browser of the bot. An MCP server can take a linked value as its key.

Two facts shape the design:

- **Licensing.** `bw` is GPL-3.0, so the reference project never imports or
  ships it. It downloads `bw` on first use and runs it only as a separate
  process (`server/host/bitwarden-cli.ts:1-5`). The Secrets Manager SDK and
  its `bws` tool are under the Bitwarden SDK License, so the reference
  project wrote its own HTTP client (`server/host/bitwarden-secrets-api.ts:1-2`).
  A test fails if a Bitwarden package enters the build
  (`scripts/testing/no-bitwarden-dependency.test.ts:13-23`).
- **Access.** Every Bitwarden item is for every bot (`bots: "all"`,
  `server/host/bitwarden-vault.ts:3-4`, `:335`, `:344`). The account's own
  collections are the only border. 1Password has grants for each vault and
  each item. Bitwarden has none.

## 2. Files read completely

Each reader read its files at `42f86aefd`. A range means that only those
lines were read.

### 2.1 The download and the runner (reader cli-download)

| Path | Lines | Read |
|---|---|---|
| `server/host/bitwarden-cli.ts` | 132 | all |
| `server/host/bitwarden-cli.test.ts` | 90 | all |
| `server/testing/fake-bw.ts` | 68 | all |
| `server/testing/fake-bw-process.ts` | 23 | all |
| `scripts/testing/no-bitwarden-dependency.test.ts` | 24 | all |
| `server/perf/disk-categories.ts` | 324 | all |
| `server/perf/disk-categories.test.ts` | 113 | all |
| `docs/bitwarden.md` | 118 | all |
| `server/browser/chrome/install.ts` | 164 | 55-110 |
| `server/zip-archive.ts` | 202 | 28-160 |
| `server/workspace-backup.ts` | - | 30-37 |

### 2.2 The vault provider and the references (reader vault-references)

| Path | Lines | Read |
|---|---|---|
| `server/host/bitwarden-vault.ts` | 403 | all |
| `server/host/bitwarden-vault.test.ts` | 155 | all |
| `server/vault/providers.ts` | 87 | all |
| `server/bot-logins.ts` | 250 | all |
| `server/bot-logins.test.ts` | 149 | all |
| `server/routes/logins.ts` | 266 | all |
| `shared/logins.ts` | 211 | all |
| `server/vault-store.ts` | 667 | all |
| `server/vault/mcp-keys.ts` | 146 | all |
| `server/host/secret-cards.ts` | 692 | 229-238, 270-340, 610-692 |
| `server/host/mcp-servers-host.ts` | - | 100-152, 196-225 |
| `server/login-fill.ts` | - | 665, 679-682 |
| `shared/vault.ts` | - | 30-49 |

### 2.3 Secrets Manager (reader secrets-manager)

| Path | Lines | Read |
|---|---|---|
| `server/host/bitwarden-secrets-api.ts` | 195 | all |
| `server/host/bitwarden-secrets.ts` | 269 | all |
| `server/host/bitwarden-secrets.test.ts` | 415 | all |
| `server/testing/fake-bws.ts` | 79 | all |
| `server/vault/choices.ts` | 66 | all |
| `server/vault/mcp-keys.ts` | 146 | all |
| `server/routes/vault.ts` | 106 | all |
| `server/vault/providers.ts` | 87 | all |

### 2.4 The UI (reader ui)

| Path | Lines | Read |
|---|---|---|
| `src/components/BitwardenConnection.tsx` | 106 | all |
| `src/components/BitwardenSecretsConnection.tsx` | 96 | all |
| `src/components/VaultSettings.tsx` | 467 | all |
| `src/components/VaultSettings.test.ts` | 463 | all |
| `src/lib/logins.ts` | 109 | all |
| `src/lib/vault.ts` | 78 | all |
| `src/lib/server-error.ts` | 20 | all |
| `src/locales/en.json` | 12334 | 2205, 4105-4112, 4129-4130, 11778-11808 |
| `src/state/api.ts` | - | 1-90 |

### 2.5 The wiring, the team cloud and the history (reader team-callers-history)

| Path | Lines | Read |
|---|---|---|
| `server/cloud-team-bitwarden.e2e.test.ts` | 114 | all |
| `server/cloud-team-onepassword.e2e.test.ts` | 120 | all, for comparison |
| `server/host/team-vault-report.ts` | 35 | all |
| `server/host/team-vault-report.test.ts` | 44 | all |
| `server/cloud-team-admin.ts` | 109 | all |
| `scripts/testing/cloud-send-fixture.ts` | 634 | all |
| `server/system-prompt.ts` | 349 | all |
| `server/host/vault-readers.ts` | 27 | all |
| `server/index.ts` | 15217 | 440-460, 615-630, 725-760, 950, 1462-1492, 2917-2947, 7781-7787, 8132-8162, 9674, 9939-9969, 11360-11390, 11440-11495, 11655-11685, 12023-12053, 12142-12172, 12211-12241 |
| `docs/team-cloud.md` | 1143 | 75-115, 270-300 |
| `docs/cloud-pro.md` | 2786 | 1105-1135 |
| `announcements/releases.json` | 1277 | 284, 320-400, 733-750 |
| `scripts/ci-scope.mjs` | 567 | 1-115, 160-224 |

The reader also read `git log` of the feature files (25 commits).

### 2.6 Claims that the lead checked against the code

The lead read these lines again at `42f86aefd`:

| Claim | Lines |
|---|---|
| Every vault-provider item has `bots: "all"` | `server/host/bitwarden-vault.ts:1-4`, `:335`, `:344` |
| A `bw://` name that two items share resolves to nothing. With no field, a login gives its password | `server/host/bitwarden-vault.ts:350-365` |
| `bw://x/totp` gives the current code, `password` and `username` give the login fields | `server/host/bitwarden-vault.ts:139-150` |
| `load` keeps the message of an error that is not a `BitwardenProblem` | `server/host/bitwarden-vault.ts:255-260` |
| `refreshedAt` changes only on success. `fresh` refreshes when the list is older than 10 minutes | `server/host/bitwarden-vault.ts:205-208`, `:250-259` |
| A refresh at start is not awaited | `server/host/bitwarden-vault.ts:392-403` |
| The vault file keeps the server, the API key and the master password | `server/vault-store.ts:70-80` |
| An unreadable vault file reads as empty. The setter writes the whole file | `server/vault-store.ts:219-240`, `:513-521` |
| Masking: 4 characters at least, 500 values at most, a code for 5 minutes | `server/vault-store.ts:588-593`, `:630-639` |
| The pinned version, five pins, the 10-minute download, the 60 s call, the 32 MiB output | `server/host/bitwarden-cli.ts:14-29` |
| A file at the install path counts as installed | `server/host/bitwarden-cli.ts:57-58` |
| The child environment and the result mapping | `server/host/bitwarden-cli.ts:94-127` |
| The user doc says the tool gets only `PATH` and `SystemRoot` | `docs/bitwarden.md:22-24` |
| HMAC before decrypt. The access-token form | `server/host/bitwarden-secrets-api.ts:44-80` |
| 20 s for each request, 100 ids for each batch, a 404 batch read in halves | `server/host/bitwarden-secrets-api.ts:35-38`, `:120-135` |
| A `bws://` reference also finds a login secret, and its `read` skips the site check | `server/host/bitwarden-secrets.ts:155-181`, `:233-256` |
| `fresh` waits for all managers. `linkedSecret` calls `hold` before it returns | `server/bot-logins.ts:100-103`, `:139-165` |
| Names before references. A reference only for a bot that may use it | `server/vault/providers.ts:66-87` |
| The MCP cache: 5 minutes fresh, 15 minutes kept | `server/vault/mcp-keys.ts:11-16`, `:49-62`, `:116-131` |
| A turn awaits `prepare`, and `prepare` awaits `warm` for each server in turn | `server/index.ts:7784`, `:9674`, `server/host/mcp-servers-host.ts:205-211` |
| A read error goes to the bot with its message | `server/host/secret-cards.ts:632-650` |
| The team doc says Bitwarden has "the same rules" as 1Password | `docs/team-cloud.md:92-104` |
| A route that no client rule names needs the admin scope | `server/request-auth.ts:539-546` |
| The form clears the secret fields after a success, a Cancel or a close, never after a failed connect | `src/components/BitwardenConnection.tsx:28-45` |
| An unknown linked provider gets the label of 1Password | `src/components/VaultSettings.tsx:24-34` |
| The client helpers set no time limit | `src/lib/logins.ts:28-40` |

`git diff --stat fcce0b6de 42f86aefd` shows no change in
`server/vault-store.ts`, `server/vault/mcp-keys.ts`,
`server/host/secret-cards.ts`, `server/routes/vault.ts`,
`server/vault/providers.ts`, `server/bot-logins.ts` and
`server/host/vault-readers.ts`. So the lines that the finished files cite in
these files are still correct.

## 3. How it works

### 3.1 Get the `bw` tool: the pinned download

`installBitwardenCli` (`server/host/bitwarden-cli.ts:53-65`) and `install`
(`:67-92`) put the tool on the computer.

1. Take the pin of this platform. The version is `2026.10.1` (`:14`). Five
   pins exist: macOS arm64 and x64, Linux x64 and arm64, Windows x64
   (`:19-25`). Each pin has the asset name, the byte count, the SHA-256 and
   the file name (`bw`, or `bw.exe` on Windows) (`:16`).
2. No pin (for example Windows on Arm): reject with the typed error
   `BitwardenCliUnavailable`, "Bitwarden publishes none for <platform>
   <arch>" (`:31-33`, `:56`).
3. The path is `<data>/tools/bitwarden/<version>/bw` (`:39-41`). If a file
   is at that path, use it at once (`:58`). The server does not check its
   hash again.
4. One install for each path at a time: a second caller gets the running
   promise (`:51`, `:59-64`). This holds in one process only.
5. Make the version folder with mode 0700. Delete `.part` files in it that
   are older than 10 minutes. A crashed install left them (`:68-73`).
6. Name the archive and the staged file with a random 6-byte tag
   (`:74-76`).
7. Download the zip from
   `https://github.com/bitwarden/clients/releases/download/cli-v<version>/<asset>-<version>.zip`
   (`:35-37`). The shared `downloadArchive` (`server/browser/chrome/install.ts`)
   does these checks:
   - a declared `content-length` that is not the pinned size fails before
     the first byte (`install.ts:77-78`).
   - more bytes than the pin fail at once, and fewer bytes fail at the end
     (`install.ts:84`, `:96`).
   - one 10-minute timer stops the whole fetch (`bitwarden-cli.ts:27`,
     `install.ts:68-70`, `:91`).
   - the part file has mode 0600 (`install.ts:79`).
8. A SHA-256 that is not the pinned one fails: "the download failed its
   SHA-256 check; nothing was installed" (`bitwarden-cli.ts:80`).
9. Read the zip with the project's own reader: at most 4 entries, no
   encrypted or zip64 member, a new file only (`:81`,
   `server/zip-archive.ts:58-61`, `:84-89`, `:133-155`). Take the member
   whose name is the file name. None: "the archive did not hold the tool"
   (`bitwarden-cli.ts:82`).
10. Write the member to the staged file with mode 0700, then rename it to
    the final path (`:83-84`). A half-written tool is never at the final
    path.
11. Wrap any error in `BitwardenCliUnavailable`. Its text is "Bitwarden's
    command line tool could not be set up on this computer (<reason>). Try
    again in a few minutes." (`:44-48`, `:86-87`). Always delete the archive
    and the staged file (`:88-91`).

Limits and edge cases:

- Two server processes on one data folder both download. The random tag
  keeps their part files apart (`:74-76`).
- Nothing deletes the folder of an old version. Each version change leaves
  about 40 MB (a grep finds no code that removes `tools/bitwarden/<old>`).
  The cloud doc gives 46 MB for `tools/bitwarden` (`docs/cloud-pro.md:1120`).
- The end-to-end fixture writes a fake `bw` at the install path. It works
  only because a file at the path counts as installed
  (`scripts/testing/cloud-send-fixture.ts:156-166`).

### 3.2 Run one `bw` call

`bitwardenRunner` (`server/host/bitwarden-cli.ts:103-121`) makes the `run`
function that the vault provider uses.

1. Wait for `executable()`, which is the install of section 3.1 (`:105`,
   `server/host/bitwarden-vault.ts:398`). The first call waits for the
   download (up to 10 minutes) before its own time limit starts. A failed
   install rejects here.
2. Make the tool's settings folder with mode 0700 (`:106`).
3. Start the tool with `execFile` and an argument array, with no shell
   (`:108`).
4. Build the child environment from nothing (`:109-112`):
   - `PATH` of the server.
   - `NODE_EXTRA_CA_CERTS`, `SSL_CERT_FILE` and `SSL_CERT_DIR` when they
     are set, so a self-hosted server behind a private certificate
     authority connects (`:98-100`, `:123-127`).
   - `SystemRoot` on Windows.
   - `HOME` and `BITWARDENCLI_APPDATA_DIR` set to the settings folder.
   - `BW_NOINTERACTION=true` and an empty `NODE_OPTIONS`;
   - last, the secrets of this call: `BW_CLIENTID`, `BW_CLIENTSECRET`,
     `BW_PASSWORD` or `BW_SESSION` (`:95-96`).
5. Limits: 60 s by default, 32 MiB of output, `windowsHide` (`:28-29`,
   `:113`). No caller gives another time limit.
6. Map the result (`:114-118`):
   - a missing tool (`ENOENT`) gives code 127.
   - an error with no numeric code gives code 1.
   - `timedOut` is true for any kill, so an output overflow also counts as
     a time-out (not verified, section 9).
7. The promise always resolves after the tool was found (`:107-119`).

The user doc says that the tool gets only `PATH` and `SystemRoot` of the
server environment (`docs/bitwarden.md:22-24`). That is out of date: the
code also passes the three trust variables (added in commit `35a67d447`,
v0.1.178) and sets four more (`bitwarden-cli.ts:110-111`).

### 3.3 Connect the vault provider: the check before save

1. The admin opens Settings → Vault and fills the form (section 5.1).
2. The client sends `POST /api/logins/bitwarden` with `serverUrl`,
   `clientId`, `clientSecret` and `password` (`src/lib/logins.ts:29-31`).
3. The route reads at most 16 384 bytes of JSON
   (`server/routes/logins.ts:179`). `parseBitwardenCredentials` checks each
   field and gives 400 with a fixed sentence for the first bad one
   (`:53-63`, `:180`):
   - `serverUrl`: an `https:` address with no user, password, query or
     fragment, at most 2048 characters. Trailing slashes go
     (`server/host/bitwarden-vault.ts:96-105`).
   - `clientId`: `user.` and 1-100 word characters or dashes. An
     `organization.` id is refused (`server/routes/logins.ts:58`,
     `server/host/bitwarden-vault.test.ts:89`).
   - `clientSecret`: 1-256 characters, no white space (`routes/logins.ts:59`).
   - `password`: not trimmed, 1-1024 characters (`:60-61`).
4. `connect` runs `bitwarden.refresh(credentials)`
   (`server/bot-logins.ts:223-224`). With a candidate, `load` drops the
   session and unlocks with a sign-out first, then syncs and lists
   (`server/host/bitwarden-vault.ts:229-237`).
5. Any problem throws to the route, and nothing is kept
   (`bitwarden-vault.ts:257`). The route answers 400 with the message
   (`routes/logins.ts:182`).
6. Only after all of that succeeds, `store.setBitwardenCredentials` writes
   the credentials (`server/bot-logins.ts:218`, `:225`).
7. The answer is the status: connected, server host, account e-mail, item
   count (`bitwarden-vault.ts:184-191`).

Error texts are fixed. `bitwardenProblem` maps the tool's output, in this
order (`bitwarden-vault.ts:72-85`):

1. time-out: "did not answer in time", class `cant-connect`;
2. code 127: the tool is missing, `unavailable`;
3. "invalid master password": `refused`;
4. "client_id or client_secret" or "invalid_client": `refused`;
5. "vault is locked", "not logged in", "unauthenticated": `unreadable`, and
   a new unlock may help (`relock`).
6. a line that is only "Not found": `unreadable`, the item is gone.
7. "too many requests", "rate limit", "429": `rate-limited`;
8. network words (ECONNREFUSED, ENOTFOUND, certificate): "could not reach
   <host>", `cant-connect`;
9. else "could not be read", `unreadable`.

The match is on the English text of `bw`. A new `bw` version with other
words falls to case 9.

Edge case: `load` wraps an error that is not a `BitwardenProblem` with that
error's own message (`bitwarden-vault.ts:256`). A `JSON.parse` error on the
output of `bw list items` (`:236`) can reach the route answer and the status
this way.

### 3.4 Unlock, and one call with the session

`unlock` and `unlockNow` (`server/host/bitwarden-vault.ts:263-296`):

1. Callers share one unlock that runs, unless the caller asks for a new
   sign-in (`:265-270`).
2. `bw status`. A failure or a time-out throws (`:274-275`).
3. The tool is "elsewhere" when its server is not the saved one, or when
   this process signed in another `client_id` (`:277-278`).
4. If it is signed in and (a new sign-in is asked, or elsewhere): `bw
   logout`. Its result is not checked (`:279-283`).
5. If it is signed out: `bw config server <url>`, then `bw login --apikey`
   with `BW_CLIENTID` and `BW_CLIENTSECRET` in the environment (`:285-286`).
6. `bw unlock --passwordenv BW_PASSWORD --raw` with the master password in
   the environment. The output is the session key. An empty key throws
   (`:289-290`).
7. Keep the session key with the server and `client_id` it belongs to
   (`:291`).
8. `bw status` with `BW_SESSION` gives the account e-mail (`:293-294`).

One unlock can make up to 6 `bw` calls in a row, each with 60 s.

`call` (`:303-313`) runs one command with `BW_SESSION`. A session of other
credentials causes an unlock first (`:306`). On a `relock` problem, it drops
the session and tries one more time (`:310-311`).

### 3.5 Refresh and the item list of the vault provider

1. `refresh()` with no candidate shares a refresh that runs (`:198-203`).
2. `fresh()` refreshes only when the list was never read or is older than
   10 minutes (`:16`, `:205-208`).
3. `load` (`:229-261`):
   1. No credentials: clear the cache and answer "not connected".
   2. Force `bw sync` (`:234`).
   3. `bw list items`, parse the JSON. Keep only logins (type 1) and secure
      notes (type 2) with a string id, at most 1000 (`:19-22`, `:236-237`).
      Cards and identities are dropped. Each value in this answer is
      dropped at once (`:235`).
   4. Each item gets an entry with no value: id, name, type, the names of
      custom fields, the main custom field and a flag for each built-in
      field (`:34-44`, `:120-134`). Custom fields of type 0 to 2 count, at
      most 20. A custom field with a built-in name is not listed (`:121-125`).
   5. The main field: none for a secure note with text, else the first
      hidden field, else the first custom field (`:127-129`).
   6. Each login with a password becomes one login place for each site of
      its URIs, with `exactHost: false` (`:243-248`).
   7. Sort, store, set `refreshedAt`, clear the error (`:250-253`).
4. On error: with a candidate, throw. Else keep the old list and store the
   error (`:255-260`). `refreshedAt` does not change, so the next `fresh()`
   tries a full refresh again. No hold-down exists.
5. At start, a server with saved credentials starts one refresh and does
   not wait for it (`:401`).

A secret is "listed" when it is a secure note with text, or an item with a
main field (`:136-137`). A login with no custom field is only a login place.

`bw sync` runs before a value read at most once each 60 s (`:17-18`,
`:315-319`). Two reads at the same moment can both run it, because no
promise is shared there.

### 3.6 A `bw://` reference becomes a value

1. Parse `bw://<item>[/<field>]` after a trim. Neither part may hold `/`,
   `?` or `#` (`server/host/bitwarden-vault.ts:87-93`). An item name with a
   `/` can be named only by its id.
2. `resolve` uses the cached list only. It does no I/O (`:350-365`):
   1. Not connected, or no parse: null.
   2. Match the item id first. If no id matches, match the name with no
      case and no outer spaces (`:356-357`).
   3. Not exactly one item: null (`:358`). Two items with one name resolve
      to nothing, with no reason.
   4. The field: the given one, else `password` for a login and `notes`
      for a note (`:360`).
   5. A built-in field (`password`, `username`, `totp`, `notes`) wins over
      a custom field of the same name. It resolves only if the item has it
      (`:24`, `:361-362`).
   6. Else a custom field by name, with no case (`:363-364`).
3. `read(itemId, field)` (`:367-380`) runs `bw get item <id>` after a sync
   (`:321-330`), then `valueOf` (`:139-150`):
   - no field: the note text, or the main custom field.
   - `password`, `username`, `notes`: the built-in value.
   - `totp`: the current 6-digit code made from the key. The key itself is
     not returned on this path.
   - else the first custom field of that name.
4. A login place read (the login fill) returns the password and the TOTP
   **key** (`:368-373`).
5. An empty value gives an empty answer. A "Not found" gives null. Other
   problems throw (`:327-328`, `:371`, `:376`, `:379`).

Because `resolve` reads the cache, a new item in Bitwarden resolves only
after the next refresh.

**The reach of a reference.** A `bw://` reference reads the password, the
username and the current one-time code of a Login (`:142-147`). The team
test hands out `bw://GitHub/password` and `bw://i-github/username` with no
card (`server/cloud-team-bitwarden.e2e.test.ts:82`). For 1Password, a
reference never reaches a Login's fields
(`server/cloud-team-onepassword.e2e.test.ts:84-86`, `docs/team-cloud.md:97`).
The team doc still says that Bitwarden has "the same rules"
(`docs/team-cloud.md:100`). So a bot can get a website password as a
reference and use it outside `fill_login`.

### 3.7 Secrets Manager

**The access token** (`parseAccessToken`,
`server/host/bitwarden-secrets-api.ts:51-59`):

1. A string of at most 1024 characters, with exactly one `:`.
2. The head is `0.<uuid>.<client secret>`. The version must be `0`, and the
   secret must have no white space.
3. The seed is base64 of exactly 16 bytes.
4. HKDF-SHA256 with the salt `bitwarden-accesstoken` and the info
   `sm-access-token` makes 64 bytes. The first 32 are the AES key, the last
   32 the MAC key (`:44-48`).

**The server** (`secretsServer`, `:61-65`): an address in the fixed list
(`https://vault.bitwarden.com`, `https://vault.bitwarden.eu`,
`shared/logins.ts:111`) uses `https://identity.<host>` and
`https://api.<host>`. Any other address is self-hosted, with `/identity` and
`/api` under it.

**Decrypt** (`decryptEncString`, `:67-80`):

1. Only type 2: `2.<iv>|<data>|<mac>`.
2. Check the shape: iv 16 bytes, data a multiple of 16, mac 32 bytes.
3. Check HMAC-SHA256 over iv and data with `timingSafeEqual`.
4. Only then decrypt with AES-256-CBC. Each failure is `unreadable`.

**Sign-in** (`:152-176`):

1. Use a live session. Share a sign-in that runs.
2. `POST <identity>/connect/token` with `client_credentials`,
   `scope=api.secrets`, the id and the secret in the form body
   (`:161-162`).
3. 400 or 401: `refused` (`:163`).
4. Read the organization id from the `organization` claim of the JWT, with
   no signature check (`:84-91`).
5. Decrypt `encrypted_payload` with the token key. A failure is `refused`:
   a token with a changed seed signs in but opens nothing (`:167-170`).
6. The organization key must be 64 bytes (`:171-172`).
7. Keep the bearer, the end time minus 60 s, the organization id and the
   key, in memory only (`:38`, `:173-175`).

**One request** (`:141-150`, `:178-194`): a 20 s time limit (`:35`, `:180`),
no redirects (`:107`), one retry after a 401. 429 is `rate-limited`, 401 and
403 are `refused`, 5xx and any throw are `cant-connect`, other answers are
`unreadable`. An error carries only its kind, never the server answer
(`:21-29`).

**The list and the values** (`:111-139`):

- `GET <api>/organizations/<org>/secrets` gives ids and encrypted names. It
  has no paging and no size limit. One name that does not decrypt fails the
  whole list (`:82`, `:112-118`).
- `POST <api>/secrets/get-by-ids` in batches of 100, one after another. A
  batch with one gone id gives 404, and the client reads each half again
  (`:36`, `:120-135`).

**The catalog** (`server/host/bitwarden-secrets.ts:161-181`):

1. List all names.
2. Read the values of the first 1000 secrets only to read their notes, then
   drop the values (`:15-16`, `:165-166`).
3. A note line `url:` or `site:`, with optional `username:` and `totp:`,
   makes the secret a login (`:18-19`, `:51-68`). Its login id is
   `bitwarden-secrets:<id>:<site>:<url-encoded username>` (`:177`).
4. Each secret is an entry, logins too (`:171`).

**Connect** (`:120-134`): raise the generation, read the catalog of the
candidate, and throw on error with nothing saved. If a connect or a clear
came meanwhile, throw. Then call `save` (which is
`setBitwardenSecretsCredentials`, `server/bot-logins.ts:242`), then publish
the catalog.

**Refresh** (`:112-118`, `:190-203`): a shared refresh. A result is kept
only if the generation and the saved credentials did not change. A failed
refresh keeps the old list. `fresh()` refreshes after 10 minutes
(`:136-139`). At start, one refresh runs and is not awaited (`:264-269`).

**`bws://` references** (`:45-49`, `:233-241`): `bws://<id or name>`, with
no `/`, `?` or `#`. Match the id (only the reference is lower-cased), else
the name with no case. Exactly one match, else null. Two names that differ
only in case both fail.

**Read** (`:243-256`):

- A login id: read the secret, parse its note again, and give the password
  and the TOTP key only if the note still names the same username and a
  host of the same site (`:244-251`).
- A plain id: give the value of any known entry (`:252-255`).

`resolve` searches all entries, logins too (`:237`). `read` of the plain id
skips the site and username check. So **a `bws://` reference to a login's
secret reads its password with no site check**. No test covers this.

**Disconnect** (`clear`, `:141-150`): raise the generation, drop the client,
the bearer, the organization key and the lists.

### 3.8 A bot uses a linked secret

The provider interface (`server/vault/providers.ts:16-30`) has `id`,
`label`, `fresh()`, `items()` (never a value), `read(itemId, field?)`,
`markUsed` and an optional `resolve(reference)`.

**By name or reference: `request_credential`**
(`server/host/secret-cards.ts:629-655`):

1. Look for a saved Vault secret of that name first (`:636`). No wait.
2. Else call `botLogins.linkedSecret(label, botId)` (`:640`):
   1. `await this.fresh()`: every manager's `fresh()` together, with
      `Promise.all` (`server/bot-logins.ts:101-103`, `:141`).
   2. `findLinkedSecret` (`server/vault/providers.ts:66-80`):
      - make a key of the name: NFKC, lower case, each run of other
        characters one space (`shared/vault.ts:30-32`).
      - for each manager in the order 1Password, vault provider, Secrets
        Manager (`server/bot-logins.ts:78`), for each secret this bot may
        use, compare the key with each name and "<name> <field>". The
        first match wins, with no warning (`providers.ts:68-73`).
      - only if no name matches: ask each manager's `resolve`. Use the
        result only if this bot may use it (`:74-78`).
   3. `readLinkedSecret`: read now. No value throws "<name> is no longer in
      <label>, or has no value there." Then mark it used (`providers.ts:82-87`).
   4. `this.hold(value)`: register the value for masking (`bot-logins.ts:145`).
   5. Make the linked id: `linked-` and the first 32 hex of SHA-256 of
      `<secret id>\0<field>` (`:15`, `:146`).
   6. Keep the use in `referenced` under that id (`:147`). This map is in
      memory, has no limit and is lost at a restart (`:69`).
3. A read error gives 502 with "<label> is in a linked password manager,
   but it could not be read: <message>" (`secret-cards.ts:641-642`).
4. The value is handed over as a file (`vault.mintFile`) or a one-use
   reference (`vault.mintRef`), with the linked id (`:648`). No card shows.
   → bot-box.md.
5. No match in any manager: a card asks the person (status 201,
   `server/cloud-team-bitwarden.e2e.test.ts:88`).

**"Use a saved one" on a card** (`server/host/secret-cards.ts:274-321`): the
card offers linked secrets by name. `fittingChoices` keeps at most 5 names
that share a word with the asked label (`server/vault/choices.ts:7-29`). A
pick calls `linkedSecret` and then `handOver` (`secret-cards.ts:294`,
`:314`). → bot-box.md. The sign-in card offers only the local Vault logins
(`choices.ts:36`, `:50`).

**An MCP server key** (`server/vault/mcp-keys.ts`):

1. The pointer `vault:linked-<32 hex>` can be in an MCP server of
   `config.json` (`:11-14`). The server must have a grant for that id in
   the Vault file (`:55`, `:120`).
2. Before a turn, a Test or a start check, `warm` runs (`:116-131`):
   - return at once if each linked value was read less than 5 minutes ago
     (`:15`, `:121`).
   - else `await linked.fresh()` (that is `botLogins.fresh()`) and ignore
     its error (`:122`).
   - read each stale id one after another with `byId(id).read()`, and keep
     `{ value, at }` in a map in memory (`:123-127`). Not found or an error
     drops the entry (`:128-129`).
3. `linkedById` (`server/bot-logins.ts:152-165`) finds the id in
   `referenced`, else in the listed secrets. Its `read` calls `hold` before
   it returns.
4. `resolve` is synchronous. A linked id not granted or not found is
   "removed", a bot not allowed is "kept", a value kept less than 15
   minutes is used, else "unread" (`mcp-keys.ts:16`, `:54-62`).
5. The value goes into the environment or the headers of the MCP server.
   → bot-box.md.

So a linked value lives in memory for up to 15 minutes, though the provider
files say a value is "never kept" (`server/host/bitwarden-vault.ts:2`,
`server/host/bitwarden-secrets.ts:2-3`). A value removed in Bitwarden still
works for an MCP server for that time. After a restart, an id that only a
reference reached is not in `referenced`, and the MCP server reports "its
key is no longer in the Vault" (`mcp-keys.ts:45`, `:57-58`).

**A login fill** (`server/vault/providers.ts:40-49`): a candidate for the
page host calls `provider.read(login.id)` when the fill runs. The fill
registers the password and the TOTP key as "password", and the typed code
as "code" (`server/login-fill.ts:665`, `:679-682`). A vault-provider login
fills on any host of its site, because `exactHost` is false
(`server/host/bitwarden-vault.ts:246`, `shared/logins.ts:162-167`). The
URI match setting of Bitwarden is not read.

### 3.9 Masking of a linked value

1. `BotLogins` gets `hold = (value) => heldSecrets.remember(value,
   "password")` (`server/index.ts:744`).
2. Each read path calls `hold` before it returns the value
   (`server/bot-logins.ts:145`, `:154`, `:161`). The test checks it
   (`server/bot-logins.test.ts:142`).
3. `remember` (`server/vault-store.ts:629-639`):
   - a "code" is kept 5 minutes (`:592`, `:631-633`).
   - a "password" of 4 characters or more goes into a set of at most 500.
     When the set is full, the oldest value goes (`:591`, `:593`,
     `:635-638`).
4. `secretValues()` also masks the stored credentials: the client secret,
   the master password and the access token (`:575-585`). The `client_id`
   and the session key are not in that list.

Gaps: a value of less than 4 characters is never masked. A busy server can
drop an old linked value from the set. A code read by `bw://x/totp` is held
as a "password" for the life of the process, not as a 5-minute code.

### 3.10 The stored credentials, and the write-only key store

**Where they are.** Both providers keep their credentials in the Vault
file `<data>/logins.json.enc`, with its key in `<data>/logins-key` beside it
(`server/vault-store.ts:18-19`, `:199-201`):

- `bitwarden`: `serverUrl`, `clientId`, `clientSecret`, `password` (the
  master password) and `connectedAt` (`:75-76`).
- `bitwardenSecrets`: `serverUrl`, `accessToken`, `connectedAt` (`:77-78`).

The values are plain text inside the encrypted JSON. Who reads both files
gets the whole Bitwarden account. The vault provider has no grant field.
1Password has `onePasswordGrants` and `onePasswordItemGrants` (`:79-82`).

**How this relates to the write-only key store.** The write-only key store
of [`write-only-secrets.md`](write-only-secrets.md) is `config.json` and the
desktop file `credentials.bin`. The password-manager credentials are not
there (a grep of `electron/` and `server/config.ts` for "bitwarden" finds
nothing). They follow the same write-only rule in another file:

- a route answers only a status with flags and counts
  (`shared/logins.ts:73-91`, `server/routes/logins.ts:1`).
- the UI never gets them back (`src/lib/vault.ts:6`).

The only link back to `config.json` is the MCP pointer
`vault:linked-<32 hex>` of section 3.8. The values of the managers are
never written to a file by this code. They are read at use
(`server/vault/providers.ts:1-2`).

**A failed read, then a write.** This is the problem "A file written over
after a failed read" (section 8.1).

1. The store reads the file one time and keeps a cache
   (`server/vault-store.ts:219-240`).
2. A missing or bad key, a damaged file or a field that fails the schema
   gives an empty file and the warning "the saved logins file could not be
   opened; it will be replaced on the next save" (`:228-233`).
3. `setBitwardenCredentials` writes the whole file from that empty cache
   with only its own field (`:518-521`). The old logins, saved secrets, the
   1Password token, the grants, the MCP key grants and the GitHub tokens
   are gone. Nothing is set aside.
4. The Bitwarden trap: after the failed read, `bitwardenCredentials()` is
   null (`:513-516`), so the vault provider shows "not connected" with no
   error (`server/host/bitwarden-vault.ts:184-186`). The admin connects
   again, and that connect is the write that erases the rest of the Vault.
5. A missing `logins-key` beside an existing file has the same result: the
   write makes a new key (`vault-store.ts:206-217`).

The Secrets Manager provider writes no file itself. Its `save` goes
through the same store, so the same problem applies to it.

### 3.11 Disconnect

- Vault provider: the route clears the saved credentials first, then signs
  the tool out and deletes the settings folder
  `<data>/tools/bitwarden/account`, which holds the encrypted copy of the
  vault (`server/bot-logins.ts:229-233`,
  `server/host/bitwarden-vault.ts:210-227`, `bitwarden-cli.ts:129-132`).
  The logout error is ignored.
- Secrets Manager: clear the saved token first, then the cache
  (`server/bot-logins.ts:244-248`).
- A connect also runs `logout` first when another account was signed in
  (`server/host/bitwarden-vault.test.ts:147`).

### 3.12 The bot prompt

1. `secretNamesFor(botId, reader)` joins the Vault names for the turn's
   reader and each linked secret name the bot may use
   (`server/bot-logins.ts:128-131`). The linked names are filtered by bot
   only, not by reader.
2. `secretsPrompt` names each manager that has `resolve` and an item the
   bot may use (`:134-137`).
3. `savedSecretsPrompt` (`server/system-prompt.ts:162-183`):
   - control characters and white space become one space, and each name is
     cut to 80 characters (`:163`, `:173`).
   - one name for each name key, JSON-quoted, with " (ref only)" when so
     (`:174-175`).
   - at most 40 names, then "and N more" (`:162`, `:178-179`).
   - one clause for each reference form: "a Bitwarden reference
     (bw://item/field)", "a Bitwarden Secrets Manager reference
     (bws://secret)" (`:166-167`, `:180-181`).
   - the sentence: "Secrets in the Vault you may use: <names>. To use one,
     call request_credential with its name as the label: <product> hands it
     over at once with no card, and you never see the value." (`:182`).
4. With no names, the text is empty, and the reference clause is not given
   either (`:177`).

The prompt is built from stored data, not from model output. But a
Bitwarden item name is text from the outside account. It gets less
cleaning than the text of a person (`:18-28`) or a folder name (`:237`): no
removal of bidi marks, and no "names, not instructions" note.

The direct turn and the room turn use the reader of the thread
(`server/index.ts:8147`, `:9954`). The prompt preview uses `TEAM_READER`
(`:2932`). `secretsPrompt` reads the cache and does not wait.

### 3.13 The team cloud

- Only an admin connects, refreshes or disconnects. A route that no client
  rule names needs the admin scope (`server/request-auth.ts:539-546`), and
  a grep finds no client rule for `/api/logins`. The Secrets Manager test
  checks it (`server/host/bitwarden-secrets.test.ts:357-360`).
- In a member's private chat and in the shared chat, names and `bw://`
  references are handed over with no card
  (`server/cloud-team-bitwarden.e2e.test.ts:80-90`).
- A member gets `bitwarden: { connected: false }` and no items
  (`server/routes/vault.ts:54-57`), and 403 on connect, refresh, disconnect
  and the delete of a login (`cloud-team-bitwarden.e2e.test.ts:92-100`).
  The 1Password test also checks `GET /api/logins`
  (`cloud-team-onepassword.e2e.test.ts:98`). The Bitwarden test does not.
- The admin report (`server/host/team-vault-report.ts:14-35`) has a
  Bitwarden row with the server host as its label and a fixed failure
  class (`:30-33`). The row kinds are only `1password` and `bitwarden`
  (`server/cloud-team-admin.ts:37-40`). Secrets Manager has no row.
  `status()` and `failure()` are synchronous, so the report never waits
  (`server/index.ts:11670`).
- A member's own default bot: the lines above do not stop it from getting
  a Bitwarden item. No test covers it (section 9).

### 3.14 What waits for what

- **Start:** no wait. Both providers start one refresh with `void`
  (`server/host/bitwarden-vault.ts:401`,
  `server/host/bitwarden-secrets.ts:267`).
- **The prompt and the admin report:** no wait. They read the cache.
- **`request_credential` with a name that is not saved:** waits for
  `fresh()` of all managers together (`server/bot-logins.ts:101-103`,
  `:141`). A list older than 10 minutes makes a full refresh. So a slow
  Bitwarden delays a 1Password name, and even the card for a name that no
  manager has.
- **A login fill:** `candidates` also waits for `fresh()` first
  (`server/bot-logins.ts:106-107`), also for the person's own saved logins.
- **Turn start:** a direct turn and a room turn await
  `mcpServersHost.prepare(bot)` (`server/index.ts:7784`, `:9674`).
  `prepare` awaits `warm` for each enabled MCP server in turn
  (`server/host/mcp-servers-host.ts:205-211`). This waits only for a server
  with a linked pointer that was not read in the last 5 minutes
  (`server/vault/mcp-keys.ts:120-121`). Then it waits for `fresh()` of all
  managers, even when the pointer is a 1Password item.
- **Each `bw` call:** 60 s at most. One unlock: up to 6 calls. The first
  call: the download (10 minutes) plus 60 s.
- **Each Secrets Manager request:** 20 s. A refresh of more than 1000
  secrets is at least 12 requests in a row, more with a 401 retry or 404
  halves. No deadline covers the whole refresh.
- **After a failure:** no hold-down. Each `fresh()` tries again while
  Bitwarden is down (section 3.5).

### 3.15 How the feature grew

From `git log` of the feature files (25 commits):

1. `6c7bcb02e` (2026-11-09, v0.1.151): "linked password managers behind one
   provider interface", and secret names in the prompt.
2. `09805bb19` (2026-11-17, v0.1.167): "Bitwarden in the Vault: logins and
   secrets through the open-source CLI". 35 files, +1477/-52. The release
   note: "Bitwarden in the Vault: logins and secrets through Bitwarden,
   alongside 1Password." (`announcements/releases.json:743`).
3. `7fec80461` (2026-11-21, v0.1.177): Secrets Manager as a Vault source
   and a login fill source. The same day, three fixes: a login fills only
   for the username its note still names, a refresh after a reconnect
   reads the new connection, the login id names its username
   (`e5330c39c`, `fa5048ba5`, `7bc565f84`). The release note: "Bitwarden
   Secrets Manager can be a Vault and sign-in source."
   (`releases.json:395`).
4. `35a67d447` (2026-11-23, v0.1.178): pass the trust variables to `bw`.
   The release note: "Bitwarden: a self-hosted Vaultwarden with a private
   certificate authority connects." (`releases.json:357`).

No other entry of `announcements/releases.json` names Bitwarden or
Secrets Manager (a grep of the whole file).

## 4. The data

### 4.1 Credentials and status (`shared/logins.ts`)

| Type | Fields | Lines |
|---|---|---|
| `BitwardenCredentials` | `serverUrl`, `clientId`, `clientSecret`, `password`. "Sent once, kept sealed on the server, never sent back." | `:84-91` |
| `BitwardenStatus` | `connected`, `server` (host), `account` (e-mail), `items` (count), `error` (text) | `:73-82` |
| `BitwardenSecretsCredentials` | `serverUrl`, `accessToken` | `:105-108` |
| `BitwardenSecretsStatus` | `connected`, `server`, `items`, `error`. No account | `:93-101` |
| `BITWARDEN_SERVERS` | `https://vault.bitwarden.com`, `https://vault.bitwarden.eu`. Any other address is self-hosted | `:110-111` |
| `LoginSource` | `card`, `settings`, `1password`, `bitwarden`, `bitwarden-secrets`. The last three are read-only | `:12-14` |
| `LoginBots` | `"all"` or a list of bot ids | `:16-17` |

### 4.2 Items in memory

| Shape | Fields | Lines |
|---|---|---|
| `LinkedItem` | a login summary (`kind: "login"`) or a linked secret (`kind: "secret"`) | `server/vault/providers.ts:8` |
| `LinkedValue` | optional `password`, `totp` (key), `value` | `server/vault/providers.ts:10-14` |
| `LinkedSecret` | `id`, `name`, `fields` (other field names), `source: "linked"`, `provider`, `bots`, `readOnly: true`, `lastUsedAt` | `shared/vault.ts:36-49` |
| `ItemEntry` (vault provider) | item id, name, type, custom field names, main field, a flag for each built-in field. No value | `server/host/bitwarden-vault.ts:34-44` |
| `LoginEntry` (vault provider) | id, item id, site, hosts, username, `hasTotp` | `server/host/bitwarden-vault.ts:46` |
| Secrets Manager entry | secret id, name, `login` flag | `server/host/bitwarden-secrets.ts:171` |
| Secrets Manager session | bearer, end time, organization id, organization key | `server/host/bitwarden-secrets-api.ts:95`, `:173-175` |

The session key, the item lists, the last-used times and the map
`referenced` are in memory only. A restart loses them.

### 4.3 Identifiers

| Id | Form | Lines |
|---|---|---|
| Vault-provider secret | `bitwarden:<item id>` | `server/host/bitwarden-vault.ts:15`, `:334` |
| Vault-provider login | `bitwarden:<item id>:<site>` | `server/host/bitwarden-vault.ts:246` |
| Secrets Manager secret | `bitwarden-secrets:<secret id>` | `server/host/bitwarden-secrets.ts:13`, `:217` |
| Secrets Manager login | `bitwarden-secrets:<secret id>:<site>:<url-encoded username>` | `server/host/bitwarden-secrets.ts:177` |
| Linked id | `linked-` + 32 hex of SHA-256 of `<secret id>\0<field>` | `server/bot-logins.ts:15`, `:146` |
| MCP pointer | `vault:linked-<32 hex>` | `server/vault/mcp-keys.ts:11-14` |

`PATCH` or `DELETE` of `/api/logins/<id>` for a `bitwarden:` or
`bitwarden-secrets:` id gives 409 "This login is in Bitwarden. Change or
remove it there." (`server/routes/logins.ts:236-239`, `:108`).

### 4.4 On disk

| Path | What | Class in the storage report |
|---|---|---|
| `<data>/logins.json.enc` | the Vault file with both credential sets | `settings`, precious (`server/perf/disk-categories.ts:156-165`) |
| `<data>/logins-key` | its key, 64 hex, mode 0600 | first-level file |
| `<data>/tools/bitwarden/<version>/bw` | the tool | `engine_clis`, rebuildable (`:28`, `:187`) |
| `<data>/tools/bitwarden/account` | the tool's settings and the encrypted copy of the vault | `settings`, precious (`:13-14`, `:187`) |

No backup or move carries `tools/` (`server/workspace-backup.ts:34-35`,
`docs/bitwarden.md:30-31`). The `account` folder is really a cache: a
sign-in with the stored credentials makes it again. But the storage report
calls it precious.

### 4.5 Limits

| Limit | Value | Lines |
|---|---|---|
| `bw` version | `2026.10.1` | `server/host/bitwarden-cli.ts:14` |
| Download time | 10 minutes | `:27` |
| One `bw` call | 60 s | `:28` |
| `bw` output | 32 MiB | `:29` |
| Zip entries | 4 | `:81` |
| Vault-provider items | 1000, logins and secure notes only | `server/host/bitwarden-vault.ts:19-22` |
| Custom fields of one item | 20 | `:20` |
| List age before a refresh | 10 minutes | `:16`, `server/host/bitwarden-secrets.ts:14` |
| `bw sync` before a read | once each 60 s | `server/host/bitwarden-vault.ts:17-18` |
| Server address | 2048 characters, `https:` | `:96-105` |
| `clientSecret` / master password | 256 / 1024 characters | `server/routes/logins.ts:59-61` |
| Connect body | 16 384 bytes | `:179` |
| Access token | 1024 characters, version 0 | `server/host/bitwarden-secrets-api.ts:52-56` |
| One Secrets Manager request | 20 s | `:35` |
| Ids in one value batch | 100 | `:36` |
| Secrets read for notes | 1000 | `server/host/bitwarden-secrets.ts:16` |
| Hosts of one login | 20 | `:17` |
| MCP linked value | fresh 5 minutes, kept 15 minutes | `server/vault/mcp-keys.ts:15-16` |
| Masking | 4 characters at least, 500 values, a code for 5 minutes | `server/vault-store.ts:591-593` |
| Names in the prompt | 40, each 80 characters | `server/system-prompt.ts:162-163` |
| Admin report | 500 secrets, 200 bot names for each | `server/host/team-vault-report.ts:9-10` |

## 5. The UI

### 5.1 The vault-provider row (`src/components/BitwardenConnection.tsx`)

- Not connected: "Let bots use logins and secrets from a Bitwarden
  account." and a button "Connect Bitwarden" (`:48`, `:60`,
  `src/locales/en.json:11784`).
- The dialog (`:65-100`):

  | Field | Input | Limit | Line |
  |---|---|---|---|
  | Server | a select: bitwarden.com, bitwarden.eu, "Self-hosted or Vaultwarden" | - | `:75-81` |
  | Server address (self-hosted only) | `type="url"` | 2048 | `:82-87` |
  | client_id | text | 200 | `:88-91` |
  | client_secret | password | 256 | `:92-95` |
  | Master password | password, with a hint | 1024 | `:96-99` |

  All inputs have `autoComplete="off"` and `spellCheck={false}`. The labels
  "client_id" and "client_secret" are literal, not translated (`:88`, `:92`).
- The guide text: use a dedicated account that can see one collection, find
  the API key under Account settings → Security → Keys, and "Bitwarden's
  own command line tool is downloaded from Bitwarden the first time."
  (`en.json:11789`).
- The note: "Kept encrypted on the computer this runs on and never shown
  again. ..." (`en.json:11794`).

The connect flow:

1. Connect is on only when the address, the trimmed id, the trimmed secret
   and the password are not empty. The password is not trimmed (`:40-41`).
2. Submit sends the four fields (`:42-45`). A spinner shows, and the
   inputs are off while busy (`:70`, `:76`, `:85`). No text says that a
   download runs.
3. Success: set the status, clear the id, the secret and the password,
   close the dialog (`:31`, `:36`).
4. Failure: show the server text, or "Bitwarden could not be connected.
   Try again." (`:37`, `en.json:11795`). The typed values stay in the form.
5. Cancel and close also clear the three fields (`:66`, `:68`). Cancel is
   not off while busy, so a connect can go on after the dialog closes. Its
   error then shows under the row (`:64`).
6. A second action while one runs does nothing (`:33`).

The client helpers set no time limit (`src/lib/logins.ts:29-51`,
`src/state/api.ts:46-50`). The server text reaches the form as is, because
no Bitwarden route sends an `errorKey` (`src/lib/server-error.ts:15-19`).

Connected: "Connected as {account} · {count} logins and secrets". The
account falls back to the server, then to "Bitwarden" (`:46-48`,
`en.json:11785`). The buttons "Refresh" and "Disconnect" use the keys of
1Password (`:57`, `:59`, `en.json:4129-4130`). Disconnect acts on one click
(`:58-59`). A later server error shows under the row (`:63`). On a team
cloud a line says: "For the whole team: its bots use it in shared and
private chats. Use a dedicated Bitwarden account that can only see one
collection." (`:62`, `en.json:11788`).

### 5.2 The Secrets Manager row (`src/components/BitwardenSecretsConnection.tsx`)

The same row and dialog, with one secret field: "Access token", password,
1024 characters (`:86-89`, `en.json:11803`). It uses the same server select
(`:73-85`). The token is cleared on success, on Cancel and on close (`:29`,
`:34`, `:64`, `:66`). Connected: "Connected to {server} · {count} logins
and secrets" (`:44-46`, `en.json:11798`). The guide explains the note lines:
a `url:` line, with optional `username:` and `totp:` lines, makes the secret
a login (`en.json:11802`). The team line: "Give the machine account only the
projects bots need." (`en.json:11801`).

### 5.3 The Vault page (`src/components/VaultSettings.tsx`)

- The rows are in the "elsewhere" group in this order: the link to AI and
  app keys, 1Password, Bitwarden, Secrets Manager (`:288-300`).
- A row shows only when the server sends its status (`:295`, `:297`,
  `src/lib/vault.ts:12-14`). A team-cloud member does not see the group
  (`:288`).
- After connect, refresh or disconnect, the page takes the status from the
  answer and loads the whole Vault again (`:296`, `:298`).
- Source labels: "From Bitwarden", "From Bitwarden Secrets Manager"
  (`:24-34`, `en.json:11781-11782`). A linked secret of any other provider
  gets "From 1Password" (`:30`).
- A Bitwarden login or secret has no Change, no Delete and no bot choice
  (`:179-180`, `:218-221`). Only 1Password has an editor of bots for each
  vault and each item (`:355-397`, `:440-444`).
- The page never shows a value, and never a `bw://` or `bws://` reference.
  No file under `src/` has those strings (a grep). They are only in the
  bot prompt.

## 6. The tests

| Test | What it fixes | Lines |
|---|---|---|
| `server/host/bitwarden-cli.test.ts` | the version and the URL, four platforms, no pin for Windows on Arm, the install path and mode, no second download, a flipped byte and a zip with no tool fail and leave nothing, the trust variables pass and a server variable does not, the password only in the environment, code 127 | `:20-89` |
| `server/host/bitwarden-vault.test.ts` | the command order of a connect, no secret in an argument, no value in `items()`, a look-alike host gets no login, reads by name and by `bw://`, the built-in field wins, null for a shared name, a re-unlock after the session ends, one sync in a minute, the error texts, a lost server keeps the list, logout before a switch, disconnect | `:35-154` |
| `server/bot-logins.test.ts` | linked names after the Vault names, a secret of another bot reads nothing, punctuation folds to spaces, the linked id form, `hold` gets the value, the reference clause only with an item for the bot | `:114-148` |
| `server/host/bitwarden-secrets.test.ts` | token parse (ten bad forms), HKDF, a changed byte or key fails, cloud and self-hosted addresses, connect, login fill, reads by name and `bws://`, a revoked token or changed seed saves nothing, one new sign-in after a bearer ends, 429 keeps the list, stale reads dropped, 404 halves, 1001 secrets, a failed save keeps the old connection, admin scope, a member sees nothing | `:50-414` |
| `src/components/VaultSettings.test.ts` | the connect form, the address field only for self-hosted, two password inputs, the POST body, the master password gone after save, "From Bitwarden · All bots", no buttons on a Bitwarden login, Disconnect sends DELETE, no row when the server has no status | `:269-318` |
| `server/cloud-team-bitwarden.e2e.test.ts` | a wrong master password keeps nothing, names and `bw://` with no card in a private and a shared chat, an unknown item gives a card, no value in answers or logs, member 403, the signed report, disconnect | `:68-114` |
| `server/perf/disk-categories.test.ts` | the class of each `tools/bitwarden` path | `:40-41` |
| `scripts/testing/no-bitwarden-dependency.test.ts` | no `@bitwarden/` package in a manifest, a lock file or an import | `:13-23` |

The fakes: an in-memory `bw` with the real English error texts
(`server/testing/fake-bw.ts:28-65`), the same fake as a process
(`server/testing/fake-bw-process.ts`), and an in-memory Secrets Manager
server (`server/testing/fake-bws.ts`). No test uses the network.

Not tested:

- a real hang of `bw`: the fake's `slow` answers at once
  (`fake-bw.ts:26`).
- the call time limit, the output cap, a size mismatch, an early end of
  the download, the sweep of `.part` files, two installs at once.
- the runner on Windows (`bitwarden-cli.test.ts:56`, `:74`).
- the 1000-item and 20-field limits, a card or identity item.
- a `bws://` reference to a login secret.
- provider order in a name collision, and the wait of `fresh()`;
- Secrets Manager in the UI and on a team cloud.
- a failed connect in the UI, and `client_secret` gone from the page.
- a Bitwarden row in the unit test of the admin report
  (`server/host/team-vault-report.test.ts:14-43`).
- `GET /api/logins` for a member in the Bitwarden e2e test.

## 7. Ours compared

We have no Vault and no password manager yet. `crates/bot-core/src` has
only `lib.rs`. The plan has the parts that this feature stands on:

| The reference | Ours now | Where it goes |
|---|---|---|
| The Vault file and its credentials (`server/vault-store.ts`) | nothing | `bot-core`, a `vault` module after step 6 (settings, redaction, the `Secret` type of P20). The failed-read rule of P22 and P232 |
| The provider interface (`server/vault/providers.ts`) | nothing | `bot-core::vault`, a `VaultProvider` trait with a typed refusal. `bot-core` does no I/O beyond its store (`AGENTS.md`), so the trait is there and the providers are not |
| The `bw` download and runner (`server/host/bitwarden-cli.ts`) | nothing | a crate that does I/O. `bot-engine` has the child-process code of step 9. The choice is P573 |
| The vault provider (`server/host/bitwarden-vault.ts`) | nothing | the same crate, behind the trait |
| The Secrets Manager client (`server/host/bitwarden-secrets-api.ts`, `bitwarden-secrets.ts`) | nothing | the same crate, with `reqwest` of step 5 and permissive crypto crates (HKDF, AES-CBC, HMAC). License check before each crate |
| `BotLogins` and the lookup (`server/bot-logins.ts`) | nothing | `bot-core::vault`, a pure lookup over the trait |
| The prompt text (`server/system-prompt.ts:162-183`) | nothing | `bot-core`, built from stored data only (`AGENTS.md`) |
| The hand-off of a value | nothing | → bot-box.md |
| The UI rows (`src/components/Bitwarden*.tsx`, `VaultSettings.tsx`) | nothing | `bot-desktop`, Settings → Vault |
| Redaction (`server/vault-store.ts:588-667`) | step 6.4 `redact.rs` | `bot-core`, step 6 |

`docs/comparison.md:183` says "Password managers | 1Password SDK; Bitwarden
CLI as a child | `@1password/sdk` | No crate checked; a CLI as a child
works". That row is out of date. The reference project now also has
Secrets Manager through its own HTTP client, and it has a rule that no
Bitwarden package enters the build.

What we can take as it is:

- the check before save (section 3.3).
- secrets only in the environment of the child, never in its arguments,
  and a test with a fake that records any secret in an argument.
- a child environment built from nothing.
- the pinned download with a size check, a SHA-256 check, a part file and
  a rename.
- HMAC before decrypt, no redirect, an error that carries only a kind.
- a generation check so that a stale read is never kept.
- fixed error texts for the person and fixed failure classes for the
  admin report.

## 8. Where we can be better

The main session gives the P-numbers. Each T has a reason. A T that is
better than the reference starts with "Problem in the reference:" and the
problem of section 5 of [`../changelog.md`](../changelog.md), or says that
it is a judgment call.

### 8.1 The problems of `changelog.md` section 5 in this code

| Problem | In this feature | Evidence |
|---|---|---|
| A secret or an access right in the wrong place: credentials in process arguments (v0.1.19) | **No.** Each secret goes in the environment of `bw`, never in its arguments. A test checks it | `server/host/bitwarden-cli.ts:95`, `:111`; `server/host/bitwarden-vault.ts:286`, `:289`, `:307`; `bitwarden-vault.test.ts:40`, `:105` |
| The same, secrets "over a pipe, not the environment" (v0.1.92) | **Partly.** `bw` reads its secrets from its environment by design. The server keeps its own environment out | `bitwarden-cli.ts:109-112` |
| The same, streamed text masked only after the save (v0.1.154) | **Border.** Each linked value is registered before the hand-off. The stream itself is in `chat-ui.md` and `approval-cards.md` | `server/bot-logins.ts:145`, `:154`, `:161` |
| The same, access rights | **Yes.** Every item is for every bot. A reference reaches a Login's password and code. A `bws://` reference skips the site check | sections 3.6, 3.7, 3.13 |
| A file written over after a failed read (v0.1.103, v0.1.151) | **Yes**, in the Vault store. Both providers save through it. The reconnect is the trap | `server/vault-store.ts:228-233`, `:518-521` |
| One slow or stuck part blocks all the others (v0.1.114, v0.1.153, v0.1.177, v0.1.178) | **Yes**, on a tool call, a login fill and turn start. Not at start or in the prompt | section 3.14 |
| A turn or a wait that does not end (v0.1.123) | **Partly.** The client has no time limit. The server has 60 s for each call but no deadline for the whole operation | `src/lib/logins.ts:29-51`; `bitwarden-cli.ts:105` |
| Sign-in to an engine, and engine CLIs that change (v0.1.101, v0.1.182) | **Partly.** The version is pinned and checked. The error mapping reads English text, and nothing tests against the real tool | `bitwarden-cli.ts:14`, `:80`; `bitwarden-vault.ts:72-85` |
| State lost at a restart or a crash (v0.1.24, v0.1.165) | **Partly.** An id that only a reference reached is lost, and its MCP server reports the key as removed | `server/bot-logins.ts:69`; `server/vault/mcp-keys.ts:57-58` |

### 8.2 Proposals

**P559. One rule for the reach of a reference, the same for each manager.**
A reference reaches only a secret field. A Login's password, username and
one-time code go only to `fill_login`, never to a bot by reference. A
`bws://` reference to a login secret is refused. One test runs over each
provider.

- Problem in the reference: a bot gets a website password and its current
  one-time code as a value with `bw://GitHub/password` or
  `bw://GitHub/totp` (`server/host/bitwarden-vault.ts:142-147`, `:360`,
  `server/cloud-team-bitwarden.e2e.test.ts:82`,
  `server/host/bitwarden-vault.test.ts:67`, `:70`). It can then use them
  outside the login fill. The same reference for 1Password is refused
  (`server/cloud-team-onepassword.e2e.test.ts:84-86`), and the team doc
  says "the same rules" (`docs/team-cloud.md:97`, `:100`). A `bws://`
  reference reads a login secret's password with no site or username check
  (`server/host/bitwarden-secrets.ts:237-240`, `:252-255`, against `:249`).
  The release problem: "A secret or an access right in the wrong place"
  ("Automations stay within the accounts each bot may use", v0.1.178.
  "each bot reaches only its own AI account's sign-in", v0.1.181).
- Where: `bot-core::vault`, the lookup.

**P560. Bot grants for the items of each manager.** An item of a linked
manager has bots like each Vault item. The default for a new connection is
a choice for the author: all bots (the reference) or none. A member's own
bot is never in a team grant by default.

- Problem in the reference: every Bitwarden and Secrets Manager item is for
  every bot, and the UI has no bot choice for them
  (`server/host/bitwarden-vault.ts:3-4`, `:335`, `:344`;
  `server/host/bitwarden-secrets.ts:3-4`, `:217`, `:227`;
  `src/components/VaultSettings.tsx:218-221`). 1Password has grants for
  each vault and item (`server/bot-logins.ts:195-210`). The release
  problem: "A secret or an access right in the wrong place" (v0.1.178,
  v0.1.181).
- Where: `bot-core::vault` and `bot-desktop`.

**P561. Ask only the manager that holds the secret, with its own deadline and
a hold-down. Turn start never waits for a manager.** A lookup by name uses
the cached lists and refreshes only the manager that matched. A manager that
failed is held down for a period. Turn start uses the last value and
refreshes in the background, or mounts the MCP server as "key not ready".

- Problem in the reference: `fresh()` waits for all managers with
  `Promise.all` (`server/bot-logins.ts:101-103`). A tool call, a login fill
  and turn start wait for it (`:107`, `:141`; `server/index.ts:7784`,
  `:9674`; `server/host/mcp-servers-host.ts:205-211`;
  `server/vault/mcp-keys.ts:122-127`). So a slow Bitwarden holds a
  1Password secret and a turn for minutes. A failed refresh has no
  hold-down, so each call tries again (`server/host/bitwarden-vault.ts:207`,
  `:252`, `:258-259`). The release problem: "One slow or stuck part blocks
  all the others" (v0.1.114, v0.1.153, v0.1.177, v0.1.178).
- Where: `bot-core::vault`.

**P562. A CLI runner with one deadline and a typed result.** One deadline for
install, unlock and read together. A call to a tool that is still in
download fails at once with a typed "not ready" refusal. A time-out kills
the process group, with a hard kill after a short grace. The result tells a
time-out, an output overflow and an outside kill apart. Calls on one
settings folder run one at a time. Secrets are a separate typed field, so
they cannot go into the argument list.

- Problem in the reference: the first call waits for the download (10
  minutes) before its 60 s starts (`server/host/bitwarden-cli.ts:27`,
  `:105`). One unlock can make 6 calls of 60 s in a row
  (`server/host/bitwarden-vault.ts:275-293`). Each kill counts as a
  time-out (`bitwarden-cli.ts:117`). The release problems: "One slow or
  stuck part blocks all the others" (v0.1.114) and "A turn or a wait that
  does not end" ("A stuck engine stops in minutes, not 15.", v0.1.132).
- Where: the I/O crate of P573, with the process code of step 9 (P41,
  P68).

**P563. Read the answers of `bw` by exit code and JSON, and keep recorded
answers for each pinned version.** A test plays the recorded answers of the
pinned version. A change of the pin needs new recordings.

- Problem in the reference: the error mapping reads the English text of
  `bw` (`server/host/bitwarden-vault.ts:72-85`), and the fake copies those
  texts (`server/testing/fake-bw.ts:28-65`). A new wording falls to "could
  not be read" with no error in a test. The release problem: "Sign-in to an
  engine, and engine CLIs that change" ("failed on Codex 0.160", v0.1.101).
- Where: the I/O crate of P573.

**P564. One rule for the life of a read value.** A read value has a type
that says its kind (password, code, other) and its time to live. The
masking takes the kind. The MCP cache keeps a value for a stated time, and
the provider documentation says so.

- Problem in the reference: a one-time code read by `bw://x/totp` is held
  as a "password" for the life of the process (`server/index.ts:744`). A
  value of less than 4 characters is never masked, and the set of 500 drops
  the oldest value (`server/vault-store.ts:591-593`, `:635-636`). The MCP
  cache keeps a value 15 minutes, while the providers say a value is
  "never kept" (`server/vault/mcp-keys.ts:16`, `:51`, `:61`;
  `server/host/bitwarden-vault.ts:2`). The release problem: "A secret or an
  access right in the wrong place" (masking, v0.1.154).
- Where: `bot-core`, with the redaction of step 6.

**P565. A linked id that a reference reached survives a restart.** The
stored MCP pointer row keeps the provider and the item id, not only a hash.

- Problem in the reference: the map `referenced` is in memory only and has
  no limit (`server/bot-logins.ts:69`, `:147`). After a restart, an MCP
  server with such a pointer reports "its key is no longer in the Vault"
  though the item is still in Bitwarden (`server/vault/mcp-keys.ts:45`,
  `:57-58`). The release problem: "State lost at a restart or a crash"
  (v0.1.24, v0.1.165).
- Where: `bot-core::vault`, with the store of step 8.

**P566. A bounded Secrets Manager list.** Cap the size of the answer, skip
and count an entry that does not decrypt, and give the whole refresh one
deadline. Read a value only on use, and do not decrypt 1000 values to read
their notes.

- Problem in the reference: the list has no paging and no size limit, and
  one bad name fails the whole list
  (`server/host/bitwarden-secrets-api.ts:82`, `:112-118`). A refresh of
  more than 1000 secrets is 12 or more requests in a row with no total
  deadline (`:123`, `:130-134`). The release problem: "One slow or stuck
  part blocks all the others" (an address "left out of turns and named
  once, instead of slowing every turn", v0.1.178). The part about notes is
  a judgment call (`server/host/bitwarden-secrets.ts:165-166`).
- Where: the I/O crate of P573.

**P567. The connect form has a time limit and stage text.** "Downloading the
tool", then "Checking the account". A connect that passes the limit shows a
fixed error and can be tried again.

- Problem in the reference: the client sets no time limit, and only a
  spinner shows while the server downloads 40 MB and checks the account
  (`src/lib/logins.ts:29-51`; `src/components/BitwardenConnection.tsx:70`).
  The release problem: "A turn or a wait that does not end" ("waits
  forever on 'Reserving your machine'", v0.1.123).
- Where: `bot-desktop`.

**P568. Only fixed text leaves the server.** An error that goes to a bot or
to the window is a fixed text for its class, never the message of a
wrapped error. Judgment call: no release problem is proven here. Whether
the message can hold tool output is not verified.

- Reason: `load` keeps the message of any other error
  (`server/host/bitwarden-vault.ts:256`). The route and the tool answer
  pass it on (`server/routes/logins.ts:182`;
  `server/host/secret-cards.ts:642`). The admin report already uses fixed
  classes only (`server/cloud-team-admin.ts:34-36`).

**P569. Item names from a manager are untrusted text.** Remove bidi marks,
keep the 80 and 40 caps, and say in the prompt that they are names, not
instructions. Judgment call.

- Reason: a Bitwarden item name is text of the outside account. It goes
  into the prompt with less cleaning than a person's own text
  (`server/system-prompt.ts:18-28`, `:173`, `:237`).

**P570. A name collision is a typed "ambiguous" refusal.** The same for
names and references, with the ids of the candidates. Judgment call.

- Reason: two items that share a `bw://` name read nothing, with no reason
  (`server/host/bitwarden-vault.ts:358`). Two listed secrets that share a
  name key read the first one, by provider order, with no warning
  (`server/vault/providers.ts:68-71`, `server/bot-logins.ts:78`).

**P571. One list of provider kinds for the admin report and for the
member-denied test.** Judgment call.

- Reason: Secrets Manager has no row in the admin report
  (`server/host/team-vault-report.ts:26-33`,
  `server/cloud-team-admin.ts:37-40`). The member test of Bitwarden misses
  `GET /api/logins`, which the 1Password test checks
  (`server/cloud-team-bitwarden.e2e.test.ts:95-98`,
  `server/cloud-team-onepassword.e2e.test.ts:98`). A list makes a new
  provider fail the test until it is added.

**P572. Check the installed tool, and remove old versions.** Keep the
SHA-256 beside the tool and check it before the first start of a run.
Delete the folders of older versions after an install. Class the settings
folder of the tool as a cache. Judgment call.

- Reason: any file at the install path runs (`server/host/bitwarden-cli.ts:58`).
  Old versions stay (about 40 MB each). The storage report calls the
  folder that a sign-in makes again "precious"
  (`server/perf/disk-categories.ts:187`).

**P573. Choice: where the provider code goes.** The `VaultProvider` trait,
the lookup, the grants and the prompt text go in `bot-core::vault`. The
`bw` runner, the download and the Secrets Manager client do I/O, so they go
in another crate: `bot-engine` (it has the child-process code of step 9 and
the HTTP code of step 5) or a new crate when the boundary is proven (D4).
`bot-cli` connects them. This follows the reference: the providers are
separate modules behind one interface (`server/vault/providers.ts:16-30`).

**P574. Decision: the license border of Bitwarden.** Follow the reference.
We never link a Bitwarden SDK or crate. We run `bw` (GPL-3.0) only as a
separate process from a pinned download. We speak the public HTTP API of
Secrets Manager with our own client, because its SDK and `bws` are under
the Bitwarden SDK License. A `cargo deny` rule and a test over `Cargo.lock`
keep it so. Source: `server/host/bitwarden-cli.ts:1-5`,
`server/host/bitwarden-secrets-api.ts:1-2`,
`scripts/testing/no-bitwarden-dependency.test.ts:1-23`. This answers the
license rule of `AGENTS.md`, and it corrects `docs/comparison.md:183`.

**P575. Small UI changes.** Judgment calls.

- Clear the typed secrets after any answer, and keep the server and the id.
  The reference keeps them after a failure
  (`src/components/BitwardenConnection.tsx:36-37`).
- One map from provider to label, with a neutral fallback. The reference
  labels an unknown provider "From 1Password" (`VaultSettings.tsx:30`).
- Ask before Disconnect, as Delete does (`BitwardenConnection.tsx:58-59`,
  `VaultSettings.tsx:118-119`).
- One connect component driven by a description of the provider. The
  reference has two near copies plus the 1Password form.
- Refuse a non-`https` self-hosted address in the form, with the reason.
  The form has only `type="url"` (`BitwardenConnection.tsx:84`).

### 8.3 New facts for proposals that exist

- **P19 (the keychain):** the reference keeps the Bitwarden master password
  and the API key in the Vault file, with its key in a file beside it
  (`server/vault-store.ts:19`, `:76`, `:206-217`). Who reads both files gets
  the whole account. An option for us: offer the machine-account token
  first, which Bitwarden limits to chosen projects, and keep a master
  password only in the keychain.
- **P22, P232 and P367 (no write after a failed read):** the Vault store has
  the same problem (`server/vault-store.ts:228-233`, `:518-521`). The
  Bitwarden trap: after the failed read, the vault provider shows "not
  connected" with no error, and the reconnect erases the rest of the Vault
  (section 3.10).
- **P20 and P480 (the `Secret` type):** the access token, the seed, the
  bearer, the organization key, the master password and the session key
  need it (`server/host/bitwarden-secrets-api.ts:11`, `:93`;
  `server/host/bitwarden-vault.ts:164`).
- **P40 (a key only in the child's environment):** the `bw` runner is a
  model for it. It builds the environment from nothing, and a fake records
  any secret in an argument (`server/host/bitwarden-cli.ts:109-112`,
  `server/testing/fake-bw.ts:25`).

## 9. Not verified

- What Node.js does when the output of `bw` passes `maxBuffer`: if it sets
  `killed`, an overflow shows as "did not answer in time"
  (`server/host/bitwarden-cli.ts:117`).
- What happens when `bw` ignores SIGTERM, or when a child of `bw` keeps its
  output open. No hard kill is set.
- Whether the real `bw` accepts two calls at once on one settings folder.
- Whether another process of the same user can read the environment of a
  running `bw`. This depends on the operating system.
- Whether a `JSON.parse` error message holds a piece of the `bw` output in
  the Node.js version of the reference (`server/host/bitwarden-vault.ts:236`,
  `:256`).
- The meaning of the Bitwarden field types 0 to 3. The code keeps types 0
  to 2 (`server/host/bitwarden-vault.ts:121`).
- Whether zod drops unknown fields of the Vault file on a write
  (`server/vault-store.ts:70`).
- Whether a member's own default bot on a team cloud can get a Bitwarden
  item through `request_credential`. The code does not stop it. No test
  covers it.
- Whether Secrets Manager works on a team cloud. No test or doc covers it.
- The Bitwarden part of `botLogins.receiveHandoff` (`server/index.ts:1477`).
- Whether the real list endpoint of Secrets Manager pages its answer, and
  whether Bitwarden sends ids in lower case
  (`server/host/bitwarden-secrets.ts:238`).
- Whether the time-out signal also bounds the body read of a Secrets
  Manager request (`server/host/bitwarden-secrets-api.ts:179-184`).
- Whether a changed item list changes the stable half of the prompt and so
  restarts a warm engine process (`server/system-prompt.ts:40-50`).
- Whether the end-to-end fixture runs on Windows: its fake `bw.exe` is a
  script with a shebang (`scripts/testing/cloud-send-fixture.ts:158-165`).
- The pinned digests were not checked against the release on GitHub. The
  doc says only the macOS arm64 one was checked against a download
  (`docs/bitwarden.md:110`).
- Whether the browser check of `type="url"` runs when the footer button
  submits the form.
- Whether `/api/logins` is in no client rule of `server/request-auth.ts`:
  a grep finds no rule that names it, and the default is the admin scope
  (`:539-546`). The regular expressions of the rules were not read one by
  one.
