# Plan: GitHub sign-in

The proposals from the research file
[`../research/features/github-sign-in.md`](../research/features/github-sign-in.md)
(batch 9, reference commit `140172d88`). The steps, the pull requests and the
order are in [`README.md`](README.md). The author decides each proposal.
Then it becomes a decision, a pull request or a choice, and its text leaves
this file. A path that starts with `crates/`, `docs/plan/`, `docs/research/`,
`docs/decisions.md` or `docs/comparison.md` is ours. All other paths are in
the reference project.

- **Steps:** 6, 9, 10 and 16.
- **State:** all open.
- **The main finding:** the server signs in to GitHub one time, with the
  device code of GitHub CLI or a pasted token, and keeps the token. The git
  of a bot gets the token in two ways. On This computer, a credential helper
  asks a loopback route, and that route gives the token to the bot's git.
  In the bot box, a broker relays git to GitHub and checks each push. The
  push guard refuses a push to the default branch, a delete and a moved
  tag. It does not find a force-push to another branch, and it does not
  check who made a branch (`server/github/git-credential.ts:1-6`, `:61`;
  `server/bot-box/git-push-guard.ts:5-7`, `:92-97`).

## Proposals

- **P471 (plan, step 16, `bot-engine`). GitHub sign-in is a part of step
  16.** It needs step 6 (`Secret`, the store), step 9 (the process runner,
  P61, P65, P68) and step 10 (the card row). The Team Cloud parts are out of
  scope (D10).
  - Why: follows the reference in the three sources and their order
    (`server/github/sign-in.ts:268-295`), the arguments of `gh auth login`
    and the private environment of gh (`server/github/gh-cli.ts:72-113`),
    the rule that only a 401 means "signed out"
    (`server/github/gh-output.ts:93`) with fixtures for each gh version, the
    constant device URL (`gh-output.ts:5`), and no `gh auth logout`.
  - Source: `server/index.ts:12034` (the composition).
- **P472 (decision, step 16, `bot-engine`). The git of a bot reaches GitHub
  only through a local broker with one push guard, and the token is where a
  bot cannot read it.**
  - **Problem in the reference:** on This computer no push rule applies, so
    a mistake of a bot can force-push or delete the default branch of the
    person. The helper secret is in the environment of the bot and in the
    arguments of `curl` (`server/github/git-env.ts:51`), so a shell or a
    transcript can show it. The route gives the token to the git of the bot
    (`git-credential.ts:61`), but the docs page says that the token "never
    reaches a bot" (`apps/docs/content/docs/connected-apps/github-sign-in.mdx:38`).
    The release problem: "A secret or an access right in the wrong place"
    (v0.1.19, v0.1.101, v0.1.181).
  - **The author chooses here.** A broker alone does not stop a bot that
    wants the token: the bot runs as the person and can read the data
    folder. The gh design of P471 keeps the token as plain text in
    `<data>/github/owner/config/hosts.yml`. To keep the token from a bot, it
    goes in the keychain (P19), and that is a difference from the
    `--insecure-storage` of the reference.
  - Source: `server/github/git-env.ts:49-52`; `git-credential.ts:58-61`;
    `server/bot-box/broker-github.ts:201-243`.
- **P473 (plan, step 16, needs P472). The guard refuses a force-push and
  each update of a branch that the bot did not make.**
  - **Problem in the reference:** a bot can write over a feature or release
    branch of a person (`git-push-guard.ts:5-7`, `:92-97`). The note of
    v0.1.181 says "never with a force-push". The release problem: "A secret
    or an access right in the wrong place" (v0.1.113, v0.1.178, v0.1.181).
  - Source: `git-push-guard.ts:92-97`; `broker-github.e2e.test.ts:182`
    (the only `--force` in the tests moves a tag).
- **P474 (plan, step 16, needs P472). The push scope comes from records
  that the server made, not from files that a bot can write.**
  - **Problem in the reference:** one `git ls-remote`, or a `.git/config`
    that the bot writes, permits a push to each repository that the token
    can read (`server/github/git-repos.ts:26-37`;
    `server/bot-box/broker-github.ts:190`). The release problem: "A secret
    or an access right in the wrong place" (v0.1.128, v0.1.178).
