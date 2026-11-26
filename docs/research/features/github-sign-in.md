# GitHub sign-in in the reference project

The feature row in [`../reference-features.md`](../reference-features.md): "GitHub
sign-in: the server signs in once with the device code of GitHub CLI, or
takes a pasted fine-grained token; the token never reaches a bot; each
member of a Team Cloud signs in with their own account". Document of the
reference: `apps/docs/content/docs/connected-apps/github-sign-in.mdx`. Part
20, group 3, crate `bot-engine`. For step 16 of
[`../../plan/README.md`](../../plan/README.md).

Read on 2026-11-26 at commit `140172d88` (version 0.1.182) by nine readers,
one for each group of files. Four more agents then tried to disprove the key
findings against the code. Section 9 gives the results of that check. The
lead also read some lines again. All paths are in the reference project
unless a path starts with `crates/` or `docs/`. Nobody opened its
`enterprise/` directory. No real token is in this file.

The reference uses its product name in three wire values: the first value of
`GithubSignInSource`, the `user-agent` header and the prefix `OMB_` of its
environment variables. This file writes `<product>` in their place.

What this file adds to the done research files:

- The full flow of the server sign-in: the device code of GitHub CLI, the
  pasted token and the person's own GitHub CLI. No file had it.
  `connected-apps.md:275` named the page as a border only.
- How the git of a bot reaches GitHub: the credential helper on This
  computer and the broker grant in the bot box.
- The push rule, and the parts of it that the code does not enforce.
- The GitHub chat card, which no code raises at this commit.
- A correction to `acp-adapter.md:340-342`. That file says that an unboxed
  bot process "gets a GitHub credential in its environment". The
  environment holds a per-spawn secret for a loopback helper, not the token
  (section 3.6). The cited lines are now `procs.ts:423-425, 444, 454`.

## 1. In short

The server of the reference project signs in to GitHub one time. Then the
server can clone, push and open pull requests for the bots. The person does
not register an app on GitHub. The server uses GitHub's own command-line
tool, GitHub CLI (`gh`), and its device-code sign-in.

A sign-in comes from one of three sources, in this order:

1. **The server's own GitHub CLI sign-in.** The server runs
   `gh auth login --web` in a private folder. The person types a short code
   on a GitHub page. gh then writes the token to a file in that private
   folder.
2. **A pasted token.** The person pastes a token that they made on GitHub.
   The server keeps it in its encrypted Vault.
3. **The person's own GitHub CLI** (This computer only). If the person ran
   `gh auth login` in their own terminal, the server reads that sign-in and
   never changes it.

The docs page promises that the token "never reaches a bot"
(`github-sign-in.mdx:30`, `:38`). The code keeps this promise in the bot box
only. In the bot box, a broker adds the token to each git request outside
the box, and a push guard refuses some pushes. On This computer, with no
box, a credential helper gives the real token to the git of the bot, and no
push rule applies (section 3.6).

The release note of v0.1.181 promises that bots on My Cloud "push to a
branch of their own, never the default branch and never with a force-push".
The code refuses a push to the default branch. It does not refuse a
force-push to another branch, and it does not check that the branch belongs
to the bot (section 3.8).

A chat card "Connect GitHub" exists, but no code raises it at this commit
(section 3.9).

Terms used in this file:

- **GitHub CLI, gh:** GitHub's command-line program. The reference starts it
  as a child process.
- **Device code:** a sign-in for a program that cannot show a web page. gh
  prints a short code such as `B1A5-0221`. The person opens
  `https://github.com/login/device` on any device, types the code and
  approves. gh asks GitHub again and again (it polls) until the person
  approves, and then it writes the token.
- **Audience:** whose sign-in it is. Off a Team Cloud the audience is
  `owner`. On a Team Cloud it is the person key of a member: `p_` and 22
  characters, made from a hash of the member's email
  (`server/person-key.ts:5-10`).
