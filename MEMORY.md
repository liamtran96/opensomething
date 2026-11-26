# Memory

Notes for the people and the agents that work on this repository: how the
author wants the work done, and facts that the code does not show. This file
is in git, so each computer has the same notes.

- An agent reads this file at the start of a session and obeys it.
- When the author corrects an approach or states a preference, add a note
  here, with the date and the reason. Do not keep it only in a memory folder
  on one computer.
- One note for each fact. Change a note that is wrong, and remove a note
  that no longer applies.
- No secrets, no keys and no personal data.
- A design choice goes in [`docs/decisions.md`](docs/decisions.md). A rule
  for all code goes in [`AGENTS.md`](AGENTS.md). This file is for the rest.

## How the author wants the work done

### The author types the code (2026-11-23)

Do not write the source files of a plan step. Show the code to type
(`docs/code/<feature>/` has one file for each pull request), and do the other
work: branches, documents, checks, review, commits and pull requests when
asked.

- **Why:** The author said "do steps 1 to 5 for me but please remember that i
  will type the code". Interpretation: the author learns the code by typing
  it.
- **How:** Prepare the branch and the code-to-type file. Wait until the
  author says the code is typed. Then review it against the file and run the
  checks. Report an error for the author to correct. Do not correct it.
- **The order of the work (2026-11-23):** analyze a feature, then the author
  decides the proposals, then update `docs/plan/`, `docs/decisions.md` and
  `docs/code/`. Before the author types a step, check the code file against
  the latest reference source again. The author said: "once we analyze
  finish for each feature we need to update plan and the code folder" and
  "when i start coding i want to check the reference source code to confirm
  it correct". The steps are 6 and 7 of "How to run a batch" in
  [`docs/research/progress.md`](docs/research/progress.md).

### Follow the reference, and raise each improvement (2026-11-23)

The reference source is the default design. Do what the reference does. When
we can do better than the reference, do not change it silently: raise it as a
proposal (a P-number in `docs/plan/<feature>.md`), and the author decides.

- **Why:** The author asked why decision D22 existed, then said: "please
  follow the reference source and if we can do it better i mean improve it
  please raise it".
- **How:**
  - A plan step, a decision or a code file follows the reference, with the
    file and line of the reference.
  - A difference from the reference is either a proposal that the author
    has not decided yet, or a decision that says "Better than the
    reference" with its reason.
  - A difference that is neither is an error. Correct it, or raise it as a
    proposal.

### The changelog is checked and up to date (2026-11-23)

[`docs/research/changelog.md`](docs/research/changelog.md) is the record of
the releases of the reference project. Use it as a trusted source. Do not
research the release history again unless the author asks.

- **Why:** The author first said "please remember that the changelog is
  correct and up to date". Then the author asked for a re-check. The
  re-check of 2026-11-23 found 29 claims that were wrong or not exact, and
  many key changes that the rows of section 8 did not have. It corrected
  `changelog.md`. The findings and the full list of missing changes are in
  [`docs/research/changelog-check.md`](docs/research/changelog-check.md).
  On 2026-11-26 the file covered v0.1.0 to v0.1.181, and v0.1.181
  (2026-11-25) was the latest release of the reference project. v0.1.179
  has no tag and no release.
- **How:**
  - Use sections 5, 6 and 7 for the problems that each feature must check,
    as "How to run a batch" in `docs/research/progress.md` says. For the
    repeated fixes of one theme, look also in section 6 of
    `changelog-check.md`.
  - Keep it up to date: when the reference project publishes a release after
    v0.1.181, add its row to section 8. Change sections 3 to 7 only when the
    new release changes them.

### A changelog row has all the key changes of its release (2026-11-23)

When you write or check a row of the release history, read the whole note
of the release. Put each key change in the row: a new feature, a new base
part, a removal or a reversal, a breaking change, and a fix of a problem
that comes again.

- **Why:** The author showed the full note of v0.1.177 as an example, and
  the row had only two of its changes. The author said: "dont miss the
  important things and avoid the mistake from them".
- **How:** Give each change with its exact quote. Check each quote, date
  and version against the release text before you write it. Put a change
  that alters a theme or a reversal into sections 5 and 6 too.

### One plan file for each researched feature (2026-11-23)

`docs/plan/README.md` has the steps, their pull requests and their choices.
`docs/plan/<feature>.md` has the proposals of one feature, with the same name
as `docs/research/features/<feature>.md`. Do not make other plan files.

