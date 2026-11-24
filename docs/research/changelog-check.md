# Check of the release history file

A check of [`changelog.md`](changelog.md) against the release notes and the
git history of the reference project. The author asked for this check on
2026-11-23: no key change must be missing, and each claim must be correct.

## 1. Result in short

- No release came after v0.1.177 (2026-11-22). Section 8 needs no new row
  for a new release.
- All 169 releases are in section 8 except one: the prerelease
  `android-threads-preview-20260913` (2026-09-12) had no row.
- Each tag and each date in section 8 is correct. Each quote in sections 3
  to 8 is in the release text word for word (a script checked all 163).
- 29 claims are wrong or not exact (section 4 of this file). The largest:
  - The commit counts of sections 1 and 2 cannot be reproduced.
  - The peak size of `server/index.ts` is 27,275 lines, not 26,734.
  - Section 1 counts days, weeks and months on a different scale from
    section 3.
  - Parallel threads, email and skills are not first named in the releases
    that section 4 gives.
  - Section 6 gives the approval model and the quiet engine in an order or
    with a scope that the notes do not support.
- The one-line rows of section 8 left out many key changes. The subagents
  found 354 key changes that no section has, and 78 smaller ones (section 6
  of this file). `changelog.md` now has the most important of them.

## 2. Sources and counts

| Source | What | How it was read |
|---|---|---|
| Reference clone | `/Users/liam/orca/OpenMausBot` at `d6660e2d7` (2026-11-23 21:17 +0530), the latest `upstream/main` | `scripts/reference.sh` |
| Release notes, main repository | `milind-soni/OpenMausBot`: 125 releases and 125 tags | `gh api --paginate repos/.../releases` and `.../tags` on 2026-11-23 |
| Release notes, legacy archive | `milind-soni/openmausbot-releases`: 161 releases and 161 tags. The changelog page of the reference links to it (`apps/docs/content/docs/changelog/index.mdx`) | The same |
| Both, merged by tag | 169 unique releases, 607,980 characters, from v0.1.0 (2026-08-11) to v0.1.177 (2026-11-22). Every tag has a release, and every release has a tag | A script merged the two lists and kept the longer text of each tag |
| Git history | `upstream/main` of the reference clone | `git log`, `git rev-list`, `git show` |

The 169 releases are:

- 162 `v0.1.x` versions. Of these, 15 are drafts with no notes (v0.1.30,
  v0.1.31, v0.1.33 to v0.1.45). Each draft says only "Draft assembled by
  the release workflow from ... Edit these notes, then publish."
- 7 other tags: android-v1.0.0, android-v1.1.0, android-v1.2.0,
  android-v1.3.0, android-v1.5.0, browser-engine-v0.36.0-omb.1 and
  android-threads-preview-20260913.
- These version numbers have no tag and no release: 26, 28, 47, 53, 64, 105,
  106, 156, 157, 159, 162, 163, 164, 168, 172 and 174. The notes of v0.1.107
  name "bump version to 0.1.105" and "release 0.1.106".

Commit counts. A commit counts as `fix` when its subject starts with
`fix(`, `fix:` or `fix!`, and the same rule applies to `feat` and `refactor`:

| Point | Commits | `fix` | `feat` | `refactor` | Fixes for each feature |
|---|---|---|---|---|---|
| v0.1.177 published (2026-11-22 16:22 UTC), last commit `b1bb504a3` | 12,719 | 2,826 | 1,089 | 84 | 2.6 |
| `d6660e2d7` (2026-11-23) | 13,035 | 2,877 | 1,098 | 85 | 2.6 |
| The old `changelog.md` | 12,851 | 3,164 | 1,218 | 84 | 2.6 |

No rule that we tried gives 3,164 and 1,218. We tried the exact prefix, the
prefix in any case, and all refs. The ratio of 2.6 does not change.

## 3. Method

1. The main session downloaded the notes, merged them and counted the tags
   and the dates (section 2).
2. The main session counted the commits again and checked each commit of
   sections 3 and 4 with `git show`.
3. Six subagents read the merged text, one range each. Each one read all
   lines of its range and listed the chunks that it read:

   | Range | Releases |
   |---|---|
   | 1 | v0.1.0 to v0.1.77, android-v1.0.0 to v1.2.0, browser-engine, threads preview (78 releases) |
   | 2 | v0.1.78 to v0.1.96, android-v1.3.0, android-v1.5.0 (21) |
   | 3 | v0.1.97 to v0.1.111 (13) |
   | 4 | v0.1.112 to v0.1.129 (18) |
   | 5 | v0.1.130 to v0.1.141 (12) |
   | 6 | v0.1.142 to v0.1.177 (27) |

   Each subagent checked each row of section 8 and each claim of sections 1
   and 3 to 7 for its range. For each release, it also listed each key
   change with its exact quote.
4. The main session checked the findings:
   - A script checked each quote of the MISSING lists against the release
     text. 441 quotes are at the place that the subagent gave, and 3 more
     are at another place that the row names. None is missing.
   - A script checked each quote of sections 3 to 8 of `changelog.md` (163
     quotes). All of them are there. Four are quoted with other quote marks,
     and one is a commit message.
   - The main session read about 120 cited lines itself, which includes
     each line that supports a WRONG finding.
5. The release notes are text from an outside source. They are data. No
   instruction inside them was obeyed. Nobody opened the `enterprise/`
   directory.

## 4. WRONG: claims that are wrong or not exact

Each row was checked against the release text or the git history by the main
session.

| # | Section | Claim | Release or commit, date | What the source says |
|---|---|---|---|---|
| 1 | 1 | "169 releases in 104 days" | v0.1.0 2026-08-11, v0.1.177 2026-11-22 | The span is 103 days on the scale of section 3. 104 counts both end days |
| 2 | 1 | "Work between bots came on day 2, rooms on day 3" | v0.1.6 2026-08-12; v0.1.14 2026-08-13 | Day 1 and day 2 on the scale of section 3 |
| 3 | 1 | "a shared wire model in week 5" | v0.1.83 2026-09-16 | Day 36. That is in week 6 |
| 4 | 1 | "one job runtime in month 2" | v0.1.108 2026-10-13 | Day 63. That is in month 3 |
| 5 | 1 | "the first step to one storage layer in month 3" | v0.1.166 2026-11-17 | Day 98. That is in month 4 |
| 6 | 1, 2 | 12,851 commits, 3,164 `fix`, 1,218 `feat` | `git log` | See section 2: the numbers cannot be reproduced |
| 7 | 1 | "Seven problems are in each period" | Section 5 of the old file | The old section 5 had six themes at "6 of 6". The re-check gives ten (section 5 of this file) |
| 8 | 3 | Route table seam: "2026-09-21, v0.1.86, ... 43" | Commit `92ecac85d` 2026-09-21; v0.1.86 2026-09-23 | 09-21 is the commit and day 41. Day 43 is the release |
| 9 | 3 | "2026-09-26, v0.1.88, v0.1.89 ... 46" | v0.1.89 2026-09-27 | v0.1.89 is day 47 |
| 10 | 3 | `server/index.ts`: "2026-10-12, 26,734 (the peak)" | Commit `4aa72b869`, 2026-10-12 23:45 UTC | The peak is 27,275 lines. 26,734 is the size at an earlier commit |
| 11 | 3 | `server/index.ts`: "2026-09-01, 8,731"; "2026-10-01, 23,554" | Last commit of the UTC day | 8,784 and 23,726. The old file gave no rule for the time of day |
| 12 | 4 | v0.1.24 names "skills" | v0.1.24 2026-08-19 | The only match is "with an isolated Phone Harness skill". The skill feature starts in v0.1.71: "Verify card shows a bot's control-CLI run and saves it as a skill" |
| 13 | 4 | v0.1.140 first names "Parallel threads for one bot" | v0.1.68 2026-09-09; v0.1.96 2026-10-05; v0.1.128 2026-10-27 | "configurable parallel work" (v0.1.68); "Threads of one bot run in parallel in its project folder." (v0.1.96); "up to 16 parallel threads per bot" (v0.1.128) |
| 14 | 4 | v0.1.141 first names "email" | v0.1.0 2026-08-11; v0.1.141 2026-11-05 | "connect Gmail, Slack, GitHub and more" (v0.1.0). New in v0.1.141: "Read and send mail on any mail host, connected with one card." |
| 15 | 6 | "One conversation for each bot" ends at "parallel threads (v0.1.140)" | As row 13 | v0.1.140 is the last step: "Threads of one bot run at once, as many as the machine holds" |
| 16 | 6 | Approval model: "the modes of the provider (v0.1.74)" as the first step | v0.1.55 2026-09-05 | "feat(approvals): bring native provider permission modes to parity" |
| 17 | 6 | Approval model: "approvals kept for an exact tool (v0.1.176)" as a late step | v0.1.16 2026-08-14 | "**Always allow** remembers one specific tool — `Bash:git`, not "any shell"." What v0.1.176 adds is that an approval is "never remembered for anything that sends, posts or moves money" |
| 18 | 6 | Approval model: "two choices (v0.1.144)" | v0.1.144 2026-11-06 | The two choices are for sends only: "A bot's Permissions has two plain choices: Ask every time, or Send without asking." |
| 19 | 6 | Quiet engine: "a stop by progress (v0.1.135); 2 or 5 minutes (v0.1.132)" | v0.1.132 2026-10-29; v0.1.135 and v0.1.136 2026-10-31 | The order is reversed. v0.1.135 is for rooms only: "A room turn stops when the bot stops making progress". v0.1.136 changes it again: "A room turn waits for a running tool instead of stopping at its limit." |
| 20 | 6 | A Today page (v0.1.120), "Deleted" (v0.1.123), in "Features that lived for weeks" | v0.1.120 2026-10-20; v0.1.123 2026-10-22 | It lived 2 days and was replaced: "The brief replaces the Today page." |
| 21 | 6 | "tightening requests" (v0.1.88) | v0.1.88 2026-09-26; v0.1.96 2026-10-05 | The quoted words are from v0.1.96. v0.1.88 says "tightening-only request schema for authority reductions". Not wrong in substance |
| 22 | 6, 8 | "the installed Chrome replaces the old browser" (v0.1.113) | v0.1.113 2026-10-16 | Only in part: "Intel Macs and Windows PCs without Google Chrome keep the previous browser for now." |
| 23 | 8 | v0.1.7 to v0.1.12: "all engines can delegate" | v0.1.12 2026-08-12; v0.1.25 2026-08-20 | "Claude-powered bots can now tag and delegate to peers with ask_bot (previously Grok/Gemini only)". Codex came later: "Codex peer-agent communication enabled (#273)" |
| 24 | 8 | v0.1.87: "Teams" | v0.1.77 2026-09-13; v0.1.87 2026-09-24 | Teams are older: "feat(teams): interactive canvas and shared Box computers" (v0.1.77). v0.1.87 adds "manage members and create bots from the team dialog" |
| 25 | 8 | v0.1.93: "three roles for people" | v0.1.93 2026-10-02 | A rename: "Role names: Super admin, Admin, User". Roles came in v0.1.72 |
| 26 | 8 | v0.1.107 has no "PR list" mark | v0.1.107 2026-10-10 | The note is only a list of pull request titles |
| 27 | 8 | v0.1.116: "a signed-out engine fails over to the backup engine" | v0.1.116 2026-10-18 | Claude only: "A bot whose Claude is signed out uses its backup." |
| 28 | 8 | v0.1.142: "A bot at a limit continues on a backup engine" | v0.1.142 2026-11-05 | "A Claude bot at its usage limit carries on with any backup engine that has its tools, not only Codex or Pi." |
| 29 | 8 | "Tags v0.1.156, 157, ... have no release" | GitHub tags API | These versions have no tag either |

