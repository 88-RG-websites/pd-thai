---
name: 2-site-build
description: >
  Phase 2 of a client site build: choose the design direction, write theme.js
  (palette, type, shape and motion) and client.js (all copy, SEO, pages,
  platform ids), generate favicons and the OG image, and get the site
  building. Runs in the client repo after 1-site-setup.
---

# 2 · Build: direction, theme, content

First read `.claude/skills/build-client-site/references/handoff.md` and do its
"at the start" steps. Then load the `frontend-design` skill.

Read from `extraction.json`: name, type, facts, brand colours and fonts, image
list, vibe notes, `domain`, `geo`, `legacyUrls`, `ordering`. Read the Brief in
`BUILD.md`: where the user said to keep their colours or fonts, that overrides
the direction tables. Look at `extraction/legacy-desktop.png` once, for the
vibe.

References: `references/theming.md` (direction, palette, type, theme.js,
favicons), `references/content.md` (copy, pages, SEO, platform ids), and
`template-map.md` at the repo root for which key feeds which section. Open a
component only to change it.

## Mandates

- **A complete rework, clearly better than the source.** The old site's
  colours, logo and photos inform the brand; layout, type and polish come from
  the template and your judgment. Never clone the old layout. The report says
  "inspired by", not "matched to".
- **No template look.** Pick a design direction (upscale-minimal, warm-classic,
  casual-expressive, bold-modern) from the research and commit to it across
  palette, fonts, shape tokens and motion. Two consecutive builds should read
  as different designers' work. The structural half of this is phase 3.

## Steps

1. **Direction first.** Choose it, and write it into `BUILD.md` Decisions with
   the reason from the research, before any token.
2. **`theme.js`**: colour scales (plus `accent` when the brand makes a bad
   button), fonts and `googleFontsUrl` with the weights actually used, overlay,
   radii, shadows, motion, `meta.tileColor`, and the presence flags for
   sections the client has content for. Shape variants stay stock
   (theming.md, "theme.js checklist").
   Then `npm run fonts` to self-host the faces, and commit what it writes.
3. **Type against the face.** Re-measure the display face's ink and adjust the
   line-height ladder and tracking in this repo's `tailwind.config.js`
   (theming.md, "The leading ladder" and "Fonts").
4. **`client.js`**: every block in `template-map.md`, written per
   `content.md`: copy, SEO strings and schema fields, `hoursSchedule`,
   contact, `domain`, `geo`, `cuisines`, `heroImages` with portrait crops and
   real alt text, `nav`, `ctas`, `menuCards`,
   `carouselImages` pairs, `legacyRedirects.js`.
   **Reviews:** when the business has a Google listing, turn them on per
   `/google-reviews` Part A (Maps URL, backfill, commit `reviews-cache.json`).
   Registering for the monthly cron waits for production (Part B).
5. **Extra pages** only where the business has real content (content.md,
   "Which pages exist"). Every page, stock ones included, gets its own
   `client.seo.<slug>.title`. Read the generated FAQ (`faq.js`) once the data
   is real, then place the owner's SEO keyword group in it (`neighborhood`,
   `faq.extra`; content.md, "The FAQ is generated"). Stop at any `BLOCKING` question per the contract.
6. **Favicons and `og-image.jpg`** (JPEG or PNG, never webp) (theming.md, "Generated assets"). Look at
   the 32px favicon before accepting it.
7. `npm run build` passes, then `git diff` the built CSS against the previous
   build if you touched a comment in a scanned file: a prose word that is also
   a utility name ships a stray rule.

## Not choices

- `header` is always `'header'`, and the hero photography is never dimmed
  (theming.md, "Two things that are not choices").
- Menu content stays in the ordering iframe.
- This repo is the client's own: new variants or restructured sections are
  allowed when the direction needs them. The template's plumbing
  (`theme-vars.njk`, base layout mechanics) is not. A bug fix to a
  template-owned component goes under Port upstream as it is made.

## Record in BUILD.md

- **Decisions:** direction and why; palette (anchored on what); accent and
  button label colour (with the measured ratio); fonts and why; measured ink
  and the ladder change; pages added and the source each rests on; anything
  derived from cuisine/vibe rather than extracted.
- **Follow-ups:** `client.id` if unknown (headline item), demo-id stand-in if
  used, reviews cron registration after production (`/google-reviews` Part B)
  or why reviews are off, low-res logo, form colours to fix in the 88 admin, anything invented
  for lack of a source.
- **Log:** one line.

Then `Next: /clear, then /3-site-signature`.