- **Why:** The author first said "there to many plan file consolidate it"
  (the plan had a file for each step and a separate file of proposals). Then
  the author said "i want to a folder plan with each folder in it
  corresponding on each feature folder in research folder", and chose one
  file for each feature.
- **How:** When a research file is done, write `docs/plan/<feature>.md`
  with its proposals (P1, P2, ...), and link each proposal from its step in
  `docs/plan/README.md`. The code to type goes in `docs/code/<feature>/`,
  with the same name. The author said "and code folder as well it should
  match with the feature as well".

### Always read the reference code before a suggestion (2026-11-23)

This rule is mandatory. The reference project is the base for all parts of
this system, and our aim is to make each part better than the reference.
Before each suggestion, explanation, plan or review, read all the related
code of the reference project. Give the file and the line for each claim. Do
not answer from general knowledge.

- **Why:** An agent explained the three message roles from the convention of
  chat APIs. The reference has two roles (decision D18). The author said:
  "you should make sure about everything before you give me the
  suggestions", and then: "you need ALWAYS see the code of openmausbot
  everything related to give me the suggestions this is must".
- **Scope:** all aspects, not only the types. The author said: "not only
  the type I mean everything, type, how it work, ui, and system design".
  For each topic, read each of these in the reference:
  - the types and the data: the fields, the JSON, what is stored;
  - the behaviour: the flow from start to end, the error paths, the limits
    and the edge cases;
  - the UI: the components, the layout, the text and the states (empty,
    busy, error), in `src/` and `DESIGN.md`;
  - the system design: which module owns the work, the boundaries, the
    order of events, and its feature page in `docs/`;
  - the tests, which show the behaviour that the reference guarantees.
- **Read all the lines.** The author said: "you should read all the lines of
  code with subagent and related file to use it for fully understanding dont
  guess". Read each file completely, and read the related files: the code
  that implements it, the code that calls it and its tests. Use subagents
  for this, one for each group of files, and tell each one to read all
  lines and to list the files that it read completely. Check the key
  findings of a subagent against the code. Do not report on a file from its
  outline or from a part of it.
- **How:**
  1. Find all the related code in the reference: the type, where the value
     is made, where it is stored and where it is read. Read the primary
     type, not a secondary schema.
  2. If a search stops early, search again in a smaller path.
  3. Compare point by point: what the reference does, what we do, and where
     they differ.
  4. Where we differ, say whether it is an improvement, and why. "Better"
     needs a reason: a wrong state that the compiler now refuses, less code,
     or a known problem of the reference that we do not copy.
  5. Say what is verified and what is not.
  6. Never read the `enterprise/` directory of the reference (`AGENTS.md`).

### The author wants to understand all of the reference project (2026-11-23)

The aim is not only to copy the parts that our plan needs. The author wants
to understand fully how the reference project works: all of it, with the
features that our plan does not have.

- **Why:** The author said: "i want to understand fully how openmausbot work
  I mean everything remember that".
- **How:**
  - The list of all parts, their state and the prompt for one session are in
    [`docs/research/README.md`](docs/research/README.md). The author does one
    part in each session.
  - To research several features at the same time, follow "How to run a
    batch" in [`docs/research/progress.md`](docs/research/progress.md). It
    chooses features from `reference-features.md` and the problems to check from
    `changelog.md`, and it has the prompt for one feature.
  - Write each research file for a person who did not read the code: a plain
    summary first, each special term explained one time, each flow as a
    numbered list.
  - Analyze a part in full when it is out of scope for our plan.
  - Before the code of a plan step, do the parts that the table names for
    that step.

### This is a port from TypeScript to Rust: look at our crates first (2026-11-23)

Before you choose, order or explain a feature of the reference project, look
at our Rust files and folders, and say where the feature goes in them.

- **Why:** An agent chose five research features without a mark of core or
  not core, and three of them were support rules. The author said: "i should
  mark which one is core which one is not core the the features.md and
  please remember look at our files and folders structure in rust I want to
  port from ts to rust".
- **How:**
  - The layout is in [`README.md`](README.md): `bot-protocol`, `bot-engine`,
    `bot-core`, `bot-cli`, `bot-desktop`. The step and the crate of each
    feature are in [`docs/plan/README.md`](docs/plan/README.md).
  - [`docs/research/reference-features.md`](docs/research/reference-features.md) has the columns
    "Core" and "Ours" for each row. Choose research work from the rows that
    are core. Keep the two columns correct when the plan changes.
  - For each feature, name the TypeScript files of the reference and the
    Rust crate and module that get the port.

