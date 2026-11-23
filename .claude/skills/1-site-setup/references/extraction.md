# Extraction playbook

Goal: from the business's current website URL (+ optional social URLs), gather
everything needed to fill `client.js`, `theme.js`, and `src/assets/images/` —
then record it all in `extraction.json` at the new repo root.

Assumption: the URL belongs to the client who commissioned this site. Reuse
only their own assets (their photos, their logo, their copy as source facts).

## 1. Crawl the website

1. `curl -sL <url>` the homepage. Parse `<title>`, meta description, schema.org
   JSON-LD (often has name/address/phone/hours ready-made), nav links.
2. Fetch discovered internal pages that look like: about, menu(s), contact,
   hours, locations, gallery. Stay on the same domain; a handful of pages is
   enough — this is extraction, not archiving.
3. **JS-rendered site** (thin HTML, empty body, everything client-side):
   fall back to browser tooling (the built-in browser, or Claude in Chrome for a logged-in source; never Playwright): navigate, use page
   text + snapshot to read content.
4. Screenshot the live homepage at 1440px width and save it into the new repo
   at `extraction/legacy-desktop.png` — the "vibe reference" for later design
   decisions. A 375px screenshot is also worth keeping.

   Pass an **absolute path** to `page.screenshot` from inside
   `run_code_unsafe` and it lands in the client repo directly:

   ```js
   await page.screenshot({ path: '<repo>/extraction/legacy-desktop.png', fullPage: true });
   ```

   `browser_take_screenshot`'s `filename` parameter does not — it reports
   success and writes into a root a later `find /` cannot locate, leaving
   nothing to copy across.

Collect (facts only — copy gets rewritten later, never pasted):
- Business name (title/logo/schema), what kind of business it is (drives
  `client.businessType` + whether menus/ordering applies), cuisine (if a
  restaurant), tagline
- Street address, city/state/zip, phone, email
- Hours (day-by-day; note lunch/dinner splits)
- Social media links (also inputs to §3)
- Google Maps link and/or embed URL
- About/story facts: founded when, by whom, what they're known for
- Menu highlights: signature dishes, categories, price range ($–$$$$)
- Non-restaurants: the equivalent offerings — services + prices, booking
  flow, certifications/awards — same rigor, different nouns
- Page inventory: what sections/pages the source site has (services,
  catering, events, story…) — input for deciding which extra pages the new
  site deserves

## 1b. Client-supplied assets

The user often hands over a folder of their own material — phone photographs of
the room, logo files, header art — alongside the URL. **It outranks anything on
the live site.** Copy it into the new repo's pipeline; never edit in place.

Two things to look for that the website will not give you:

- **Photographs of the printed menu.** A phone shot of a menu card is usually
  legible at full resolution, which means the real dish list, real prices and
  the restaurant's own wording. Read them for facts and record those in
  `extraction.json`. Do **not** build a page that retypes a menu: food, drinks,
  wine and specials are all served by the ordering iframe on `/menus/`, and a
  hand-typed copy is a second source of truth that goes stale on the next price
  change. Nav entries for those categories are fine — point them at `/menus/`.
- **Brand artwork.** A transparent wordmark, a carved sign, a mark. Check the
  alpha channel and the trim box: supplied logos frequently carry lopsided
  transparent padding, which reads as a missing element beside a centred logo
  and shrinks the artwork inside a box that is sized by height. Trim and
  re-centre with a thin symmetric margin.

**Platform stock is not the client's food.** Menufy, HungerRush, BentoBox and
friends fill a restaurant's site with photos from their own stock library —
white plates, generic curries, a naan on a silver tray. Those are not this
kitchen's plates and must not be reused. If the client's own material has no
food in it, say so plainly in the report as the top asset follow-up and build
around the room, the exterior and the brand artwork instead.

## 2. Images and brand

**Images**
- Sources: `<img src>`, `og:image`, `<source srcset>`, CSS `background-image`
  URLs, and any /gallery page.