- **Own folder:** `<data>/github/<audience>/`, with `config/` (gh's config,
  with the token in `hosts.yml`) and `home/` (gh's HOME)
  (`server/github/sign-in.ts:97-101`).
- **Vault:** the encrypted file `<data>/logins.json.enc` of the server. Its
  key is in `<data>/logins-key`. A pasted token is in it
  (`server/vault-store.ts:18-19`, `:86-88`).
- **Team Cloud:** a server of the reference project that a team shares. Each
  member has their own private chats there.
- **This computer:** the desktop app of the reference, where the server runs
  on the person's own computer.
- **My Cloud:** a server of the reference that one person rents. Bots there
  run in the bot box.
- **Bot box:** a Linux sandbox (bubblewrap) around each process of a bot on
  a Cloud home (`docs/bot-box.md:3-5`). The full box is an open research
  row. This file covers only the parts of it that GitHub uses.
- **Broker:** a server process outside the box. A box process sends its
  requests to it with a broker token. The broker adds the real credential.
- **Broker token:** `omb_t0_` and 48 hexadecimal characters, one for each
  process, kept as a SHA-256 hash in memory for at most 24 hours
  (`server/bot-box/broker.ts:14-16`, `:63`).
- **Grant:** one upstream that a broker token can reach. The GitHub grant
  has the fixed upstream `https://github.com`.
- **Push guard:** the code in the broker that reads the ref updates of a
  push and refuses some of them (`server/bot-box/git-push-guard.ts`).
- **Credential helper:** a program that git asks for a user name and a
  password. git reads it from its config.
- **Smart HTTP:** git's protocol over HTTPS: `info/refs`, `git-upload-pack`
  (fetch) and `git-receive-pack` (push).
- **Default branch:** the branch that the repository opens on, often `main`.
- **Force-push:** a push that moves a branch to a commit that does not
  contain the old commit. It can delete the work of other people.
- **Held secret:** a value that the server masks in logs and tool output
  (`server/vault-store.ts:575-667`).
- **Connector card:** a chat message of kind `connector` that asks the
  person to connect something. [`bot-contact-cards.md`](bot-contact-cards.md)
  and [`connected-apps.md`](connected-apps.md) describe the shared parts.

## 2. Files read completely

Lines in brackets. "Ranges" lists a file that a reader read in parts.

**Sign-in core** (reader 1):

- `server/github/sign-in.ts` (503), `server/github/sign-in.test.ts` (530)
- `server/github/token.ts` (27), `server/github/sign-in-card.ts` (14)
- `shared/github-sign-in.ts` (29)
- `server/routes/github-sign-in.ts` (60), `server/routes/github-sign-in.test.ts` (112)
- `server/github/gh-cli.ts` (177), `server/github/gh-output.ts` (145),
  `server/github/personal-hosts.ts` (25)
- `server/host/github-sign-in-cards.ts` (141), `server/person-key.ts` (62)
- Ranges: `server/index.ts` (15253): 118, 388, 687-688, 728, 730, 745, 747,
  12034, 12130, 12145, 13408-13409, 14525-14540, 14755-14775, and part of
  12775. `server/request-auth.ts` (763): 10-75, 138-150, 222-250, 306-316,
  524-545, 700-763. `server/vault-store.ts`: 8-40, 60-130, 150-270, 440-460,
  480-667. `server/credential-env.ts`: 1-69. `server/routes/team-phone.ts`:
  39-53. `server/atomic.ts`: 53-78. A search of `server/request-auth.test.ts`
  (969) and `server/index.test.ts` (15166) for "github": no test there names
  the sign-in.

**GitHub CLI** (reader 2):

- `server/github/gh-cli.ts` (177), `gh-cli.test.ts` (42), `gh-output.ts`
  (145), `gh-output.test.ts` (100), `gh-release.ts` (38),
  `personal-hosts.ts` (25), `personal-hosts.test.ts` (30), `gh-dbus.test.ts`
  (55)
- All 26 fixtures in `server/github/fixtures/`: `2.40.1/` (7 files),
  `2.102.0/` (6), `2.103.3/` (9), `constructed/` (4)
- `server/procs.ts` (743), `server/testing/fake-github.ts` (135),
  `server/credential-env.ts` (106)
- Ranges: `deploy/install.sh` (1152): 470-565. `scripts/server-installer.test.ts`
  (690): 356-392. `server/env-path.ts` (472): 1-260.
  `server/engine-standalone.ts` (899): 1-135, 325-464, 608-660, 780-899.
  `server/contracts.ts`: 464-519.

**Git access** (reader 3):

- `server/github/git-access.ts` (44), `git-access.test.ts` (131),
  `git-credential.ts` (63), `git-credential.test.ts` (146), `git-env.ts`
  (53), `git-repos.ts` (112), `git-repos.test.ts` (71)
- `server/testing/fake-github-git.ts` (78), `server/drivers/acp/copilot.ts`
  (282), `server/redact.ts` (48), `shared/redact.ts` (168)
- `docs/verification/copilot-engine.md` (97)
- Ranges: `server/drivers/acp/copilot.test.ts` (395): 20-66, 103-198,
  226-260, 388-395. `server/redact.test.ts` (337): 135-172, 250-337.
  `server/host/cloud-team-host.ts`: 40-70.

**Bot box broker and push guard** (reader 4):

- `server/bot-box/broker-github.ts` (251), `broker-github.test.ts` (316),
  `broker-github.e2e.test.ts` (222)
- `server/bot-box/git-push-guard.ts` (154), `git-push-guard.test.ts` (160)
- `server/bot-box/broker.ts` (231), `broker-env.ts` (88), `env.ts` (94)
- Ranges: `server/bot-box/box.ts` (411): 1-30, 140-262, 280-312.
  `server/bot-box/plan.test.ts` (402): 270-300.
  `server/bot-box/hostile-home.test.ts` (101): 1-20, 29-35, 66-101.
  `docs/bot-box.md` (251): 180-235 and grep lines. `server/lent-clone.ts`:
  24-52.

**Chat card** (reader 5):

- `server/host/github-sign-in-cards.ts` (141), `github-sign-in-cards.test.ts`
  (219), `server/github/sign-in-card.ts` (14)
- `server/host/connector-cards.ts` (92), `server/routes/sign-in-cards.ts`
  (63), `server/routes/sign-in-cards.test.ts` (126)
- `packages/phone-protocol/src/connector-card.ts` (25),
  `shared/connector-card.ts` (1), `packages/phone-protocol/src/inbox.ts` (82)
- `server/host/connect-card-settle.ts` (50), `connect-card-settle.test.ts`
  (77), `server/host/resumable-cards.ts` (52), `resumable-cards.test.ts`
  (59), `server/connector-card-text.test.ts` (30)
- `server/host/cloud-team-host.ts` (241), `server/host/mcp-sign-in-cards.ts`
  (293), `src/components/github/GithubChatCard.tsx` (98)
- Ranges: `server/index.ts`: 1368-1371, 1895-2040, 9378-9402, 11310-11375,
  11465, 12034, 14740-14826. `packages/phone-protocol/src/wire.ts` (1000):
  23, 436-490. `server/chat-widgets.test.ts` (556): 100-240.
  `server/chat-apps.test.ts` (886): 20-130.
  `server/host/team-connections-host.ts` (476): 120-160.

**Callers of the sign-in** (reader 6):

- `server/lent-clone.ts` (127), `lent-clone.test.ts` (128),
  `server/lent-copies.ts` (286)
- `server/skill-fetch.ts` (484), `skill-fetch.test.ts` (668),
  `server/routes/bot-skills.ts` (210)
- `server/workspace-backup-policy.ts` (86), `workspace-backup-policy.test.ts`
  (117)
- `server/routes/cloud-sync.ts` (139), `cloud-sync.test.ts` (162)
- `docs/files.md` (108), `server/group-exec.ts` (97), `server/secret-folder.ts`
  (11)
- Ranges: `server/routes/bot-skills.test.ts` (399): 1-49, 142-245.
  `server/setup-import.test.ts` (761): 78-104, 205-232, 575-628.
  `server/setup-import.e2e.test.ts` (218): 70-130.

**UI** (reader 7):

- `src/lib/github-sign-in.ts` (204), `github-sign-in.test.ts` (231)
- `src/components/github/GithubAppCard.tsx` (76), `GithubAppCard.dom.test.ts`
  (235), `GithubChatCard.tsx` (98), `GithubChatCard.dom.test.ts` (145),
  `GithubSignInDetails.tsx` (192)
- `src/components/PluginsPanel.tsx` (821), `PluginsPanel.member.test.ts` (32)
- `src/components/MemberApps.tsx` (125), `MemberApps.dom.test.ts` (77)
- `src/components/ConnectorCard.tsx` (254), `src/github-sign-in-preview.tsx`
  (161), `github-sign-in-preview.html` (12)
- `src/state/api.ts` (97), `src/lib/copy-text.ts` (156)
- The 10 images of `docs/pr-screenshots/github-sign-in-card/`
- Ranges: `src/locales/en.json` (12251): 12205-12251 and each line that a
  search for "github" gave. `src/locales/everyday-words.test.ts` (139): 1-40,
  60-139. `DESIGN.md` (445): 92-100, 160-186, 226-230, 284-292, 330-350.
  `src/components/AskCard.tsx` (363): 40-125, 255-300.

**Documents and releases** (reader 8):

- `apps/docs/content/docs/connected-apps/github-sign-in.mdx` (47),
  `index.mdx` (82), `meta.json` (5)
- `apps/docs/content/docs/security/index.mdx` (29), `docs/bot-box.md` (251)
- The notes of v0.1.181 and v0.1.182 (`gh release view`)
- The full messages of commits `ed8cb7278`, `fbdd6d96f`, `2bc18664c`,
  `cd59909a3`, `922754ec2`, `a679d29e2`, `a57139497`, `2125677dd` and seven
  more
- Ranges: `apps/docs/content/docs/security/permissions-and-secrets.mdx`
  (311): 15-25, 139-158, 211-221. `announcements/releases.json` (1295): 1-30,
  118-132. `docs/verification/cloud-account.md` (99) and
  `docs/verification/engines-ui.md` (117): searched. Neither has GitHub
  content. No verification document exists for this feature.

**Our repository** (reader 9): `MEMORY.md`, `AGENTS.md`, `README.md`,
`docs/research/features/write-only-secrets.md` (648) and
`security-model.md` (1010) completely. The other border files in ranges
(section 9).

**The lead** read: `server/bot-box/sign-in-masks.ts` (70),
`server/share-github.ts` (128), `server/engine-homes/layout.ts` 46-67, and
lines of `server/bot-box/plan.ts` and `server/engine-standalone.ts` found by
search.

## 3. How it works

### 3.1 The parts and who owns them

| Part | File | What it does |
|---|---|---|
| Wire types | `shared/github-sign-in.ts:1-29` | The five states and the routes. No token field |
| State machine | `server/github/sign-in.ts:103-503` | One sign-in for each audience: status, start, cancel, pasted token, sign-out, token |
| gh runner | `server/github/gh-cli.ts` | Finds gh, builds its environment, runs short calls and the login |
| gh output | `server/github/gh-output.ts` | Reads the device code, the status and `hosts.yml` |
| Pinned gh | `server/github/gh-release.ts` | Downloads gh 2.103.3 when no usable gh exists |
| Accessor | `server/github/token.ts:7-27` | `githubToken(audience)` for other server code, with no import of `index.ts` |
| HTTP routes | `server/routes/github-sign-in.ts:20-60` | `GET` status and four `POST` actions |
| Git of an unboxed bot | `server/github/git-credential.ts`, `git-env.ts:43-53` | A loopback route and a curl credential helper |
| Git of a boxed bot | `server/github/git-access.ts`, `git-env.ts:22-40`, `server/bot-box/broker-github.ts` | A broker grant to `https://github.com` |
| Push guard | `server/bot-box/git-push-guard.ts`, `server/github/git-repos.ts` | Refuses some ref updates, and pushes to other repositories |
| Chat card | `server/host/github-sign-in-cards.ts`, `server/github/sign-in-card.ts` | Makes and settles a "Connect GitHub" card. No caller |
| Composition | `server/index.ts:12034` | Connects all of the above |

The composition at `server/index.ts:12034` gives two switches:

- `personalAllowed: () => !CLOUD_HOME && !HOSTED_WORKSPACE && !botBox.enabled()`.
  The person's own gh is used only on This computer with no bot box.
- The credential route is `enabled: () => !CLOUD_HOME && !HOSTED_WORKSPACE && !CLOUD_TEAM && !botBox.enabled()`.

It also gives `remember: (token) => heldSecrets.remember(token, "password")`.
Each token that the sign-in returns becomes a held secret, so the server
masks it by value in logs and tool output.

Design rules in the header of `sign-in.ts:5-13`:

- One sign-in for each audience. Each audience has its own folder.
- "A token is never logged, never in a route's answer and never in a bot's
  environment" (`:7-8`).
- Nothing runs at start-up. Nothing runs on a timer (`:10`).
- A login in progress is in memory only (`:10-11`).
- The server asks GitHub if a saved sign-in still works only on `check`, at
  the first status of a run, or after a git action reported a refusal
  (`:11-13`).

### 3.2 Read the status

`status(audience, {check})` (`sign-in.ts:247-261`):

1. Check the audience (`must`, `:120-124`). A bad audience gives 403 "Sign in
   to this server to connect GitHub." The pattern
   `/^(?:owner|p_[\w-]{22})$/u` (`:28`) also guards the folder path. A test
   gives 403 for `"../owner"` (`sign-in.test.ts:391`).
2. If a status call of this audience is in progress, return the same
   promise (`:256-257`). Three parallel calls start gh one time (test
   `sign-in.test.ts:487-497`). The `check` option of a second caller is
   ignored.
3. Else run `readStatus` (`:263-296`):
   1. End a late attempt (`settleLate`, step list in 3.3). If an attempt is
      live, return `signing-in` or `installing` (`:265`).
   2. Ask GitHub when `check` is true, or the status is `stale`, or no answer
      is known in this run (`:267`).
   3. If the own `hosts.yml` can be read, run `checkOwn` and return the
      result (`:268-274`). The organisation list (`gh api user/orgs`, at most
      200 names) is asked only on a source change or on `check` (`:158-162`,
      `:270`).
   4. Else, if the Vault has a pasted token, run `checkToken`. "Unreachable"
      gives `signed-in` with `checkedAt: null` (`:275-283`).
   5. Else, off a Team Cloud, read the person's own gh (`:284-291`). Output
      that cannot be read gives `signed-out` here (`:217`, `:287`).
   6. Else return `signed-out` with `download` true when no gh is on the
      computer (`:293-295`).

How each answer becomes a state (`gh-output.ts:78-112`, `sign-in.ts:164-208`):

| Answer | State |
|---|---|
| gh JSON: no `github.com` key | signed out |
| gh JSON: `state: "success"` with a login | `signed-in`, `checkedAt: now` |
| gh JSON: `state: "error"` with `HTTP 401` or `Bad credentials`, or `state` `expired` or `refresh_expired` (`gh-output.ts:93`) | `invalid` |
| gh JSON: `state: "error"` with another text (offline, proxy) | `signed-in`, `checkedAt: null` |
| gh text: `not logged in to any (GitHub) hosts` | signed out |
| gh text: `Token for github.com account X ... has expired`, or `Refresh token ... was rejected` | `invalid` |
| gh text: `Failed to log in` or `Timeout trying to log in` | unknown, thus `signed-in`, `checkedAt: null`. gh prints the same text for a refused token and for no network (`gh-output.ts:98-100`) |
| `success` with no login (`sign-in.ts:166`) | `invalid` |
| Own gh: no answer, or output that cannot be read | `signed-in`, `checkedAt: null`: "The config file is there, so an answer gh could not give is not a refusal" (`sign-in.ts:181-182`) |
| Pasted token: `GET https://api.github.com/user` gives 401 | `invalid`, "GitHub no longer accepts this token. Paste a new one." (`:201-202`) |
| Pasted token: network error, 403 or other status | `signed-in`, `checkedAt: null`. "A 403 on a pasted token (also GitHub's rate limit) proves nothing" (commit `ed8cb7278`) |

So a brief failure never shows as signed out for the server's own sources.
The tests `sign-in.test.ts:294-322` and the fixtures fix this for three
versions of gh (section 6.2).

### 3.3 Sign in with the device code

`start(audience)` (`sign-in.ts:344-397`):

1. Check the audience. If an attempt is live, return it. A second Start
   joins the first (`:346-347`).
2. If the own folder is signed in: 409 "GitHub is already signed in here.
   Sign out first to use another account." (`:348`). An `invalid` own sign-in
   still has `hosts.yml`, so Start gives 409 until sign-out.
3. Make the attempt at once, before the first `await`: phase `installing`,
   no child (`:350-353`).
4. Off a Team Cloud, read the person's own gh (`:356-364`):
   - Output that cannot be read: 409 "Your own GitHub CLI's sign-in could not
     be checked, so nothing was changed. Try again."
   - Signed in, also unchecked (offline): 409 "GitHub is already signed in on
     this computer as {login}, with your own GitHub CLI."
   - Start continues only for: no gh, gh signed out, or gh refused by GitHub.
5. Windows only, off a Team Cloud, when the person's gh did not say signed
   out (`:365-373`). If the person has no gh, read Credential Manager with
   `<SystemRoot>\System32\cmdkey.exe /list` (`gh-cli.ts:171-175`). Start
   gives 409 in three cases: the person has a gh (thus refused), the list
   cannot be read, or the list has a `gh:github.com...` entry. The text is
   "This computer's Windows
   Credential Manager already holds a GitHub CLI sign-in, which signing in
   here could change. Paste a GitHub token instead, or sign in again with
   your own GitHub CLI." The reason: gh keeps a sign-in in the credential
   store of the system under one name for all config folders, and Windows
   Credential Manager cannot be redirected (`gh-cli.ts:5-11`).
6. Choose the gh: the person's own gh if its version is 2.102.0 or later
   (`GH_SIGN_IN_FLOOR`, `gh-cli.ts:24`), else the pinned copy (`:374`).
7. If no gh is there, start the download in the background (`:380-390`).
   The download has a limit of 20 minutes
   (`STANDALONE_DOWNLOAD_TIMEOUT_MS = 20 * 60_000`,
   `engine-standalone.ts:30`, `:397`). It comes from three allowed hosts over
   HTTPS. The server checks the SHA-256 of the archive and of the program,
   and the macOS Team ID. It runs `--version` before the switch
   (`gh-release.ts:1-38`, `engine-standalone.ts:797-884`). A failure ends the
   attempt with `last.reason` (at most 300 characters). When the download
   ends, the clock of the attempt starts again: "The clock for a code starts
   when gh does" (`:383-384`).
8. `launch` (`:317-342`) starts gh:
   `gh auth login --hostname github.com --git-protocol https --web --insecure-storage --clipboard=false`,
   plus `--expiring=false` from gh 2.103.0 (`gh-cli.ts:26`, `:72-75`).
   - stdin is closed, no shell, `windowsHide: true` (`gh-cli.ts:166-169`).
   - The server keeps at most 64 KiB of output (`sign-in.ts:27`, `:329`).
   - The environment is in section 4.3.
9. Each chunk of output is read for the code (`gh-output.ts:9`, `:33-46`):
   `/one-time code(?: \(|: )([A-Z0-9]{4}-[A-Z0-9]{4})\b/iu`, and an `https`
   URL with host `github.com` and path `/login/device`. The URL that the
   client gets is always the constant `https://github.com/login/device`,
   never the text that gh printed (`gh-output.ts:5`, `:31-32`).
10. When the code is found, the state is `signing-in`, with
    `expiresAt = now + 15 * 60_000` (`DEVICE_CODE_TTL_MS`, `sign-in.ts:24`,
    `:333`). gh does not print the expiry. GitHub's `expires_in` is 900 s
    (`:23`).
11. gh polls GitHub in its own process. The server does not poll GitHub.
    The client polls the server (section 5.3).
12. When gh exits, `finish` runs (`:298-315`). It does nothing if the attempt
    is not the current one, so the exit of a cancelled gh changes nothing.
    - Exit 0 and `hosts.yml` exists: clear `last`, set `stale` (the next
      status asks GitHub), and delete a pasted token of this audience: "One
      source at a time" (`:306-311`).
    - Other exit: `last` = `loginFailure(output)`, one line (next list).

`loginFailure` (`gh-output.ts:49-56`), first match:

- `expired_token`, "code has expired" and similar: `expired`, "The code
  expired before it was entered on GitHub."
- `access_denied`, "denied": `failed`, "The sign-in was turned down on
  GitHub."
- `timed out`, `no such host`, `connection refused`, `dial tcp`, `read tcp`,
  `EOF`: `failed`, "GitHub could not be reached from this server. Check its
  network connection, then try again."
- Else `failed`, "GitHub CLI stopped: {last line, at most 200 characters}".
  This line goes to the client in `last.reason`.

**The limits of the wait.** No timer of the server stops the login
(`sign-in.ts:221`: "No timer: asked on read."). `settleLate` (`:222-230`)
runs when `current()` runs, thus from a status read, a Start, a Cancel or a
sign-out (`:233`, `:264`, `:346`, `:411`, `:447`). It ends an attempt that is
late:

- phase `signing-in` and `now > expiresAt`: `last` "The code expired before
  it was entered on GitHub."
- phase `installing` and more than `NO_CODE_MS = 2 * 60_000` since the start
  (`:26`): `last` "GitHub did not send a code in time. Try again."

It stops the child with `SIGTERM` only. No `SIGKILL` follows, and no wait for
the exit (`:227`). An attempt that waits for the download has no child, so
`settleLate` skips it (`:224`). The download limit of 20 minutes ends it.

If nobody reads the status, gh runs on. gh 2.103.3 stops by itself after
899 s (`gh-output.test.ts:82`, fixture `2.103.3/login-expired.stderr.txt`).
So the wait has a limit that gh sets, not the server. A gh that hangs before
it prints a code has no limit.

### 3.4 Cancel, paste a token, sign out

**Cancel** (`sign-in.ts:399-412`): set `cancelled`, clear the attempt, set
`last` to `cancelled`, send `SIGTERM` to the child. No `SIGKILL` follows.
A gh that still writes its file after the cancel makes the next status
`signed-in` (test `sign-in.test.ts:191-200`).

**Paste a token** (`sign-in.ts:414-428`):

1. Trim the text. It must match `/^[A-Za-z0-9_]{20,255}$/u`. Else 400 "Paste
   a GitHub token: it starts with github_pat_ (fine-grained) or ghp_."
   (`:417`). The code does not check the prefix.
2. `GET https://api.github.com/user` with `authorization: Bearer <token>`,
   `accept: application/vnd.github+json`, `x-github-api-version: 2022-11-28`
   and a limit of 20 s (`:191-197`). "Unreachable" gives 502 "GitHub could
   not check the token just now. Try again in a minute." Not signed in gives
   400 "GitHub did not accept this token. Check it and paste it again."
   (`:418-420`).
3. Stop an attempt in progress (`:421`).
4. Delete the own folder: `rmSync(root, { recursive: true, force: true })`
   (`:423`).
5. Write the token to the Vault: `setGithubToken(audience, { token, login })`
   (`:424`).
6. Return the status. It has no token.

No scope and no permission of the token is checked. Only `GET /user` must
answer 200 with a login. The order of steps 4 and 5 is a risk: if the Vault
write throws, the gh sign-in is already gone and the new token is not stored
(section 8, P475).

**Sign out** (`sign-in.ts:430-448`):

1. Stop an attempt.
2. If the sign-in is not the server's own (no own folder and no Vault token)
   and the source is `cli`: 409 "This sign-in is your own GitHub CLI's. Sign
   out there with `gh auth logout`."
3. Else delete the own folder and the Vault token, and return the status.
   On This computer the next status can be the person's own gh.

The server never runs `gh auth logout`, because logout also deletes entries
in the credential store of the system, which can be the person's own
(`gh-cli.ts:5-9`). Sign-out does not revoke the token on GitHub. To revoke,
the person removes "GitHub CLI" on GitHub. That signs out each copy of
GitHub CLI of that account (`github-sign-in.mdx:42-47`).

### 3.5 Give the token to server code

`token(audience)` (`sign-in.ts:450-475`), through `githubToken(audience)`
(`token.ts:15-17`):

1. Resolve the audience. Null gives null. On a Team Cloud only a member's
   person key resolves. There is no fallback to another audience
   (`:116-119`).
2. Own folder signed in: run `gh auth token --hostname github.com` with the
   own environment. gh renews an expiring sign-in when it is asked for its
   token (`:459`). With no gh, read `oauth_token:` from `hosts.yml` (`:462`).
3. Else the Vault token.
4. Else, off a Team Cloud, run `gh auth token` of the person's own gh with
   the person's environment (`:466-471`).
5. The output must match `/^[A-Za-z0-9_]{20,255}$/u` (`gh-output.ts:142-145`).
6. Give each token to `remember` first (`:453-456`).
7. Each exception gives null (`:472-474`).

There is no cache. Each call for a gh sign-in starts one gh process with a
limit of 30 s and `SIGKILL` (`gh-cli.ts:28`, `:138-143`).

Three parts of the server use `githubToken` (verifier C6 corrected a reader
who found one):

| User | Audience | How the token leaves the server |
|---|---|---|
| Credential route for unboxed bots (`git-credential.ts:59`) | `owner` only | To git, as `password=<token>` (section 3.6) |
| Broker grant for boxed bots (`git-access.ts:34-41`) | `gitAudience(threadId)` | In an `Authorization` header to `https://github.com`, added outside the box (section 3.7) |
| Skill import (`skill-fetch.ts:26-31`) | the caller, or `gitAudience(threadId)` for a bot | `authorization: Bearer` to `https://api.github.com` only (section 3.10) |

`reportGithubAuthFailure(audience)` (`token.ts:20-22`) sets `stale`, so the
next status asks GitHub. It does not sign out (`sign-in.ts:479-482`).

### 3.6 The git of a bot on This computer (no box)

This path is on only when the composition switch is true: not a Cloud home,
not a hosted workspace, not a Team Cloud, and the bot box off for the whole
server (`index.ts:12034`). It also needs a sign-in of `owner`
(`git-credential.ts:29`).

1. A bot process starts. `spawnCli` calls `unboxedGitCredential` for an
   unboxed process of a bot (`procs.ts:423-425`).
2. The server makes a secret: 24 random bytes, base64url, with a life of at
   most 24 hours (`GIT_CREDENTIAL_TTL_MS`, `git-credential.ts:14`, `:33-34`).
   At most 2,000 secrets exist. A new one removes the oldest (`:15`, `:32`).
   They are in memory only.
3. The server adds one entry to `GIT_CONFIG_PARAMETERS` in the environment of
   the bot (`git-env.ts:43-53`):
   `credential.https://github.com.helper=!f() { ... curl -fsS --noproxy 127.0.0.1 --max-time 30 -H "x-omb-git-credential: <secret>" http://127.0.0.1:<port>/api/github/git-credential ...; }; f`.
   - The entry comes after the person's own git settings, so the person's
     own helpers answer first (`git-env.ts:46-47`, test
     `git-credential.test.ts:126-145`).
   - Other hosts get nothing (test `git-credential.test.ts:122`).
   - All settings go in one variable, never a file. `GIT_CONFIG_COUNT` and
     `GIT_CONFIG_KEY_<n>` are not used, because a Codex shell drops names
     that contain `KEY` (`git-env.ts:1-4`, test `git-access.test.ts:78-80`).
4. The bot runs `git push`. git asks the person's helpers. If they have
   nothing, git runs the curl helper.
5. The route answers only a loopback `GET` with owner trust and a live
   secret (`git-credential.ts:51-62`). It answers 403 for a session, a
   `service` loopback, a wrong secret, a `POST`, an old secret or a released
   secret (tests `git-credential.test.ts:55-99`). With no token it answers
   204.
6. The route answers `username=x-access-token\npassword=<token>\n` with
   `cache-control: no-store` (`:61`).
7. git sends the token to github.com. When the bot process exits, the server
   deletes the secret (`procs.ts:444`, `:454`).

What this means:

- The real GitHub token reaches the git process of the bot. The file says
  so: the bot runs as the person (`git-credential.ts:3-6`).
- The secret is in the environment of the bot and in the arguments of curl
  (`git-env.ts:51`). A shell of the bot can run the same curl command and
  get the token.
- No push rule applies. The push guard is in the broker only. Only
  `broker-github.ts:17` imports it (verifier B2). The bot can push to the
  default branch, force-push and delete a branch. Only the scopes of the
  token and the branch protection on GitHub limit it.
- If the person's own gh is the source, the bot's git gets the person's own
  token (`sign-in.ts:466-471`). Its scopes are those of the person's gh.

The docs page says that the server "never hands it to a bot"
(`github-sign-in.mdx:30`) and that the token "never reaches a bot" (`:38`).
On this path the token reaches the git of the bot.

### 3.7 The git of a bot in the bot box

This path is for a Cloud home with the box on.

1. A box process starts. If the box has an isolated network and the audience
   is signed in, `boxGithubGit` adds the `github` grant to the broker token
   of the process (`box.ts:194-210`, `git-access.ts:34-41`). With no sign-in,
   nothing changes: no token, no setting (test `git-access.test.ts:82-92`).
2. The box environment gets `GIT_CONFIG_PARAMETERS` with (`git-env.ts:22-40`):
   - three `url.http://127.0.0.1:<port>/g/github/.insteadof` entries for
     `https://github.com/`, `git@github.com:` and `ssh://git@github.com/`.
     The remote stays `https://github.com/...` in the clone.
   - `http.<broker origin>/.extraheader=x-omb-broker: <broker token>`. The
     token is never in an address, so git records do not hold it
     (e2e test `broker-github.e2e.test.ts:145-174`).
   - `credential.<broker origin>.helper=` (empty), and
     `GIT_TERMINAL_PROMPT=0`.
3. git sends each request to the broker. The broker accepts only four
   shapes (`broker-github.ts:53-67`):
   `GET /<owner>/<repo>[.git]/info/refs?service=git-upload-pack|git-receive-pack`
   and `POST .../git-upload-pack|git-receive-pack`. Other requests get 403
   "Only git's own requests to a GitHub repository go through here."
4. The broker removes each credential header of the client
   (`broker.ts:61-71`) and adds `Authorization: Basic base64("x-access-token:<token>")`
   for the fixed upstream `https://github.com` (`broker-github.ts:20`, `:77`).
5. The broker asks for the audience on each request and keeps a token for
   at most 60 s (`GITHUB_TOKEN_REUSE_MS`, `:22`, `:88-94`). A sign-out or a
   share of the conversation takes effect in that time.
6. GitHub answers 401 to a request with a token: the broker calls
   `reportAuthFailure` and does not send that token again. A `GET` goes again
   with no credential, so a public repository still clones (`:97-101`,
   `:145`, `:184-189`). A 403, a 404 or a network error does not report. A
   network error gives 502 "GitHub could not be reached." (`:152`). A 401 on
   the read of the default branch refuses the push, but does not call
   `reportAuthFailure` (`:127`, verifier B4).
7. A push goes through the push guard (section 3.8).

The GitHub token never enters the box. A test checks that
`JSON.stringify(env)` does not contain it (`broker-github.e2e.test.ts:98`).
The own folder `<data>/github` is never visible in a box (test
`plan.test.ts:280-295`). `GH_TOKEN` and `GITHUB_TOKEN` of the server are not
on the allow-list of the box environment (`env.ts:6-17`). One exception: a
`GH_TOKEN` that the person saved on an engine instance (Copilot, for example)
passes by name (`env.ts:67`, `box.ts:162`, verifier B9).

Redaction does not mask the broker token in its header form
`x-omb-broker: omb_t0_...`. No shape pattern matches `omb_t0_`. Only the
forms after `token=`, `--token` or `Bearer` are masked
(`shared/redact.ts:99`, `:112`, `:120`, verifier B10).

No time limit applies to the relay of a clone or a push to GitHub
(`broker-github.ts:183-198`, `:238-243`). A stuck connection holds its git
process. The read of the default branch has a limit of 15 s (`:26`, `:138`).

### 3.8 The push rule

The task asks for the code that enforces "a branch of the bot, never the
default branch, never a force-push". The code is in the broker only. The
guard does not read the git command line. It reads the ref updates
(`<old id> <new id> <ref>`) in the body of `git-receive-pack`, before one
byte goes to GitHub (`git-push-guard.ts:13`, `:34-72`). So the name of the
remote, the refspec and the flags of `git push` do not change the decision.

Steps of a push (`broker-github.ts:201-243`):

1. Refuse a compressed body (`:203-204`).
2. Hold the request until the command list is read. Limits: 1 MiB and 5,000
   commands (`git-push-guard.ts:10-11`, `:52`, `:69`). The wait for the list
   has no time limit, only the size limit.
3. Refuse a repository that the conversation may not push to (`mayPush`,
   `:227-229`).
4. If an update touches `refs/heads/`, read the default branch: a v0
   `info/refs?service=git-upload-pack` read for `symref=HEAD:` on the first
   ref line, with a limit of 15 s, kept 10 minutes
   (`DEFAULT_BRANCH_REUSE_MS = 10 * 60_000`, `:24-26`, `:110-142`). A failed
   read refuses the push: "the default branch could not be read; push again"
   (`:232-234`). With no symref, `refs/heads/main` and `refs/heads/master`
   are protected (`git-push-guard.ts:87-89`).
5. Check each command (`git-push-guard.ts:92-97`). One refused command
   refuses the full push (`:100-104`).
6. A refusal goes back as a 200 receive-pack result with `ng <ref> <reason>`
   and a `remote:` line, so git shows the bot why (`broker-github.ts:159-166`,
   `git-push-guard.ts:135-154`).

| Part of the rule | Enforced? | Code | Text for the bot |
|---|---|---|---|
| Never the default branch | Yes | `git-push-guard.ts:96` | "the default branch is protected here; push to a new branch" |
| Never delete a ref | Yes | `:93` | "deleting a ref is not allowed here; push to a new branch" |
| Never move a tag | Yes | `:94` | "moving a tag is not allowed here; push a new tag" |
| Only `refs/heads/` and new `refs/tags/` | Yes | `:95` | "only branches and new tags may be pushed here; push to a new branch" |
| A signed push, an unknown line, a second capability list | Refused | `:63-74`, `:82-91` | - |
| Only a repository of the conversation | Yes, but weak (next list) | `broker-github.ts:227-229`, `git-repos.ts:92-107` | "not a repository this conversation works in" |
| **Never a force-push** | **No**, for a branch that is not the default. The file says: "A force push to another branch is not detected" (`git-push-guard.ts:5-7`) | - | - |
| **Only a branch of the bot** | **No.** No prefix check and no owner check (`git-push-guard.ts:92-97`) | - | - |

Ways around the rule (reader 4, checked by verifiers B3 and B6):

- `git push --force origin feature` to a branch of a person: it passes. A
  bot can write over the work of a person on any branch that is not the
  default. No test covers a force-push of a branch. The only `--force` in
  the tests moves a tag (`broker-github.e2e.test.ts:182`).
- A fast-forward update of a branch of another person: it passes (test
  `broker-github.test.ts:248`).
- `mayPush` permits a repository that has a clone in the folders of the
  conversation (depth 2, at most 400 folders, `.git/config` read as text) or
  that was fetched through the broker since the server started
  (`git-repos.ts:9-14`, `:26-37`, `:67-107`). Reads are not narrowed
  (`broker-github.ts:10-11`). Each 200 ref list of `git-upload-pack` marks
  the repository as fetched (`:190`). So a bot can run `git ls-remote` on
  any repository that the token can read, and then push to it. A bot can
  also write a `[remote]` line in a `.git/config` in its folder.
- Push options after the flush are not read and go to GitHub
  (`git-push-guard.ts:44`).
- A branch with protection on GitHub that is not the default: the broker
  does not know it. Only GitHub's own rules apply.

The release note limits the promise to "Bots on My Cloud" (`v0.1.181`, under
"Bots and work"). The docs page says nothing about the rule (verifier D2).
`docs/bot-box.md` has no line about the GitHub grant or the push guard
(verifier D3).

### 3.9 The GitHub chat card

The card is a connector message that asks the person to connect GitHub
after a clone, fetch or push failed for want of a sign-in.

**No code raises it.** The only caller of `cards.raise` is
`raiseGithubSignInCard` (`server/github/sign-in-card.ts:12-14`). Nothing
calls `raiseGithubSignInCard`. A test fixes this: "is raised from nowhere
yet: only a git failure may call it, and none is wired to it here"
(`github-sign-in-cards.test.ts:204-218`). The commit message of `2bc18664c`
says "nothing calls it yet". The note of v0.1.181 promises the card "when a
bot's push fails for lack of access" (verifier C1, D1, D8).

What the card would do, from the code:

1. `raise(at, failure)` (`github-sign-in-cards.ts:82-110`) checks, in this
   order:
   1. The operation is `clone`, `fetch` or `push` (`:65`, `:83`).
   2. The repository matches
      `/^[A-Za-z0-9](?:[A-Za-z0-9-]{0,38})\/(?!\.\.?$)[A-Za-z0-9._-]{1,100}$/u`
      (`:20`, `:84`). The repository name is the only text from the bot.
   3. There is a person (`no-person` in a room or a shared chat of a Team
      Cloud, `:85-86`).
   4. If `failure.refused`, call `reportAuthFailure`.
   5. No open card for this bot in this chat.
   6. The cooldown: one card in each hour for each person, in all chats,
      also after "Not now" (`GITHUB_CARD_COOLDOWN_MS = 60 * 60_000`, `:18`).
      The map is in memory only (`:70-71`).
   7. The sign-in status. `signed-in`, `installing` and `signing-in` stop it
      (`:92-94`). The cooldown is checked again after this `await`
      (`:95-96`).
2. It appends a bot message of kind `connector` (`:99-108`):
   `source: "github"`, `slug: "github-sign-in"`, `label: "GitHub"`,
   `status: "required"`, `resumeKey: "github-<UUID>"`, `person` on a Team
   Cloud only, a text and a description (section 4.5). No token, no code
   and no URL.
3. At the end of the turn, `resumableCards` lists it as `connect GitHub`
   (`resumable-cards.ts:31-32`). The work parks with "Waiting on the person:
   connect GitHub" (`index.ts:1975`).
4. The card route `GET .../connector-cards/<id>/status` settles it
   (`github-sign-in-cards.ts:126-136`):
   - 403 "This GitHub sign-in is someone else's." when the caller's audience
     is not the card's.
   - Else read the status. When it is `signed-in`, patch the card to
     `connected` and call `resume` one time.
   - `authorize` gives 409 with the text `server.github.card.connectInApps`.
     `resume` gives 409 "nothing waits on this card". `dismiss` sets
     `dismissed`, starts the cooldown and releases the parked work
     (`:117-125`).
5. `resume` answers the parked work with a fixed text from stored data:
   "<product> connection update: the user securely connected GitHub.
   Continue the task that paused for this connection. Do not ask them to
   connect it again." (`index.ts:1898-1899`, `:11334-11344`). It answers only
   when each card of that `resumeKey` is connected and none is dismissed. The
   server does not run the git command again.
6. A settle that comes before the park is not lost: `reconcileParkedNode`
   answers on the next tick (`index.ts:1933-1939`, `:9388-9393`). After a
   start, `reconcileParkedRoots` does the same for all parked work
   (`:9384`, `:9399-9401`).

Gaps in this design:

- Only the `GET status` route settles the card. Only a client that shows the
  card calls it (`GithubChatCard.tsx:43-59`). If the person signs in from
  Apps and does not open the chat, the card and the parked work stay open.
  The MCP sign-in card has a server hook for this
  (`mcp-sign-in-cards.ts:275-282`). The general app settle skips the GitHub
  card only because its slug is not an app slug
  (`connect-card-settle.ts:26`).
- The status route reads the card, waits for `signIn.status`, then patches
  `{ ...card.connector, status: "connected" }` (`:129-132`).
  `store.patchMessage` replaces the full connector object (`store.ts:1239`).
  A `dismiss` in that gap is lost (verifier C4). No test covers it.

### 3.10 Other users of the sign-in

**Skill import** (`server/skill-fetch.ts`, after v0.1.181, merge
`a57139497`):

- `skillImportToken(audience)` calls `githubToken(audience)`. A null audience
  stays anonymous with no lookup (`:26-31`).
- The token goes only in `authorization: Bearer <token>` to origin
  `https://api.github.com`, with `redirect: "manual"`. A redirect is
  followed and signed again only inside that origin (`:41-56`, `:96-119`).
  File downloads get no token and `redirect: "error"` (`:300`).
- A token that does not match `/^[A-Za-z0-9_]+$/` is not sent, so that an
  error of `Headers.set` cannot show it (`:49-51`).
- The lookup races the abort signal of the import, so a slow `gh auth token`
  cannot make the import longer than 120 s (`:14`, `:69-86`).
- A 401 calls `reportGithubAuthFailure` one time for each import
  (`:108-111`).
- Limits of one import: 128 API requests, 1,000 downloads, 64 MiB in total,
  1 MiB for each API answer, 2 MiB for each file, 4 downloads at a time,
  120 s (`:12-15`, `:134`).
- A bot can start an import with `skill_manage`. The server then uses the
  token of `gitAudience(threadId)`: the owner off a Team Cloud
  (`index.ts:13408-13409`). This needs skill authoring on (`:13401-13402`).

**Lent clone** (`server/lent-clone.ts`) does not use the sign-in. It runs
`git clone https://github.com/<owner>/<name>.git` with "whatever git on My
Cloud already uses" (`:1-5`). Each git call has a limit of 10 minutes and a
process group stop: `SIGTERM` then `SIGKILL` at once, or
`taskkill /PID <pid> /T /F` on Windows (`:24`, `:51`, `group-exec.ts:7-35`).
With the box on, the clone ignores all git config of HOME and uses only
`~/.git-credentials` (`:27-39`). Its state file `<data>/sync/clones.json`
reads as `{}` after any error, and the next write keeps only the new record
(`:69-70`).

**Template import** (`server/share-github.ts`) reads public files from
`raw.githubusercontent.com` with no token (`:1-3`, `:72`). It is not a user
of the sign-in.

**Backups** never carry `<data>/github/` ("each holds its token in plain
text for GitHub CLI") or the Vault files (`workspace-backup-policy.ts:44`,
`:51-52`). A Cloud restored from a backup starts with no sign-in
(`github-sign-in.mdx:30`).

**Copilot engine:** the server removes `GH_TOKEN`, `GITHUB_TOKEN` and
`COPILOT_ALLOW_ALL` from the Copilot child, except a token name that the
engine instance sets itself (`server/drivers/acp/copilot.ts:200-206`). This
is a different sign-in.

### 3.11 Team Cloud

This part is out of scope for our plan (decision D10: one person, no
Cloud). It is recorded for the author.

- Each member signs in with their own account. The audience is the member's
  person key. A member reaches only their own sign-in. A team admin also
  reaches only their own (`routes/github-sign-in.ts:24-28`, test
  `github-sign-in.test.ts:65-77`).
- The person's own gh is never read on a Team Cloud (test
  `sign-in.test.ts:324-332`).
