# Code to type

One folder for each feature. A folder has the same name as the research file
in [`../research/features/`](../research/features/) and the plan file in
[`../plan/`](../plan/README.md). Each folder has one file for each pull
request, named `<step>.<pr>-<short-name>.md`. The author types the code from
the file, runs the check, then ticks the box in the folder's `README.md`.

A folder is made when the first code file of its feature is written.

| Folder | Research | Pull requests |
|---|---|---|
| [`turn-flow-comparison/`](turn-flow-comparison/README.md) | [`turn-flow-comparison.md`](../research/turn-flow-comparison.md) | 2.1 to 2.5 |
| `driver-contract/` | [`driver-contract.md`](../research/features/driver-contract.md) | 3.1 to 3.5 |
| `newer-config-unavailable/` | [`newer-config-unavailable.md`](../research/features/newer-config-unavailable.md) | 4.1 to 4.3, 6.2 |
| `chat-streaming/` | [`chat-streaming.md`](../research/features/chat-streaming.md) | 5.1 to 5.6 |
| `file-modes-atomic-writes-redaction/` | [`file-modes-atomic-writes-redaction.md`](../research/features/file-modes-atomic-writes-redaction.md) | 6.1, 6.3, 6.4 |
| `write-only-secrets/` | [`write-only-secrets.md`](../research/features/write-only-secrets.md) | 6.5, 7.6 |
| `event-bus-fold/` | [`event-bus-fold.md`](../research/features/event-bus-fold.md) | 7.1, 7.2, 7.4, 7.5 |
| `chat-turns/` | [`chat-turns.md`](../research/features/chat-turns.md) | 7.3 |

- Step 2 has no file in `research/features/`. Its research is
  `research/turn-flow-comparison.md`, so its folder uses that name.
- When a pull request builds parts of two features, its file goes in the
  folder of the feature that it builds most.
