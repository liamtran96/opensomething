# Plan: Bot box

The proposals from the research file
[`../research/features/bot-box.md`](../research/features/bot-box.md)
(batch 11, reference commit `42f86aefd`). The steps, the pull requests and the
order are in [`README.md`](README.md). The author decides each proposal.
Then it becomes a decision, a pull request or a choice, and its text leaves
this file. A path that starts with `crates/`, `docs/plan/`, `docs/research/`,
`docs/decisions.md` or `docs/comparison.md` is ours. All other paths are in
the reference project.

- **Steps:** step 6 (P580), step 9 (P577, P578, P582) and decision D10
  (P576). P579 goes with the broker. P581 and P583 to P588 wait for a box,
  which has no step: P576 option b adds one after step 16.
- **State:** all open. Decide P576 first. It refines D10, and it tells if
  P581 and P583 to P588 have a step at all.
- **The main finding:** the box is a sandbox for each engine process:
  `bwrap` with its own mounts, a seccomp filter, no network of its own, an
  egress gate for the public internet and a credential broker that keeps
  the keys out of the box. The reference runs the box only on a Linux Cloud
  server, never on the desktop (`server/bot-box/detect.ts:63-73`). On the
  desktop every engine gets the raw keys and the raw MCP headers
  (`server/bot-box/box.ts:194-196`, `server/bot-box/broker-mcp.ts:40`).
  When the box cannot start, turns run without it
  (`server/bot-box/box.ts:329-330`).

## Proposals

- **P576 (decision, refines D10, decide first). What our desktop does about
  the box.** The reference has no box on macOS, on Windows or on a Linux
  desktop (`server/bot-box/detect.ts:66-67`). There every engine gets the
  raw keys and MCP headers (`server/bot-box/box.ts:194-196`,
  `server/bot-box/broker-mcp.ts:40`).
  - Options:
    - a. Follow the reference: no sandbox on the desktop. `bot-engine` has
      one process runner that takes a sandbox request as data. Now it has
      one kind, "no sandbox", so a Linux box can come later with no change
      to the drivers. The desktop gets the allow list of environment
      variables (P61) and an own home for each engine (P103) instead.
    - b. Option a, and a Linux box later, in its own step after step 16.
      The box is off by default on the desktop.
  - Kind: follows the reference. The research recommends a.
- **P577 (plan, step 9, with P61). The needs of a driver for its process are
  a typed capability, and a spawn requires an engine identity.** The
  capability names the sign-in files, the extra read-only and writable
  paths, the relay, and whether the process is shared.
  - **Problem in the reference:** a driver-name string chooses the sign-in
    files of a process. A spawn with no `engine` silently keeps no sign-in,
    so its bot loses its login (`server/bot-box/sign-in-masks.ts:4`, `:37`,
    `server/engine-homes/layout.ts:57-68`). The only guard is a text scan
    of ten driver source files (`server/bot-box/sign-in-masks.test.ts:193-212`).
    The release problem: "A secret or an access right in the wrong place"
    (v0.1.181, "each bot reaches only its own AI account's sign-in").
- **P578 (plan, step 9 and later). A grant ends with its owner.** A process
  grant is a value that revokes itself when it is dropped. So every end path
  revokes it: a failed spawn, an error with no process id, and the exit. A
  conversation grant ends when the turn ends, when the conversation is
  deleted, and when its headers change.
  - **Problem in the reference:** the token stays valid when `spawn` throws
    or reports an error with no process id (`server/procs.ts:441-454`).
    After a header change, the MCP token of the old secret stays valid, and
    each turn extends it (`server/bot-box/broker-mcp.ts:42`, `:57-60`).
    `revokeThread` has one production caller, the settings check
    (`server/bot-box/broker-probe.ts:44`), but `server/bot-box/broker.ts:5`
    says that tokens die when the turn ends. The release problem: "A secret
    or an access right in the wrong place" (v0.1.92, v0.1.101, v0.1.181).
    No release note names these cases.
- **P579 (plan, with the broker). Every connection of a gate or of the
  broker has time limits:** connect, first byte and idle, each a named
  constant, and a DNS look-up with a limit.
  - **Problem in the reference:** the broker has no time limit on the
    upstream (`server/bot-box/broker.ts:196`). The egress gate has none on
    DNS, on the connect or on a tunnel (`server/bot-box/egress-gate.ts:63-69`,
    `:108`). A stuck MCP server holds the turn until the engine stops. The
    release problem: "One slow or stuck part blocks all the others"
    (v0.1.114, v0.1.153, v0.1.177).
- **P580 (plan, step 6, with P480). A header value is a type, and a saved
  key must pass it when it is saved and when it is read.** Then the send
  path cannot fail on a bad byte.
  - **Problem in the reference:** one saved key with a control character
    made the broker throw. The server stopped, and the check at start sent
    the same request again: "a crash loop" (commit `88a285945`,
    `server/bot-box/broker-headers.ts:1-6`). The fix trims the key and
    fails one request (`server/bot-box/broker.ts:173-181`). But a stored
    MCP header that cannot be sent still loads
    (`server/bot-box/broker-headers.test.ts:46-55`). The release problem:
    "One slow or stuck part blocks all the others" (v0.1.184, "One saved
    key with a stray character can no longer take a Cloud down.",
    `announcements/releases.json:27`).