- The git of a bot uses the sign-in of the member who owns the private
  conversation, and nobody's elsewhere: a room, the team, a shared
  conversation and a shared process get none
  (`cloud-team-host.ts:62-63`, `git-access.ts:19-27`, test
  `git-access.test.ts:105-120`).
- When a member leaves, `VaultStore.forgetPerson` removes the Vault token and
  `GithubSignIn.forgetPerson` stops a login in progress (`SIGTERM`) and
  deletes the folder (`index.ts:12130`, `vault-store.ts:450-453`,
  `sign-in.ts:492-501`).

## 4. The data

### 4.1 The wire status

`GithubSignInStatus` (`shared/github-sign-in.ts:14-29`) is `{ last?: GithubSignInLast }`
joined with one of five states:

| State | Fields | Meaning |
|---|---|---|
| `signed-out` | `download: boolean` | No sign-in. `download` is true when Start must first download gh, "about 15 MB" (`:21`) |
| `installing` | - | The download runs, or gh started and printed no code yet |
| `signing-in` | `code`, `verificationUrl`, `expiresAt` | The code to type, the constant URL, the expiry in ms |
| `signed-in` | `login`, `source`, `scopes: string[]`, `orgs?: string[]`, `checkedAt: number \| null` | `checkedAt: null`: "there is a sign-in, but GitHub did not confirm it" |
| `invalid` | `login: string \| null`, `source`, `reason` | The saved sign-in does not work (revoked, expired) |

