# Plan: Skills

The proposals from the research file
[`../research/features/skills.md`](../research/features/skills.md)
(batch 8, reference commit `83d18e3af`). The steps, the pull requests and the
order are in [`README.md`](README.md). The author decides each proposal.
Then it becomes a decision, a pull request or a choice, and its text leaves
this file. A path that starts with `crates/`, `docs/plan/`, `docs/research/`,
`docs/decisions.md` or `docs/comparison.md` is ours. All other paths are in
the reference project.

- **Steps:** a new step after 15 for skills (P428), 9 (P432), 10 (P429,
  P437), 12 (P433), 15 (P435), and later (P434, P436, P440, P441, P442).
- **State:** all open.
- **The main finding:** a skill is a folder with `SKILL.md`, and each turn
  gets an index of the skills that are on. A skill change that a bot asks
  for applies at once at every approval level, with a receipt and Undo
  (`server/direct-apply.ts:1-4`). The old "staged until the person
  confirms" model is still in the wire comment and the smoke test
  (`packages/phone-protocol/src/skill-request.ts:1-4`). The store is careful
  about integrity (`server/skills.ts:179-186`, `:462-491`), but a skill that
  comes in from outside gets one of three rules (`server/index.ts:13409-13411`,
  `server/skills.ts:546`, `server/imported-skills.ts:303-308`).

## Proposals

- **P428 (plan, new step after 15, `bot-core`, `bot-engine`, `bot-protocol`,
  `bot-desktop`). A step for skills.** Add a row to the part 3 table and a
  sentence to "Gaps that have no step": "Skills have no step yet: a new step
  after step 15 has the store of one bot, the skill index, `skills_list` and
  `skill_manage`, `/learn`, `/name` and the automatic review. The library,
  all bots, the department share, the GitHub import and the built-in skills
  are later." The step needs the store (step 8), the card, the receipt and
  Undo (step 10), our MCP tools (step 12) and the side job of the memory
  review (step 15). The crates: `bot-core` (module `skills`: the store, the
  format and the integrity checks), `bot-engine` (the index prompt part and
  the tools), `bot-protocol` (a card variant) and `bot-desktop`
  (`features/skills/`). Alternative: the part with no review comes right
  after step 12, and the review joins step 15.
  - Why: follows the reference, which builds the index from the bot's own
    skills and adds the review as a side job.
  - Source: `server/host/skills-library.ts:312-321`;
    `server/index.ts:13400-13466`; `server/skill-review.ts:1-5`;
    `server/side-jobs.ts:296-327`.
- **P429 (decision, steps 10 and P428, `bot-core`, new facts for P112 and
  P139 to P144). One approval rule for a skill change.** A create, an
  update and a delete that a bot asks for on its own skills apply at once,
  with a receipt and Undo, as the reference does. A card waits only where
  the reference waits: a Cloud guest turn, or a thread that is not the
  bot's own. A skill that comes in from outside arrives off until a person
  turns it on. This rule is the same for a bot import, a person import and a
  skill from this computer.
  - Why: follows the reference for the bot's own changes. Better than the
    reference for a skill from outside: the reference has three rules for
    one risk. A bot import is on at once, a person import is off, and a
    skill from this computer with no warning is on for every bot. The
    stale "staged until confirmed" model stays in the wire comment and the
    smoke test (changelog section 6, the approval model), so our card text
    and tests must state the one rule.
  - Source: `server/direct-apply.ts:1-4`, `:17-20`;
    `server/index.ts:3037-3039`, `:10970-10978`, `:13409-13411`;
    `server/skills.ts:546`; `server/imported-skills.ts:303-308`;
    `packages/phone-protocol/src/skill-request.ts:1-4`;
    `scripts/testing/skill-approval-ui-smoke.cjs:22-50`.
- **P430 (decision, P428, `bot-core`). The store follows the reference, with
  the state in SQLite.** Keep these parts of the reference:
  - The state of a skill is outside the folder that the bot can write.
  - A hash check on each read, list and link.
  - A folder is published with one rename, and a file is written with `wx`.
  - A name that exists is refused, never written over.
  - The replay guard `appliedStageId`.

  The state of all switches goes in one table, with one rule on a read
  error: fail closed. A move between the store of a bot and the library is
  one transaction.
  - Why: follows the reference for the integrity checks. Better than the
    reference for the state: it has four files (the manifest, the native
    switches, the opt-outs and the choices for skills from this computer)
    with two rules. The manifest fails closed, and the native switches fail
    open. A crash between the archive and the manifest removal can lose a
    skill, and one transaction closes this gap (`AGENTS.md`).
  - Source: `server/skills.ts:179-186`, `:205-206`, `:462-491`,
    `:803-829`, `:855`, `:1150-1165`; `server/skill-folder.ts:170-197`;
    `server/native-skill-choices.ts:19-34`;
    `server/skills-library-migration.ts:57-60`, `:127-137`.