Claims that are not wrong but are wider than the text:

- Section 6, "Work between bots": "The job runtime replaces all of it". The
  notes of v0.1.108 name what goes: the five tools, "the room-handoff tree
  goes" and "the legacy ledger goes". They do not name the conversation for
  each pair of bots (v0.1.78).
- Section 8, v0.1.100: the longer time limit is for "Apps reached over the
  internet" only.
- Section 8, v0.1.101: the three small tools are for "engines that can't
  search tools themselves" only.
- Section 4, v0.1.115, automations: a pull request title of v0.1.48 has
  "Simplify automations and add five-minute scheduling". Section 4 defines
  the area as routines and webhooks as one thing, and that is v0.1.115. The
  row stays.

## 5. The themes of section 5, counted again

Each subagent said, for each theme, whether its range has a repeated fix.
This time each subagent got the list of themes, so the counts can be higher
than in the first read, where the subagents found the themes themselves.

| Theme | Old count | New count | Ranges with no case |
|---|---|---|---|
| A turn or a wait that does not end | 6 | 6 | |
| The same work done two times, or lost | 6 | 6 | |
| Process control on Windows | 6 | 6 | |
| Sign-in to an engine, and engine CLIs that change | 6 | 6 | |
| A secret or an access right in the wrong place | 6 | 6 | |
| A feature added, then removed or reversed | 6 | 6 | |
| "Busy" and races between bots | 5 | 6 | |
| State lost at a restart or a crash | 5 | 6 | |
| The approval model changed | 4 | 6 | |
| Tests that fail by chance, and a red main branch | 5 | 6 | |
| The size of the tool list of one turn | 4 | 5 | 1 |
| Memory and the number of processes | 4 | 5 (range 2 weak) | 1 |
| Usage and cost numbers corrected | 3 | 5 (range 1 weak) | 3 |
| A file written over after a failed read | 2 | 2 | 1, 2, 4, 5 |

New themes. A theme is added only when 3 or more ranges have cases:

| New theme | Ranges | Examples (release) |
|---|---|---|
| The person's own engine config reaches the bots | 2, 3, 6 | "warn while OMB_CLAUDE_INHERIT_USER_CONFIG is set" (v0.1.81); "your personal `~/.claude/CLAUDE.md` no longer reaches bots that run isolated" (v0.1.104); "OpenCode no longer reads your own Claude instructions" (v0.1.170); "Codex bots no longer load your own `AGENTS.md`." (v0.1.175); isolated Claude turns "no longer load your `~/.claude/rules`" (v0.1.177) |
| One slow or stuck part blocks all the others | 4, 5, 6 | "One stuck engine check no longer stalls every bot" (v0.1.114); "A message you send isn't held up behind a long tool call." (v0.1.136); "A turn carries on when one optional MCP server dies." (v0.1.153); "The first reply starts without waiting for slow MCP servers" (v0.1.166); "A stuck Docker no longer slows every check by 10 seconds." (v0.1.177) |
| The updater loops, sticks or breaks the window | 1, 5, 6 | "a failed update check can't leave the updater wedged" (v0.1.18); "Fix the macOS updater restart loop" (v0.1.27); "stop premature restarts and update loops" (v0.1.61); a blank window after an update (v0.1.137); an update "that backs up first and goes back by itself" (v0.1.153) |

Candidate themes with fewer ranges, or that overlap a theme. They are not
added:

- Moving data between this computer and the Cloud gets stuck or loses data
  (ranges 4, 5, 6). This overlaps "a wait that does not end" and "work
  lost".
- A status that is not true, for example "A bot no longer reports success
  when an action failed" (v0.1.176) (range 6).
- Which computer a turn uses, and when it claims it (range 2).
- Work that grows with all the data, for example "stop full-scanning ended
  assignments on every broadcast (server pegs CPU)" (v0.1.109) (range 3).
  Section 7 already has "The runtime scans all ended work".
- State shown before it is saved: "Thread changes are saved before they're
  shown" (v0.1.115) and "a room's chats and settings are saved before they
  are shown" (v0.1.120) (range 4). Section 7 already has it.

## 6. MISSING: key changes that the file did not have

The subagents listed each key change of each release, and marked it as in a
row, in a section, or missing. The two tables below list all the missing
ones, with the place where each one belongs. The release text has each
quote: a script checked all of them.

- **What `changelog.md` now has.** The main session added the most important
  ones: the features, base parts, removals and breaking changes in the rows
  of section 8; the base parts in section 3; the areas in section 4; the
  steps and reversals in section 6; and a few examples for each theme in
  section 5.
- **What it does not have.** Most repeated fixes stay only in this file.
  Section 5 gives examples, not a full list.

Key: FEATURE (a new feature), BASE (a new base part), REMOVAL (removed,
replaced or reversed, or a default changed), BREAKING (old data, config or
behaviour breaks), REPEAT (a fix of a problem that comes again, with its
theme).

### 6.1 Key changes

