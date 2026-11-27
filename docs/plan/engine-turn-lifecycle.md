# Plan: Engine turn lifecycle

The proposals from the research file
[`../research/features/engine-turn-lifecycle.md`](../research/features/engine-turn-lifecycle.md)
(batch 11, reference commit `42f86aefd`, tag v0.1.184). The steps, the pull
requests and the order are in [`README.md`](README.md). The author decides
each proposal. Then it becomes a decision, a pull request or a choice, and its
text leaves this file. A path that starts with `crates/`, `docs/plan/`,
`docs/research/`, `docs/decisions.md` or `docs/comparison.md` is ours. All
other paths are in the reference project.

- **Steps:** 5 (the chat driver), 9 (the ACP core and the warm engines), 12
  (our MCP tools) and 13. The proposals for a Claude or Codex adapter are
  "later", because the plan has no step for those adapters. P589 and P590
  change D20, and P591 changes D22.
- **State:** all open. Decide P589 and P590 first: they change
  `bot-protocol` before step 5.
- **The main finding:** a steer is a message from the person that goes into
  the turn that runs. Each engine takes it in at a different point, and the
  server guesses that point. The v0.1.182 fix stopped a double send, but the
  guess stays (`server/host/person-first.ts:163-167`). A second gap: a Claude
  turn that streamed only reasoning can still be sent again. Only
  `text_delta` sets `sawStreamDelta` (`server/drivers/claude.ts:1391-1392`),
  and only a whole assistant frame sets `answered` (`:1424`).

## Proposals

- **P589 (decision, step 5, changes D20, new facts for P64). A read signal for a steer.**
  `Driver::steer` takes a `SteerId` that the runtime makes (D17). A new event
  `steer.read { steer_id }`, or a field of an existing event, says that a
  model call took the steer in. A capability `steer_read_signal` says if the
  driver sends that event. The chat driver of step 5 knows the exact point:
  the top of a round (`server/drivers/openai-chat.ts:623-629`). The runtime
  puts a stopped steer back in the queue only when the driver has the signal
  and the event did not come. With no signal, it never puts the steer back
  (the v0.1.182 rule).
  - **Problem in the reference:** a steered message ran two times. The
    server guessed when the engine read the message, and it put words back
    in the queue that the engine already had (v0.1.182, "a steered message
    is no longer sent twice", `server/host/person-first.ts:165-167`, commit
    `1128b084f`, merged as `a28d29d3d`). The guess stays: the server marks a
    steer "read" when any tool call completes. The Claude driver gets the
    exact signal from the CLI echo (`--replay-user-messages`, CLI 2.1.282,
    `server/drivers/claude-cli-version.ts:26-29`), but it only deletes a
    uuid (`server/drivers/claude.ts:1451-1455`). The release problem: "The
    same work done or delivered two times, or lost" (v0.1.150, v0.1.182).
  - The test of the reference fix: `server/host/person-first.test.ts:81`.
- **P590 (decision, step 5, changes D20, new facts for P34 and P64).
  Unread steers come back at the
  end of the turn.** `turn.completed` carries the ids of the steers that the
  driver did not add to the model input. The runtime puts them back at the
  front of the queue, in the same transaction as the end of the turn
  (`AGENTS.md`). This also gives one answer for a late `steered` on the two
  paths. The reference answers 409 and stores nothing on the arrival path
  (`server/index.ts:7186-7191`). It puts the words back in the queue on the
  queue steer route (`server/routes/bot-messages.ts:431-434`, `:466-468`).
  - **Problem in the reference:** after the v0.1.182 fix, a steered message
    can be lost. The first tool result of a batch marks it read
    (`server/host/person-first.ts:163-167`). The chat driver reads it only
    after the whole batch (`server/drivers/openai-chat.ts:623-629`, tool
    loop `:798-880`). A stop on the second call drops the steer, and the
    person gets only a notice (`:899`). Inferred, not tested. A steer that
    comes between `abort()` and `finally` is also never read (`:887`,
    `:966`). The release problem: "The same work done or delivered two
    times, or lost" (v0.1.182).