- **P431 (plan, P428 or step 12, `bot-engine`, new facts for P48). One
  budget for the whole skill index.** One byte budget for all blocks of the
  index. A cap for each description line, for example 200 bytes. When the
  index is full, it keeps the skills used most and the skills of this task,
  and it points to `skills_list` for the rest. The index stays in the
  stable half of the prompt.
  - Why: follows the reference for the place of the index. Better than the
    reference for the size: each block has a cap of 30 skills and 4,000
    bytes, but the index has up to four blocks and no total cap (changelog
    section 5, the size of the tool list). One description can use 1,024
    characters. The reference cuts by name order, so a skill named `zz-...`
    never reaches the prompt.
  - Source: `server/skills.ts:42-43`, `:505`, `:1275-1279`, `:1306-1311`;
    `server/host/skills-library.ts:310-321`; `shared/skill-md.ts:9`;
    `server/system-prompt.ts:49-50` (the index is not in the list of
    volatile sections).
- **P432 (plan, step 9, `bot-engine`, new facts for P61 and P103). No skill
  of the person reaches a bot unless the person turns it on.** For Claude,
  follow the reference: the isolation flags and the opt-in
  `claudeUserSkills`. The Codex driver gets the same switch. A turn never
  runs in the home folder of the person: a turn with no work folder fails
  or uses the bot folder.
  - Why: follows the reference for Claude. Better than the reference for
    Codex: Codex bots load `~/.codex/skills`, `~/.agents/skills` and
    `/etc/codex/skills` with no switch, and the Codex homes link in the
    person's `skills` folder (changelog section 5, the person's own engine
    config reaches the bots, and section 6, "The Codex setup of the person",
    v0.1.150 and v0.1.175). The reference uses `turn.cwd ?? homedir()`, so
    the home folder can look like a project. Add this to the row "The
    person's own engine config reaches the bots" of the table "The problems
    of the reference".
  - Source: `server/imported-skills.ts:445-455`;
    `server/drivers/codex-shared-home.ts:1-5`, `:15`;
    `server/drivers/claude.ts:976-981`, `:1003`;
    `server/turn-settings.ts:15-39`.
- **P433 (plan, step 12, `bot-engine`, new facts for P194 to P203).
  `skills_list` and `skill_manage` in the tool list of step 12.** Use the
  arguments and the gate of the reference. With no query, `skills_list`
  shows only names and status. With a query, it shows the best 8. The tool
  takes the bot from the turn's token, never from an argument (P194).
  - Why: follows the reference. A description is prompt content, so a list
    with no query does not show it.
  - Source: `server/drivers/agents-catalog.ts:726-766`, `:868-870`;
    `server/drivers/agents-call.ts:156-173`, `:889`;
    `server/index.ts:12716-12720`.
- **P434 (plan, later part of P428, `bot-core`). The scanner looks for
  secrets, and the hash of an imported folder covers every file.** The
  scanner adds the secret detector of the redaction module to its three
  patterns. A person import is redacted, or it is refused. The hash of an
  imported folder covers every file in it, also a file that was added
  later. A warning never blocks a skill, and the person decides.
  - Why: follows the reference for the warnings. Better than the reference:
    its scanner has no secret pattern, the import does not use the detector
    that exists, and the code names the added-file case as an open risk
    (changelog section 5, a secret in the wrong place). The copies from this
    computer already hash every file.
  - Source: `shared/skill-md.ts:125-142`; `server/skill-folder.ts:136-153`,
    `:217-220`; `shared/redact.ts:96-98`;
    `server/imported-skills.ts:128-191`.
- **P435 (plan, step 15 or P428, `bot-core`). The automatic review is a side
  job, off by default.** Follow the reference: count the tool steps, with a
  threshold of 10 (3 to 100). One review for each bot at a time, at most 3
  changes, no tools for the review model, and a hash check before an update.
  The transcript is redacted before it goes to the review model. Our port
  adds a line to "Adapted components" in `NOTICE`, with the credit to Hermes
  Agent `agent/background_review.py` (MIT, Copyright (c) 2025 Nous
  Research).
  - Why: follows the reference for the review. Better than the reference:
    the transcript is not redacted in `skill-review.ts`, and it can go to the
    helper model. The reference credits this port only in the file header.
    Its `NOTICE` credits Hermes Agent for a different file
    (`server/browser/desktop/rfb-filter.ts`).
  - Source: `server/skill-review.ts:1-5`, `:16-25`, `:82-142`, `:445-447`,
    `:501-503`; `server/config.ts:603-615`; `server/side-jobs.ts:323-326`;
    `NOTICE:103-106`.
