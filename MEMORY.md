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
(`docs/code/step-NN/` has one file for each pull request), and do the other
work: branches, documents, checks, review, commits and pull requests when
asked.

- **Why:** The author said "do steps 1 to 5 for me but please remember that i
  will type the code". Interpretation: the author learns the code by typing
  it.
- **How:** Prepare the branch and the code-to-type file. Wait until the
  author says the code is typed. Then review it against the file and run the
  checks. Report an error for the author to correct. Do not correct it.

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
  - Write each research file for a person who did not read the code: a plain
    summary first, each special term explained one time, each flow as a
    numbered list.
  - Analyze a part in full when it is out of scope for our plan.
  - Before the code of a plan step, do the parts that the table names for
    that step.

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

## Facts about the environment

- **The reference project** is a local clone in a folder next to this
  repository: `../OpenMausBot`. It is not in this repository. Clone it on a
  new computer before design work.
- **Run the desktop application:** `pnpm run tauri dev` in
  `crates/bot-desktop/ui`. The UI has hot reload.
- **Window capture on the work computer (Windows):** PowerShell is in
  constrained language mode, so `Add-Type` fails, and Python has no PIL. Use
  a Python `ctypes` script: `EnumWindows`, `PrintWindow(hwnd, dc, 2)` and
  `GetDIBits`, then write the PNG with `zlib`.