| Release | Date | Kind | Quote | Where it belongs |
|---|---|---|---|---|
| v0.1.6 | 08-12 | FEATURE | "**Gemini CLI harness** — run bots on **Google's Gemini** models via the `gemini` CLI" | 8 row v0.1.6 (IN-SECTION 6 as "A CLI (v0.1.6)") |
| v0.1.14 | 08-13 | FEATURE | "a live **\"A ⇄ B\" channel** appears in your sidebar with their whole conversation" | 8 row v0.1.14 |
| v0.1.16 | 08-14 | REPEAT (turn/wait that does not end) | "**Approvals inside rooms** are visible and answerable; before, the bot waited out a 15-minute timeout in silence" | 5, turn/wait |
| v0.1.16 | 08-14 | FEATURE (approval model) | "**Always allow** remembers one specific tool — `Bash:git`, not \"any shell\"." | 6 approval model |
| v0.1.17 | 08-14 | REPEAT (engine sign-in and engine CLIs) | "engines are detected when you install them or sign in **while the app is running**" | 5, engine sign-in |
| v0.1.18 | 08-16 | REPEAT (engine sign-in) | "the auth check now reports what's actually true rather than guessing" | 5, engine sign-in |
| v0.1.22 | 08-17 | REMOVAL | "One Composio project key (`ak_…`) replaces the old two-key Connect flow." | 8 row v0.1.22 |
| v0.1.23 | 08-17 | REPEAT (turn/wait that does not end) | "so a handoff no longer looks like it is still running after it has stopped" | 5, turn/wait |
| v0.1.24 | 08-19 | BASE | "Bots have a real activity state, and the store announces its own writes" | 3 (event from the store) |
| v0.1.24 | 08-19 | BASE | "Approvals answer with a typed outcome, and a bot repeating itself is noticed" | 3 |
| v0.1.24 | 08-19 | REPEAT (secret in wrong place) | "secrets are scrubbed from what the harness stores" | 5, secret |
| v0.1.24 | 08-19 | REPEAT (busy and races) | "Permission broker rejects colliding ask ids and digests the thread id into its socket name" | 5, busy/races. v0.1.76 fixes the same socket again. |
| v0.1.24 | 08-19 | FEATURE | "**Bring your own VPS** as a computer backend" | 8 row v0.1.24 |
| v0.1.24 | 08-19 | FEATURE | "**USB Android control**, with an isolated Phone Harness skill" | 8 row v0.1.24 |
| v0.1.25 | 08-20 | FEATURE | "Codex peer-agent communication enabled (#273)" | 8 row v0.1.25 (fixes B, row v0.1.7-12) |
| v0.1.27 | 08-20 | REPEAT (in-app updates, new theme) | "Fix the macOS updater restart loop by staging updates before relaunch" | 5, new theme "updater" |
| v0.1.48 | 09-02 | FEATURE | "Simplify automations and add five-minute scheduling" | 4 automations |
| v0.1.48 | 09-02 | REPEAT (file written over / atomic write) | "Write MEMORY.md atomically" | 5, file written over |
| android-v1.1.0 | 09-03 | FEATURE | "**Call a bot.** A phone button in a chat opens a call" | 8 row v0.1.52/android |
| v0.1.54 | 09-05 | REPEAT (work done twice) | "fix(connectors): recover pending sign-ins without duplicate accounts" | 5, work done twice |
| v0.1.55 | 09-05 | REMOVAL (approval model) | "feat(approvals): bring native provider permission modes to parity" | 8 row v0.1.55; 6 approval model |
| v0.1.55 | 09-05 | REPEAT (work lost) | "fix: preserve existing bots and conversations during team import" | 5, work lost (also v0.1.25 ) |
| v0.1.59 | 09-06 | REPEAT (turn/wait; engine process control) | "fix: wait for Codex process shutdown" | 5, turn/wait |
| v0.1.60 | 09-06 | REMOVAL (approval model) | "feat(antigravity): add composer Auto full access" | 6 approval model (Full access exists here, before v0.1.109) |
| v0.1.61 | 09-07 | REPEAT (updater) | "fix(updater): stop premature restarts and update loops (0.1.61)" | 8 row v0.1.60-63; 5, new theme "updater" |
| v0.1.62 | 09-07 | FEATURE | "Run `openmausbot` to set up your AI connection, choose a model, optionally connect your phone, and open your workspace." | 8 row v0.1.60-63 |
| v0.1.62 | 09-07 | REPEAT (Windows process control) | "Windows browser startup and close/reopen no longer stall the bot's tool connection" | 5, Windows |
| v0.1.66 | 09-08 | FEATURE | "feat: per-bot Claude accounts with a nested account picker" | 8 row v0.1.65-66 |
| v0.1.68 | 09-09 | FEATURE | "configurable parallel work" | IN-ROW (8). 4 and 6 should change |
| v0.1.71 | 09-10 | REMOVAL | "chore: remove the Teach a skill recorder for now" | 8 row v0.1.71; 6 |
| v0.1.71 | 09-10 | REPEAT (secret in wrong place) | "fix(security): mask xAI, Groq, and Hugging Face API keys in redactSecrets" | 5, secret |
| v0.1.71 | 09-10 | REPEAT (usage and cost) | "Stop a conversation from paying for context it never asked for" | 5, usage and cost |
| v0.1.72 | 09-10 | REMOVAL (default changed) | "skill authoring on by default" | 8 row v0.1.72 |
| v0.1.74 | 09-11 | REPEAT (turn/wait) | "Approve for me answers itself when Claude's reviewer never starts" | 5, turn/wait |
| v0.1.74 | 09-11 | REPEAT (state lost at restart) | "fix(chat): retain accepted follow-ups across restarts" | 5, state lost at restart |
| v0.1.74 | 09-11 | REPEAT (state lost at crash) | "fix(desktop): recover the embedded server after a crash" | 5, state lost at restart |
| v0.1.74 | 09-11 | REPEAT (turn end / process control) | "fix(runtime): verify CLI shutdown before releasing turns" | 5, turn/wait |
| v0.1.76 | 09-12 | REPEAT (Windows process control) | "fix(atomic): retry a rename Windows refuses for a moment" | 5, Windows |
| v0.1.76 | 09-12 | REPEAT (Windows process control) | "fix: accept successful Windows CLI termination" | 5, Windows |
| v0.1.76 | 09-12 | REMOVAL (a quiet engine) | "replace hardcoded absolute timeout with renewable idle stream timeout" | 6 "A quiet engine" (first step, before v0.1.93) |
| v0.1.76 | 09-12 | REPEAT (turn/wait) | "fix(hermes): give the ACP model catalog probe a 15s deadline" | 5, turn/wait |
| v0.1.76 | 09-12 | REPEAT (secret/access in wrong place) | "fix(access): Off means no browser, and connected apps are per bot" | 5, secret/access |
| v0.1.76 | 09-12 | REPEAT (usage and cost) | "fix(budgets): enforce spend cap for channel turns" | 5, usage and cost |
| v0.1.76 | 09-12 | REPEAT (busy and races) | "fix(models): make thread and provider switching explicit and atomic" | 5, busy/races |
| v0.1.77 | 09-13 | REPEAT (flaky tests and red main) | "fix(ci): unblock main — refresh the stale Ukrainian strings and give the serial test job margin" | 5, flaky/red main |
| v0.1.77 | 09-13 | REPEAT (access in wrong place) | "fix(security): gate computer sharing behind a flag that defaults off" | 8 row v0.1.77; 5, access |
| v0.1.77 | 09-13 | REPEAT (Windows) | "fix(windows): avoid shared-terminal timeouts caused by PowerShell module discovery" | 5, Windows |
| v0.1.77 | 09-13 | FEATURE | "feat(teams): interactive canvas and shared Box computers" | 8 row v0.1.77 (teams exist before the v0.1.87 row "Teams") |
| v0.1.78 | 09-13 | REPEAT (approval model) | "fix: make Full Access genuinely hands-off" | 8 row; 6 approval model |
| v0.1.78 | 09-13 | FEATURE | "feat(routines): add monthly, yearly and timezone-aware cron schedules" | 8 row |
| v0.1.78 | 09-13 | REPEAT (busy and races) | "fix(coordination): typing never cancels teammates, and Stop stays in its own conversation" | 8 row |
| v0.1.79 | 09-15 | REMOVAL | "Run cloud turns on the Box itself, drop the local computer relay" | 8 row (add "drop the local computer relay") |
| v0.1.79 | 09-15 | REPEAT (tool list size) | "fix(browser): text-only bounded results and slim tool schemas for the built-in browser" | 5 tool list size |
| v0.1.79 | 09-15 | REPEAT (engine CLIs that change) | "fix(claude): detect --autocompact from claude --help instead of hardcoded floor" | 5 engine CLIs |
| v0.1.79 | 09-15 | FEATURE | "feat(sidebar): cross-bot attention inbox in the thread picker" | 8 row |
| v0.1.80 | 09-15 | FEATURE | "feat(threads): reversible archive with attention resurface" | 8 row |
| v0.1.80 | 09-15 | REPEAT (busy and races) | "fix(rooms): park queued handoffs behind busy teammates in their own queue window" | 8 row |
| android-v1.3.0 | 09-15 | FEATURE / BREAKING | "as soon as a bot had a second thread, every message from the phone was refused" | 8 row (row names only v0.1.81 changes) |
| v0.1.81 | 09-15 | FEATURE | "feat(surfaces): one place per turn, chosen by a person and shown everywhere" | 8 row |
| v0.1.81 | 09-15 | FEATURE | "Pair a phone's native app with a self-hosted server" | 8 row |
| v0.1.81 | 09-15 | REPEAT (engine CLIs / config) | "feat(engines): warn while OMB_CLAUDE_INHERIT_USER_CONFIG is set, and document it" | 5 (relates to v0.1.175 "stop reading the config files") |
| v0.1.82 | 09-16 | REPEAT (approval model) | "fix(opencode): honor Full access for native tools and external folders" | 6 approval model |
| v0.1.83 | 09-16 | REPEAT (approval model) | "feat(approvals): a Chief of Staff's Full access covers the work it delegates" | 8 row; 6 approval model |
| v0.1.83 | 09-16 | REPEAT (approval model) | "feat(engines): pass Qwen Code's and Gemini CLI's approval modes through" | 6 approval model |
| v0.1.83 | 09-16 | REPEAT (busy and races) | "fix(routines): dispatch scheduled work into a free thread slot" | IN-SECTION 6 (thread slot step 2); 8 row lacks it |
| v0.1.83 | 09-16 | REPEAT (Windows process control) | "fix(electron): stale Windows data-dir lease after same-boot PID reuse" | IN-SECTION 5 (Windows); 8 row lacks it |
| v0.1.83 | 09-16 | REPEAT (flaky tests and red main) | "test: green main — Qwen/Gemini approval flags, and the approval smoke's read count" | 5 flaky |
| v0.1.84 | 09-17 | REPEAT (busy and races) | "fix(vps): several turns per bot at once — only the desktop is exclusive, and only once used" | 8 row; 6 "Busy" sequence |
| v0.1.85 | 09-20 | REPEAT (work done twice) | "fix(routines): prevent duplicate agent-created schedules" | 5 work twice |
| v0.1.85 | 09-20 | REPEAT (turn/wait) | "fix(browser): a timed-out browser no longer wedges its session for good" | 5 turn/wait |
| v0.1.85 | 09-20 | REPEAT (approval model) | "fix(approvals): let Full access stop the asking on OpenAI-compatible engines" | 6 approval model |
| v0.1.85 | 09-20 | REPEAT (busy and races) | "fix(computers): gate VM provisioning and close browser claim races" | 5 busy |
| v0.1.85 | 09-20 | REPEAT (red main) | "fix(ci): unblock main and repair remaining verification failures" | 5 flaky |
| v0.1.85 | 09-20 | FEATURE | "feat(browser): let a bot attach to an already-running Chrome over CDP" | 8 row; 6 browser sequence |
| v0.1.86 | 09-23 | REPEAT (busy and races) | "fix: admit classic delegations on a free thread slot instead of whole-bot idle" | IN-SECTION 6 (thread slot step 3); 8 row lacks it |
| v0.1.86 | 09-23 | REPEAT (secret in wrong place) | "fix: data-dir hygiene (token files out of backups, owner-only registries, control-plane env)" | 5 secret; 8 row |
| v0.1.86 | 09-23 | REPEAT (access right) | "fix(server): close per-bot visibility leaks found in review (follow-up to #1717)" | 5 secret/access |
| v0.1.86 | 09-23 | REPEAT (usage and cost) | "fix(usage): count Codex/OpenRouter spend, book turns to who started them" | 5 usage |
| v0.1.86 | 09-23 | REPEAT (tool list size) | "refactor(agents): split the tools proxy into catalog, client and call core, and measure the catalog's wire size" | 5 tool list size |
| v0.1.86 | 09-23 | REPEAT (approval model) | "fix: keep Chiefs available during handoffs and apply Full Access to all threads" | 6 approval model |
| v0.1.86 | 09-23 | REPEAT (flaky tests) | "test: make delegation, fixture and UI waits deterministic under load" | 5 flaky |
| v0.1.87 | 09-24 | BASE | "feat(ask): shared question spine and Codex multi-question answers" | 8 row |
| v0.1.87 | 09-24 | REPEAT (busy / turn not end) | "Bound delegation busy holds and arm the stall watchdog at turn admission" | 5 busy / turn |
| v0.1.87 | 09-24 | REPEAT (work done twice) | "fix(groups): post shared requests once for all recipients" | 5 work twice |
| v0.1.87 | 09-24 | REPEAT (turn does not end) | "fix(server): end the turn when its lazy computer claim rejects" | 5 turn |
| v0.1.87 | 09-24 | REPEAT (usage and cost) | "fix(usage): headline the tokens actually bought, not the thread re-read each turn" | 5 usage |
| v0.1.87 | 09-24 | REPEAT (approval model) | "feat(permissions): add command allowlist in composer and bot settings" | 6 approval model |
| v0.1.87 | 09-24 | REPEAT (secret) | "fix(teams): Share team never stuck on skills; keep keys out of connection addresses" | 5 secret |
| v0.1.87 | 09-24 | REPEAT (red main) | "test: unblock main — update #1758-stale e2e assertions and fix two e2e races" | 5 flaky |
| v0.1.88 | 09-26 | FEATURE (later REMOVAL) | "feat(server): tightening-only request schema for authority reductions" | IN-SECTION 6 (features that lived for weeks); 8 row lacks it |
| v0.1.89 | 09-27 | REMOVAL | "chore(cli): remove Requesty integration" | 8 row |
| v0.1.89 | 09-27 | FEATURE | "feat: add opt-in backup model recovery for ACP startup failures" | 8 row (earlier step of the v0.1.111/v0.1.142 backup engine) |
| v0.1.89 | 09-27 | REPEAT (engine sign-in) | "fix(ui): Claude disappears from the picker when Claude Code is signed out or not found" | 5 engine sign-in |
| android-v1.5.0 | 09-27 | BREAKING (security) | "Public plain-HTTP servers are refused." | 8 row (row names only v0.1.89 changes) |
| v0.1.90 | 09-29 | FEATURE (later REMOVAL) | "feat(computer): consented, cost-visible, idle-stopped cloud overflow for waits" | IN-SECTION 6; 8 row lacks it |
| v0.1.90 | 09-29 | REPEAT (turn/wait) | "fix(handoffs): renew the hard-cap stall window on durable progress" | 5 turn/wait; 6 quiet engine |
| v0.1.90 | 09-29 | REPEAT (flaky / Windows) | "fix: make the Windows vitest shards pass again (eval line endings, cloud home data path)" | 5 flaky |
| v0.1.91 | 09-29 | FEATURE / change of direction | "feat(cloud): Move to Cloud — one button from this computer to the Cloud home" | 8 row; 6 "Where the data is" (earlier than v0.1.117) |
| v0.1.91 | 09-29 | REPEAT (secret) | "fix(server): strip every shared credential from the CLI probe and Claude update env" | 5 secret |
| v0.1.91 | 09-29 | REPEAT (access right) | "fix(security): owner-scope computer sharing and harden what a lent Mac exposes" | 5 secret/access |
| v0.1.91 | 09-29 | REPEAT (red main) | "Fix main's UI rule tests (blocks the v0.1.91 release)" | 5 flaky |
| v0.1.92 | 10-01 | FEATURE | "feat: official ChatGPT plan sign-in and model routing" | 8 row |
| v0.1.92 | 10-01 | REPEAT (secret) | "Engines: fix OpenCode model failures and auth errors, stop a router key leak, faster Antigravity" | 5 secret |
| v0.1.92 | 10-01 | REPEAT (access right) | "fix(security): keep a guest's conversation out of a bot's memory on a Cloud home" | 5 secret/access |
| v0.1.92 | 10-01 | REPEAT (busy and races) | "fix(routines): defer scheduled/webhook dispatch behind a busy workspace lease instead of failing it" | 5 busy |
| v0.1.92 | 10-01 | REPEAT (usage and cost) | "fix(acp): count cache reads in a turn's input" | 5 usage (earlier than v0.1.170 "Cached input is counted") |
| v0.1.94 | 10-02 | REPEAT (approval model) | "A Chief of Staff's approval level flows down to the threads it opens" | 8 row; 6 approval model |
| v0.1.95 | 10-03 | REPEAT (work done twice) | "Delegation: follow-ups continue the same thread everywhere (no duplicate parallel work)" | 8 row; 5 work twice |
| v0.1.96 | 10-05 | REMOVAL | "That rule is gone; threads run side by side like several coding sessions in one repo." | IN-SECTION 6 ("Busy" row); 8 row lacks it |
| v0.1.96 | 10-05 | REPEAT (state lost at restart) | "Since v0.1.90 it forgot it on every restart on every OS" | 5 state lost; 8 row |
| v0.1.96 | 10-05 | REMOVAL (default changed) | "**On Auto, bots don't touch a cloud computer.**" | 8 row |
| v0.1.96 | 10-05 | FEATURE | "**Copy this computer's workspace to any server you add.**" | 8 row; 6 "Where the data is" |
| v0.1.96 | 10-05 | BASE (security) | "feat(trust): activity log, outbound gate, connection scopes, account fallback, team memory" | 8 row |
| v0.1.96 | 10-05 | REPEAT (flaky tests) | "test: make the two Windows-flaky tests deterministic (team-memory budget, dispatch-supersede eval)" | 5 flaky |
| v0.1.97 | 10-06 | REPEAT (busy and races; regression of the v0.1.96 kept-warm session) | a message sent right after Stop was refused ("a turn is already running on this thread") | 5, "Busy" and races; or the 8 row |
| v0.1.97 | 10-06 | REMOVAL | The "Computer" choice in the model list is gone. | 6 (a feature removed). The 8 row has it, section 6 does not. |
| v0.1.98 | 10-07 | REPEAT (work done twice / the continuation feature corrected one day later) | A provider's rate limit no longer starts a "Continue:" thread, and a continuation never takes over the thread you're in. | 8 row or 5 |
| v0.1.98 | 10-07 | REPEAT (tool list size) | Agents tools: ordinary bots stop carrying the Chief of Staff's tools on every request | 5, tool list size (an extra example) |
| v0.1.99 | 10-07 | REPEAT (engine sign-in) | An expired ChatGPT sign-in for Codex says so. | 5, engine sign-in (an extra example) |
| v0.1.101 | 10-08 | REPEAT (flaky tests; Windows) | The causes of false CI failures are also fixed: a Windows port clash, Windows timeouts, known flaky tests (retried and listed) and macOS machines that never started. | 5, flaky tests |
| v0.1.103 | 10-09 | REPEAT (engine CLIs that change) | "Update Claude for me" works. It now updates the copy of Claude Code the app uses. | 5, engine sign-in and CLIs |
| v0.1.104 | 10-09 | FEATURE (new product area) | A new **Data** tab in the Computer panel, powered by DuckDB, with one database per bot on your computer. | 4. No earlier release names DuckDB or Data (grep). The 8 row has it, section 4 does not. |
| v0.1.104 | 10-09 | REPEAT (secret or access right in wrong place) | your personal `~/.claude/CLAUDE.md` no longer reaches bots that run isolated. | 5, secret or access right |
| v0.1.104 | 10-09 | Note for tool list theme | Data: DuckDB analytics in the Computer panel, with five bot tools | 5 or 7. Five tools added on day 59, five removed on day 63. |
| v0.1.108 | 10-13 | BASE | Every turn a root: cards park, work continues, Stop means stop (4/5) | 3 (part of the job runtime row) or 8 row |
| v0.1.108 | 10-13 | REPEAT (work done twice) | A turn that already sent, posted, committed or paid is never rerun. | 5, work done twice; 8 row |
| v0.1.108 | 10-13 | REPEAT (state lost at restart) | A job a Chief hands to teammates now runs on one durable job record: a restart no longer ends it | 5, state lost at restart |
| v0.1.108 | 10-13 | REPEAT (approval model) | Full access stays on. Changing a bot's engine no longer resets it to Ask | 5 or 6, approval model |
| v0.1.108 | 10-13 | REMOVAL / approval step | Approved MCP read tools are remembered across tasks. | 6, approval model. Section 6 starts "approvals kept for an exact tool" at v0.1.176; this is an earlier step. |
| v0.1.109 | 10-14 | BREAKING (config name) | The setting that points OpenMausBot at another Boat API is now `OMB_BOAT_API`; it was `OMB_BOX_API`. | 8 row |
| v0.1.109 | 10-14 | REPEAT (memory and processes) | Browsers a crash left behind are cleaned up at start, and an unused browser closes after 10 minutes (sign-ins are kept). This frees a lot of memory on busy machines. | 5, memory and processes |
| v0.1.110 | 10-15 | REPEAT (engine sign-in) | Codex isn't signed in on this computer. Sign-ins don't copy over when you move to My Cloud. | 5, engine sign-in |
| v0.1.110 | 10-15 | REPEAT (work done twice) | Groq, Mistral, Cerebras and Meta bots no longer get the history twice each turn. | 5, work done twice |
| v0.1.111 | 10-15 | REPEAT (tool list size; off by default) | a find_tool / use_tool bridge that cuts the tool list a bot is sent each turn by 65-74% (opt-in; Claude Code and API models) | 5, tool list size |
| v0.1.111 | 10-15 | REPEAT (approval model) | One compact approval card. A permission ask is now one short row with Deny and Allow once. | 6, approval model. Note: 8 row v0.1.133 says "One card for questions and approvals". |
| v0.1.112 | 10-15 | FEATURE | "**HighLevel (GoHighLevel, Growably and other white-labels).** Open Connected apps, choose Connect on the HighLevel card" | 8 row v0.1.112 |
| v0.1.112 | 10-15 | FEATURE | "**Files.** A new Files page in the sidebar shares a folder from this computer with My Cloud" | 8 row v0.1.112; maybe 4 |
| v0.1.112 | 10-15 | REMOVAL | "**Quoting selected text into your message** (added in 0.1.111) is taken out again while it is reworked." | 8 row; 6 (a small reversal one release later) |
| v0.1.113 | 10-16 | FEATURE | "**Buy MausBot Cloud in the app.**" | 8 row v0.1.113 |
| v0.1.113 | 10-16 | FEATURE | "**Bring your skills and tools from other AI apps.**" | 8 row v0.1.113 |
| v0.1.113 | 10-16 | BREAKING / REPEAT (secret or access right in the wrong place) | "**Self-hosted servers:** a browser on the same machine now signs in once with the link that `openmausbot serve` prints. It is no longer trusted automatically." | 8 row v0.1.113; 5 secret theme |
| v0.1.113 | 10-16 | REPEAT (secret or access) | "**Web pages no longer get owner access** to OpenMausBot running on the same computer, and the phone link on the desktop needs a token." | 5 secret theme (a strong example) |
| v0.1.113 | 10-16 | REPEAT (secret or access) | "**A bot can't read a password it just filled.**" | 5 secret theme |
| v0.1.114 | 10-16 | FEATURE | "**Connected apps on MausBot Cloud.**" | 8 row v0.1.114 |
| v0.1.114 | 10-16 | REPEAT (state lost at restart) | "**Replies streamed before a quit or restart are kept** for Antigravity and other ACP engines." | 5 state-lost theme |
| v0.1.115 | 10-17 | REMOVAL (approval model) | "**No more permission prompts from OpenMausBot itself.** When a bot changes its profile, a teammate's model, the team setup or the team's memory, the change now just happens." | 6 approval row (v0.1.115 is not in it); the row only quotes "New bots start at Full access" |
| v0.1.115 | 10-17 | REPEAT (approval model) | "**Routines at Full access on a Cloud no longer stall on a prompt.**" and "**Antigravity bots set to Full access no longer ask for approvals,**" | 5 approval theme |
| v0.1.115 | 10-17 | FEATURE / REPEAT (turn or wait that does not end) | "**Routines recover by themselves.**" ... "now waits or tries once more on its own, instead of failing." | 8 row v0.1.115 |
| v0.1.116 | 10-18 | REPEAT (secret or access) | "**Stripe secret and restricted keys** are hidden in logs and chats, like other keys." | 5 secret theme |
| v0.1.117 | 10-19 | FEATURE | "**Run when my AI limit resets.**" ... "a turn that hits a usage limit continues on the backup and says so." | 8 row v0.1.117 |
| v0.1.117 | 10-19 | REMOVAL (a paid gate removed) | "**Live calls for everyone.** You no longer need a paid plan for Live calls." | 6 (a Pro gate was added in v0.1.108 at , partly removed in v0.1.109 , and fully removed here) |
| v0.1.117 | 10-19 | REPEAT (secret or access) | "**Shared workspaces: Mark all as seen on routine runs only covers bots you can see.**" | 5 secret/access theme |
| v0.1.118 | 10-19 | REPEAT (memory and number of processes) | "Bots on OpenCode share one engine process instead of starting one each." | 5 memory theme (the theme already cites v0.1.118) |
| v0.1.120 | 10-20 | FEATURE | "**Today page:** what your bots finished, what needs you, and the time they saved you." | IN-SECTION 6, not in the row |
| v0.1.120 | 10-20 | REPEAT (state shown before it is saved) | "**Rooms:** a room's chats and settings are saved before they are shown." | 8 row; this repeats the v0.1.115 thread fix . Section 7 has this problem; section 5 has no theme for it |
| v0.1.120 | 10-20 | REPEAT (engine sign-in) | "**\"Use this key for every Claude bot\" no longer stops \"Claude (API key)\" bots.**" | 5 engine sign-in theme |
| v0.1.121 | 10-21 | REPEAT (memory and number of processes) | "**A busy Cloud stays up.** When many bots browse at once, new work waits for memory instead of bots being stopped" | 5 memory theme |
| v0.1.121 | 10-21 | REPEAT (busy and races) | "the screen is free for its next call right away, instead of being refused as \"in use locally\" for 40 seconds." | 5 busy theme |
| v0.1.122 | 10-22 | FEATURE | "**Publish a page to its own link.**" | 8 row v0.1.122 |
| v0.1.122 | 10-22 | REPEAT (work done twice) | "Automations switch on in My Cloud and off on this computer, so nothing runs twice." | 5 twice theme |
| v0.1.123 | 10-22 | REPEAT (turn or wait that does not end / quiet engine) | "**A bot running a long tool keeps going.** It is no longer stopped as stalled after 20 minutes." | 6 "A quiet engine" row; 5 turn/wait theme |
| v0.1.123 | 10-22 | REMOVAL | "The brief replaces the Today page." | IN-SECTION 6 |
| v0.1.123 | 10-22 | REPEAT (move to the Cloud gets stuck; new theme) | "**Moving to My Cloud no longer gets stuck.**" | new theme |
| v0.1.124 | 10-23 | REPEAT (turn or wait that does not end) | "**A sign-in card for an app no longer waits forever** after its link expires." | 5 turn/wait theme |
| v0.1.125 | 10-23 | REPEAT (secret or access) | "**Private chats are private.** A member's private chat with a team bot is theirs alone. The team's owner and admins can't open it either." | 8 row v0.1.125; 5 secret/access theme |
| v0.1.125 | 10-23 | FEATURE | "**Departments.** The sidebar's bot groups are now called departments." | 8 row; reversed in v0.1.128 (see below) |
| v0.1.125 | 10-23 | REPEAT (usage and cost numbers) | "**Cursor bots use Fast only with a -fast model,** instead of always being billed as Fast." | 5 usage theme |
| v0.1.126 | 10-24 | REPEAT (tool list size) | "If a model can't take so many tools, the bot retries quietly with fewer, and says so plainly if it still can't." | 5 tool-list theme |
| v0.1.126 | 10-24 | REPEAT (engine sign-in / engine CLIs) | "**Engines you installed on a Cloud work again.** OpenCode, Grok, Kimi, Antigravity, Cursor and others that you added yourself could fail every turn." | 8 row v0.1.126; 5 engine theme |
| v0.1.126 | 10-24 | REMOVAL (approval model) | "**Question and approval cards no longer expire.**" | 6 approval row |
| v0.1.126 | 10-24 | FEATURE | "**Every bot reports to someone.**" ... "**Each person can have their own Chief of Staff.**" | 8 row v0.1.126 |
| v0.1.126 | 10-24 | REPEAT (secret or access) | "**Private chats stay private inside the engines too.**" | 5 secret/access theme |
| v0.1.127 | 10-24 | REPEAT (server stops on one bad event) | "**OpenMausBot no longer stops when a connected window's session ends,**" | 8 row v0.1.127 (it pairs with the v0.1.128 hardening line) |
| v0.1.128 | 10-27 | REMOVAL (reversal) | "Departments are folders now, not walls: any bot can ask any other bot for help" | 6 (departments named v0.1.125 and changed 4 days later) |
| v0.1.128 | 10-27 | REMOVAL (a default changed) | "The desktop app now shares its internet connection with My Cloud by default" | 8 row v0.1.128 |
| v0.1.128 | 10-27 | FEATURE | "up to 16 parallel threads per bot, and the main chat never waits in line." | 8 row v0.1.128; 4 and 6 |
| v0.1.128 | 10-27 | REPEAT (secret or access) | "The password never reaches the AI." and "Reads that hand out a stored secret need the desktop app or the same page." | 5 secret theme (the theme already cites v0.1.128 data_sql) |
| v0.1.128 | 10-27 | REPEAT (busy and races) | "browser start/stop races fixed" | 5 busy theme |
| v0.1.129 | 10-27 | REPEAT (work done twice) | "HighLevel: refreshes keep their own sign-in, creates are never sent twice, and long lists page through." | 5 twice theme |
| v0.1.129 | 10-27 | REMOVAL (approval model) | "Change a bot's approval level while it works: the new level applies to what it does next." | 6 approval row |
| v0.1.130 | 10-27 | BASE (security boundary) | "**Only the OpenMausBot app on this computer can let bots use it.** Another server running on the same computer can no longer reach your screen." | 8 row v0.1.130; 5 "secret or access right in wrong place" |
| v0.1.131 | 10-28 | REPEAT (tool list size) | "**Your own MCP tools on Claude load when the bot needs them,** through Claude Code's tool search, so long tool lists no longer crowd every turn." | 5 "tool list size" |
| v0.1.131 | 10-28 | FEATURE / REPEAT (engine CLIs) | "**Connected apps work the same on every AI.** ... Switching a bot's AI no longer quietly breaks its routines." | 8 row v0.1.131 |
| v0.1.131 | 10-28 | REPEAT (secret or access right) | "fix(composio-broker): bind MCP sessions to the current acting user" | 5 "secret or access right" |
| v0.1.132 | 10-29 | REMOVAL / approval model | "**A bot reading its own files never asks you.** Its instructions, skills, memory and conversation folders are its own, so unattended routines no longer stall waiting for an approval to read them." | 6 "The approval model"; 5 "approval model" |
| v0.1.132 | 10-29 | REPEAT (memory and processes) | "Fewer \"Waiting for memory\" holds on smaller Clouds: the memory check counts what engines really use." | 5 "memory and number of processes" |
| v0.1.132 | 10-29 | REPEAT (tool list size) | "Bots carry a smaller list of OpenMausBot's own tools in each turn: compact schemas, and fewer tools where a turn can't use them." | 5 "tool list size" |
| v0.1.133 | 10-29 | REPEAT (engine CLIs) | "Fix Grok Build ACP sign-in for current CLI" | 5 "engine sign-in and CLIs" (name must not be used in our text; cite by version only) |
| v0.1.133 | 10-29 | REMOVAL (CI direction) | "ci: main runs Linux and one macOS job; Windows and macOS suites run nightly, by hand and in the release lane" | 5 "flaky tests and red main" (context) |
| v0.1.134 | 10-30 | REMOVAL (small) | "a Cloud's sidebar is plain, with no night sky or stars." (reverses v0.1.131 4770 "A faint night sky at the top of a Cloud's own sidebar") | none (cosmetic; reversal in 3 days) |
| v0.1.135 | 10-31 | FEATURE / direction (where the data is) | "**A server of your own can be your bots' home.** ... This computer's bots, chats, memory and routines move there" | 8 row v0.1.135; 6 "Where the data is" |
| v0.1.135 | 10-31 | REPEAT (memory and processes) | "**Short on memory.** When a Cloud runs short on memory, a bot's browser or tool stops first, never the whole workspace." | 5 "memory and number of processes" |
| v0.1.135 | 10-31 | REPEAT (usage and cost) | "**Where your usage went.** ChatGPT and other models without a listed price now show in \"Where it went\"." | 5 "usage and cost numbers" |
| v0.1.135 | 10-31 | REPEAT (work done twice) | "Two teammates asking a bot the same thing at the same time get one answer." | IN-ROW; add to 5 "work done twice" |
| v0.1.135 | 10-31 | REPEAT (regression) | "**Bots can ask you questions on Clouds again.** The question tool failed every time on a Cloud." | none needed |
| v0.1.136 | 10-31 | BASE (context) | "**Faster first answers on long conversations.** A long conversation is summarized while it sits idle" | 8 row v0.1.136 |
| v0.1.136 | 10-31 | REMOVAL / approval model | "**Just do it means just do it.** In Just do it mode, a bot doesn't stop to ask you along the way" | 6 "The approval model" |
| v0.1.136 | 10-31 | REMOVAL (UI) | "The collapse button and the Sidebar density setting are gone." | none (UI) |
| v0.1.136 | 10-31 | REPEAT (turn/wait) | "**Rooms.** A room turn waits for a running tool instead of stopping at its limit." | 6 "A quiet engine" |
| v0.1.136 | 10-31 | REMOVAL (default changed) | "A command on a lent computer returns its output when it hits its limit, and may run up to 15 minutes." (v0.1.130 4660 said "runs up to 2 minutes") | none (note only) |
| v0.1.137 | 11-01 | BREAKING (old page vs new app) | "After updating to 0.1.136, a window whose Cloud hadn't updated yet could show only the rail of places and an empty page." | IN-ROW |
| v0.1.137 | 11-01 | REPEAT (turn/wait) | "**Goals:** a one-on-one goal whose turn keeps losing its slot now stops as blocked instead of retrying forever." | 5 "turn/wait" |
| v0.1.137 | 11-01 | REPEAT (access right) | "**Shared workspaces:** MausBot's notification tools now refuse on any shared workspace, not only a Team Cloud." | 5 "secret or access right" |
| v0.1.138 | 11-02 | REPEAT (Windows process control) | "Windows: a reused pid no longer holds the data-directory lease when wmic is missing" | 5 "Windows" (the same bug as v0.1.83, came again) |
| v0.1.138 | 11-02 | REPEAT (secret) | "fix(redact): mask GitLab personal, deploy and runner tokens"; "fix(redact): mask Basic credentials in an Authorization header"; "fix(redact): mask Slack app-level tokens (xapp-)" | 5 "secret" |
| v0.1.139 | 11-03 | REPEAT (tool list size) | "Chat engine: servers past the tool limit stay reachable through the directory, and the bot shows its tool budget" | 5 "tool list size" |
| v0.1.139 | 11-03 | REPEAT (memory and processes) | "**Small servers:** idle engines close sooner on machines with 1.5 GB of memory or less, and Node's memory limit follows the machine's." | 5 "memory and number of processes" |
| v0.1.139 | 11-03 | REPEAT (turn end) | "fix(acp): fail a turn whose whole reply is a provider error body" | 5 "turn that does not end" (a quiet success; sibling of v0.1.86 row) |
| v0.1.139 | 11-03 | REPEAT (usage and cost) | "fix(usage): show a Claude plan's monthly spend, with its amounts" | 5 "usage and cost" |
| v0.1.139 | 11-03 | BASE (performance) | "the app loads about a third less code at launch, and the server sleeps when nothing is due." | IN-ROW (partly) |
| v0.1.140 | 11-03 | REPEAT (Windows process control) | "fix(browser): free a Windows profile held by an orphaned Chrome (exit code 21)" | 5 "Windows" (taskkill already cited) |
| v0.1.140 | 11-03 | REPEAT (busy and races) | "Fix DeepSeek Harness \"session is already active\" when a turn's tools change" | 5 "busy and races" |
| v0.1.140 | 11-03 | REPEAT (usage and cost) | "fix(pi): book pi's priced cost and cached tokens on turn.completed"; "Plan usage: don't show the default Codex account's limit on a ChatGPT-plan provider" | 5 "usage and cost" |
| v0.1.140 | 11-03 | REPEAT (secret or access right) | "A team export now leaves out members' private chats." | 5 "secret or access right" |
| v0.1.140 | 11-03 | BASE (outside work) | "**Threads from outside work:** a thread opened by work that came in from outside now stays with that work." | 8 row v0.1.140 (with below) |
| v0.1.141 | 11-05 | BASE (security boundary) | "Work started from outside, such as webhooks or other people, stays confined to that work and what it hands on, and can't reach your private conversations, memory or rooms." | 8 row v0.1.141; 3 (base part); 7 "Who sent a message" |
| v0.1.141 | 11-05 | REMOVAL / approval model | "At Full access, bots send messages through connected apps without asking, up to 25 a day." (reverses v0.1.111 3427 "without a \"Send on your behalf?\" card or a daily limit") | 6 "The approval model" |
| v0.1.141 | 11-05 | REPEAT (turn/wait) | "Work handed from one bot to another no longer stalls after a Cloud wakes from sleep. Before, it could wait up to an hour." | 5 "turn/wait" |
| v0.1.141 | 11-05 | REPEAT (turn end) | "A bot that works around a failed tool call now finishes its turn normally, on every model." | 5 "turn that does not end" |
| v0.1.141 | 11-05 | REPEAT (work done twice) | "Results coming back from a teammate no longer send you a second notification." | 5 "work done twice" |
| v0.1.141 | 11-05 | REPEAT (state lost at restart) | "Connected apps keep their saved keys when they restart, so you aren't asked for the same password again." | 5 "state lost at restart" |
| v0.1.141 | 11-05 | REPEAT (Windows process control) | "The built-in browser no longer restarts on every action, which opened command windows, dropped the live view and slowed the PC." | 5 "Windows" |
| v0.1.141 | 11-05 | REPEAT (engine sign-in and CLIs) | "fix(codex): count Codex 0.165's API-key login as signed in"; "fix(claude): an unreadable sign-in check leaves the account unconfirmed, not signed out" | 5 "engine sign-in and CLIs" |
| v0.1.141 | 11-05 | REPEAT (busy and races) | "fix(codex): start a turn only after its MCP servers finish starting"; "Normal bot work no longer locks a bot out of the lent Mac" | 5 "busy and races" |
| v0.1.141 | 11-05 | REPEAT (secret) | "fix(redact): mask SendGrid API keys (SG.…)"; "fix(redact): mask PyPI API tokens (pypi-AgE…)"; "fix(logins): mask a held password in its form-urlencoded spelling" | 5 "secret" |
| v0.1.141 | 11-05 | REPEAT (access right, regression) | "Only a person's own request opens threads on a bot itself, again" | 5 "secret or access right" |
| v0.1.141 | 11-05 | REPEAT (tool list size) | "Claude: leave out four built-in tools no bot can use (4,889 tokens less per model call)" | 5 "tool list size" (already cited) |
| v0.1.141 | 11-05 | REPEAT (turn/wait) | "If some things never arrive, the rest still moves, the reason is shown, and the move no longer freezes every hour." | 5 "turn/wait" (move to the Cloud; sibling of v0.1.127 "could sit there for hours") |
| v0.1.142 | 11-05 | FEATURE | "Bots make images in the chat, with a backup provider if the first one fails." | 8 row (or section 4) |
| v0.1.142 | 11-05 | FEATURE | "A Chief can answer, for you, a question a teammate asks you." | 8 row |
| v0.1.142 | 11-05 | BASE (security) | "A signed-in session ends after its idle window passes." | 3 |
| v0.1.142 | 11-05 | REPEAT | "Temporary AWS access keys are masked in logs and chats." | 5/secret in wrong place |
| v0.1.142 | 11-05 | REPEAT | "A computer's sleep no longer counts as a turn going silent." | 5/turn or wait that does not end (quiet engine, section 6) |
| v0.1.142 | 11-05 | REPEAT | "No more getting stuck on \"Opening My Cloud…\" after moving bots to a server." | 5/turn or wait that does not end |
| v0.1.142 | 11-05 | REPEAT | "Slow engine detection no longer hides existing chats." | 5/new theme "one slow part blocks all" |
| v0.1.142 | 11-05 | REPEAT | "* Main green again: server/index.ts size, Linux dictation smoke by @milind-soni" | 5/flaky tests and red main |
| v0.1.142 | 11-05 | REPEAT | "Claude isn't held back at a full window while your paid extra usage still has room." | 5/usage and cost numbers |
| v0.1.142 | 11-05 | REPEAT | "Cursor installs from its card on a Cloud, fixes a wrong CLI path by itself, and signs in with a link." | 5/engine sign-in and CLIs |
| v0.1.142 | 11-05 | REPEAT (approval) | "Bots can turn their own skills on or off, or delete them, once you approve." | 6/approval model |
| v0.1.143 | 11-06 | BASE | "* E2E phone connection: wire spec v1, Node reference and test vectors by @milind-soni" | 3 (a versioned wire spec with test vectors) |
| v0.1.143 | 11-06 | REPEAT | "* Make four release-gate flakes reliable (one real data-interrupt bug) by @milind-soni" | 5/flaky tests and red main |
| v0.1.143 | 11-06 | FEATURE | "**Command Code** is now a built-in engine." | 8 row (minor) |
| v0.1.144 | 11-06 | REMOVAL | "There's no daily cap any more." | 6/approval model (it comes with "two choices") |
| v0.1.144 | 11-06 | BASE | "The groundwork for teams on their own servers: a server reachable at your own domain with its own HTTPS, a tunnel when no port can be opened, signed updates that roll back on a failed check, and an audit log the server's owner can read." | 3 |
| v0.1.144 | 11-06 | FEATURE | "If your bots live on My Cloud, your computer now sits on the left rail beside it." | 6/where the data is |
| v0.1.144 | 11-06 | FEATURE | "Team Clouds can now sleep when nobody is using them" | 8 row |
| v0.1.145 | 11-06 | REPEAT | "**OpenCode:** one thread per folder in a shared process, fixing the mid-turn \"capability has expired\" error" | 5/engine CLIs that change |
| v0.1.145 | 11-06 | REPEAT | "**Chat engine** mounts every tool of an MCP server, within each provider's real tool limit." | 5/tool list size |
| v0.1.145 | 11-06 | REPEAT | "**Voice notes** are kept on every turn ending, and files a thread parked are delivered when its turn settles." | 5/work done twice or lost |
| v0.1.145 | 11-06 | REPEAT | "* A sign-in the app sees only in a status read ends the engine's signed-out hold by @milind-soni" | 5/engine sign-in |
| v0.1.145 | 11-06 | REPEAT | "* Own server: the home's secrets in a read-only file, and CAP_SYS_ADMIN only for the hidepid remount by @milind-soni" | 5/secret in wrong place |
| v0.1.146 | 11-07 | BASE | "Updates happen only when no bot is using the engine. The new version is checked before it replaces the old one, and the old one stays if anything goes wrong." | 3 (an answer to "engine CLIs that change") |
| v0.1.146 | 11-07 | BREAKING (migration) | "OpenCode copies installed before version 2 move to version 2 with your sessions, keys and models kept." | 5/engine CLIs that change |
| v0.1.146 | 11-07 | REMOVAL (default) | "When the app starts, it reopens the place that was open when you closed it" | 6/where the data is (v0.1.144 says "The app still opens My Cloud first." ) |
| v0.1.146 | 11-07 | REPEAT | "A bot only says a voice note is recorded once the audio is saved." | 5/work lost (also a status that is not true) |
| v0.1.147 | 11-07 | REPEAT | "OpenCode chats on a Cloud failed in every conversation after a bot's first one" | 5/engine CLIs that change |
| v0.1.147 | 11-07 | FEATURE (area) | "Paste a Google Meet, Microsoft Teams or Jitsi link and a bot joins the call as a guest." | 4 (meetings; it is in the row but not in section 4) |
| v0.1.148 | 11-07 | REPEAT | "**A failed connected-apps connection** no longer fails the whole turn." | 5/new theme "one slow part blocks all" |
| v0.1.149 | 11-08 | BASE | "**Starter runs two tasks at once.** Other tasks wait their turn, and your own chat still goes first. Once two are running and four are waiting, a new hand-off is refused with a clear note" | 3 (admission with a bounded queue) |
| v0.1.149 | 11-08 | FEATURE (access) | "When a desktop pairs with a server you run yourself, it asks **\"Let <server> use this computer?\"**." | 8 row |
| v0.1.149 | 11-08 | REPEAT | "**Bots list only the imported skills that fit them** and find the rest by search, instead of listing every skill in every prompt." | 5/tool list size |
| v0.1.150 | 11-09 | REPEAT | "Restoring a backup, or moving this computer's workspace to My Cloud, used to wait on \"Fully quit MausBot…\", which a Cloud can't do." | 5/turn or wait that does not end |
| v0.1.150 | 11-09 | BASE | "**Routines save a run's progress once per window,** not after every step, so long runs write far less." | 3 |
| v0.1.150 | 11-09 | REPEAT (approval) | "**Public HTTPS MCP servers** can be added without an approval step when access is below Full." | 6/approval model |
| v0.1.150 | 11-09 | FEATURE | "**A bot can open a thread on another model,** including one from another provider" | 8 row |
| v0.1.150 | 11-09 | REPEAT | "**Secrets typed into a bot's card are kept in the Vault,** for that bot only" | 5/secret in wrong place |
| v0.1.150 | 11-09 | (sets up a reversal) | "**ChatGPT plan turns use your own Codex setup and skills,** with their sign-in kept separate." | 6 (v0.1.175 reverses it: "**Codex bots no longer load your own `AGENTS.md`.**") |
| v0.1.151 | 11-09 | FEATURE | "**1Password secrets by name.** Link a password manager, and a bot can use a secret from a vault it's allowed to read, without the value being saved or shown." | 8 row (row / says "a second password manager", but the first is not named anywhere) |
| v0.1.151 | 11-09 | REPEAT | "**Reset saved keys.** If the app can't read its saved keys at launch, Connected apps offers a reset. The old file is set aside, not deleted." | 5/file written over after failed read |
| v0.1.151 | 11-09 | REPEAT | "**Edit a bot's memory as text.** If it changed while you were editing, you're told before anything is overwritten." | 5/file written over (lost update) |
| v0.1.151 | 11-09 | REPEAT | "**Computer control recovers by itself.** On macOS 26, a keyboard shortcut could crash the helper that controls your computer, and the bot's tools disappeared until you restarted the app." | 5/state lost at restart or crash |
| v0.1.151 | 11-09 | REPEAT | "**Moving to My Cloud only moves this computer's own workspace.** The move used to carry whichever local environment was open at the time, and could finish without your bots." | 5/work lost; 6/where the data is |
| v0.1.152 | 11-10 | REMOVAL | "**No more stopping at 5 bots on Starter.**" | 6 (it reverses v0.1.149: "Bots past five are paused until you upgrade") |
| v0.1.152 | 11-10 | REPEAT | "**A stronger bot sandbox on Clouds and shared servers.** Five fixes close ways a bot's files could affect the server outside the sandbox" | 5/secret or access right in wrong place |
| v0.1.152 | 11-10 | BREAKING | "**On a server with the sandbox on, an engine installed only in the home folder can show as \"not installed\".** Reinstall it from Settings." | 8 row |
| v0.1.152 | 11-10 | BREAKING | "If an older phone app's link has ended, the desktop says why and what to do: update the phone app and pair again." | 8 row |
| v0.1.152 | 11-10 | REPEAT | "**Lent computers survive a Cloud waking up.**" | 5/state lost at restart |
| v0.1.153 | 11-11 | REPEAT | "**Work waiting on you gets one reminder after a day and closes after three,** instead of waiting forever." | 5/turn or wait that does not end |
| v0.1.153 | 11-11 | REPEAT | "**A turn carries on when one optional MCP server dies.**" | 5/new theme "one slow part blocks all" |
| v0.1.153 | 11-11 | REPEAT | "**The bot sandbox keeps more server settings away from bots.**" | 5/secret or access right |
| v0.1.153 | 11-11 | BREAKING | "**Sign-in lists:** people you added in Settings while an empty environment setting was overriding it now take effect at the next start. Check the list before you update." | 8 row |
| v0.1.153 | 11-11 | BREAKING (operations) | "If you run the Docker setup, run `docker compose up -d` after pulling, not only a restart." | 8 row |
| v0.1.154 | 11-12 | FEATURE (area) | "**Publish to Netlify.** A bot can put a site or web app online on your own Netlify account." | 4 and 8 row |
| v0.1.154 | 11-12 | Open risk (secret) | "**Streamed text is shown as the bot produces it.** Saved secrets are masked once the message is saved, as before." | 5/secret in wrong place (streamed text is not masked until it is saved) |
| v0.1.154 | 11-12 | REPEAT | "**A secret a member types in their private chat stays theirs.**" | 5/secret or access right |
| v0.1.154 | 11-12 | REPEAT | "**Notion integration tokens are masked** in chats and logs." | 5/secret in wrong place |
| v0.1.154 | 11-12 | REPEAT | "**Emailed sign-in codes stop being read** when the turn ends." | 5/access right |
| v0.1.155 | 11-13 | REMOVAL (reversed) | "**The usage bars next to the model name show your Claude plan again,**" | 6 and 5/usage numbers |
| v0.1.155 | 11-13 | REPEAT | "**An OpenCode Go limit no longer blocks the free OpenCode models** on the same sign-in." | 5/usage numbers (it comes back in v0.1.158 ) |
| v0.1.155 | 11-13 | REPEAT | "**A replayed image is marked as already sent,** so the model doesn't treat it as new." | 5/work done twice |
| v0.1.155 | 11-13 | REPEAT | "**A typed reply closes a bot's earlier questions,** so the \"Waiting\" badge clears." | 5/wait that does not end |
| v0.1.158 | 11-14 | REPEAT | "**The shared Local VM:** a turn waiting behind someone's hold stays waiting until the hand-over." | 5/busy and races |
| v0.1.158 | 11-14 | REPEAT | "**An OpenCode Go limit is scoped to current prices,** so free models aren't held back." | 5/usage numbers (the same as v0.1.155) |
| v0.1.158 | 11-14 | FEATURE (capability flag) | "**A custom ACP engine can opt in to steering** a turn while it runs." | 7 (capability flags) |
| v0.1.160 | 11-15 | REPEAT | "**Pairing no longer gets stuck on \"Secure access needs attention\".**" | 5/wait that does not end |
| v0.1.160 | 11-15 | REPEAT | "**Turn off a bot's Meetings, Data, Pages, Images or Email tools** to make its requests smaller." | 5/tool list size |
| v0.1.160 | 11-15 | REPEAT | "**A bot-to-bot message that hits a limit before it starts is sent once to the backup AI.**" | 5/work done twice |
| v0.1.160 | 11-15 | REPEAT | "**\"Run when my limit resets\" no longer skips a run** when usage is checked just after the reset." | 5/usage numbers |
| v0.1.160 | 11-15 | REPEAT | "**Engines:** a brief provider error at start-up no longer fails the turn" | 5/engine sign-in and CLIs |
| v0.1.160 | 11-15 | REPEAT (approval) | "**A 👍 reaction means \"go ahead\" only after a question or an offer.**" | 6/approval model |
| v0.1.161 | 11-15 | BASE | "A scheduled run waits at most an hour for a busy bot, and a run has a default limit of 3 hours (12 hours for a room goal)." | 3 and 7 (waits with a limit) |
| v0.1.161 | 11-15 | REPEAT | "**A stuck run no longer blocks the next ones.**" | 5/wait that does not end |
| v0.1.161 | 11-15 | REPEAT | "**Long commands finish.** A command that needs more than about 30 seconds now runs in the background and is followed to its end, instead of being cut off." | 5/turn or wait (it repeats v0.1.144 ) |
| v0.1.161 | 11-15 | REPEAT | "**Pairing a phone again replaces its old entry** instead of adding another one" | 5/work done twice |
| v0.1.161 | 11-15 | REPEAT | "**Antigravity signs in with Google again.**" | 5/engine sign-in |
| v0.1.161 | 11-15 | REPEAT | "**Threads:** a turn whose engine process exited is freed instead of staying busy" | 5/turn that does not end |
| v0.1.161 | 11-15 | REPEAT | "**MCP:** two connections to one server can sign in at the same time" | 5/busy and races |
| v0.1.161 | 11-15 | FEATURE | "**Bots can pass files to each other.**" | 8 row |
| v0.1.165 | 11-16 | REMOVAL (default) | "**New bots on the Mac and Windows app work on This computer by default.**" | 6 and 8 row |
| v0.1.165 | 11-16 | REPEAT | "**Windows: the computer tools start reliably.** They no longer drop out of a turn when they take a few seconds to start." | 5/Windows process control |
| v0.1.165 | 11-16 | BASE | "**Optional day and month caps** for the whole server and for each bot, on every edition." | 3 |
| v0.1.165 | 11-16 | BASE | "**Unattended work has limits**: hand-offs and runs nobody started can't renew their budget on failure or run without end." | 3 and 7 |
| v0.1.165 | 11-16 | REPEAT | "**Always allow sticks.** Five causes of being asked again are fixed." | 6/approval model |
| v0.1.165 | 11-16 | REPEAT | "**Browsers are capped** to what the server can run, and idle ones close only when room is needed." | 5/memory and processes |
| v0.1.165 | 11-16 | BASE | "**Docker and Cloud images bring their own init**, so finished processes are reaped." | 3 |
| v0.1.165 | 11-16 | FEATURE | "**Bots on your computer and on My Cloud can work together**" | 6/where the data is |
| v0.1.165 | 11-16 | REPEAT (approval) | "Your approval level decides what is asked." | 6/approval model |
| v0.1.166 | 11-17 | REMOVAL | "**At a usage limit, a bot switches only to a backup you chose**; otherwise it waits for the reset." | 6 (it reverses v0.1.142 ; v0.1.175 continues it : "A bot with no backup chosen stops at the limit and says so.") |
| v0.1.166 | 11-17 | REMOVAL (default) | "**Sites a bot publishes to your Netlify account are public by default.**" | 8 row |
| v0.1.166 | 11-17 | REPEAT | "**The first reply starts without waiting for slow MCP servers**, and chat-engine turns no longer stop at 64 steps." | 5/new theme "one slow part blocks all" |
| v0.1.166 | 11-17 | REPEAT | "Some tools are now loaded only when needed, and text that rarely changes is cached instead of re-sent." | 5/tool list size |
| v0.1.166 | 11-17 | REMOVAL (default) | "**Room jobs run side by side by default**" | 8 row |
| v0.1.167/169 | 11-17 | REPEAT (approval) | "**One set of names for approval levels** in Simple and Advanced mode." | 6/approval model |
| v0.1.167/169 | 11-17 | REPEAT | "A tool call with unreadable arguments no longer breaks the next turn on chat-engine bots." | 5/turn that does not end |
| v0.1.169 | 11-17 | REPEAT | "Fixes: a partial MCP environment update no longer clears saved keys" | 5/file written over after failed read |
| v0.1.170 | 11-19 | REPEAT | "**Stop ends everything.** Stopping an OpenCode bot also ends the work it had moved to the background, so nothing keeps running unseen." | 5/turn that does not end (and processes) |
| v0.1.170 | 11-19 | REPEAT (isolation) | "**OpenCode no longer reads your own Claude instructions** (`CLAUDE.md`)." | 5/new theme "the person's own engine config leaks into bots" |
| v0.1.170 | 11-19 | REPEAT | "**Each bot's footprint is visible,** and idle engines close sooner when the computer is under pressure." | 5/memory and processes |
| v0.1.170 | 11-19 | REPEAT | "**Scheduled runs try again:** a routine whose cloud desktop did not wake retries by itself a few minutes later, up to three times" | 5/work lost |
| v0.1.170 | 11-19 | REPEAT | "**Cloud computers:** they wake patiently, and a computer that stops answering is set aside with its files instead of deleted." | 5/work lost |
| v0.1.173 | 11-19 | REPEAT | "Windows installers build reliably again on the newest build machines." | 5/red main (build) |
| v0.1.175 | 11-21 | REPEAT (approval, race) | "A conversation a bot opens while a permission change is still being confirmed no longer gets stuck at Ask." | 6/approval model; 5/busy and races |
| v0.1.175 | 11-21 | REPEAT | "**Codex turns keep going** while you have ChatGPT credits left." | 5/usage numbers |
| v0.1.176 | 11-21 | FEATURE | "**Check before done (per bot, off by default).** Turn it on, and a bot's answer is checked by another bot before it reaches you." | 8 row |
| v0.1.176 | 11-21 | FEATURE | "**What changed.** When a bot edits a document you gave it, you can see exactly what changed, sentence by sentence." | 8 row |
| v0.1.176 | 11-21 | REPEAT (approval) | "**New conversations a bot opens** take the approval level of the chat that opened them." | 6/approval model |
| v0.1.176 | 11-21 | REPEAT | "**Grok bots** use fewer processes per session, recover from the out-of-threads crash" | 5/memory and processes |
| v0.1.176 | 11-21 | REPEAT | "**Lighter browsers:** fewer processes per bot browser, and unused browsers close first when memory runs low." | 5/memory and processes |
| v0.1.176 | 11-21 | REPEAT | "**A busy Cloud recovers better:** unused browsers close first, and the only busy engine stops once the machine starts thrashing." | 5/memory and processes |
| v0.1.176 | 11-21 | REPEAT | "**A bot no longer reports success when an action failed** in the browser." | 5/new theme "a status that is not true" |
| v0.1.176 | 11-21 | BASE | "**Full backups** now include bots' Data tables and take the bursts database whole while it's being written." | 3 |
| v0.1.176 | 11-21 | REPEAT | "Usage bars keep their last reading when a usage check fails." | 5/usage numbers |
| v0.1.176 | 11-21 | REPEAT | "The Inbox lists an automation's question only once." | 5/work done twice |
| v0.1.176 | 11-21 | REPEAT | "An older message that arrives while a conversation's history is still loading no longer jumps ahead of the newest reply." | 5/busy and races |
| v0.1.177 | 11-22 | FEATURE | "**Bitwarden Secrets Manager** can be a Vault and sign-in source." | 8 row |
| v0.1.177 | 11-22 | REPEAT (approval) | "**Cloud computer clicks follow your approval level.** On a cloud or remote computer, Claude's computer actions now ask under Ask or Edits, with \"allow for this session\"." | 6/approval model |
| v0.1.177 | 11-22 | REPEAT | "**A stuck Docker** no longer slows every check by 10 seconds." | 5/new theme "one slow part blocks all" |
| v0.1.177 | 11-22 | REPEAT | "**Grok:** a brief sign-in hiccup is no longer reported as signed out, and a routine tries once more." | 5/engine sign-in |
| v0.1.177 | 11-22 | REPEAT (isolation) | "**Lighter isolated Claude turns:** they no longer load your `~/.claude/rules`." | 5/new theme "the person's own engine config leaks into bots" |
| v0.1.177 | 11-22 | REPEAT | "**Connected apps:** if the connected-apps service doesn't answer when a conversation starts, bots still get its search and run tools, not just Gmail and Calendar." | 5/new theme "one slow part blocks all" |
| v0.1.177 | 11-22 | REPEAT | "**Browser:** a slow start on a busy computer no longer fails with \"No matching tab opened\"." | 5/wait (a time limit that is too short) |
| v0.1.177 | 11-22 | REPEAT | "**Teammates** no longer show a bot as \"needs setup\" once its AI account works again." | 5/new theme "a status that is not true" |
| v0.1.177 | 11-22 | REPEAT | "**Hermes** keeps its shared gateway running when one conversation stops." | 5/memory and processes (a shared process) |
| v0.1.177 | 11-22 | BASE (two-phase format change) | "This version can read Vault secrets up to 64 KiB, such as cookie files or service-account JSON. Saving them switches on in the next update." | 3 (it is already IN-ROW in section 8) |