- **P436 (decision, later, `bot-core`, new facts for P275). Only the Chief, or
  only the person, changes the skills of many bots.** The skill tools that
  change many bots go on the Chief list. In a room, a change for all bots
  always waits on a card, as the reference does.
  - Why: follows the reference for the room rule. Better than the
    reference: the release note says "by asking your Chief", but the Chief
    list does not have the skill tools. A test has a bot that is not the
    Chief delete a shared skill with no card. The library, all bots and the
    department share are later, and our team is one person (D10).
  - Source: `server/drivers/agents-catalog.ts:816-818`;
    `server/skills-for-all-bots.e2e.test.ts:52-56`;
    `server/host/skills-for-all-bots-host.ts:1-6`, `:193-194`.
- **P437 (plan, step 10 and P428, `bot-desktop`, new facts for P139 to
  P144). A skill card shows its files before "Enable" works.** "Enable"
  stays disabled until the person opens the preview. The review dialog of
  the bot page shows all files of an imported folder, not only `SKILL.md`.
  - Why: better than the reference. The preview starts closed, and "Enable"
    sends the hash as "reviewed" also when the person never opened it. The
    review dialog shows only the `SKILL.md` text.
  - Source: `src/components/PendingApproval.tsx:168`, `:273-283`;
    `src/components/bot-settings/SkillsSection.tsx:286-292`.
- **P438 (plan, P428, `bot-core`). `/name` and `/learn` follow the
  reference.** In the middle of a message, only words that a person typed
  run a skill. Code is ignored. `/learn` opens a turn with a fixed text and
  the person's own request, never with model output.
  - Why: follows the reference. It agrees with the rule of `AGENTS.md`:
    text that opens a turn is built from stored data.
  - Source: `shared/skill-command.ts:38-82`, `:98-107`;
    `server/skill-learn.ts:46-62`.
- **P439 (choice, P428, `bot-core`). The `SKILL.md` reader.** A hand-written
  reader with the rules of the reference: only one-line `key: value` lines,
  the name pattern, and the limits of 64 and 1,024 characters. No YAML
  crate. This chooses the "Hand-written" option of
  `docs/comparison.md:130` over `gray_matter`.
  - Why: follows the reference, which is not a YAML parser. No new
    dependency.
  - Source: `shared/skill-md.ts:7-15`, `:84-123`, `:97`.
- **P440 (plan, later, `bot-core`). The GitHub import, with the fetch rules
  of the reference.** One commit, a hash check for each blob, the token
  only to `api.github.com`, no redirect to another host, and one budget for
  requests, downloads, bytes and time.
  - Why: follows the reference. The research file lists these rules under
    "Keep as the reference does".
  - Source: `server/skill-fetch.ts:12-15`, `:96-119`, `:262-267`, `:402`.
- **P441 (plan, later, `bot-core`). The built-in skills.** A switch for each
  bot, trigger words matched on word boundaries, and a start that skips a
  broken skill. A port of `posts.html` carries its MIT (MiniMock) and ISC
  (Lucide) notices to `NOTICE`.
  - Why: better than the reference. It selects a built-in skill by a
    substring of the message, and one bot cannot switch it off. A broken
    skill can stop the start, but the research did not verify whether the
    caller catches the error (research section 9).
  - Source: `server/skill-library.ts:78-87`, `:116-128`;
    `skills/social-posts/posts.html:2-32`.
- **P442 (choice, later). The row "Copy of a skill to another bot".** The
  reference planned `copySkill` (the copy arrives off, with its provenance)
  and never built it. Option a: remove the row. Option b: keep it as the
  one-person form of "all bots", a copy that arrives off.
  - Why: follows the reference, which shipped the library, all bots and the
    department share in place of the copy.
  - Source: `docs/superpowers/plans/2026-08-31-06-memory-review-loop.md:144-155`.

## Notes

- `docs/research/changelog.md` stops at v0.1.180. The note of v0.1.181
  (2026-11-25) has the item "Skills on all your bots". `MEMORY.md` asks for
  its row in section 8. This is not a proposal.
