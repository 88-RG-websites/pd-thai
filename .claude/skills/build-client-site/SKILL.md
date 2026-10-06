---
name: build-client-site
description: >
  Turn a client business's current website URL into a finished, deployed
  preview site built on this template, as five phases run one session at a
  time: 1-site-setup, 2-site-build, 3-site-signature, 4-site-review,
  5-site-ship. Works for restaurants (the common case) and any other local
  business. Use when asked to "build a site for <URL>", "rework <business>'s
  website", given a URL with intent to build, or asked to continue or check on
  a client build.
---

# Build a client site: the router

A build is five phase skills, each run in its own session with `/clear`
between them. This skill only works out which phase is next and starts it.
`references/handoff.md` is the contract every phase follows, and
`BUILD.md` in the client repo records where a build stands.

| # | Skill | What it does |
| --- | --- | --- |
| 1 | `1-site-setup` | intake, client repo, extraction, photos, `BUILD.md` |
| 2 | `2-site-build` | direction, `theme.js`, `client.js`, pages, favicons |
| 3 | `3-site-signature` | variant tuple, structural departures, `design-notes.md` |
| 4 | `4-site-review` | screenshot loop (in subagents), pre-deploy checklist |
| 5 | `5-site-ship` | preview deploy, smoke test, final report |

## Routing

- **In the template repo with a URL**: if a sibling repo for this business
  already has a `BUILD.md`, say so and give its Next line. Otherwise invoke
  `1-site-setup` with the URL, socials, id and notes exactly as given.
- **In a client repo** (a `BUILD.md` at the root): read its Status and Open
  questions. Report where the build stands in two or three lines, and give
  the Next line. If the user asked to continue, invoke the next phase's skill
  directly: the session is already fresh if this is its first message,
  otherwise tell them to `/clear` first.
- **A client repo with no `BUILD.md`** was built before the phases existed.
  Don't retrofit one unless asked; handle the request directly.

After phase 5 and the human production deploy, a site with reviews on still
needs `/google-reviews` Part B (the monthly reviews cron). Name it when
reporting on a finished build.

Don't run more than one phase in a session. Starting phase 2 on top of
phase 1's context is the cost this split exists to avoid.