- **P591 (plan, step 5, `bot-engine::chat`, brings the `Capabilities`
  struct of D22 and P57). The chat driver takes a steer between rounds.**
  Follows the reference.
  - `steer` parks the text in `asides` and returns `Steered`. It returns
    `Refused` when no turn runs or `ending` is set
    (`server/drivers/openai-chat.ts:202-205`, `:964-969`).
  - At the top of each round, the driver adds all parked steers as one user
    message, joined with a blank line. It never adds them inside a tool
    batch (`:622-629`).
  - When the model gives its final answer while steers wait, the driver
    keeps the answer and runs one more round (`:778-781`, commit
    `86f082c93`, test `server/drivers/openai-chat.test.ts:584`).
  - This works with no tools: the end of each completion is a round
    boundary.
  - `queueing` is then the first flag that a step reads
    (`server/index.ts:7166`, `server/drivers/openai-chat.ts:952`). D22 says
    that the `Capabilities` struct comes with that step.
- **P592 (choice, step 5, `bot-engine::chat`). A round budget for
  steers.** Keep a budget of rounds. At the last round of the budget, set
  `ending`, as commit `dad54b565` did. Then a late steer is refused and goes
  to the queue.
  - **Problem in the reference:** commit `d6788b49c` ("Remove the 64-step
    cap from chat-engine turns") removed the round cap. Repeated steers can
    make one turn longer, up to 200 tool calls
    (`server/drivers/openai-chat.ts:145`, `:791`). Inferred, not tested.
  - Judgment call: no release names this.
  - Options:
    - a. Follow the reference: no round cap, only the cap of 200 tool
      calls.
    - b. A round budget that sets `ending` at its last round.
- **P593 (decision, steps 5 and 9, `bot-core` and `bot-engine`, new facts
  for P250 and P461). The
  runtime decides the rebuild, and native replay is a capability flag.**
  The decision itself follows the reference:
  - The runtime sends `session_reset`, `resume_cursor` (only on a resume),
    `recovery_text` (only with a cursor) and `transcript`
    (`server/resume-plan.ts:18-37`, `server/turn-context.ts:61-81`,
    `server/index.ts:7735-7746`, `:8315-8317`).
  - It builds the recovery text from stored rows. Tool lines go only to the
    inline rebuild, never to `transcript`
    (`server/context-rebuild.ts:184-190`, `server/index.ts:7697`,
    `:7720-7740`).
  - `rewound` clears only after a dispatch that worked
    (`server/index.ts:8352`).
  - The chat driver keeps no session and builds each request from
    `transcript` (`server/drivers/openai-chat.ts:479-509`, `:608`).
  - Rule conflict: the reference keys native replay on the driver kind
    (`server/runtime/capabilities.ts:12-53`). `AGENTS.md` says that engine
    behaviour is gated by capability flags, never by a driver's name. We
    make it a capability flag.
  - Judgment call: no release problem. This is our rule.
- **P594 (plan, step 9, `bot-core`). One notice for each rebuilt session,
  on every driver.** The runtime shows one notice when `session.started`
  has `rebuilt`. Then no driver can forget it.
  - **Problem in the reference:** the ACP core sets `rebuilt: true` and
    shows no notice (`server/drivers/acp/core.ts:1195`). Only `claude.ts`
    and `codex.ts` import `rebuiltSessionNotice`. They tell the person that
    earlier tool results did not carry over
    (`server/drivers/claude.ts:1376-1377`,
    `server/drivers/codex.ts:1330-1331`, text at
    `server/resume-recovery.ts:44-46`). After an ACP rebuild, the person is
    not told.
  - Judgment call: no release names this.
- **P595 (plan, step 9, `bot-engine::acp`). One `SteerStrategy` enum.**
  Follows the reference.
  - The variants are `None`, `Command { name }`, `Request { method }` and
    `Prompt { enabled, folded }` (`server/drivers/acp/steer.ts:1-190`).
  - A request has 15 s (`server/drivers/acp/core.ts:280`). A prompt uses
    the idle limit of the turn (`:1028-1034`).
  - Command and request send one steer at a time
    (`server/drivers/acp/steer.ts:66-68`, `:101-134`).
  - The turn waits for its steer prompts before it ends. A failed steer
    prompt fails the turn (`server/drivers/acp/core.ts:1298-1306`).
  - A folded reply does not decide the stop reason
    (`server/drivers/acp/steer.ts:166-169`,
    `server/drivers/acp/core.ts:1313-1324`).
- **P596 (plan, step 9, `bot-engine`). Warm engines are capability flags,
  and the pool key holds the MCP list.** Follows the reference in its
  behaviour.
  - The flags: `warm_process` and `restart_on_mcp_change` now. Later
    `fork_session`, `prestart` and `defers_tools`. The reference asks only
    if `adapter.cacheKeepWarm` and `.compact` exist (`server/index.ts:5161`,
    `server/host/warm-summary-host.ts:178`).
  - The chat driver of step 5 sets none of them: "A metered API key's main
    cache lives five minutes by default" (`server/cache-keepwarm.ts:6-7`).
  - The ACP pool uses a process again only on an equal key of MCP servers,
    tool scope and system hash (`server/drivers/acp/core.ts:945-954`). The
    key holds the bearer tokens, so a stable bearer (P599) keeps the process
    warm.
  - A changed key closes the old process first. The log gives only the
    names of the changed fields
    (`server/drivers/claude-spawn-contract.ts:4-35`,
    `server/drivers/codex-warm.ts:215-235`).
  - A kept process is never given to another conversation
    (`server/drivers/codex-warm.ts:266`).
- **P597 (plan, step 9, `bot-engine::acp`). The MCP transport and the byte
  budget come from capability flags and the `initialize` answer, not from
  an agent name.** The behaviour follows the reference.
  - The reference picks the byte budget by the agent name in `initialize`
    (`server/drivers/own-mcp-session-budget.test.ts:174-180`).
  - It picks the schema profile of the built-in servers by driver kind
    (`server/drivers/turn-mcp.ts:119`).
  - The URL or stdio choice for our own servers already uses driver flags
    and the `initialize` answer (`server/drivers/own-mcp-http.ts:66-88`,
    `server/drivers/acp/core.ts:1133`, `:1176`). We make all of it flags of
    the adapter.
  - Rule conflict: `AGENTS.md` says that engine behaviour is gated by
    capability flags, never by a driver's name.
  - Judgment call: no release problem. This is our rule.
- **P598 (plan, steps 9 and 12, `bot-engine`). A notice when the tools are
  over the byte budget.** Send a notice to the person and to the bot. The
  notice names the servers that were cut.
  - **Problem in the reference:** over the budget, the reference writes
    only a log line. Then the CLI drops the largest tools, and nobody is
    told (`server/drivers/session-tool-budget.ts:90-92`). A server that is
    not relayed is not fitted (`:93`). The first session guesses the list
    of a relayed server (`:3-5`, `:79-84`). The release problem: "The size
    of the tool list of one turn" (v0.1.120, "41 of its 49 tools were being
    skipped", v0.1.182 commit `09a4d73cb`, v0.1.184 commit `b2e662007`).
- **P599 (plan, steps 12 and 13, `bot-core`). One bearer for each thread,
  one record for each turn.** Follows the reference. This is how a warm ACP
  session keeps its MCP servers across turns.
  - The bearer stays the same while the bot, the thread, the grants and the
    approval stay the same (`server/index.ts:1655-1660`, `:1673`).
  - The server accepts the bearer only while a turn of the thread runs. It
    reads the facts of the turn from the record on each call (`:1651-1653`,
    `:1669-1672`).
  - A new turn, the end of a turn, the end of a thread and shutdown revoke
    the record (`:1644-1649`, `:1719-1722`, `:1724-1732`, `:1740-1745`). An
    orphan record expires after 30 days (`:1610`).
  - A computer gets a new bearer each turn (`:1672-1673`).
  - A revoked bearer gets 401, and the proxy makes it a tool error
    (`server/harness-mcp-proxy.test.ts:73-112`).
  - The document of the reference:
    `docs/verification/claude-tool-lifecycle.md:49-65`.
- **P600 (plan, step 12, `bot-engine::chat`, with P33). The chat driver
  mounts its MCP servers for each turn.** Follows the reference, and keeps
  the v0.1.153 fix ("A turn carries on when one optional MCP server dies",
  commit `84450939f`).
  - The driver mounts the servers at the start of the turn and closes them
    in its `finally` (`server/drivers/openai-chat.ts:613`, `:891`).
  - Only our `agents` server (and a Local VM) is required. When another
    server fails, the driver leaves it out and tells the model
    (`server/drivers/chat-mcp-tools.ts:561-566`).
  - The start limits: 8 s, 30 s on a Cloud, and 20 s for a built-in server
    on Windows or for `agents`. At most 32 servers (`:77-99`, `:593`).
  - The close limit: 5 s, or 15 s on Windows (`:211-221`). A close that the
    driver cannot confirm fails the turn
    (`server/drivers/openai-chat.ts:892-897`).
- **P601 (plan, later, the Claude adapter). A CLI version is `Known` or
  `Unknown`.** Pass a flag only on a `Known` version at or above its floor.
  Give a typed refusal when isolation needs a version that is `Unknown` or
  too old, with the text of the update card
  (`server/drivers/claude-cli-version.ts:40-58`).
  - **Problem in the reference:** an unknown Claude CLI version counts as a
    version that supports every flag
    (`server/drivers/claude-cli-version.ts:36-38`). So an old CLI can get a
    flag that it does not know: "an unknown flag is a hard argument error"
    (`:5`). Or a CLI below 1.0.122 runs with no `--setting-sources`, and
    "bots still see this machine's own Claude Code setup" (`:48`). The
    reference refuses only a tool scope on an unknown version
    (`server/drivers/claude.ts:919-921`). The release problems: "Sign-in to
    an engine, and engine CLIs that change" (v0.1.101, v0.1.177, v0.1.178)
    and "The person's own engine config reaches the bots" (v0.1.104).
  - The ACP core probes the version of a CLI
    (`server/drivers/acp/core.ts:104`). Nobody read if it gates flags on a
    version floor, so this proposal stays "later".
- **P602 (plan, later, the Claude adapter). A turn is accepted at any
  model activity.** The state of the turn is `Launched`, `Accepted` or
  `Answered`. The first stream event of any kind moves it to `Accepted`.
  Only a `Launched` turn may be sent again.
  - **Problem in the reference:** only `text_delta` sets `sawStreamDelta`
    (`server/drivers/claude.ts:1391-1392`). Only a whole assistant frame
    sets `answered` (`:1424`). So a turn that streamed only reasoning and
    then exited with a transient error is sent again
    (`server/drivers/retry.ts:222-226`). The person pays for its reasoning
    two times. The release problem: "The same work done or delivered two
    times, or lost" (v0.1.150, "A Claude turn is never sent twice", commit
    `812c99063`).
