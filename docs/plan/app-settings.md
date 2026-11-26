# Plan: App settings

The proposals from the research file
[`../research/features/app-settings.md`](../research/features/app-settings.md)
(batch 7, reference commit `96ff84455`). The steps, the pull requests and the
order are in [`README.md`](README.md). The author decides each proposal.
Then it becomes a decision, a pull request or a choice, and its text leaves
this file. A path that starts with `crates/`, `docs/plan/`, `docs/research/`,
`docs/decisions.md` or `docs/comparison.md` is ours. All other paths are in
the reference project.

- **Steps:** 6, 7, 8, 10 and 12, D8 and D10.
- **State:** all open.
- **The main finding:** a bot changes the settings of the application with
  one tool, `app_settings`. Each `set` of a safe setting applies at once
  with an applied card and Undo. The approval level is not read: the gate is
  the owner's own turn (`server/app-settings/host.ts:96-97`, `:143-149`).
  But a bot can change any bot, with approval mode to Full access, and send
  a saved key to an address that it gives
  (`server/app-settings/registry-bots.ts:12-17`,
  `server/app-settings/registry.ts:133-138`).

## Proposals

- **P289 (decision, adds to D8). A bot changes only its own bot settings,
  and never an approval level.** Approval mode and a change to another bot
  are owner-only.
  - Why: better than the reference, where a bot changes any bot, or all
    bots, with approval mode to Full access. Its own spec names "raise its
    own permissions" as a threat. The turn record knows the caller (P194),
    so the check is one line.
  - Source: `server/app-settings/registry-bots.ts:12-17`, `:85-100`,
    `:196-212`; `server/app-settings/host.test.ts:479-487`;
    `docs/superpowers/specs/2026-11-12-app-settings-tool-design.md:33`.
- **P290 (decision). Some settings are owner-only.** Provider addresses,
  engines with `keyFrom`, ways in (Wi-Fi, the relay, Tailscale) and
  `computer.sharing`.
  - Why: better than the reference. A bot can send the requests and their
    key to a new address, and open the computer to the network. The spec
    says a hijacked bot must not do either (spec `:33`).
  - Source: `server/app-settings/registry.ts:133-138`, `:252-262`,
    `:313-315`; `server/app-settings/registry-window.ts:11-14`;
    `server/app-settings/registry-config.ts:154-156`;
    `server/app-settings.e2e.test.ts:141-148`.
- **P291 (decision, a note for steps 8 and 10). The Undo record is stored
  with its card in one transaction.** For a key or an address, store a
  reference, not the value.
  - Why: better than the reference. It keeps the record in memory, so after
    a restart the card still shows Undo, and a tap gets "This change can't
    be undone here."
  - Source: `server/app-settings/host.ts:88`, `:148`, `:265-266`; spec
    `:116-118`; `src/components/ApprovalCard.tsx:164`.
- **P292 (plan, step 12, or a new step after it). Add `app_settings`.** It
  needs step 6 (settings), 7.6 (the key card), 8 (the store) and 10 (the
  card path). First: `find`, `get` and `set` of safe settings, with Undo.
  Then the key card. Window preferences later. Themes and `show_card` are
  not planned.
  - Why: a smaller tool first. The reference tool has 10 actions and 2,387
    characters in every profile. Its spec planned three actions.
  - Source: `server/drivers/agents-app-settings-tool.ts:14`;
    `server/app-settings/host.ts:234-256`.
- **P293 (decision). The tier is the whole policy.** Three tiers as a Rust
  enum that holds its data: `Safe { write, current }`,
  `Secret { credential }`, `OwnerOnly`. Writes only in the owner's own turn,
  from the turn record (P194). No approval card, with Undo.
  - Why: follows the reference for the tiers. The compiler refuses a secret
    entry with a value, or an owner-only entry with a write function.
  - Source: `packages/phone-protocol/src/app-settings.ts:1`, `:5`;
    `server/app-settings/registry.ts:47-68`;
    `server/app-settings/host.ts:96-97`, `:143-149`; spec `:5-12`, `:56`.
- **P294 (plan, a note to D10). One write path with a typed caller.** The
  caller is `Actor::Bot(id)`, not admin HTTP. The bot tool and the Tauri
  commands of step 7.6 call the same `bot-core` functions.
  - Why: better than the reference, which calls its own routes as an admin
    loopback client, so the routes do not know that a bot is the caller.
    Less code (no HTTP server, D10).
  - Source: `server/app-settings/registry.ts:365-386`, `:374`.
- **P295 (plan, step 12). The write budget is in the turn record.** Every
  refusal gives back its write. The limit stays 10 for each turn.
  - Why: better than the reference. A refused batch gives the write back,
    a refused single write does not. The spec says a refusal does not spend.
  - Source: `server/app-settings/host.ts:19`, `:99-104`, `:124` compared
    with `:134`; spec `:129-130`.
- **P296 (plan, step 7, or a gap). The setter answers first.** A window
  preference change returns the result of the setter before the tool says
  "Changed".
  - Why: better than the reference. It stores the value before the window
    applies it, and the window ignores errors (a gap the spec names).
  - Source: `server/routes/app-settings.ts:43-49`;
    `src/lib/window-prefs.ts:100-104`; spec `:250-252`.
- **P297 (plan, step 6). Redaction by type, not by field name.** One
  redaction function runs at each exit.
  - Why: better than the reference. It removes fields that match
    `/key|token|secret|password/i`, so `decider.customBaseUrl` is refused on
    write as sensitive but shown on read.
  - Source: `server/app-settings/registry-config.ts:15-18`, `:54-57`.
- **P298 (plan). Add this feature to the problems table of `README.md`.**
  "A secret in the wrong place": P289, P290, P297. "The approval model
  changed": P289, P293. "State lost at a restart": P291. "The size of the
  tool list": P292, with P48 and P197. "A file written over after a failed
  read": a new example, the desktop preferences file and the provider patch
  that copies the whole section from memory over the file.
  - Why: the table of section 5 problems in the research file.
  - Source: `server/drivers/agents-tool-groups.ts:36`;
    `server/drivers/agents-catalog-goldens/full.tools-list.json:2479-2547`;
    `electron/desktop-prefs.mjs:92-98`;
    `server/app-settings/registry.ts:252`; `server/config.ts:892-902`.
- **P299 (plan, a test of step 12). Undo restores every field that the
  change touched.**
  - Why: better than the reference. Archive clears Chief of Staff, and its
    Undo does not restore it.
  - Source: `server/app-settings/registry-bots.ts:252-253`.
- **P300 (plan). A row for this file in the open-proposals table of
  `README.md`.** Steps 6, 7, 8, 10 and 12, and D8 and D10.
  - Why: section 7 of the research file maps each part to these steps.
  - Source: the research file, section 7.