- **P581 (plan, with P576 b). A box that is wanted but off is a typed
  refusal and a visible state.** The runtime refuses a turn when the
  settings ask for a box and the box cannot start, or when a required check
  fails. The window shows the state, its reason and the result of the check.
  - Judgment call: no release of section 5 names this. The reference fails
    open (`server/bot-box/detect.ts:1-4`, `:70-71`,
    `server/bot-box/box.ts:329-330`). The result of the self-check goes
    only to the log (`server/bot-box/boot.ts:41-44`), and the person sees
    nothing. The first release note of the box said that bots "can't see
    ... any keys" (GitHub release v0.1.122, line 22). That was not true for
    sign-ins until v0.1.181.
- **P582 (plan, step 9). Settings checks, model lists and the self-check
  start their process through the same path as a turn.**
  - Judgment call, with release evidence. Many fixes of the box were "it
    works outside the box and fails inside", while Settings said Ready or
    connected:
    - Engines not found in the box, exit 127 (v0.1.126, commit `0011279cb`).
    - An MCP 404 (v0.1.132, commit `1fee5d86b`).
    - The permission socket (v0.1.135, commit `8537559a9`).
    - Uploads (v0.1.141, commit `352313dff`).
    - A shared process (v0.1.147, commit `90102ee90`).
  - This pattern is not a theme of section 5. The author can add it.
- **P583 (later, with the box). The self-check has one total deadline,
  writes each result when it ends, runs the network checks in parallel,
  cleans up with a guard, and runs in CI with every mutation.**
  - Judgment call. The steps run one after the other and can take about
    90 s. The limit is 60 s, and when it ends, all results are lost
    (`server/bot-box/box-probe.ts:161-191`, `server/bot-box/self-check.ts:156`,
    `:171`). An early throw leaves the canary process and its files
    (`server/bot-box/self-check.ts:95-169`). The test leaves out
    `bind-otherws`, its `share-net` row cannot pass, and CI skips it
    (`server/bot-box/self-check.linux.test.ts:35-50`,
    `.github/workflows/ci.yml:211-218`).
- **P584 (later, with the box). One helper process for each box, and a
  bridge that does not come up refuses the turn.**
  - Judgment call. For each box the reference starts three `socat`
    processes and one more for each connection, or one Node process
    (`server/bot-box/bridge.ts:22-30`). When the first bridge does not
    answer, the engine starts anyway (`server/bot-box/bridge.ts:26`). The
    count of helper processes goes to P70.
- **P585 (later, with the box). The egress gate knows which box asks, and
  logs each refusal with the bot.** An optional list of hosts and ports for
  each bot comes later.
  - Judgment call. One socket serves all boxes, and the gate only counts a
    refusal (`server/bot-box/box.ts:287-292`,
    `server/bot-box/egress-gate.ts:59-62`). Any public host on any port
    passes (`server/bot-box/egress-gate.ts:28-34`), so a raw key in a box
    can go to any public host.
- **P586 (later, with the box). A socket is made in a private folder before
  it is bound, not changed with `chmod` after `listen`.** The relay gives a
  secret value to the waiting connection, so another process in the box
  cannot take the callback.
  - Judgment call. For a short time the permission socket has its default
    mode (`server/drivers/claude.ts:441-446`). The fallback in `/tmp` is the
    worst case. Any process in the box can take a relay connection and get
    the OAuth code (`server/bot-box/relay.ts:24-29`, `:46`).
- **P587 (later, with the box). The filter checks the x32 bit, has a table
  for aarch64, and comes from a maintained crate,** with a simulator test
  as `server/bot-box/seccomp.ts:64-74` has. Check the license of the crate
  first (`AGENTS.md`).
  - Judgment call. The filter does not check the x32 bit
    (`server/bot-box/seccomp.ts:33-42`), and it is off on arm64 (`:59-61`).
- **P588 (later, with the box). The plan has `--clearenv` with explicit
  variables, a short list of `/etc` files, and a property test.** The
  property: no path of the data folder is visible unless a line grants it.
  - Judgment call. The reference keeps the environment out of the plan
    (`server/bot-box/box.ts:160-162`, `:183`) and binds all of `/etc`
    (`server/bot-box/plan.ts:234`). It tests the plan with examples
    (`server/bot-box/plan.test.ts:46-66`), and `visibleInBox` is the model
    (`server/bot-box/plan.ts:421-432`).

## New facts for open proposals

