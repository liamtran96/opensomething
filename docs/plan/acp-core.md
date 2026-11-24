# Plan: The ACP core

The proposals from the research file
[`../research/features/acp-core.md`](../research/features/acp-core.md)
(batch 4, reference commit `ed8cb7278`). The steps, the pull requests and the
order are in [`README.md`](README.md). The author decides each proposal.
Then it becomes a decision, a pull request or a choice, and its text leaves
this file.

- **Steps:** 9, 10.
- **State:** all open.
- **The main finding:** one core (`server/drivers/acp/core.ts`) serves 17
  adapters and the Antigravity driver. The core copies all of
  `process.env`. Off a Team Cloud, each engine keeps the home folder of the
  person, so it reads the config and the instructions of the person
  (`core.ts:339-354`, `server/engine-homes/engine-homes.ts:1-3`).

## Proposals

- **P102 (step 9). The one adapter of step 9 is the custom adapter.** Model
  discovery comes in a later pull request.
  - Kind: follows the reference.
  - Why: it has 55 lines, no sign-in and no engine bug. Its own test drives
    the fake CLI, so it tests the core. It reads no model list at create.
  - Source: `server/drivers/acp/custom.ts:18-34`, `:28`,
    `server/drivers/acp/custom.test.ts:81-101`.
- **P103 (step 9). An engine home that the app owns.** Each engine gets a
  home folder of the app, not the home folder of the person. An adapter
  writes only into that folder, with mode 0600, and never into a config
  file of the person.
  - Kind: better than the reference.
  - Why: six adapters write the key of a local model server into the config
    of the person, five with no file mode. Qwen writes `{}` over a settings
    file that does not parse.
  - Source: `server/engine-homes/engine-homes.ts:108-111`,
    `server/drivers/acp/opencode-go.ts:416`, `droid.ts:88`, `grok.ts:250`,
    `kimi.ts:455`, `hermes.ts:84`, `qwen.ts:109-114`, `:146`.
  - Related: P61, which takes the env part.
- **P104 (step 9). One engine process for each thread.** A shared process is
  a later option, with its own test.
  - Kind: a subset of the reference.
  - Why: on a shared process, a stop that the engine does not confirm in
    5 s kills the turns of other threads. The reference shares a process
    only for two engines.
  - Source: `server/drivers/acp/core.ts:285`, `:438-447`, `:533-549`,
    `server/drivers/acp/shared-process.test.ts:272-295`.
- **P105 (step 9). A maximum length for a line from the engine,** and for
  the buffer.
  - Kind: better than the reference, whose ACP host has no limit. Two other
    readers of the reference use 1 MiB for a line and 8 MiB in all.
  - Source: `server/drivers/acp/host.ts:165-182`,
    `server/drivers/acp/custom-model-catalog.ts:14-15`.
- **P106 (step 9). A choice: JSON-RPC by hand on a line codec, as the
  reference, or the `agent-client-protocol` crate.** The client must send
  and receive methods that are not in the protocol, for example
  `_session/steering`. Check the license of the crate first.
  - Source: `server/drivers/acp/host.ts:126-388`, `core.ts:258-275`,
    `steer.ts:16-21`.
  - Changes: [`../comparison.md`](../comparison.md) assumes the crate.
- **P107 (step 10). An adapter confirms the approval mode from the reply of
  the engine.** If the value did not change, the turn fails before the
  prompt.
  - Kind: follows two adapters of the reference. Three others do not check.
  - Source: `server/drivers/acp/devin.ts:126-136`,
    `server/drivers/antigravity.ts:237-258`, `kiro.ts:117-125`,
    `droid.ts:204-209`, `command-code.ts:26-28`.
- **P108 (steps 8 and 9). The protocol log cuts the tool input and output
  of each engine,** not only of one.
  - Kind: better than the reference, where 17 engines log full tool data
    with only pattern redaction.
  - Source: `server/drivers/antigravity.ts:163`, `server/drivers/acp/tool-log.ts:30-71`,
    `core.ts:220`, `:488`.
- **P109 (step 9). A cache of an adapter is keyed by the instance id,** not
  by the CLI path.
  - Kind: better than the reference, where two OpenCode instances with
    different keys share one model cache.
  - Source: `server/drivers/acp/opencode-go.ts:55-62`, `:293-310`.

## New facts for proposals that exist

- **P53, P54, P61 and P6** cite lines of `d6660e2`. At `ed8cb7278`:
  `acp/core.ts:1572` is `:1534`, `:922` is `:868` and `:973`, `:333-346` is
  `:339-354`, and `acp/host.ts:276` is `host.ts:275-299`. The behaviour is
  the same, except that the idle timer now ignores the time that the
  computer sleeps (`host.ts:22`, `:285`).
- **P6:** the idle limit of 15 minutes starts again with no end while a
  tool or a question is open. The value `0`, or a value that is not valid,
  turns it off. The prompt, the admission and the startup model read have
  no limit (`host.ts:275-299`, `core.ts:858`, `:886`, `:910`, `:1306-1319`).
- **P63:** a fake ACP CLI keeps its state for each session, writes one log
  line for each request, and stops when its parent stops. The reference
  keeps global slots, so two sessions cannot wait at the same time
  (`server/testing/fake-acp-cli.ts:181-191`, `:563-589`).
- The core tests of step 9 use the `Clock` of section 7 of
  [`changelog.md`](../research/changelog.md). The core tests of the
  reference use real timers and sleeps (`server/drivers/acp/acp.test.ts:2278`).
- "Engine behaviour by a capability flag, not a driver name" for the
  approval levels is in P113.