### 6.2 Smaller changes (marked optional by the subagents)

| Release | Date | Kind | Quote | Where it belongs |
|---|---|---|---|---|
| v0.1.78 | 09-13 | FEATURE | "feat(ios): Walkie mode — hold to talk to a bot, hear the answer back" | 8 row (optional) |
| v0.1.78 | 09-13 | REPEAT (Windows process control) | "fix(windows): prevent shared terminal PowerShell discovery timeouts" | 5 Windows (optional) |
| v0.1.79 | 09-15 | REPEAT (turn/wait) | "fix(coordination): keep a minimum runway when the handoff lifetime ceiling hits" | 5 (optional) |
| v0.1.79 | 09-15 | REPEAT (turn/wait) | "fix(drivers): keep Stop reachable through a turn's retry relaunch" | 5 (optional) |
| v0.1.80 | 09-15 | FEATURE | "feat(threads): opt-in parking for direct messages behind delegated work (#1194)" | 8 row (optional) |
| v0.1.80 | 09-15 | REPEAT (flaky tests) | "fix(test): stop the steering e2e losing a steer to the event loop" | 5 (optional) |
| v0.1.81 | 09-15 | FEATURE | "feat(rooms): recent-work brief, per-turn log lines, recall by time" | 8 row (optional) |
| v0.1.81 | 09-15 | FEATURE | "feat: passwordless company backup and restore" | 8 row (optional) |
| v0.1.83 | 09-16 | REPEAT (Windows process control) | "fix(windows): start npx and npm MCP servers without a shell" | 5 Windows (optional) |
| v0.1.83 | 09-16 | REPEAT (turn/wait) | "fix(coordination): pause handoff lifetime while work executes, make limits configurable" | 5 (optional) |
| v0.1.83 | 09-16 | BASE | "feat(server): optional retention sweep for thread event logs" | 8 row (optional) |
| v0.1.84 | 09-17 | FEATURE | "feat(coordination): resume delegated returns with only what the session has not seen" | 8 row (optional) |
| v0.1.84 | 09-17 | FEATURE | "feat(threads): paste and send canonical thread reference links" | 8 row (optional) |
| v0.1.85 | 09-20 | FEATURE | 'feat(webhooks): delivery "post" mode — payload text lands in the bot chat, no task' | 8 row (optional) |
| v0.1.85 | 09-20 | REPEAT (tool result size) | "fix(tools): bound large agent replies with scoped result retrieval" | 5 tool list size (optional) |
| v0.1.86 | 09-23 | REPEAT (turn ends wrong) | "Settle a stopped Claude turn as interrupted, not a crash" | 5 turn (optional) |
| v0.1.87 | 09-24 | FEATURE | "feat(org-library): add packages from the organization's library (W2-1, W2-3)" | 8 row (optional) |
| v0.1.88 | 09-26 | BASE | "feat(evals): behavior eval tiers 2-3 — golden-thread replay and opt-in live-model smoke" | 8 row (optional) |
| v0.1.88 | 09-26 | REPEAT (flaky tests) | "test(server): strip ambient OMB_*/OPENMAUSBOT_* env from spawn-based tests" | 5 flaky (optional) |
| android-v1.5.0 | 09-27 | FEATURE | "**Update Claude from your phone.** A card offers to run Claude Code's updater on the computer." | 8 row (optional) |
| v0.1.90 | 09-29 | FEATURE | "Run routines in the conversation" | 8 row (optional) |
| v0.1.90 | 09-29 | BASE | "feat(vm): pool mode with per-thread seat affinity (#1654)" | 8 row (optional) |
| v0.1.93 | 10-02 | FEATURE | "feat(ios): take control of a bot's Local VM from the phone" | 8 row (optional) |
| v0.1.93 | 10-02 | REPEAT (wait that does not end) | "fix(server): release stalled direct Local VM claims safely" | 5 turn/wait (optional) |
| v0.1.95 | 10-03 | REPEAT (failed turn) | "Hosted desktop: keep the bot's own engine, and a failed turn never breaks the bot" | 8 row (optional) |
| v0.1.95 | 10-03 | REMOVAL | "Delete dead server code, stale names and env knobs nobody sets" | 8 row (optional) |
| v0.1.96 | 10-05 | REMOVAL (limit changed) | "**OpenAI-compatible chats run up to 64 steps per reply** (was 16)" | 8 row (optional) |
| v0.1.96 | 10-05 | REPEAT (access right) | "**Webhooks on a Cloud run as the owner, at the bot's own level.**" | 5 access (optional) |
| v0.1.97 | 10-06 | FEATURE (an early form of v0.1.128 "Every bot can reach every bot") | Opt-in open teams for advanced setups (OMB_OPEN_TEAMS=1). | 8 row (optional) |
| v0.1.98 | 10-07 | REMOVAL (direction: per-thread model to bot model) | Changing a bot's model now moves all its threads with it, instead of leaving old threads on the model they were created with. | 6 (optional). The 8 row has the quote. |
| v0.1.102 | 10-08 | REPEAT (turn ends wrongly) | A question a bot asked you that went unanswered no longer ends its turn as a tool error. | 5, turn/wait (optional) |
| v0.1.102 | 10-08 | REPEAT (access right in wrong place) | Skill imports from GitHub only fetch files from `https://raw.githubusercontent.com` and never follow a redirect elsewhere. | 5, secret or access right (optional) |
| v0.1.103 | 10-09 | FEATURE / approval change | When the Chief creates a bot, you see the same card as for a team setup, and can approve it unless you've given full access. | 8 row (optional) |
| v0.1.103 | 10-09 | BASE (every turn carries the time) | Every message tells the bot when it was sent, in your time zone. | 8 row (optional) |
| v0.1.104 | 10-09 | REPEAT (engine sign-in) | A Cursor bot with an API key is no longer signed out, or sent to a browser sign-in, before each session. | 5, engine sign-in (optional) |
| v0.1.107 | 10-10 | REPEAT (state lost at restart) | fix: preserve restart sessions and await ACP cleanup | 5, state lost at restart (optional) |
| v0.1.107 | 10-10 | REPEAT (approval model) | fix(approvals): judge a room turn's requests at the level it was sent with | 5, approval model (optional) |
| v0.1.107 | 10-10 | REPEAT (turn that does not end) | fix(acp): end the turn when a question answer matches no option | 5, turn/wait (optional) |
| v0.1.108 | 10-13 | FEATURE | Logins from 1Password. Connect a vault through a service account and bots can sign in with its logins. | 4 (optional, with saved logins). 8 row v0.1.167 mentions "a second password manager". |
| v0.1.108 | 10-13 | FEATURE | Bots ask you to sign in where they work. ... No password ever goes through the chat. | 8 row (optional) |
| v0.1.108 | 10-13 | REPEAT (busy and races) | calls wait for a busy computer instead of failing | 5, busy (optional) |
| v0.1.109 | 10-14 | REPEAT (turn/wait that does not end; caused by the runtime) | Chiefs stuck on "Waiting on a teammate…" | 5, turn/wait (optional) |
| v0.1.110 | 10-15 | REPEAT (busy) | Restart was refused while the bot was busy. Taking control now works in that case. | 5, busy (optional) |
| v0.1.110 | 10-15 | BASE (health reports) | A MausBot Cloud now reports content-free health checks (error codes and counts, never your chats or files) | 3 (optional) |
| v0.1.111 | 10-15 | BASE (security boundary; off by default) | A safety floor that never auto-approves a fixed list of dangerous commands, on macOS and Linux. | 3 or 6 approval model (optional) |
| v0.1.111 | 10-15 | FEATURE (earlier than the 8 rows v0.1.124 and v0.1.142 on MCP result size) | A result size limit for each MCP server, set in the server editor. Bots now see a clear warning when a result is trimmed. | 8 row (optional) |
| v0.1.112 | 10-15 | REPEAT (Windows process control) | "**No more console windows flashing on Windows** while the bot's browser runs." | 5 example (optional) |
| v0.1.112 | 10-15 | REPEAT (engine CLIs that change) | "**Codex shows newly added models** right after the Codex CLI updates itself." | 5 example (optional) |
| v0.1.112 | 10-15 | REPEAT (flaky tests and red main) | "Windows and macOS test runs get more time, and several Windows-only test failures are fixed." | 5 example (optional) |
| v0.1.113 | 10-16 | BASE | "**A new built-in browser on OpenMausBot's own Chrome driver.** ... It is off by default." | 8 row v0.1.113 (optional) |
| v0.1.115 | 10-17 | FEATURE | "**Cloud computers go to sleep after 10 idle minutes**" | 8 row (optional) |
| v0.1.116 | 10-18 | FEATURE | "**Research for bots with your own treg key.**" | 8 row v0.1.116 (optional) |
| v0.1.116 | 10-18 | REPEAT (engine CLIs that change) | "**Codex settings typed in \"Set CLI\"** (`-c key=value`) now reach Codex." | 5 example (optional) |
| v0.1.117 | 10-19 | FEATURE | "**See every bot's computer on the Team map.**" | 8 row (optional) |
| v0.1.119 | 10-20 | FEATURE | "**Bots can enter sign-in codes for you.**" | 8 row v0.1.119 (optional) |
| v0.1.120 | 10-20 | REPEAT (engine CLIs that change) | "**Codex:** a usage-limit reset given only as a time is read as today, not tomorrow." | optional |
| v0.1.121 | 10-21 | FEATURE | "**React to a bot's message to answer it.**" | 8 row (optional) |
| v0.1.122 | 10-22 | FEATURE | "**Pages and apps in the chat.**" | 8 row (optional) |
| v0.1.123 | 10-22 | FEATURE | "**X (Twitter) in Apps.**" | optional |
| v0.1.124 | 10-23 | FEATURE | "**\"Use my Mac\" after moving to My Cloud.**" | optional |
| v0.1.125 | 10-23 | FEATURE | "**Pages show in the chat.**" | optional |
| v0.1.128 | 10-27 | REPEAT (Windows process control) | "startup on Windows no longer times out during a slow unpack." | optional |
| v0.1.128 | 10-27 | REPEAT (turn that does not end clearly) | "Runs that were cut off without anyone pressing Stop now say what happened." | optional |
| v0.1.128 | 10-27 | FEATURE | "**\"Tell Marco that…\"** Ask a bot in your private chat to pass something on." | optional |
| v0.1.129 | 10-27 | FEATURE | "**@devs:** type @devs in any chat with a few words about what went wrong." | optional |
| v0.1.129 | 10-27 | REPEAT (wait / work done twice) | "Pi waits for a slow session reply instead of starting over." | optional |
| v0.1.130 | 10-27 | REPEAT (state lost at restart) | "Old tool receipts no longer show as running after a restart." | 5 "state lost at restart" (optional) |
| v0.1.130 | 10-27 | FEATURE | "**Lent folders keep working while your computer is away.** My Cloud keeps a copy of the folders you lend ... if you changed the same file, both versions are kept." | 8 row v0.1.130 (optional) |
| v0.1.131 | 10-28 | FEATURE (engine) | "**GitHub Copilot CLI** is a built-in engine." | 8 row v0.1.131 (optional) |
| v0.1.132 | 10-29 | REPEAT (secret) | "**Bots ask for a secret on the secure card.** ... so nobody pastes a key into chat." | 5 "secret" (optional) |
| v0.1.133 | 10-29 | REPEAT (turn/wait) | "A slow local model gets to finish its answer. ... no longer cut off at 3. A server that has stopped responding ends the wait early." (bold on first sentence in source) | 5 "turn/wait" (optional) |
| v0.1.135 | 10-31 | FEATURE | "**Tell your Chief once.** A preference such as \"reminders go to TickTick\" is saved once, and every bot follows it" | 8 row v0.1.135 (optional) |
| v0.1.138 | 11-02 | FEATURE | "Composer: steer, queue or restart a message sent while a bot works" | 8 row v0.1.138 (optional) |
| v0.1.138 | 11-02 | BASE (test harness) | "A desktop performance bench that prints JSON" | 8 row v0.1.138 (optional) |
| v0.1.139 | 11-03 | REPEAT (work twice) | "fix(notify): one \"done\" when a job is really finished" | 5 "work done twice" (optional) |
| v0.1.139 | 11-03 | FEATURE (team) | "Team Clouds enforce their team's rules, fetched from the Admin" | 8 row v0.1.139 (optional) |
| v0.1.141 | 11-05 | BREAKING (plan limit) | "Starter makes up to 5 bots. Making a 6th offers the upgrade. Bots you already have stay." | 8 row v0.1.141 (optional) |
| v0.1.141 | 11-05 | REPEAT (flaky tests) | "Test ports: each vitest worker picks from its own" | 5 "flaky tests" (optional) |