### Write the output with the ASD-STE100 skill (2026-11-23)

Use the `asd-ste100` skill (Simplified Technical English) for the output of
a task: the research files, the reports and the summaries.

- **Why:** The author said: "remember to use asd skill for the output note
  that".
- **How:** Load the skill before you write the output. Tell each agent of a
  worktree to load it before it writes its file. Apply it to prose, not to
  code, paths or quotes from the reference.

### A change updates its related documents in the same pull request (2026-11-23)

When a pull request changes something, change each document that describes
it in the same pull request: the feature page in `docs/`, the table in
`docs/README.md`, the root `README.md`, the plan, the research tables and
the docs web site in `apps/docs`.

- **Why:** The author said: "please note that once we change something
  update the related docs like readme, docs site,.. as well". Two pull
  requests were opened with stale documents: `docs/protocol.md` said that
  the message types were "not merged yet", and the roadmap page of the docs
  site said that step 1 was in progress.
- **How:** Before a commit, search for the name of the changed thing in
  `README.md`, `docs/` and `apps/docs/content/`. Read each place that
  states its state ("built", "not built", "step N", "in progress") and
  correct it. Say in the pull request text which documents changed. When no
  document needs a change, say that too.

### Make a worktree with the Orca CLI (2026-11-23)

When the author asks for a worktree, make it with `orca worktree create`, not
with a hidden worktree of the agent tool.

- **Why:** An agent started five research subagents in hidden worktrees. The
  author stopped them and said: "I mean create worktree in here the side bar
  of orca project". The author wants to see each worktree and its agent in
  the Orca sidebar (interpretation).
- **How:** `orca worktree create --repo id:<repoId> --name <name> --branch
  <branch> --base-branch main --agent claude --prompt "<text>" --json`.
  `orca repo list` gives the repository id. The worktree goes in
  `../workspaces/opensomething/<name>`, so `../OpenMausBot` is wrong there:
  give the agent the absolute path of the reference project. The research
  work is tracked in [`docs/research/progress.md`](docs/research/progress.md),
  one row of `docs/research/reference-features.md` for each worktree.

### The agent of an analysis worktree uses subagents (2026-11-23)

When an agent makes a worktree for an analysis task (research of the
reference project), the prompt tells the agent of that worktree to use
subagents: one subagent for each group of related files. The rule is for
analysis tasks only, not for other worktrees.

- **Why:** The author said: "please note that use subagent for each worktree
  you create", then "from now [on] the analyzing task only", then "for each
  worktree use should subagent to speed up the progress". The subagents read
  their groups of files at the same time, so the analysis ends sooner. The
  agent of the worktree is the lead, and it does not read all the files
  itself.
- **How:** Put the line "Use subagents: one for each group of related files,
  and each one reads its files completely" in the `--prompt` of
  `orca worktree create`. The main session does not start its own subagent
  for a worktree; the Orca agent of the worktree starts them.

- **A report file for each subagent (2026-11-24):** each subagent writes
  its report to `.research/<group>.md` in the worktree when it finishes.
  - **Why:** in batch 5, the usage limit stopped all six agents, and the
    author changed the account. A running agent keeps its old account, so
    each agent had to start again. The finished readers came back only from
    the journal of the old workflow run. `chat-ui` lost all six readers. The
    author asked: "can the new account still continue read the cache of
    dynamic workflow and keep working".
  - **How:** the prompt template of `docs/research/progress.md` has the
    rule. After a restart, the lead reads the files that exist and starts
    only the missing readers.

- **At most two analysis workflows at a time (2026-11-25):** start the
  next worktree when one finishes. A reader adds its notes to its report
  after each file, not only at its end.
  - **Why:** in batch 6, six workflows (about 55 readers) ran at the same
    time. The 5-hour limit stopped all of them before any of them
    finished, and only 2 reports were saved. Each restart began again and
    used the weekly limit. The author asked: "because of limit 5 hours I
    run it many time but did not finish the workflow maybe because 6
    workflow cost many token right?", then said "keep the two running,
    pause the other four".
  - **How:** step 1.6 of "How to run a batch" and the "Rules" of the
    prompt template in `docs/research/progress.md`.

- **One analysis workflow at a time (2026-11-25):** this replaces the
  limit of two above. Approve the next worktree only when the one before
  it is done.
  - **Why:** at the start of batch 7, the main session made two worktrees
    for two workflows. The author said: "wait start one by one".
  - **How:** a worktree can exist and wait at its approval step. Send the
    approval to one agent at a time.