- Download with curl into a temp dir; keep only images ≥ ~800px wide
  (`sips -g pixelWidth`). Skip icons, sprites, badges, third-party widgets.
- Dedupe (same file under multiple URLs — compare checksums).
- **Retouch and convert in one step, via the `retouch-photos` skill.** A
  client's photos are usually shot under restaurant lighting — warm cast,
  crushed shadows, flat contrast — and grading them is much of the difference
  between a site that looks designed and one that looks scraped. Run
  `.claude/skills/retouch-photos/scripts/retouch.sh check` first; on exit 3
  skip grading, record it as a gap, and fall back to a plain
  `sips -s format webp --resampleHeightWidthMax 2000 in.jpg --out out.webp`.
  Otherwise follow that skill's measure → look → apply → verify loop with
  `@output format=webp maxedge=2000`, which writes the webp itself. Do not run
  `sips` after it: resampling after sharpening throws the sharpening away and
  adds a second lossy encode.
- Name to template conventions: `hero-1.webp`, `gallery-1.webp`…,
  `logo.png`/`logo.svg`. The OG card is `og-image.jpg` (never webp), cut in
  2-site-build.
- **Renditions per photograph, not one.** The master (maxedge 2000, what the
  lightbox opens, `gallery/gN.webp` under `src/assets/images/`), a ~1200px `m*.webp` for
  anything rendering in a column or a card, and the gallery tile. A site that
  only has masters serves them into 400px cards and nothing looks wrong — see
  the page-weight check in `4-site-review`'s design-review.md. The tile and
  the sizes come from one script, not a hand-cut square:

  ```bash
  scripts/optimize-gallery.sh           # gN-r.webp tiles + src/_data/galleryDims.json
  scripts/optimize-gallery.sh --dims-only   # only (re)write the JSON
  ```

  It writes `gN-r.webp` at 800px wide **in the photo's own ratio** (never a
  square crop: `/gallery/` lays out justified rows from each image's
  width/height, and the homepage wall crops with CSS), and records
  `{full: [w, h], thumb: [w, h], tile}` per photo in `galleryDims.json`
  (matched to `client.galleryImages` by the gN in `full`; `tile` becomes the thumb). Re-run it
  after adding or replacing any gallery photo and commit the output. Without
  it the build still works (a photo with no dims is laid out 4:3 and the build
  warns), but the rows are wrong.
- **Curate `client.homeWall` (9 photos).** The homepage wall shows nine tiles
  in the order given and a floating "see the gallery" button sits over tile 9,
  the wide strip in the last row. Choose tile 9 first: it must be plain (a
  table, a bar top, a wall of bottles), never a face, a lone dish or
  lettering. Put the strongest landscape in tile 1 (the big feature tile in
  the default `mosaic` map) and portraits in 2 and 3. Leave `homeWall` empty
  only if the first nine `galleryImages` already satisfy this; fewer than nine
  leaves holes. Look at the built wall at 375, 768 and 1440 before moving on.
- **Hero entries carry `width`, `height`, `alt` and `focus`.**
  `client.heroImages[]` is `{src, portrait, width, height, alt, focus}` (plus
  optional `tagline`/`blurb` for per-slide copy): the dimensions stop the first
  paint shifting, `alt` is the slide's description, and `focus` is the
  `object-position` that keeps the subject in the crop. Read the dimensions off
  the files; never leave them off.
- **Pick the hero frames by cropping candidates to 8:5 and looking at THAT.**
  A contact sheet shows whole photographs; a viewport-tall hero shows a
  letterbox slice with the top and bottom gone, and the two rank differently.
  A plate that fills a portrait frame can lose its subject entirely to the
  crop, and a wide table shot that looks unremarkable whole can be the best
  thing on the sheet at 8:5. Render every candidate through
  `-gravity center -resize 640x400^ -crop 640x400+0+0`, montage those, and
  choose from the montage. Getting this wrong is invisible until someone looks
  at the built page and says the hero photos are weak.
  **Sharpness is a real input but rarely the deciding one.** The largest file
  is not automatically the best hero: on one build the strongest frame upscaled
  1.30x at 1440x900 against 1.06x for two duller ones, and 1.30x on a
  photograph behind a shadowed headline is not visible while a bland hero is.
  State the trade in `client.js` rather than silently taking the sharp option.
