---
name: 1-site-setup
description: >
  Phase 1 of a client site build: intake, bootstrap the client repo from the
  template (GitHub repo included), extract facts, brand and photos from the
  business's current website and socials, grade and convert the photos, and
  start BUILD.md. Runs from the template repo. Use when starting a new client
  build from a URL, or when build-client-site routes here.
---

# 1 · Setup: repo, extraction, photos

First read `.claude/skills/build-client-site/references/handoff.md`, the
contract every phase follows. This phase is the one that creates `BUILD.md`,
so its "at the start" steps apply only when resuming an interrupted setup.

**Resuming:** if `../<site_name>/BUILD.md` exists, continue in that repo from
the first missing artifact (repo → `extraction.json` → images) instead of
starting over.

## Intake

Inputs: the business's website URL (required), social URLs, the 88restaurants
id, and any notes (optional).

- Derive the business name from the page title, logo alt or schema.org. Ask
  only if it is genuinely ambiguous.
- Classify it: restaurant or another kind of business. This sets
  `businessType` and whether ordering, menus and reservations apply at all.
- `SITE_NAME`: lowercase and hyphens, from the name (`casa-sanchez`).
- Check the preview host now: `ssh -o BatchMode=yes rg@104.237.128.61 true`.
  If it fails, keep going and put it in Follow-ups: the ship phase will need
  the user.
- Record the user's own words about this build (keep the colours, keep the
  ChowNow modal, reuse the copy) verbatim. They go in `BUILD.md` under Brief,
  and every later phase reads them there.

## Bootstrap

```bash
.claude/skills/1-site-setup/scripts/new-site.sh <site_name>
```

Creates `../<site_name>` from the template (skills included), stamps
`SITE_NAME` into `deploy.sh`/`package.json`, git-inits, creates a **private**
GitHub repo under the template's org and pushes, then installs deps. Repo
creation degrades to a warning (no `gh`, no auth, name taken): that is a
Follow-up, not a failure. `NO_REMOTE=1` skips it; `GH_ORG=<org>` retargets it.

Everything after this runs **inside the new repo**. Copy
`.claude/skills/build-client-site/references/BUILD.template.md` to its root
as `BUILD.md` and fill the header and Brief now, so an interrupted setup can
resume.

## Extraction

Follow `references/extraction.md`. It produces `extraction.json` at the repo
root, the images in `src/assets/images/`, and legacy-site screenshots under
`extraction/`. A blocked source or a missing fact becomes a `gaps` entry, never
a stall.

Four facts need a specific method, and each gets its own `extraction.json` key
so that the build phase uses the value without re-deriving it:

- **`domain`: the host the server actually serves.** It becomes the canonical
  tag, `og:url`, the sitemap host and every schema URL, so an apex/www
  mismatch makes every page declare a canonical that redirects away from
  itself. Measure it rather than assuming it:
  `curl -s -o /dev/null -w '%{http_code} %{redirect_url}' https://www.<domain>/`
- **`geo`: from the place marker** in the resolved `maps.google.com` URL, the
  `!8m2!3d<lat>!4d<lng>` pair. Not by geocoding the street address (wrong on
  hyphenated ones), and not from an embed URL's `!2d`/`!3d`, which is the
  viewport centre and sat 220m off the pin on one client.
- **`legacyUrls`: every URL the old site serves.** Production deploys with
  `--delete`, and Eleventy writes `/menus/` where a hand-built site served
  `/menus.html`, so every old URL 404s on the first deploy unless it gets a
  redirect stub. Crawl for the real URL surface (links, sitemap.xml), and
  include pages the new site has no equivalent of: a redirect home beats a 404
  on an indexed URL.
- **`ordering`: the ordering frame's operational facts**, when there is an 88
  id. The website is marketing copy and goes stale; the frame is what is
  actually sold, with availability windows, weekend-only dishes and exact dish
  names:
  ```bash
  curl -s https://88restaurants.com/<id>/online_orders/frame | grep -o 'Available[^<]*'
  ```
  Record where it contradicts the website. A contradiction that a whole page
  would rest on (a catering menu on a business whose site never mentions
  catering) goes in Open questions as `BLOCKING for 2-site-build`.

## Photos

Photos go through the `retouch-photos` skill before conversion. It owns the
webp write, so nothing re-encodes after it (extraction.md, "Images"). Without
ImageMagick it exits 3: use the photos as they are and record the skip under
Photo retouch in `BUILD.md`. Otherwise record graded / left alone /
auto-reverted, with the reason for any revert.

Keep this phase's context small: summarise measurement output rather than
printing it per image, and look at contact sheets rather than one image at a
time.

## Finish

Commit `extraction.json`, the images and `BUILD.md`, and push. Mark
`1-site-setup` ✅ and log sources used and blocked. The reply ends with:

```
Next: cd ../<site_name> && claude, then /2-site-build
```

A new session in the client repo is the context reset, and it loads that
repo's own `CLAUDE.md` and skills.
