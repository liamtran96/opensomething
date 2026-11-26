# Plan: The security model

The proposals from the research file
[`../research/features/security-model.md`](../research/features/security-model.md)
(batch 4, reference commit `ed8cb7278`). The steps, the pull requests and the
order are in [`README.md`](README.md). The author decides each proposal.
Then it becomes a decision, a pull request or a choice, and its text leaves
this file.

- **Steps:** 6, before 9, 10, 12.
- **State:** all open. Decide P95 before step 9.
- **The main finding:** the reference trusts a loopback caller as the owner
  on a server with no hosted setup. A bot shell is a loopback caller. At
  Full access, the engines run in their own no-ask mode, and no safety
  floor sees their commands (`server/request-auth.ts:33-39`, `:110`,
  `server/safety-floor-gate.ts:3-4`).

## Proposals

- **P95 (before step 9). What `docs/threat-model.md` must cover.**
  1. The bot shell runs as the same user as the app. It can read the data
     folder, the settings and each key file in it.
  2. Each process of the same user can send requests on the permission
     channel (P96).
  3. At Full, the engines run in their own no-ask mode, and no floor sees
     their commands (P97).
  4. Each turn needs an explicit folder. The driver never uses the home
     folder of the person as the default. The client file system and the
     terminal of ACP stay off. When the file system is on, writes stay in
     the folder of the turn.
  5. The four items of the process research (in
     [`engine-process-lifecycle.md`](engine-process-lifecycle.md)).
  - Kind: a known problem of the reference.
  - Source: `server/vault-store.ts:206-217`, `SECURITY.md:32-34`,
    `server/drivers/claude.ts:519-563`, `:1297`,
    `server/safety-floor-gate.ts:3-39`, `server/drivers/acp/core.ts:880`,
    `:1084`, `server/drivers/acp/client-path.ts:9-36`.
  - Changes: the note under part 2 of [`README.md`](README.md).
- **P96 (step 10). A permission channel that checks the caller.** A request
  reaches the core only on a channel that proves the turn. Option a: the
  stdio pipe of the child. Option b: a token for each turn on a local
  socket. A request with no proof is refused.
  - Kind: better than the reference.
  - **Problem in the reference:** The permission socket does not check who
    connects. A process of the same user, also a command in the bot box, can
    send asks that show as cards. On Windows the socket is a named pipe in
    the global namespace with no access list
    (`server/drivers/claude.ts:425-489`, `:1267`;
    `server/procs.ts:740-742`). The release problem: "A secret or an access
    right in the wrong place" (v0.1.113, v0.1.130) and "Busy" and races
    between bots (v0.1.76).
  - Why: the socket of the reference has mode 0600 but no caller check. On
    Windows it is a named pipe in the global namespace with no access list.
  - Source: `server/drivers/claude.ts:519-577`, `:1297`, `server/procs.ts:729-735`.
- **P97 (step 10). A safety floor that a no-ask mode cannot skip.** Option
  a: run each engine with its asks on, and send each request to our verdict
  function (P112). Option b: keep the no-ask modes, and the threat model
  states that Full has no floor. Keep the rule of the reference: a command
  that the floor cannot read is never "clear".
  - Kind: a is better than the reference. b follows it.
  - **Problem in the reference:** At Full, Claude Code and Codex run in
    their own no-ask modes. So the floor never sees a command, and a command
    on its list, for example a recursive delete of the home folder, runs
    with no check (`server/safety-floor-gate.ts:3-4`;
    `server/full-access-default.e2e.test.ts:74-76`). The release problem:
    "The approval model changed" (v0.1.78, v0.1.109).
  - Source: `server/safety-floor-gate.ts:3-39`,
    `server/full-access-default.e2e.test.ts:73-78`, `server/safety-floor.ts:3`,
    `:699`.
  - Related: P49.
- **P98 (step 12). A capability for each turn, bound to its thread and its
  turn.** The identity comes from the record in the core, never from the
  caller. The mint takes a guard of an active turn, so the compiler refuses
  a mint outside a turn. The core checks the turn again before each side
  effect, and revokes the capabilities at the turn end.
  - Kind: follows the reference, with the guard type added.
  - Source: `server/index.ts:1573`, `:1667-1670`, `:1695-1784`,
    `:12757-12795`.
- **P99 (all steps). A rule in D10: a loopback address alone gives a bot
  nothing.** A request from a bot shell carries the capability of its turn.
  - Kind: better than the reference, which names this as an open risk. While
    the shared Full policy is on, any loopback caller can open a Full thread.
  - **Problem in the reference:** A bot's shell is a loopback caller. So a
    bot can post into the thread of any bot, also a Full-access thread.
    While the shared Full policy is on, it can also open a new Full thread
    (`server/request-auth.ts:38-41`; `server/routes/tasks.ts:204-207`). The
    release problem: "A secret or an access right in the wrong place"
    (v0.1.113, v0.1.141).
  - Source: `server/request-auth.ts:33-58`, `server/routes/tasks.ts:204-207`,
    `server/routes/bot-messages.ts:315-338`.
  - Changes: D10, "Rules that apply to code from step 2 on".
- **P100 (step 6). One function says if the keychain of the system is safe.**
  On Linux, a store with a fixed key is not safe. The core then refuses to
  save the key and says why.
  - Kind: better than the reference, where one store of three does not
    refuse the Linux `basic_text` back end.
  - **Problem in the reference:** On a Linux desktop with no secret store,
    the main credential store saves the provider keys with only Electron's
    fixed-key obfuscation, and it does not tell the person. The two other
    stores refuse that back end (`electron/main.mjs:390-394`, against
    `:797`, `:882-883`). The release problem: "A secret or an access right
    in the wrong place" (v0.1.27, v0.1.152).
  - Source: `electron/main.mjs:390`, `:797`, `:881-886`,
    `docs/cli-onboarding.md:82`.
  - Changes: the choice "Where the API key lives" of step 6.
- **P101 (no step). Record what we do not port:** the loopback gate and the
  trust modes, the service routes, sessions and pairing, the tailnet
  listener, and hosted sign-in. When a server comes into the plan, read
  sections 3.1 to 3.7 of the research file first.
  - Changes: a note in D10.

## New facts for proposals that exist

- **P19 and P22** also apply to each later secret store. The Vault of the
  reference keeps its key as a plain file beside it. An unreadable Vault
  reads as empty, and the next save replaces it (`server/vault-store.ts:206-233`,
  `:255-266`). A key from a paired phone now goes into `config.json` as
  plain text (`server/routes/config.ts:574-575`).
- **P61:** three more places copy the environment and remove only some
  names (`server/drivers/claude.ts:119`, `server/drivers/chat-mcp-tools.ts:143-144`,
  `server/engine-standalone.ts:624`, `server/credential-env.ts:57-60`). The default level and what Full
  never does are in P120.