- Portrait hero crops for phones: center-crop a ~3:4 version of each hero
  image (`hero-1-portrait.webp`) when the source is large enough.
- **Logo**: grab the highest-res version available (SVG > PNG). If only a
  tiny raster exists, flag it in the final report — don't upscale.
- Favicons + og-image are generated later in the build phase from the logo /
  best hero image.

**Brand colors**
- Look for CSS custom properties, repeated hex/rgb values in stylesheets,
  the logo's dominant colors (read the downloaded logo image directly).
- Record 1–3 candidate brand colors with where each was found. These are
  *inspiration*, not a spec — the design mandate in `2-site-build` governs
  how they become the new palette.

**Fonts**
- `font-family` declarations and Google Fonts `<link>`s. Record the display
  and body faces in use. If a face isn't on Google Fonts, note the closest
  Google Fonts equivalent (e.g. Futura → Jost, Garamond → EB Garamond).

## 3. Social media sources (when URLs were given)

Instagram/Facebook are JS-rendered and often login-walled — use the Chrome
MCP tools (the user's logged-in session). If a source still blocks, **skip it
and note it in the report; never stall the pipeline on one source.**

Harvest:
- Food/interior/exterior photography — usually far better than the website's.
  Download the largest renditions available; same webp pipeline as above.
- Bio/tagline text, cuisine signals, hours corrections (socials are often
  fresher than the website)
- Yelp/Google reviews: recurring praise ("best green chile in town") — angles
  for hero/about copy, recorded as facts

## 4. extraction.json

Write to the new repo root and commit it. Every later phase reads its facts
from here rather than re-scraping, so a fact that is not in this file gets
re-derived (or invented) later. If `extraction.json` already exists when setup
resumes, skip extraction.

```json
{
  "sourceUrl": "https://…",
  "socialUrls": ["…"],
  "extractedAt": "2026-08-14",
  "name": "…",
  "cuisine": "…",
  "tagline": "…",
  "domain": "https://www.…  (the host that serves, measured)",
  "address": { "street": "…", "city": "…", "state": "…", "zip": "…" },
  "geo": { "lat": 0, "lng": 0, "source": "place marker !3d/!4d" },
  "phone": "…",
  "email": "…",
  "hours": [ { "day": "…", "lunch": "…", "dinner": "…" } ],
  "priceRange": "$$",
  "googleMapsUrl": "…",
  "googleMapsEmbedUrl": "…",
  "social": { "facebook": "…", "instagram": "…", "yelp": "…" },
  "aboutFacts": ["founded 1987 by …", "known for …"],
  "menuHighlights": ["…"],
  "ordering": { "availability": ["…"], "contradictsWebsite": ["…"] },
  "legacyUrls": ["/menus.html", "/about.html"],
  "brand": {
    "colors": [ { "hex": "#…", "foundIn": "logo | css | header bg" } ],
    "fonts": { "display": "…", "body": "…", "notes": "…" }
  },
  "images": [ { "file": "src/assets/images/hero-1.webp", "source": "https://…", "kind": "hero|gallery|logo|interior" } ],
  "vibeNotes": "…",
  "gaps": ["no email found", "instagram login-walled", "logo only 200px png"]
}
```

## Failure modes

| Problem | Response |
| --- | --- |
| Site is JS-only / thin HTML | Browser tooling instead of curl |
| No usable images | Keep template placeholders; flag prominently in report |
| No discernible palette | Derive a tasteful palette from cuisine + vibe (table in `2-site-build`'s theming.md); say so in report |
| Font not on Google Fonts | Nearest Google Fonts equivalent; note the substitution |
| Social login-walled | Skip source, note in report |
| No email/phone/hours found | Leave template placeholder, list under `gaps` — pre-deploy checklist will catch any forgotten ones |