- **Watch the worktrees with a background watcher (2026-11-26):** after
  the main session approves analysis worktrees, it starts one background
  shell job that watches all of them and exits when all are finished. Then
  it does the next work, such as the pull requests.
  - **Why:** the author said "after all worktree finisnh create pr for
    me", then "please note the back watcher to memory".
  - **How:** step 4.5 of "How to run a batch" in
    [`docs/research/progress.md`](docs/research/progress.md). A worktree is
    finished when its `docs/research/features/<name>.md` exists and its
    agent is idle. Do not use `orca terminal wait --for tui-idle` alone:
    the agent is idle while its workflow runs in the background.

- **After the pull request, delete the worktree, not the branch
  (2026-11-26):** when an analysis worktree is done, open its pull request
  from its branch, then remove the worktree with
  `orca worktree rm`. Keep the branch: the pull request needs it. Remove
  only a worktree that is done, never one that still runs or waits.
  - **Why:** the author said "create pr for the worktree are done and
    delete it", then "remember the worktree not the branch", then "please
    just remove the worktree are done not running".
  - **How:** before the removal, save what only the worktree has: ask its
    agent to write its proposals to a file outside the repository (step
    5.6 of "How to run a batch"), and push the branch.

### Look at the real window before you report a UI change (2026-11-20)

For work in `crates/bot-desktop/ui`, capture the application window and
compare it with the reference before you report the change.

- **Why:** An agent wrote the sidebar and the settings layout in several
  rounds and did not look at the result. A CSS layer bug and wrong
  proportions were not seen.
- **How:** Read the reference first: the screenshots from the author, and
  `DESIGN.md`, `src/components/Sidebar*.tsx` and `src/components/settings/`
  of the reference project. Capture only the window with the title
  `opensomething`. "Like the reference" means plain flat panes, a grey
  sidebar and a white chat. "Just the layout" means no new controls.

### Do not use a browser to check the desktop UI (2026-11-20)

Do not open or drive the browser of the author to look at the desktop UI.

- **Why:** The author said "please dont run the browser anymore". The pages
  and the typed input of the agent got in the way (interpretation).
- **How:** Use `pnpm run typecheck`, `pnpm run lint` and `pnpm run build`,
  and a capture of the Tauri window. Ask before you use a browser again.

### No coloured line on the left edge of a component (2026-11-20)

Never add a coloured vertical line on the left edge of a notice box, a card,
a quote or a list item, in the application or in the docs site.

- **Why:** The author said "remove the orange track on the left never add it
  to any component".
- **How:** When a library component has such a line by default, hide it in
  the wrapper. `apps/docs/components/mdx.tsx` does this for the Fumadocs
  `Callout`. The rule is about the left accent line, not about all borders
  (interpretation).

### A research pull request can be larger than 200 lines (2026-11-24)

A pull request that adds or corrects research documents in `docs/research/`
goes in whole, one pull request for one batch or one check. The limit of 200
lines in `AGENTS.md` is for code and for the other documents.

- **Why:** The two check reports of 2026-11-23 were 357 and 701 lines. The
  author chose "one PR each" over a split into about nine pull requests.
  Earlier research pull requests were also larger (1,240 and 5,457 lines).
- **How:** One pull request for each research worktree. Keep a change to
  `docs/plan/`, `docs/decisions.md`, `docs/code/` or the code in its own
  pull request of 200 lines or fewer.

## Facts about the environment

- **The reference project** is a local clone in a folder next to this
  repository: `../OpenMausBot`. It is not in this repository. On each
  computer, run `scripts/reference.sh` before design work. It clones the
  reference if it is missing, adds the remote `upstream` (the original
  project), checks out the latest `upstream/main` and prints the commit.
  The remote `origin` of an old clone is the fork of the author, which can
  be behind. Record the printed commit in each research file. The author
  asked for the latest code, the same on each computer (2026-11-23).
- **Run the desktop application:** `pnpm run tauri dev` in
  `crates/bot-desktop/ui`. The UI has hot reload.
- **Window capture on the work computer (Windows):** PowerShell is in
  constrained language mode, so `Add-Type` fails, and Python has no PIL. Use
  a Python `ctypes` script: `EnumWindows`, `PrintWindow(hwnd, dc, 2)` and
  `GetDIBits`, then write the PNG with `zlib`.