- `GithubSignInSource` (`:11`): `<product>` (the server's own gh), `token`
  (pasted), `cli` (the person's own gh, "read and never changed", `:9-10`).
- `GithubSignInLast` (`:14-18`): `{ outcome: "expired" | "failed" | "cancelled"; reason?: string; at: number }`.
  It says how the last attempt ended. `withLast` adds it to each state
  except `signed-in` (`sign-in.ts:242-245`).
- No field holds a token. `scopes`, `checkedAt`, `last.reason` and
  `invalid.reason` come on the wire, but no component shows them (section
  5).

### 4.2 Where the token is stored

| Source | Place | Form | Mode |
|---|---|---|---|
| Own gh | `<data>/github/<audience>/config/hosts.yml` | Plain text, `oauth_token:` (gh writes it, because of `--insecure-storage`) | Folders `config`, `home`, `home/.run` made with `0o700` before each own run (`sign-in.ts:146`). The server does not set the mode of `hosts.yml` |
| Pasted token | `<data>/logins.json.enc`, field `github[audience] = { token, login, savedAt }` | Encrypted (AES-256-GCM, `permissions-and-secrets.mdx:211-217`) with the key in `<data>/logins-key` | `0o600`, atomic write (`vault-store.ts:199-201`, `:215`, `:262`) |
| Person's own gh | The person's own config: `GH_CONFIG_DIR`, `XDG_CONFIG_HOME/gh`, `%AppData%/GitHub CLI`, `~/.config/gh` (`personal-hosts.ts:11-25`), or the credential store of the system | gh's own | Not the server's |

`hosts.yml` (fixture `constructed/hosts.yml.txt`):

```yaml
github.com:
    users:
        octo-fixture:
            oauth_token: TOKEN
    git_protocol: https
    oauth_token: TOKEN
    user: octo-fixture
```

The login is read from the line `    user:` (`gh-output.ts:115-126`). The token
is read from the line `    oauth_token:` only when no gh is on the computer
(`:129-139`, `sign-in.ts:462`).

The Vault treats a file that it cannot read as empty, and logs "it will be
replaced on the next save". The next `setGithubToken` then writes a file with
only the new data (`vault-store.ts:224-232`, `:568-572`, verifier A4). A
missing key file counts as unreadable too, and the write makes a new key.

### 4.3 The environment of each gh process

**Own gh** (`ownGhEnv`, `gh-cli.ts:79-113`), from an allow-list:

- Passed when set: `PATH`, `LANG`, `LC_ALL`, the proxy names
  (`HTTPS_PROXY`, `HTTP_PROXY`, `NO_PROXY`, `ALL_PROXY` in both cases),
  `SSL_CERT_FILE`, `SSL_CERT_DIR`, `SystemRoot`, `SYSTEMROOT`, `windir`,
  `ComSpec`, `PATHEXT`, `TEMP`, `TMP`, `TMPDIR` (`:79-80`).
- `PATH` default: `/usr/local/bin:/usr/bin:/bin`, or empty on Windows (`:89`).
- Set: `HOME=<home>`, `GH_CONFIG_DIR=<config>`, the five `XDG_*` folders
  under `<home>`, `DBUS_SESSION_BUS_ADDRESS=unix:path=<home>/.run/no-bus`,
  `GH_NO_UPDATE_NOTIFIER=1`, `GH_NO_EXTENSION_UPDATE_NOTIFIER=1`,
  `GH_TELEMETRY=false`, `DO_NOT_TRACK=1`, `GH_PROMPT_DISABLED=1`,
  `GH_SPINNER_DISABLED=1`, `NO_COLOR=1`, `GIT_CONFIG_NOSYSTEM=1`
  (`:90-110`).
- Windows: `USERPROFILE`, `APPDATA` and `LOCALAPPDATA` point into `<home>`
  (`:111`).
- Not passed: `GH_TOKEN`, `GITHUB_TOKEN`, `GH_ENTERPRISE_TOKEN`, the real
  D-Bus address, the server's HOME (test `sign-in.test.ts:155-157`).

Why (`gh-cli.ts:5-11`): the private HOME hides the macOS login keychain. The
dead D-Bus address hides the Secret Service of Linux. `--insecure-storage`
keeps the token only in the private folder. A test runs a real gh against a
fake Secret Service to show that gh does not reach it (`gh-dbus.test.ts`).

**Person's own gh** (`personalGhEnv`, `gh-cli.ts:116-121`): the full server
environment with `PATH`, `GH_NO_UPDATE_NOTIFIER`, `GH_PROMPT_DISABLED`,
`GH_SPINNER_DISABLED` and `NO_COLOR` set, minus the workspace credential
names and each `OMB_*` name. It keeps the person's `HOME`, `GH_TOKEN`,
`GITHUB_TOKEN` and D-Bus address (verifier A10).

**Short calls** (`gh-cli.ts:138-143`): `execFile` with `timeout: 30_000`,
`killSignal: "SIGKILL"`, `maxBuffer: 64 * 1024`, `windowsHide: true`. The
promise never rejects. A time-out, a missing file and an overflow give
code 1. No working folder is set.

`--version` is read with only `PATH`, `GH_NO_UPDATE_NOTIFIER=1` and
`SystemRoot`. The result is kept for each path for the life of the process,
also a `null` from a brief failure (`gh-cli.ts:151-158`).

gh is found on the augmented `PATH`, and on Windows also in
`<ProgramFiles>\GitHub CLI`, `<LOCALAPPDATA>\Microsoft\WinGet\Links` and the
scoop `shims` folder (`gh-cli.ts:59-62`, `:145-150`). A copy in the app's
own tools folder is never "personal". `gh-cli.ts` does not use the process
helper `procs.ts` or `resolveCliSpawn` (`env-path.ts:460`). If the first
match in a folder is `gh.cmd` or `gh.bat`, the start fails, because Node
refuses a `.cmd` with no shell (`env-path.ts:222-240`). The failure is soft:
`run` gives code 1 and `launch` catches the throw (`sign-in.ts:321-325`,
verifier A9). This is an inference from the code. No test runs it on
Windows.

### 4.4 Data in memory only

| Data | Place | Lost at a restart |
|---|---|---|
| The attempt: child, phase, code, URL, expiry, output, `gh` path | `sign-in.ts:40-51`, `:106` | Yes. A gh that outlived the server can still write `hosts.yml` (`:10-11`) |
| `last`, `known`, `stale`, `personalNone` for each audience | `sign-in.ts:55-63` | Yes. The first status of a run asks GitHub again |
| Shared status promises | `sign-in.ts:248` | Yes |
| The pinned gh path and the version cache | `gh-cli.ts:136-137` | Yes |
| Credential helper secrets | `git-credential.ts:18` | Yes. A bot process that lives on gets 403 |
| Broker tokens, the held token, default branches | `broker.ts:127`, `broker-github.ts:82-86` | Yes |
| Repositories fetched through the broker | `git-repos.ts:89` | Yes. A push to a repository that was only fetched is then refused |
| The card cooldown | `github-sign-in-cards.ts:70-71` | Yes. The hour starts again |
| Held secrets from `remember` | `vault-store.ts:593`, `:635-637` | Yes. At most 500 values, shared with the passwords that bot logins fill. A new value removes the oldest (verifier A5) |

### 4.5 The card row

The message (`github-sign-in-cards.ts:99-108`):

```json
{
  "role": "bot",
  "kind": "connector",
  "text": "Chief couldn't push to acme/site: GitHub isn't connected.",
  "connector": {
    "source": "github",
    "slug": "github-sign-in",
    "label": "GitHub",
    "status": "required",
    "resumeKey": "github-<UUID>",
    "person": "<person key, Team Cloud only>",
    "description": "Connect GitHub so Chief can push its work to your repositories."
  }
}
```

The text comes from `server.github.card.push`, `.clone` or `.fetch`
(`en.json:12246-12248`). The route answer is
`{ connected, pending, status: "connected" | "authorizing" | "required" }`
(`:136`). The card never stores `authorizing`. The phone protocol keeps
`connector.status`, `dismissed` and `person` "across restarts"
(`packages/phone-protocol/src/connector-card.ts:7-9`).

### 4.6 The HTTP routes

| Route | Body | Answer |
|---|---|---|
| `GET /api/github/sign-in[?check=1]` | - | status |
| `POST /api/github/sign-in/start` | - | status, or 409 |
| `POST /api/github/sign-in/cancel` | - | status |
| `POST /api/github/sign-in/token` | `{ token }`, at most `4 * 1024` bytes | status, 400 or 502 |
| `POST /api/github/sign-in/sign-out` | - | status, or 409 |
| `GET /api/github/git-credential` | header `x-omb-git-credential` | git credential lines, 204 or 403 |
| `GET/POST /api/bots/<id>/connector-cards/<messageId>/(status\|dismiss\|resume\|authorize)` | `{ threadId }` | card answer |

Who may call the sign-in routes (`routes/github-sign-in.ts:24-57`,
`request-auth.ts:69-71`, `:529-532`):

- Off a Team Cloud: a loopback request whose trust is not `service`, or a
  request with the `admin` scope. A `service` loopback (the shell of a bot
  on a shared server) and a client session get 403 "Only the owner or an
  admin of this server can connect GitHub."
- On a Team Cloud: only a session with team membership, for its own sign-in.
  Else 403 "Sign in to this team's Cloud to connect your own GitHub."
- A `POST` from a browser that is not same-origin gets 403 (`:41`).
- Each answer has `cache-control: no-store` (`:36`).
- An error that is not a `GithubSignInError` gives 500 "GitHub sign-in did
  not work this time. Try again.", "Never the error's text: it could hold
  what gh or GitHub said about the token" (`:55-57`).
- The internal token of a bot turn reaches only `/api/internal/`
  (`request-auth.ts:49`). It does not reach these routes.

## 5. The UI

[`connected-apps.md`](connected-apps.md) describes the Apps page.
[`bot-contact-cards.md`](bot-contact-cards.md) describes the shared card
frame. This section gives only what the GitHub row and the GitHub chat card
add.

### 5.1 The GitHub row in Apps

The row sits in the "Developer tools" section, just before the tile of the
GitHub app of the connector service (`PluginsPanel.tsx:414`, `:423`,
`:448-451`). It counts in "N connected" and shows in the Connected view only
when it is signed in. The Apps search finds it with the words
"github git pull requests repositories push clone" (`GithubAppCard.tsx:9`).
The refresh button of Apps sends `?check=1` (`GithubAppCard.tsx:51`).

The button at the end of the row (`GithubAppCard.tsx:16-45`):

| View | Button | Action |
|---|---|---|
| loading | disabled, spinner, "Checking…" | - |
| error | "Retry" | read again |
| signed out or invalid, after a 409 | none. The token form has the one action | - |
| signed out | "Connect" | `start` |
| invalid | "Connect again" | `start` |
| installing or signing in | "Cancel" | `cancel` |
| signed in, not `cli` | "Disconnect" (no confirm step) | `sign-out` |
| signed in, `cli` | none | - |

The lines below the row (`GithubSignInDetails.tsx:54-69`), with the English
texts of `src/locales/en.json:12214-12245`:

| State | What the person sees |
|---|---|
| signed out | "Bots push code and open pull requests as you." With `download`: "Connecting first downloads GitHub's command-line tool (about 15 MB)." After an attempt: "The last code expired before it was approved.", "The last sign-in didn't finish." or "The last sign-in was cancelled." |
| installing | "Getting GitHub sign-in ready…" and a small spinner by the title |
| signing in | The code `WDJB-MJHT` in a large mono font, a copy button "Copy code", the button "Copy code & open GitHub", "Or open github.com/login/device on any device.", a spinner and "Waiting for approval · code expires at {time}". No countdown |
| signed in | A green check, "Connected as @{login}", then "Signed in here", "Using your GitHub CLI" or "Using a token you pasted", then " · Organizations: {orgs}", and "Manage on GitHub" |
| signed in, `cli` | Also "This is your own GitHub CLI sign-in. Sign out of it in your terminal with gh auth logout." |
| invalid | In amber: "GitHub sign-in stopped working. Bots can't push until you connect again." |
| refused (Start gave 409) | "A new GitHub sign-in can't start here." and "Paste a token instead" |
| token form | A field of type `password` with the label "GitHub token" and the placeholder "github_pat_…", a "Connect" button, and the link "Create a fine-grained token on GitHub" |
| token errors | "GitHub didn't accept this token. Check it and paste it again." (400), "GitHub couldn't check the token just now. Try again in a minute." (502), "That didn't work. Try again." (other) |

Details:

- "Copy code & open GitHub" copies the code with its hyphen, then opens the
  page. The desktop app uses `window.ogb.openExternal`. A browser follows the
  link with `target="_blank" rel="noopener noreferrer"`
  (`GithubSignInDetails.tsx:85-92`, `:112`). The copy mark shows for
  1,200 ms (`copy-text.ts:6`).
- The client draws the link only for the exact URL
  `https://github.com/login/device`. For another URL the code still shows,
  with no link (`github-sign-in.ts:22-28`, `GithubSignInDetails.tsx:76`,
  `:110`).
- A screen reader hears "One-time code: W D J B, M J H T"
  (`githubSignIn.codeAria`).
- The token field is emptied before the server answers. The store keeps no
  copy. The client never shows the server's error text
  (`GithubSignInDetails.tsx:150-154`, `github-sign-in.ts:171-172`).
- The client does not check the format of the token.
- The manage link goes to `https://github.com/settings/applications`, or to
  the tokens page for a pasted token (test `GithubAppCard.dom.test.ts:70-104`,
  `:141`).
- A test forbids the words "engine", "instance", "server", "Composio",
  "VPS" and "workspace" in each `githubSignIn.` text
  (`everyday-words.test.ts:30`, `:89-98`, `:118-124`).

### 5.2 The member page of a Team Cloud

A member who cannot save settings gets `MemberApps` with the GitHub row as
the first row of "Yours to connect" (`MemberApps.tsx:27`, `:98-100`). It is
the member's own sign-in. That page has no refresh, so it never sends
`?check=1`.

### 5.3 The client store and its poll

One store serves all cards (`src/lib/github-sign-in.ts`). All state is in
memory in the browser. The server pushes nothing (`:1-3`, `:67-78`).

1. The first card that shows reads the status (`:152-157`).
2. A chain of `setTimeout` reads again: 1,500 ms in `installing`, 3,000 ms
   in `signing-in`, times `2 ** failures` (`:14-19`, `:89-99`). Other states
   have no poll.
3. The poll stops when no card is on screen, when the state is another one,
   or after `expiresAt + 60_000` in `signing-in` (`:92-93`).
4. A failed read keeps the last status for up to 4 failures, then shows
   "Retry" (`POLL_FAILURES_MAX = 5`, `:119-122`). The waits in `signing-in`
   are 3, 6, 12, 24 and 48 s (test `github-sign-in.test.ts:210-221`). A
   first read that fails shows "Retry" at once.
5. A 403 hides the card (`phase: "hidden"`, `:119`, `:139`). So a person with
   no right sees nothing.
6. A read counter drops an answer that is not from the newest read (`:113`,
   `:118`).
7. Only one action runs at a time (`busy`, `:127`). A 409 on Start reads the
   status again and, if it is not signed in, sets `refused` and offers the
   token form (`:140-144`).

Gaps:

- No request has a time limit. `api` sets one only when the caller gives
  `timeoutMs`, and the store never gives it (`src/state/api.ts:46-50`). A
  read that never answers stops the poll, because only an answer starts the
  next timer. An action that never answers keeps `busy`, and all GitHub
  buttons stay disabled until the page loads again.
- `installing` has no limit on the client.
- While the phase is `error`, the row leaves the Connected view and the
  count drops by one (`github-sign-in.ts:196-199`).
- A hidden page holds each poll until the page shows again (`api.ts:32`).
- `refused`, the open token form and the typed draft are lost on a reload.

If the window closes during a sign-in, the server keeps the attempt. The
next page load reads the status and shows the same code if it is still
live. If nobody reads, the server does not end the attempt (section 3.3).

### 5.4 The chat card

`ConnectorCard` draws `GithubChatCard` when `connector.source === "github"`
(`ConnectorCard.tsx:25`). The card (`GithubChatCard.tsx:15-98`):

1. A dismissed or superseded card shows nothing. A `connected` card shows
   one line: "GitHub · Connected", with no request.
2. An open card calls the card status route. A 403 means "the card of
   another person", and the card shows nothing. A network failure counts as
   "mine" (`:43-48`).
3. The card reads the sign-in status again, and does not trust a status that
   another card read before (`:37`). A test shows that a sign-in revoked
   since Apps looked shows "Connect again" (`GithubChatCard.dom.test.ts:101`).
4. It shows the title (the message text), the headline, the same details as
   the Apps row, a footer button ("Connect GitHub", "Connect again", "Cancel"
   or "Retry"), and an X button "Not now" that posts `dismiss`.
5. When the state changes to `signed-in`, the card calls the card status
   route one more time. The server settles the card, and the parked turn
   continues (`:51-59`). The card becomes "GitHub · Connected as @{login}".
6. The chat card has no Disconnect button.

### 5.5 The screenshots

`docs/pr-screenshots/github-sign-in-card/` has 10 images from the preview
page (`src/github-sign-in-preview.tsx`) with data that is not real:

1. The Apps page before the feature.
2. Not connected: the row with "Connect" next to the GitHub app tile.
3. The code, in the dark skin.
4. Connected, with organisations and "Disconnect".
5. The person's own GitHub CLI: no button, the `gh auth logout` line.
6. No longer valid: "Connect again" and the amber line.
7. The token form after a refusal, with the red error.
8. The chat card at phone width, with the code.
9. The member page of a Team Cloud.
10. The code state in German, with a 24-hour time.

## 6. The tests

### 6.1 The server sign-in

`server/github/sign-in.test.ts` (530 lines) uses a fake `GhTools`, a fake
Vault, a temporary data folder and a fixed clock (`:17-127`). It
guarantees:

- The code flow: the code, the constant URL, `expiresAt`, one gh for two
  Starts, the exact login arguments, the private environment with no token
  name, the dead D-Bus address, then `signed-in` with scopes and
  organisations, and `token()` that calls `remember` (`:140-174`).
- An expired code, from gh's exit and from the clock, with `SIGTERM`
  (`:176-189`). Cancel, and a late exit of gh that still signs in
  (`:191-200`). One line of reason for a network failure (`:202-209`).
- The download: `download: true`, `installing` with no child, a failed
  download, and a download that fails its checksum and installs nothing
  (`:211-248`).
- The person's own gh: used when it is 2.102.0 or later, the pinned copy
  when it is older (`:252-264`). Shown as the sign-in, Start refused, sign-out
  refused (`:266-283`). A refused sign-in lets Start go on (`:285-292`).
  Offline, old text and output that cannot be read refuse Start
  (`:294-311`). Never read on a Team Cloud (`:324-332`).
- The own sign-in stays signed in, unchecked, when GitHub cannot be reached
  (`:313-322`).
- A pasted token is kept in the Vault and never in an answer or a log, and
  replaces the own folder. A 403 later gives unchecked, and a 401 at save
  saves nothing (`:342-366`).
- Sign-out deletes the folder and the token and never runs
  `gh auth logout` (`:368-377`).
- Each member of a Team Cloud has their own sign-in, with no fallback.
  `"../owner"` gets 403 (`:379-401`).
- Nothing runs when the object is made: no gh, no download, no request
  (`:403-410`).
- `signedIn` reads the disk only (`:434-470`). Three parallel checks start gh
  one time (`:487-497`).
- Windows: Start is refused while Credential Manager has a gh entry or
  cannot be read (`:502-529`).

`server/routes/github-sign-in.test.ts` (112 lines): who reaches which
audience (`:52-77`), the `client` scope of the five routes (`:79-84`), a
cross-site `POST` gets 403 (`:86-92`), and no answer holds a token, also from
an error whose text holds it (`:94-104`).

### 6.2 GitHub CLI and its fixtures

`server/github/gh-output.test.ts` (100 lines) reads each of the 26 fixtures
(verifier A14):

| Version | Fixtures | What they fix |
|---|---|---|
| 2.40.1 | `version`, `login`, `login-clipboard-flag`, `status-json`, `status-signedout`, `status-invalid`, `status-offline` | No `--clipboard` flag (thus the floor 2.102.0) and no `--json`. Text status. `status-invalid.stdout.txt` and `status-offline.stdout.txt` are the same six lines, so both are unknown |
| 2.102.0 | `version`, `login`, `login-clipboard`, `status-json-signedout`, `status-json-invalid`, `status-invalid` | The floor. JSON status. The text that 2.102.0 prints with no `--clipboard=false` |
| 2.103.3 | `version`, `login`, `login-expired`, `login-network-failure`, `status-signedout`, `status-json-invalid`, `status-json-offline`, `status-invalid`, `status-offline` | The pinned version. gh stops by itself after 899 s (`:82`). Offline JSON recorded with `HTTPS_PROXY` to a closed port (`:46`). `status-offline.stderr.txt` and `status-invalid.stderr.txt` are byte-equal (`:52`) |
| constructed | `hosts.yml`, `status-json-success`, `status-text-success`, `status-text-success-before-2.40` | Success answers, built from gh's format strings |

No fixture has a real token. The login is `octo-fixture`. The addresses are
from the documentation range `192.0.2.0/24`. No fixture is from Windows.

`gh-cli.test.ts` (42 lines) checks the login arguments for each version.
`gh-dbus.test.ts` (55 lines) runs gh against a fake Secret Service.
`personal-hosts.test.ts` (30 lines) checks the order of the config paths.

### 6.3 Git access, the broker and the push guard

- `git-access.test.ts` (131 lines): every remote form goes to the broker,
  and the token is not in the environment, the arguments or the command.
  No name holds `KEY`, `SECRET` or `TOKEN`. No sign-in, no change. The Team
  Cloud rules.
- `git-credential.test.ts` (146 lines): the helper comes after the person's
  settings. The route answers only a live secret. It runs a real
  `git credential fill` and curl, and the person's own working helper wins.
  The test processes set `GIT_CONFIG_NOSYSTEM` and `GIT_CONFIG_GLOBAL`. The
  production code does not.
- `git-repos.test.ts` (71 lines): the remote forms, the folder walk (depth
  2, no symbolic link) and the push scope.
- `git-push-guard.test.ts` (160 lines): command lists that git 2.50.1 sent.
  A new branch passes. The default branch, a delete, a tag move and refs
  outside branches and tags are refused. One refusal refuses all. Side band
  answers.
- `broker-github.test.ts` (316 lines): the four request shapes, the
  credential that the broker adds and the client credentials that it drops,
  streaming, a 401 that reports and a 403 or 404 that does not, the 60 s
  token reuse, the default branch with its 10-minute cache and its failure,
  the push scope, and a compressed push.
- `broker-github.e2e.test.ts` (222 lines): a real `git` against
  `git-http-backend` through the broker. Clone, push of a new branch, refusal
  of the default branch and of a delete, a 3 MiB push, no broker token in
  any git record, tags, the push scope, a helper of another host, and the
  SSH forms.
- `plan.test.ts:280-295`: the own folder is never visible in a box.

The broker tests and the e2e test do not run on Windows: "The broker listens
on a unix socket, which Windows refuses at a file path (EACCES)"
(`broker-github.test.ts:45-46`).

What no test covers: a force-push of a branch that is not the default, a
push to a branch of a person, `pushurl`, push options, and the race of
`dismiss` with the card settle.

### 6.4 The card and the UI

- `github-sign-in-cards.test.ts` (219 lines): the checks of `raise`, the
  cooldown for each person, the settle for the owner of the card only, the
  card kept across a restart (`:138-149`), and no caller (`:204-218`).
- `GithubAppCard.dom.test.ts` (235 lines): each state of the row with its
  texts, the copy of the exact code, no link to a look-alike host, the token
  form that is emptied and never shows the token, `?check=1` on refresh, and
  each key in each of the 17 locale packs with the same placeholders
  (`:219-234`).
- `GithubChatCard.dom.test.ts` (145 lines): the code in the card, the settle,
  "Not now", nothing for another person, a read again before "connected",
  and one request for an open card.
- `github-sign-in.test.ts` (231 lines): the poll waits, the backoff, the stop
  after 5 failures and the 403.
- `skill-fetch.test.ts`: the token only to `api.github.com`, never in a URL,
  and the 120 s limit with a slow lookup (`:119-146`).
- `workspace-backup-policy.test.ts:64-69`: the `github/` folder is never in a
  backup.

## 7. Ours compared

Our Rust code has nothing for this feature yet. `crates/bot-engine/src/lib.rs`
is one line. No crate has a secret type, redaction, a process runner or a
time limit type (verifier D7). GitHub sign-in is in no step: step 16 has only
custom MCP servers and Composio (`docs/plan/README.md:374`). The feature row
puts it in part 20, crate `bot-engine` (`docs/research/reference-features.md:545`).

Our product shape decides which path of the reference applies to us.
Decision D10 gives one person, a desktop app, loopback only, and no Cloud
(`docs/decisions.md:219-229`). We have no bot box. So the path of the
reference that matches our product is "This computer": unboxed bots, the
credential helper, the person's own gh read only, and no push guard. The
broker and the push guard are the Cloud design of the reference. They do not
exist for us unless we build an equal part.

| Reference file | What it does | Our crate and module (proposed) | What we have |
|---|---|---|---|
| `shared/github-sign-in.ts` | Wire status | `bot-protocol`, a `github` module: the status enum with one variant for each state, no token field | Nothing. `EventKind` has two variants (`crates/bot-protocol/src/event.rs:21-28`) |
| `server/github/sign-in.ts` | State machine for one audience | `bot-engine`, `github/sign_in.rs`. It starts `gh`, so it is not in the runtime of `bot-core` (`AGENTS.md`: the runtime does no I/O beyond its store) | Nothing |
| `server/github/gh-cli.ts`, `gh-release.ts` | Find gh, its environment, run it | `bot-engine`, `github/gh.rs`, through the one process runner of step 9 (P61 allow-list, P65 stop limit, P68 Windows) | Nothing. Step 9 plans `tokio::process` and `process-wrap` (`docs/comparison.md:85`) |
| `server/github/gh-output.ts` and the fixtures | Read gh output for each version | `bot-engine`, `github/gh_output.rs`, pure functions with the fixtures as test data | Nothing |
| `server/vault-store.ts` (GitHub field) | Store the pasted token | `bot-core`, the secret store of step 6 (`settings.rs`, `Secret`, P19, P20, P232) | Planned in PR 6.4 and 6.5 (`docs/plan/README.md:298-299`) |
| `server/github/token.ts` | Accessor | A trait in `bot-engine` (`GithubToken`), with the implementation connected in `bot-cli`, the only composition root | Nothing |
| `server/github/git-credential.ts`, `git-env.ts` | Credential for an unboxed bot | `bot-engine`, `github/git_credential.rs`: what a bot process gets. A capability flag of the driver says if it gets it, never a driver name | Nothing |
| `server/bot-box/broker-github.ts`, `git-push-guard.ts` | Broker and push guard | No part today. Proposal P472 in section 8 | Nothing |
| `server/routes/github-sign-in.ts` | HTTP routes | `bot-desktop`: Tauri commands, not HTTP routes (D10) | Nothing |
| `server/host/github-sign-in-cards.ts` | Chat card | `bot-core` card row of step 10 (P135, P262), text from stored data | Nothing |
| `src/components/github/*`, `src/lib/github-sign-in.ts` | Row, card, store | `crates/bot-desktop/ui` (TypeScript) | Nothing |

The rules that the GitHub token must obey are in
[`write-only-secrets.md`](write-only-secrets.md) and
[`security-model.md`](security-model.md). This is how the reference meets
them:

| Rule | Reference | Result |
|---|---|---|
| No route, event or log returns the token | The status has no token field. Routes give a fixed 500 text (`routes/github-sign-in.ts:55-57`) | Kept |
| Never on a command line | gh gets no token in its arguments. The broker token is in a header, never an address | Kept. But the helper secret is in the arguments of curl (`git-env.ts:51`) |
| Give it only to the process that reads it | The unboxed bot's git gets the token itself (section 3.6) | Broken on This computer |
| At rest: mode `0600`, atomic write | Vault: `0o600`, atomic. `hosts.yml`: gh writes it, in a `0o700` folder | Partly. The mode of `hosts.yml` is gh's |
| A failed read is not "empty" | The Vault reads as empty after a failed read, and the next save writes over it (`vault-store.ts:224-232`) | Broken (the same defect as `mcp-oauth.json`, `custom-mcp-servers.md:937-939`) |
| Redact it in errors and logs | GitHub token shapes (`shared/redact.ts:26-27`) and held secrets by value | Kept, with a cap of 500 held values (section 4.4) |
| A sign-in code goes only to the UI of the person | The code is only in the status of the person. The card holds no code | Kept |

## 8. Where we can be better

Each point names the problem of the reference, what goes wrong for the
person or the bot, and a reason. The numbers are the same as in the list of
proposals that goes to the main session.

**P471 (follows the reference). GitHub sign-in gets a step.**

- GitHub sign-in is in no step today. The feature row puts it in part 20,
  crate `bot-engine` (`docs/research/reference-features.md:545`). It can go
  in step 16 or in a new step after it.
- It needs step 6 (the `Secret` type, the store, the atomic write), step 9
  (the process runner with P61, P65 and P68) and step 10 (the card row).
- Follow the reference in: the three sources and their order
  (`sign-in.ts:268-295`), the device code of gh with the exact arguments
  (`gh-cli.ts:72-75`), the private environment of gh (`gh-cli.ts:79-113`),
  the 401-only rule, the fixtures for each gh version, the constant device
  URL, and no `gh auth logout`. The composition is at `server/index.ts:12034`.
- The Team Cloud parts are out of scope by D10.

**P472. The git of a bot reaches GitHub through a local broker and one push
guard, and the token is kept where a bot cannot read it.**

- Problem in the reference: on This computer, no push rule applies to the
  git of a bot (verifier B2). A normal mistake of a bot can force-push to
  the default branch of the person or delete a branch, and only the branch
  protection on GitHub stops it. The credential helper gives the real token
  to the git of the bot (`git-credential.ts:61`). Its secret is in the
  environment of the bot and in the arguments of curl (`git-env.ts:51`), so
  a shell command or a transcript of the bot can show it. The docs page says
  the token "never reaches a bot" (`github-sign-in.mdx:38`).
- Release problem: "A secret or an access right in the wrong place"
  (v0.1.19, v0.1.101, v0.1.181).
- Reason: our product is the "This computer" path (D10), so each of our
  bots gets this path. A local broker on loopback (the `insteadOf` and
  `extraheader` method of `git-env.ts:22-40`) works with no sandbox. The bot
  then holds only a token for one process and one grant. Each push goes
  through one guard, and no secret is in the arguments of a process.
- Limit: the reference chose its path on purpose: "An unboxed bot runs as
  the person and can read what their own gh holds anyway; here it could ask
  the helper's address for the token too" (`git-credential.ts:5-6`). On our
  desktop a bot also runs as the person and can read the data folder
  (`security-model.md:534-536`). So a broker alone does not stop a bot that
  wants the token.
- Conflict for the author: if we follow the reference and run gh with
  `--insecure-storage`, our token is plain text in
  `<data>/github/owner/config/hosts.yml`, and a bot can read that file. To
  keep the token from a bot, the token must be in storage that a bot cannot
  read, such as the keychain of P19. That changes the gh design of P471 (gh
  then cannot keep the token in its own folder). The author chooses between
  the two.
- Changes: a new decision in `docs/decisions.md` ("the git of a bot reaches
  GitHub only through our broker"), and the row "A secret or an access right
  in the wrong place" of the table of problems.

**P473. The push guard refuses a force-push and an update of a branch that
the bot did not make.** Needs P472: with no broker, there is no guard.

- Problem in the reference: the guard does not detect a force-push to a
  branch that is not the default (`git-push-guard.ts:5-7`: "whether one
  descends from the other needs the objects, which the broker does not
  have"), and it has no
  check that the branch belongs to the bot (`:92-97`). A bot can write over
  the work of a person on a feature branch or a release branch. The note of
  v0.1.181 promises "a branch of their own, never the default branch and
  never with a force-push".
- Release problem: "A secret or an access right in the wrong place"
  (v0.1.113, v0.1.178, v0.1.181).
- Reason: the guard sees `<old id> <new id> <ref>`. A branch that the bot
  made through the guard (old id zero) can go in a stored list for the
  conversation. An update of a branch that is not in that list is refused.
  For a fast-forward check, the server can ask GitHub's compare API with the
  token it already holds. That needs a network call for each update. The
  author decides if the list alone is enough.

**P474. The push scope comes from records that the server made, not from files
that the bot can write.** Needs P472.

- Problem in the reference: `mayPush` reads `.git/config` as text in the
  folders of the bot, and each 200 ref list marks a repository as fetched
  (`git-repos.ts:26-37`, `broker-github.ts:190`). A bot can run
  `git ls-remote` on any repository that the token can read, and then push
  to it (verifier B6).
- Release problem: "A secret or an access right in the wrong place"
  (v0.1.128 "gate bypasses closed", v0.1.178).
- Reason: our rule "text that opens a delegated turn is built from stored
  data" has the same idea. The scope must come from a store record: the
  repository that the person named or approved.

**P475. A new token is written before the old sign-in is removed, and a store
that cannot be read is never written over.**

- Problem in the reference: `saveToken` deletes the own folder and then
  writes the Vault (`sign-in.ts:423-424`). If the write throws, the person
  loses the gh sign-in and the new token is not stored (verifier A3). The
  Vault reads a file that it cannot read as empty, and the next save writes a
  file with only the new data (`vault-store.ts:224-232`, `:568-572`). A
  damaged Vault thus loses all other saved logins at the next GitHub save.
- Release problem: "A file written over after a failed read" (v0.1.103,
  v0.1.107, v0.1.151).
- Reason: this extends P232 and P367 to the GitHub token. A `save` takes a
  value that only a good `load` can make (changelog section 7).

**P476. The server stops the login child at its own deadline, and stops the
full process tree.**

- Problem in the reference: no timer of the server stops gh
  (`sign-in.ts:221`). A late gh ends only when a request reads the status.
  The stop is `SIGTERM` with no `SIGKILL` (`:227`, `:405`). A gh that hangs
  before it prints a code runs until something reads the status. A gh that
  outlives a restart can still write `hosts.yml` (`:10-11`).
- Release problem: "A turn or a wait that does not end" (v0.1.15, v0.1.123,
  v0.1.153), and "State lost at a restart or a crash" (v0.1.74, v0.1.165).
- Reason: a wait in our plan is a type with a limit and a reason (changelog
  section 7). A timer at `expiresAt` (or 2 minutes with no code) stops the
  child through the runner of step 9, with a grace period and a kill. A
  child that is tied to our process (`kill_on_drop`, a Job Object on
  Windows) cannot outlive a restart.

**P477. The person's own GitHub CLI is shown, and its token goes to bots only
when the person says so.**

- Problem in the reference: when the server has no sign-in of its own,
  `token()` takes the person's own gh token (`sign-in.ts:466-471`). The
  credential helper then gives it to the git of each unboxed bot. The
  person signed in to gh for their own terminal, not for the bots.
- Release problem: "The person's own engine config reaches the bots"
  (v0.1.104, v0.1.170, v0.1.175).
- Reason: the reference removed the person's own `CLAUDE.md` and
  `AGENTS.md` from bots for the same cause. A switch "Let bots use my GitHub
  CLI sign-in", off at first, keeps the read-only display and asks the
  person once.

**P478. gh starts through the one process runner.**

- Problem in the reference: `gh-cli.ts` calls `execFile` and `spawn`
  directly, not `procs.ts` (`gh-cli.ts:139`, `:167`). It does not use
  `resolveCliSpawn`, so a `gh.cmd` from scoop or a wrapper does not start on
  Windows (`env-path.ts:222-240`). A cancel stops one process, not a tree.
- Release problem: "Process control on Windows" (v0.1.109, v0.1.129 ".cmd
  wrappers", v0.1.140).
- Reason: one runner gives each child the same `.cmd` handling, the same
  tree stop and the same environment allow-list (P61, P65, P68).

**P479. The card settles on the server when the sign-in ends.**

- Problem in the reference: only the `GET status` route settles the card,
  and only a client that shows the card calls it
  (`github-sign-in-cards.ts:126-136`, `GithubChatCard.tsx:43-59`). If the
  person signs in from Apps and does not open the chat, the parked work
  waits with no end. The MCP card has a server hook for this
  (`mcp-sign-in-cards.ts:275-282`).
- Release problem: "A turn or a wait that does not end" (v0.1.153: work
  waiting on you "closes after three, instead of waiting forever").
- Reason: the sign-in module emits one event when a sign-in ends. The card
  module settles each open card of that audience in one transaction. This
  also removes the race of `dismiss` with the settle (verifier C4).

**P480. The token of a bot request has its own type, and redaction knows it
for as long as it is in use.**

- Problem in the reference: the held secrets that redaction masks by value
  keep at most 500 values, shared with the passwords of bot logins. A new
  value removes the oldest (`vault-store.ts:593`, `:635-637`). On a busy
  server, an old GitHub token can drop out of the set, and a log line can
  then hold it if its shape is not one of the patterns.
- Release problem: "A secret or an access right in the wrong place"
  (v0.1.154, streamed text masked only "once the message is saved").
- Reason: our `Secret` type (P20) has no `Debug` output of the value, so
  the value cannot reach a log line through formatting.

**P481. Each client request and each relay has a time limit.** The relay
part needs P472.

- Problem in the reference: no client request of this feature has a limit
  (`src/state/api.ts:46-50`). A request that never answers keeps `busy`, and
  all GitHub buttons stay disabled until the page loads again
  (`github-sign-in.ts:127`). The broker relay to GitHub has no limit
  (`broker-github.ts:183-198`, `:238-243`), so a stuck connection holds the
  git of a bot.
- Release problem: "A turn or a wait that does not end" (v0.1.15, v0.1.132).
- Reason: a Tauri command of ours has a limit, and the broker of P472 has an
  idle limit for each relay.

**P482 (judgment call). Show what a pasted token can do.**

- The reference checks only that `GET /user` answers 200 (`sign-in.ts:418`).
  It does not check the scopes, the repositories or the expiry. A token with
  no write access passes, and the first push fails with no clear reason.
- No release problem of section 5 matches this. It is a judgment call. The
  author can keep the reference.

**P483 (gap, judgment call). Decide if we build the chat card.**

- The reference has the card, its texts and its tests, but no code raises
  it (`sign-in-card.ts:12-14`, `github-sign-in-cards.test.ts:204-218`). The
  note of v0.1.181 says that it exists.
- No release problem of section 5 matches this. It is a gap between the
  note and the code. If we build it, the trigger must be a typed result of
  our broker (no credential, or 401), not a parse of git's error text.

**Follow the reference (no change):**

- Only GitHub's own 401, or an expired or refused token, makes a sign-in
  invalid. Offline, a 403 and output that cannot be read leave it signed in,
  unchecked (`gh-output.ts:93`, `sign-in.ts:181-182`, `:201-203`). This
  answers "Sign-in to an engine, and engine CLIs that change" (v0.1.177,
  v0.1.178: "a brief sign-in hiccup is no longer reported as signed out").
- Keep fixtures for each version of gh that we support, with the floor
  version, the pinned version and an old version (section 6.2).
- Run gh with a private `HOME`, `GH_CONFIG_DIR`, a dead D-Bus address and
  `--insecure-storage`, and never run `gh auth logout`. The conflict in P472
  can change `--insecure-storage` (`gh-cli.ts:5-11`,
  `:79-113`).
- Show the constant device URL, never the URL that gh printed
  (`gh-output.ts:5`).
- Keep the token out of backups (`workspace-backup-policy.ts:51-52`).

### 8.1 The problems of changelog section 5 that the reference has here

| Problem | In this feature | Where |
|---|---|---|
| A secret or an access right in the wrong place | Yes. The token reaches the git of an unboxed bot. The push guard misses force-push and branch owner. The push scope comes from files that the bot can write. 500 held values | 3.6, 3.8, P472, P473, P474, P480 |
| Sign-in to an engine, and engine CLIs that change | Handled well: 401-only rule, three gh versions with fixtures, a floor version. One gap: no fixture from Windows, and no fixture between 2.40.1 and 2.102.0 for the claim that `--json` came in "gh 2.7x" (`gh-output.ts:77`) | 3.2, 6.2 |
| A turn or a wait that does not end | Yes. No server timer for the login child. A gh that hangs before its code has no limit. The card settles only from a client. No client request limit. No relay limit | 3.3, 3.9, 5.3, P476, P479, P481 |
| A file written over after a failed read | Yes. The Vault after a failed read. `clones.json` of the lent clone (`lent-clone.ts:69-70`). An own `hosts.yml` that cannot be read counts as signed out, and a new login writes over it (`sign-in.ts:126-133`) | 4.2, 3.10, P475 |
| State lost at a restart or a crash | Partly. The attempt and the cooldown are in memory. An orphan gh can still sign in. The card and the parked work survive | 4.4, P476 |
| One slow or stuck part blocks the others | Mostly handled. State is per audience, and calls are asynchronous. Parallel status reads share one gh run. Some file calls are synchronous (`readFileSync`, `rmSync`, the Vault write with fsync, `sign-in.ts:128`, `:146`, `:423`). One `busy` flag blocks all actions in the client | 3.2, 5.3 |
| Process control on Windows | Yes. No `.cmd` handling and no tree stop for gh. The Credential Manager rule is handled | 4.3, P478 |
| The person's own engine config reaches the bots | Yes. The person's own gh token goes to unboxed bots. In the box, the read-write HOME with its git config is the bot's. The box masks only the engine folders of `server/engine-homes/layout.ts:58-67`, which have no entry for `.config/gh` or `.git-credentials` | 3.6, 3.7, P477 |

## 9. Not verified

The check of the key findings: four agents tried to disprove 45 claims
against the code. 32 were confirmed, 12 were true with a correction, and 1
was wrong (verifier C6: the skill import is not the only user of the
token). This file uses the corrected forms.

The lead then read four claims again in the code, and all four hold:

- `git-credential.ts:3-6` and `:61`: the route gives the token to git, and
  the comment states the risk.
- `git-push-guard.ts:5-7` and `:92-97`: no force-push check and no owner
  check.
- `sign-in.ts:221-228` and `:423-424`: no timer, `SIGTERM` only, and the
  folder is deleted before the Vault write.
- `git grep raiseGithubSignInCard`: only the definition and the test. The lead also read
`sign-in-masks.ts`, `share-github.ts`, `layout.ts:46-67` and the download
limit in `engine-standalone.ts`.

Not verified:

- The file mode that gh gives to `hosts.yml`.
- Whether a `~/.config/gh/hosts.yml` or a `~/.git-credentials` exists in the
  server HOME of a real Cloud. The code shows only that the box does not mask
  them (`layout.ts:58-67`, `docs/bot-box.md:13`).
- The behaviour of Node `execFile` with a `gh.cmd` path on Windows. It is an
  inference from `env-path.ts:240`. No test runs it.
- The real output of gh on Windows. No fixture is from Windows.
- That git applies `insteadOf` to a `pushurl`. It is git behaviour, not in
  the code or a test.
- That GitHub always sends `symref=HEAD:` on the first line of a v0 ref list.
- Whether the egress gate lets a box reach github.com without the broker
  (`server/bot-box/egress-gate.ts` was not read).
- The race of `dismiss` with the card settle. It follows from the code
  order and `store.ts:1239`. No test shows it, and no code raises a card.
- `server/engine-standalone.ts` outside the ranges in section 2: the unpack,
  `activate`, `prune` and `runCodesign`.
- `tools.install()` waits for the download for at most 20 minutes. The steps
  after the download were not timed.
- The phone app source: how the phone draws a `source: "github"` card.
- `src/components/TemplateCard.tsx:452` ("Connect GitHub in Apps first."):
  whether it uses this sign-in.
- The 16 locale packs other than English. Only two German lines and the test
  at `GithubAppCard.dom.test.ts:219-234` were read.
- The screenshots come from a preview page with data that is not real. They
  do not prove the behaviour of the real server.
- The text of the pull requests #7248, #7265, #7278, #7340 and #7447 on
  GitHub. Only the local commit messages were read.
- Our border files: reader 9 read `write-only-secrets.md` and
  `security-model.md` completely, `connected-apps.md` to line 819, and six
  others (`hosted-app-connections.md`, `custom-mcp-servers.md`,
  `bot-contact-cards.md`, `question-cards.md`,
  `file-modes-atomic-writes-redaction.md`, `engine-process-lifecycle.md`)
  in ranges and by search. A related sentence in those files can be missing
  here.
- `docs/decisions.md` D1 to D6 and D13 to D21, and `docs/comparison.md`,
  were not read line by line.
- No test of the reference was run.