- **P61 and P508 (step 9, the allow list of environment variables,
  `changelog.md` section 7).**
  - The reference has an allow list, but only at the box boundary, as the
    "second gate" (`server/bot-box/env.ts:1-3`). On the desktop only the
    strip of each driver applies (`server/drivers/acp/core.ts:332-345`).
  - 35 prefixes let unknown names through, for example `GOOGLE_*` or
    `CLAUDE_*` (`server/bot-box/env.ts:46-51`). The never list had to add
    the CLI session token, which one prefix let through
    (`server/bot-box/env.ts:53-55`).
  - The `OMB_` part costs upkeep: 61 commits in 16 days changed
    `server/bot-box/env.ts` or its test, and 14 of them changed `env.ts`.
    The test keeps about 306 server-only names
    (`server/bot-box/env.test.ts:9-66`). A decision next to each variable
    costs less.
  - `allow` lifts the deny set too (`server/bot-box/env.ts:68`). Codex
    allows all names of the person's MCP servers for the whole engine
    process (`server/drivers/codex-mcp-mount.ts:44-53`). The tool-cache step
    puts back names that the list removed (`server/bot-box/tool-caches.ts:123`).
    `ALL_PROXY` passes, and the box does not overwrite it
    (`server/bot-box/env.ts:10`, `server/bot-box/box.ts:31`).
  - The box compares names with case, and the strip of the drivers compares
    them without case (`server/bot-box/env.ts:67-71`,
    `server/credential-env.ts:49-54`). Proposal: one function for both,
    with case on Linux and macOS and without case on Windows.
- **The row "The person's own engine config reaches the bots" of
  `changelog.md` section 7 (step 9: each driver states the instruction
  files of the person that it blocks, and a test checks the list). It goes
  with P61 and P504.**
  - Four drivers block the files in four ways: a settings field for Claude
    (`server/drivers/claude.ts:1064`), an environment flag for OpenCode
    (`server/drivers/acp/opencode-go.ts:715-718`), a home swap for Codex
    (`server/drivers/codex-shared-home.ts:24`) and a folder swap for Pi
    (`server/drivers/pi-agent-dir.ts:1-6`). No shared test checks them.
  - Codex keeps the person's own home in five cases: a Team Cloud, a home
    in the data folder, no `auth.json`, a login in the keyring, or a failed
    link (`server/drivers/codex-shared-home.ts:144-154`).
  - The path `~/.claude/rules/**` stayed open for six weeks after v0.1.104,
    until v0.1.177 (commit `73f90abe8`).
  - The OpenCode leak came from an engine update: OpenCode 2.3.1 started to
    read `CLAUDE.md` again (commit `c29e9bf51`, v0.1.170).
  - One escape switch stays: `OMB_CLAUDE_INHERIT_USER_CONFIG`
    (`server/drivers/claude.ts:138-142`). The reference removed the Codex
    switch because "hidden env flags count as settings" (commit `17a3f5af3`).
  - The box masks sign-in files, not instruction files. The person's
    `~/.codex/config.toml` stays read-write in the box of a Codex bot
    (`server/engine-homes/layout.ts:57-68`,
    `server/bot-box/sign-in-masks.test.ts:87`).
- **P103 and P504 (step 9, the engine home).**
  - On a My Cloud every box had the HOME of the server. So from v0.1.122 to
    v0.1.180 every bot could read the sign-in of every engine (commit
    `b5a333128`, v0.1.181). The fix masks files
    (`server/bot-box/sign-in-masks.ts:29-70`), and the masks are fixed when
    a box starts (`docs/bot-box.md:188-190`).
  - The writable HOME caused the reverse problem: a bot writes HOME and the
    server reads it. v0.1.152 fixed it in three places
    (`server/bot-box/program-trust.ts`, `server/engine-install.ts:144-162`,
    `server/lent-clone.ts:30`). An own home for each engine from the start
    prevents both problems.
  - On a Team Cloud the "shared sign-in" list also has `config.toml`,
    `settings.json` and a `.env`, bound read-write into each audience home
    (`server/engine-homes/layout.ts:59-66`,
    `server/engine-homes/box.linux.test.ts:62-66`). P504 must list only
    credential files.
- **P70 (steps 9 and 11, one gate for memory and processes,
  `changelog.md` section 7).**
  - The box sets no limit (`server/bot-box/plan.ts:379-388`). The reference
    probes the kernel limits for each bot and does not use them
    (`server/bot-memory-cap.ts:9-11`, `:85-96`).
  - The reference has ten separate limits (research section 3.13), four
    estimates of one engine that do not agree, and four readers of the
    memory facts.
  - The box adds helper processes for each spawn
    (`server/bot-box/bridge.ts:22-30`), and the idle policy does not count
    them (`server/drivers/session-idle.ts:110-120`).
  - Proposal: one read of the limits (CPU count, memory limit, process
    limit), given to every gate and to the report. This removes the drift.
- **P41 and P68 (step 9, Windows).** The box does nothing on Windows or
  macOS (`server/bot-box/detect.ts:67`), and its tests skip there. No
  Windows problem of section 5 changes.
- **P95 (the threat model before step 9).** The layer table of the
  reference (`docs/bot-box.md:235-244`) is a good form: each layer, what it
  stops and what it does not stop.
- **P472 to P474 (step 16, the git broker).** The GitHub grant is in the
  same process token as the provider keys (`server/bot-box/box.ts:206`).
  Git uses the header form of the broker, so the token is not in the files
  of git (`server/github/git-env.ts:28-40`).
