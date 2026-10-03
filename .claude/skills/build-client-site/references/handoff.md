# The phase contract

A client build runs as five skills, one per session, with `/clear` between
them. The context a phase builds up (scraped HTML, image output, screenshots)
is useless to the next one, and re-sending it on every call is most of what a
single-session build costs. What carries forward is on disk: the repo,
`extraction.json`, `design-notes.md`, and `BUILD.md`.

| # | Skill | Runs in | Needs | Leaves |
| --- | --- | --- | --- | --- |
| 1 | `1-site-setup` | template repo, then the new one | a URL | client repo, `extraction.json`, graded images, `BUILD.md` |
| 2 | `2-site-build` | client repo | 1 ✅ | `theme.js`, `client.js`, pages, favicons; site builds |
| 3 | `3-site-signature` | client repo | 2 ✅ | departures built, `design-notes.md` |
| 4 | `4-site-review` | client repo | 3 ✅ | zero criticals (or listed), pre-deploy checklist run |
| 5 | `5-site-ship` | client repo | 4 ✅ | preview deploy, smoke test, final report |

## Every phase, at the start

1. Read `BUILD.md` at the repo root. If an earlier phase is not ✅, stop and
   say which one to run. If this phase is already ✅, say so and stop unless
   the user asked to redo it.
2. Check **Open questions**. A `BLOCKING for <this phase>` question with no
   answer stops the phase: say what is needed and stop.
3. Read `extraction.json` only for the fields this phase uses, and read no
   other phase's reference docs. `template-map.md` at the repo root answers
   "what reads what"; open a component only to change it.

## Every phase, at the end

1. Update `BUILD.md`: the status row (✅, short commit hash, one-line note),
   anything new under Decisions, Open questions, Follow-ups and Port upstream,
   and one Log line.
2. `npm run build` passes (phases 2 onward). Commit, then push if the repo has
   a remote.
3. Set **Next** and end the reply with it, e.g.
   `Next: /clear, then /3-site-signature`.

## Writing BUILD.md

It is re-read by every later phase, so it stays short. Aim for about 150 lines.

- **Decisions carry their reason.** "Direction: warm-classic" is not enough
  for a later phase to hold the line; "warm-classic: family-run since 1987,
  photos are candlelit dining room" is. A later phase does not re-open a
  recorded decision without a finding that forces it, and logs it when it does.
- **Point, don't copy.** Facts live in `extraction.json`, the variant tuple and
  departures in `design-notes.md`, the copy in `client.js`. `BUILD.md` names
  where to look.
- **No narrative.** One Log line per phase, not an account of the session.
- **Follow-ups and Port upstream are the report.** `5-site-ship` builds the
  final report from them, so anything the report needs to say has to be
  written here when it happens, because it is not remembered.

## Questions

Decide cheap facts, proceed, and record the decision. Ask only when being wrong
means deleting a page rather than editing a sentence (see "One source" in
`2-site-build`). A question goes under **Open questions**:

- `BLOCKING for <phase>`: finish everything else this phase can do, then stop
  with the question as the last thing in the reply.
- `Non-blocking`: keep going; it ends up in the report if still open.

The user answers inline in `BUILD.md` (or in chat) before running the next
phase. That phase moves an answered question into Decisions.

## Going back

A later phase may change an earlier phase's files. The review phase touching
`theme.js` is normal. Say what changed and why in its Log line, and update the
Decision it overturns. Do not re-run an earlier phase to do it.

## Port upstream

A change to a template-owned component that fixes a bug, rather than
expressing this client's direction (a missing image dimension, a class
silently overridden by its own utilities, a wrong default), goes under
**Port upstream** with the file and a one-line reason, at the moment it is
made. Otherwise it gets rediscovered and rebuilt on the next build.
