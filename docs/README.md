# Documents

| File | What it holds |
|---|---|
| [`plan/`](plan/README.md) | The steps and their pull requests (`README.md`), and one file of proposals for each feature of `research/features/` |
| [`code/`](code/README.md) | The code to type for each pull request, one folder for each feature |
| [`decisions.md`](decisions.md) | What we chose, why, and the references |
| [`comparison.md`](comparison.md) | The features of the reference project and our crate for each |
| [`research/`](research/) | What we read in the reference project, with the file and the line of each fact |

## Feature pages

One page for each feature. A page says what the feature does now, not what
we plan. Change the page in the same pull request that changes the behaviour
(decision D19).

| Feature | Page | State |
|---|---|---|
| Wire types | [`protocol.md`](protocol.md) | Identifiers, messages and the turn events are built. The content and error events are step 2.5 |
| Desktop window | [`desktop-window.md`](desktop-window.md) | The layout is built, with mock data |
| Settings | [`settings.md`](settings.md) | The dialog is built. Nothing is saved |
| Backgrounds | [`backgrounds.md`](backgrounds.md) | Built. The choice is not saved |

## The form of a feature page

1. A title and one paragraph: what the feature is.
2. **What the person does** (for a feature that a person sees).
3. One section for each part of the behaviour, with its rules.
4. **Code:** the paths of the code and of its tests.
5. **Not built:** what the page does not cover yet, with the step of the
   plan when one exists.

When you add a feature, add its page and a row in the table above.
