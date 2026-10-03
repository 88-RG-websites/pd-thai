---
name: 5-site-ship
description: >
  Phase 5 of a client site build: deploy to the preview server, smoke-test
  every page and every asset the deployed pages reference, and write the final report from
  BUILD.md and design-notes.md. Never deploys to production. Runs in the
  client repo after 4-site-review.
---

# 5 · Ship: preview deploy and report

First read `.claude/skills/build-client-site/references/handoff.md` and do its
"at the start" steps. Everything the report says comes from `BUILD.md`,
`design-notes.md` and `extraction.json`, not from memory.

## Deploy

```bash
./deploy.sh preview
```

**Never deploy to production.** Production is human-only: `deploy.sh`
requires an interactive terminal and a typed site-name confirmation, and no
flag bypasses it. Do not work around the guard.

If the preview host is unreachable (see Follow-ups from setup), stop here and
hand the deploy command to the user.

## Smoke test the deployed site

Page-level 200s prove nothing: the HTML loads while every photo inside it can
404, which is how a path-prefix bug reaches a client. `deploy.sh preview`
leaves the prefixed build in `dist/`, so audit it, then fetch everything:

```bash
node .claude/skills/5-site-ship/scripts/prefix-audit.mjs <site_name>
node .claude/skills/5-site-ship/scripts/preview-smoke.mjs <site_name>
```

`prefix-audit.mjs` reads `dist/` for root paths the base plugin cannot rewrite
(inline `url()`, inline-script strings, stylesheet and script paths), doubled
prefixes and stylesheet images missing from the build. `preview-smoke.mjs`
fetches every page in `dist/` from the preview host, every asset those pages
reference (`src`, `srcset`, `data-*`, inline `url()`, meta refreshes) and every
`url()` inside their stylesheets. Each prints a control: the count of prefixed
references, and a missing file answering 404. A failed control means the check
proved nothing. Exit 0 from both is the pass; anything else gets fixed, rebuilt
and redeployed before the report.

## The report

Write it into the reply, built from the files:

- **Preview URL**: `https://preview.88restaurants.com/<site_name>/`
- Business name, `SITE_NAME`, `businessType`
- **Design direction** and why (BUILD.md Decisions)
- **Signature pass**: each departure named, what about this client made it
  right, and how it differs from the previous build (design-notes.md)
- **Sources**: website pages and socials used, and which were blocked
  (extraction.json, BUILD.md Log)
- **Design decisions**: palette and fonts, derived from what; say "inspired
  by", not "matched to"
- **Extraction confidence**: what was found and what was invented (hours,
  email, copy facts), from extraction.json `gaps`
- **Required follow-ups** (BUILD.md Follow-ups): the 88 id first if unknown,
  then the rest. DNS, production and the book/order/menu subdomains when the
  client approves: the template checkout's `go-live` skill, which a person
  drives (every write there is a line they run). With reviews
  on, the last item is always "after the production deploy, register for the
  monthly reviews cron (`/google-reviews` Part B)". Without it the reviews
  stop updating the day the site launches.
- **Photo retouch** (BUILD.md)
- **Port upstream** (BUILD.md), or "none". Without the line nobody notices,
  and the next build starts from the same broken default.
- Review status: passes, pre-deploy checklist result
- **Repo URL**, or why there isn't one
- Offer, don't run: the post-deploy checklist once the client's DNS points at
  production.

## Finish

Mark `5-site-ship` ✅ in `BUILD.md` with the preview URL, set Next to
"production deploy: human only, after client approval", commit and push.