- **P475 (plan, step 6, extends P232 and P367). Write the new token before
  the old sign-in is removed, and never write a store that could not be
  read.**
  - **Problem in the reference:** a pasted token deletes the gh folder
    before the Vault write (`sign-in.ts:423-424`), so a failed write loses
    both. A Vault that cannot be read is empty, and the next GitHub save
    writes over all other saved logins (`server/vault-store.ts:224-232`,
    `:568-572`). The release problem: "A file written over after a failed
    read" (v0.1.103, v0.1.107, v0.1.151).
- **P476 (plan, step 16, with P65). The server stops the gh login at its own
  deadline and stops the process tree.**
  - **Problem in the reference:** the short gh calls have a limit and
    `SIGKILL` (`gh-cli.ts:138-139`), but the login process has none
    (`gh-cli.ts:166-167`). A late login ends only when a request reads the
    status, with `SIGTERM` only (`sign-in.ts:220-228`). A gh that lives
    after a restart can still sign in (`sign-in.ts:10-11`). The release
    problems: "A turn or a wait that does not end" (v0.1.15, v0.1.123,
    v0.1.153), and "State lost at a restart" (v0.1.74, v0.1.165).
- **P477 (plan, step 16). The person's own gh sign-in goes to the bots only
  after the person turns on a switch, which is off at first.**
  - **Problem in the reference:** with no sign-in of its own, the server
    takes the token of the person's own gh (`sign-in.ts:466-471`) and gives
    it to the git of each bot. The release problem: "The person's own engine
    config reaches the bots" (v0.1.104, v0.1.170, v0.1.175).
- **P478 (plan, step 9, with P61 and P68). gh starts through our one process
  runner.**
  - **Problem in the reference:** `gh-cli.ts:139` and `:167` do not use
    `resolveCliSpawn`, so a `gh.cmd` does not start on Windows
    (`server/env-path.ts:222-240`), and a cancel does not stop a process
    tree. The release problem: "Process control on Windows" (v0.1.109,
    v0.1.129, v0.1.140).
- **P479 (plan, step 10, extends P262). The card settles on the server when
  the sign-in ends.**
  - **Problem in the reference:** only a client that reads the card status
    settles it (`server/host/github-sign-in-cards.ts:126-136`). If the
    person signs in from Apps and does not open the chat, the parked work
    waits with no end. The MCP card has a server hook for this
    (`server/host/mcp-sign-in-cards.ts:275-282`). The release problem: "A
    turn or a wait that does not end" (v0.1.153).
- **P480 (plan, step 6, with P20). The token has the `Secret` type, so
  redaction does not depend on a list with a limit.**
  - **Problem in the reference:** redaction keeps at most 500 values,
    shared with the login passwords of bots, and drops the oldest
    (`server/vault-store.ts:593`, `:635-637`). The release problem: "A
    secret or an access right in the wrong place" (v0.1.154).
- **P481 (plan, step 16). Each client request and each broker relay has a
  time limit.** The relay part needs P472.
  - **Problem in the reference:** a request that does not answer keeps all
    GitHub buttons disabled (`src/state/api.ts:46-50`;
    `src/lib/github-sign-in.ts:127`). The relay to GitHub has no limit
    (`broker-github.ts:183-198`, `:238-243`). The release problem: "A turn
    or a wait that does not end" (v0.1.15, v0.1.132).
- **P482 (plan, step 16). Show what a pasted token can do: its scopes, its
  repositories and its expiry.** A judgment call: no release problem. The
  reference checks only that `GET /user` gives 200 (`sign-in.ts:418`).
- **P483 (choice, step 16). Do we build the GitHub chat card?** A judgment
  call: no release problem. The reference has the card, but no code raises
  it (`server/github/sign-in-card.ts:12-14`;
  `server/host/github-sign-in-cards.test.ts:204-218`). If we build it, a
  typed result of our broker raises it, not a parse of the error text of
  git.

## Other notes

- `../research/features/acp-adapter.md:340-342` is wrong: the environment of
  an unboxed bot has a secret for a loopback helper, not the GitHub token.
  The research file of this feature has the correction (section 3.6).