- **P603 (decision, later, the Claude adapter). No environment variable
  that gives the bots the person's setup.** If we need such a choice, it is
  a setting of each bot, off by default. The exact form is a judgment call.
  The tool search switch is our own setting.
  - **Problem in the reference:** one variable of the server process,
    `OMB_CLAUDE_INHERIT_USER_CONFIG=1`, makes every Claude bot load the MCP
    servers, skills, hooks and `CLAUDE.md` of the person
    (`server/drivers/claude.ts:141-156`, `:916`). The tool search setting
    reads `~/.claude/settings.json` also when the turn uses project
    settings only (`server/drivers/claude-tool-search.ts:102-104`, `:113`).
    The release problem: "The person's own engine config reaches the bots"
    (v0.1.104, v0.1.170, v0.1.175).
- **P604 (plan, later, the Claude adapter). The `env` of the settings file
  of a bot cannot set account keys.** Remove each account key name and
  `CLAUDE_CONFIG_DIR` from that `env`.
  - **Problem in the reference:** the only filter on the `env` of a bot's
    own `.claude/settings.json` is "a name that the launch env does not
    have" (`server/drivers/claude-bot-settings.ts:82`). The launch env has
    no `ANTHROPIC_API_KEY` (`server/drivers/claude.ts:133-135`). For a named
    account or an endpoint, it has no account keys (`:122-129`). So a bot
    that can write its folder can set `ANTHROPIC_API_KEY` or
    `ANTHROPIC_BASE_URL`. Inferred, not checked with the real CLI. The
    release problem: "A secret or an access right in the wrong place"
    (v0.1.181).