## 7. New releases after v0.1.177

None. On 2026-11-23 the newest release in both repositories was v0.1.177
(2026-11-22 16:22 UTC). The newest commit of `upstream/main` was `d6660e2d7`
(2026-11-23), which is not yet in a release.

## 8. What is verified and what is not

Verified:

- The counts of section 2: releases, tags, drafts, dates, characters and
  commits.
- Each tag and each date of section 8.
- Each quote of sections 3 to 8 of `changelog.md`, by a script.
- Each quote of the MISSING tables, by a script.
- Each WRONG row of section 4, by the main session.
- The commits of section 3, with `git show`:
  - `659349e72`: `server/index.ts` 415 lines, `server/contracts.ts` 178,
    `server/harness/registry.ts` 123, `server/harness/bus.ts` 55.
  - `8bf62fde0`: "an interrupted write can never truncate the JSON into
    silent empty state" (in the commit message).
  - `91df452e6`: "vitest suite, CI".
  - `67d8cf5e8`: "SQLite message store"; "legacy JSON thread files import
    lazily on first read and are renamed .imported as a one-time backup".
  - `92ecac85d` (2026-09-21), `3c1f7b2a9` (2026-10-12) and `4e21f2ac7`
    (2026-10-13).
- The three ideas of section 1, in commit `659349e72`:
  - `server/contracts.ts`: one contract for all drivers.
  - `server/harness/bus.ts`: "Every adapter's event stream merges into one
    bus".
  - An unknown driver "surface[s] as unavailable shadow snapshots so a
    config from a newer build downgrades safely".

Not verified:

- "One event stream as the source of truth" (section 1) is our reading of
  the bus. The words "source of truth" are not in the code.
- The section 8 rows are a summary. A row names the main changes, not all
  of them. Section 6 of this file has the rest.
- The subagents chose which changes are key. Another reader can choose
  others. The main session did not read each release completely itself.
- The theme counts of section 5 depend on the list of themes that each
  subagent got.
- Nobody opened a pull request of the reference project. Many notes from
  v0.1.48 are only pull request titles.
