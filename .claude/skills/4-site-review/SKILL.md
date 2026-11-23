---
name: 4-site-review
description: >
  Phase 4 of a client site build: the mandatory design-review loop. Each pass
  screenshots / and every nav page at 375, 768 and 1440 in a subagent that
  returns written findings; the main session fixes and rebuilds until zero
  criticals (max 5 passes), then runs the path-prefix check and the
  pre-deploy checklist. Runs in the client repo after 3-site-signature.
---

# 4 · Review: screenshot, critique, fix

First read `.claude/skills/build-client-site/references/handoff.md` and do its
"at the start" steps. `references/design-review.md` is the checklist and the
capture method; the reviewer reads it, and this session needs only its
Critical/Major/Polish headings to judge the findings.

## Why a subagent does the looking

Screenshots are the most expensive thing a build puts into context: 3
viewports × every page × up to 5 passes, each image re-sent on every later
call. So **this session does not take or read full-page screenshots.** Each
pass hands the looking to a fresh subagent, which returns text, and its images
die with it.

## The loop (max 5 passes)

1. `npm run build`, and serve `dist/`:
   `npx http-server dist -c-1 -p 8199 --silent` (in the background).
2. **Spawn the reviewer** (Agent tool, general-purpose) with a prompt carrying:
   - the repo path, the server URL, and the page list: `/` plus every
     `client.nav` target;
   - "Read `.claude/skills/4-site-review/references/design-review.md` and
     follow its Setup, Capture gotchas, Probes and Critique checklist. Use the
     built-in browser (own tab, `tabs_close` after, `desktop` resize at the
     end), never Playwright. Capture 375, 768 and 1440 for every page; take
     the numeric 375 checks (overflow, h1 line count, mobile dialog, tap
     targets) in that browser at `mobile`, and run the probe list: the
     header-height table, the x-scroll sweep, orphans, the 320x568 reveal
     sweep, the wall button and contact columns. The owner's pane has
     reduced motion on and a hidden pane runs no IO/rAF, so a motion check
     made there is UNMET.";
   - the direction and departures from `BUILD.md` / `design-notes.md` in two
     lines, so "template sameness" and "direction incoherence" are judged
     against intent;
   - findings already fixed in earlier passes, so it verifies them rather
     than re-reporting them;
   - "Change no files (a screenshot stays in your own context; save none).
     Return only a findings list, most severe first, each with: severity
     (critical/major/polish), page, viewport, section, what is wrong, the
     measurement that shows it, and the likely file."
3. **Fix** from the findings: every critical, every major unless there's a
   stated reason, polish if quick. Fixes follow the rules in the reference:
   never a scrim across the hero frame, a heading break is measured and not guessed. To
   check one fix visually, open a single capture or a clip of one section,
   never a full-page set.
4. Rebuild, then the next pass with a **new** subagent, until a pass returns
   zero criticals. After 5 passes, stop and list what remains, honestly.

## After the loop

The subagent is not needed for these; their output is text:

- The **path-prefix check** (design-review.md, "After the visual pass"):
  `npm run build:preview`, every asset reference carries exactly one
  `/<site_name>/` prefix, then `npm run build` again.
- **Page weight** per page (the same file's python snippet).
- The repo's **`pre-deploy-checklist.md`**. The placeholder grep must be
  clean.
- Stop the server. The findings that matter are in `BUILD.md`.

## Record in BUILD.md

- Status note: passes run, criticals remaining (0 or the list).
- **Decisions** overturned by a fix, with the finding that forced it.
- **Port upstream** for any template bug found.
- **Follow-ups** for anything left open on purpose.
- **Log:** one line.

Commit, push, then `Next: /clear, then /5-site-ship`.