- **P605 (choice, step 9 if the steering engine is the adapter of step 9,
  else later). The steering engine writes only an engine home that we
  own.** Write the follow-up setting only into an engine home that we own,
  with the atomic write of step 6. Report the steer capability after the
  driver reads that config. Then a "queue" setting queues the message at
  once.
  - **Problem in the reference:** before each turn of a signed-in account,
    the driver writes `follow_up_behavior = "steer"` into the `config.toml`
    of the engine (`server/drivers/acp/grok.ts:388-414`, `:636`). With no
    instance home, that file can be the person's own file (`:33-35`). Not
    verified. Its capability `queueing` is static
    (`server/drivers/acp/capabilities.ts:20`). But the steer works only
    when that file says "steer" (`server/drivers/acp/grok.ts:372-380`). The
    e2e test uses this case as "an engine without live steering"
    (`server/steer-e2e.test.ts:123`, `:614`).
  - Judgment call: no release names this.
  - Options:
    - a. Follow the reference.
    - b. Write only a home that we own, and report the capability from the
      config.
- **P606 (choice, later, the Codex adapter). Free the launch slot after
  the handshake, not after the MCP wait.**
  - **Problem in the reference:** the slot stays held while one slow MCP
    server starts (up to 30 s). So it delays every other Codex launch
    (`server/drivers/codex.ts:549`, `:1351-1363`,
    `server/drivers/codex-mcp-startup.ts:4-5`). The release problem: "One
    slow or stuck part blocks all the others" (v0.1.114, v0.1.153,
    v0.1.177, v0.1.178).
  - The cost: the cap on launches at the same time no longer covers the MCP
    start.
  - Options:
    - a. Follow the reference: hold the slot until the MCP servers settle.
    - b. Free the slot after the handshake.
- **P607 (plan, step 12). Keep the learned tool count.** Store the count
  with the engine and the model.
  - **Problem in the reference:** the learned count is in memory only
    (`server/tool-count-limit.ts:82-90`). After a restart, the first turn
    with too many tools fails one more time (`:100-115`).
  - Judgment call: no release names this.
- **P608 (plan, later, the Claude adapter). An unread steer after the
  grace closes the session.** When the grace ends with a steer that has no
  echo, send the steer back as unread (P590) and close the session.
  - **Problem in the reference:** a steer can have a continuation that
    starts more than 2 s after the held result. That continuation runs in
    the warm process after `turn.completed`, with the old turn id
    (`server/drivers/claude.ts:1301`, `:1536-1546`, grace at `:309-311`).
    Inferred, not tested. The release problem: "The same work done or
    delivered two times, or lost" (v0.1.182).

## New facts for open proposals

- **P34** (`queue-and-steer.md`) and **P64** (`driver-contract.md`):
  - The cause of the double send of v0.1.182 and its fix
    (`server/host/person-first.ts:165-167`, commit `1128b084f`).
  - The queue steer route can still run steered words again
    (`server/routes/bot-messages.ts:431-434`, `:466-468`). The arrival path
    answers 409 (`server/index.ts:7186-7191`). Inferred.
  - The loss after the first tool of a batch
    (`server/host/person-first.ts:163-167`,
    `server/drivers/openai-chat.ts:623-629`). Inferred.
  - "Steered" has a different meaning for each engine: a stdin write
    (`server/drivers/claude.ts:1752`), an RPC answer
    (`server/drivers/codex.ts:710-715`), a parked text
    (`server/drivers/openai-chat.ts:967-968`), a sent prompt
    (`server/drivers/acp/steer.ts:150-155`).
- **P57** (`driver-contract.md`): the `queueing` flag of the chat driver is
  the first flag that a step reads (P591).
- **P60** and **P63** (`driver-contract.md`, `acp-core.md`):
  - The full protocol of the fake Claude CLI
    (`server/testing/fake-claude-cli.ts:597-1450`) and of the fake Codex
    app server (`server/testing/fake-codex-app-server.ts:594-1315`).
  - Each fake writes all of `process.env` to a file
    (`server/testing/fake-claude-cli.ts:475`, `:501`, `:568`, `:942`).
  - The fake Codex does not play an MCP server that stops during a turn, or
    a URL that answers 405. No test checks that a failed MCP server blocks
    the warm keep (`server/drivers/codex.test.ts:189`).
- **P65** (`engine-process-lifecycle.md`):
  - A Claude stop whose root process is alive waits for that root with no
    limit: "A live root keeps the verified-stop wait"
    (`server/drivers/claude.ts:756`, `:1580-1592`, test
    `server/drivers/claude.test.ts:3319`). Inferred for a root that never
    closes.
  - Codex completes the turn after 12 kill retries, one every 5 s
    (`server/drivers/codex-process.ts:80-87`,
    `server/drivers/codex.ts:681-685`).
  - The Claude auth-recovery hold has no timer
    (`server/drivers/claude-auth-recovery.ts:108`).
- **P73** (`engine-process-lifecycle.md`): a Codex question has no timer
  (`server/drivers/codex.ts:838`).
- **P250** (`context.md`): the driver name still gates the tool bridge
  (`server/agents-bridge-switch.ts:269`, `:280`). Native replay is a table
  by driver kind (`server/runtime/capabilities.ts:12-53`).
- **P251** (`context.md`):
  - An aborted keep-warm ping or warm summary books nothing, but its prompt
    was sent (`server/claude-keepwarm.ts:212-215`, `:237`,
    `server/cache-keepwarm.ts:122`, `server/warm-summary.ts:183`, `:201`).
  - The unit test hides this, because its fake ping ignores the abort
    (`server/cache-keepwarm.test.ts:152-153`).
  - Still open: a summary dropped as busy
    (`server/claude-warm-summary.ts:139`), and the whole total booked when
    no base matches (`server/claude-cost-history.ts:44`).
- **P254** (`context.md`): the warm summary run still has no time limit
  (`server/warm-summary.ts:143`).
- **P461** (`recovery-and-pausing.md`):
  - The ACP rebuild is always `before-accept`, and it fails with no
    recovery text (`server/drivers/acp/core.ts:1166-1181`).
  - New, in no tag: Claude rebuilds when a CLI below 2.1.267 keeps an old
    system prompt (`server/drivers/claude.ts:939-951`, commit `5638d70a4`).
  - New, in no tag: Codex moves a thread to a new session past 85,000
    characters of instruction blocks
    (`server/drivers/codex-instructions.ts:38-39`, `:104-109`, commits
    `b683e4116`, `5b740a190`).
- **P504** (`engines-and-accounts.md`): checked again at `42f86aefd`. Codex
  keeps the person's own home, and so reads `AGENTS.md`, in four cases
  (`server/drivers/codex-shared-home.ts:148-155`): no `auth.json`, a login
  in a keyring, a link that fails, or a home that it cannot make. Other
  parts of the person's Codex config reach own-login and plan bots. This is
  by design: `config.toml`, `developer_instructions` merged last
  (`server/drivers/codex-instructions.ts:63-77`), and the CLI `-c`
  overrides (`server/drivers/codex-process.ts:94-124`).
- **P19** and **P40** (`write-only-secrets.md`): the token of a custom
  Claude endpoint is clear text in `config.json`
  (`server/claude-endpoints.ts:2-3`, `:96-100`).
- **P197** (`agent-tools.md`): the deferred bytes of the agents tools for
  the default Chief changed from 1,331 to 1,360
  (`server/agents-claude-defer.test.ts:22-32`). A test keeps them within 2%,
  and the total under 8,000 bytes (`:60-73`).
- **Item 10 of section 8 of
  [`harness-upgrades.md`](../research/features/harness-upgrades.md)**: see
  P602.

## Notes

- `docs/verification/codex-instructions.md:26-28` of the reference is out of
  date. It says that a failed resume is not replayed. The code now rebuilds
  one time (`server/drivers/codex.ts:1280-1294`).
- Three commits that the research file cites are in no release tag:
  `5638d70a4`, `b683e4116` and `5b740a190`. Check them again at the next
  release.
