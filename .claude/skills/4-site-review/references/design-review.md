# Design-review QA loop (mandatory)

Runs after the site builds cleanly. The loop is: build → serve → screenshot →
critique → fix → repeat. **Do not deploy until a full pass produces zero
critical findings.** Cap at 5 iterations; if criticals remain, stop and report
them honestly instead of shipping or looping forever.

If the global `design-review` skill is available in this session, load it and
follow it — this checklist is the fallback/reference. (Exception: if the user
said they'll give visual feedback themselves, skip screenshots entirely.)

## Setup

```bash
npm run build
npx http-server dist -c-1 -p 8199 --silent   # -c-1: no caching, or rebuilds lie
```

**The browser is the built-in one** (`mcp__Claude_Browser__*`): `navigate` to
the served URL, `resize_window` for the viewport, `javascript_tool` for every
measurement, `computer` `screenshot` for the images. **Never Playwright** for a
rendered page (owner, 2026-10-16 and again 2026-10-21: they do not trust what
it renders, and each server is another ~0.5 GB Chromium). A desktop-app
subagent has the same tools: open its own tab (`tabs_create`), never the
owner's, and `tabs_close` when done. A CLI session has no built-in browser:
report the visual check as owed instead of substituting another one. Read
with `get_page_text` / `read_page` / `javascript_tool` before any screenshot.

`resize_window` takes `mobile` (375x812), `tablet` (768x1024) or a custom
`width` and `height`; `desktop` clears it. Reload after switching so load-time
gates re-run, and **reset to `desktop` when the pass is done** (the emulated
size otherwise sticks to the tab).

Two properties of the owner's pane change what a check proves:

- **It has `prefers-reduced-motion: reduce` on.** Crossfades and fades stay;
  movement (hero drift, reveal slides) stops. Read `matchMedia('(prefers-reduced-motion: reduce)').matches`
  before any motion work, and judge motion by what that setting leaves, not by
  what a default browser shows.
- **A hidden pane runs no IntersectionObserver and no rAF.** `tabs_context`
  says whether the pane is displayed. A reveal, drift or timer check made in a
  hidden pane proves nothing: record it UNMET, never PASS. Themed colours also
  ignore Tailwind `/opacity` modifiers, so do not infer a tint from one.

**Scroll the whole page before every full-page screenshot.** Sections carry
`data-reveal`, which an IntersectionObserver clears on scroll (threshold 0.15) —
capture without scrolling first and every section below the hero comes out
blank, which reads as a catastrophic bug that is not there:

```js
const h = document.body.scrollHeight;
for (let y = 0; y < h; y += 300) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 40)); }
await new Promise(r => setTimeout(r, 1200));
window.scrollTo(0, 0);
// assert this is 0 before shooting:
[...document.querySelectorAll('[data-reveal]')].filter(e => getComputedStyle(e).opacity !== '1').length
```

Two more artefacts of full-page capture, so you don't chase them:

- **Parallax bands render as a flat wash.** `background-attachment: fixed`
  paints against the viewport, so a full-page shot shows one smear of colour.
  Judge those sections from a viewport-sized screenshot instead.
- **The hero looks double-exposed.** The slides cross-fade over 1.2s and the
  capture lands mid-transition. Freeze it first if you need a clean frame:
  `document.querySelectorAll('.hero-slide').forEach((s,i) => { s.style.transition='none'; s.style.opacity = i ? '0' : '1'; })`

### Capture gotchas

Two things hide content from a screenshot. Scroll-reveal holds sections at
`opacity: 0` until they intersect the viewport, so a capture renders them
blank — run `document.documentElement.classList.remove('js-reveal')` first.
And a live 88restaurants popup (drawn by `88.js` on any page when the admin has
one on) covers the page with a dimmed modal:
`document.querySelectorAll('[data-88-popup]').forEach(el => el.remove())`, or
load the page with `data-88-popups="off"` on the script tag. Removing the
`<script>` tag alone is too late.

Scrolling to a section needs `document.documentElement.style.scrollBehavior =
'auto'` first: with the site's own `scroll-behavior: smooth` in force,
`scrollIntoView` and `window.scrollTo` silently no-op and every capture comes
back showing the hero. Scroll by computed offset and assert the result:

```js
const el = document.querySelector('#menus');
document.documentElement.style.scrollBehavior = 'auto';
window.scrollTo({ top: el.getBoundingClientRect().top + scrollY, behavior: 'instant' });
Math.round(scrollY)          // 0 here means it did not move
```

A capture containing a cross-origin embed (maps, the ordering iframe, the
newsletter form) needs a 3–5s wait after load or the frame shoots blank.

**WebKit goes through the iOS simulator** (`mcp__Claude_Code_iOS_Simulator__control`:
`attach` first, `open_url`, `screenshot`). It catches the safe-area and
sticky-header bugs a narrow desktop pane doesn't. The installed simulators are
frequently **393pt, not the 375 the review specifies**, so the numeric 375
checks (horizontal overflow, the `h1` line count, the mobile dialog opening,
tap-target heights) belong in the built-in browser at `mobile`. The simulator
is for how it looks; the pane at 375 is for what it measures. To reach a
section further down, `open_url` its anchor (`…/#menus`) rather than scrolling.

### Viewports and pages

Screenshot each of these viewports, full-page, in the built-in browser:

| Viewport | Size |
| --- | --- |
| Mobile | 375 × 812 |
| Tablet | 768 × 1024 |
| Desktop | 1440 × 900 |

Screenshot `/` plus **every page in `client.nav`** (menus, services, any
extra pages you created). Read every screenshot before critiquing.

### Probes (numbers, not screenshots)

Run these with `javascript_tool`; a screenshot of a passing page looks the
same as a screenshot of a page that fails them. Each needs a control: run it
once on a case that must fail (or read the number it is compared to) before
trusting an all-clear.

- **Header height table.** After any change to the bar (a link, a CTA, a
  logo), measure the bar against `--header-height` at 375, 1024, 1280, 1400
  and 1440, and put the five rows in the report. The bar is fixed height, so
  every row must match; a wide wordmark or a fifth nav link fails first at
  1024–1280.

  ```js
  const probe = document.createElement('div');
  probe.style.cssText = 'position:absolute;visibility:hidden;height:var(--header-height)';
  document.body.append(probe);
  const want = probe.getBoundingClientRect().height; probe.remove();
  const bar = document.querySelector('#main-header nav').getBoundingClientRect();
  const logo = document.querySelector('.nav-logo')?.getBoundingClientRect();
  ({ innerWidth, want, bar: Math.round(bar.height), logo: logo && Math.round(logo.height) })
  ```

  The logo should be `--header-height − 4px` tall. On a wordmark that runs
  wide, also check that the nav links and CTAs still fit on one row at 1024.
- **X-scroll sweep.** Every page at 320, 375, 640, 700, 768, 800, 900, 1000,
  1100, 1440 and 1920 (custom `resize_window` widths for the in-between
  ones; the layout changes at sizes no preset hits, and an overhanging stamp
  or breakout only shows there). Run it after the **last** layout commit, not
  the first. Assert `document.documentElement.scrollWidth <= innerWidth`, then
  list the offenders:

  ```js
  [...document.querySelectorAll('body *')].filter(e => e.getBoundingClientRect().right > innerWidth + 1)
    .slice(0, 8).map(e => e.tagName + '.' + [...e.classList].join('.'))
  ```
  The open drawer must also sit at `scrollLeft` 0.
- **Orphans.** The owner's browser ignores `text-wrap: pretty`, so test the
  greedy wrap it will actually use: set `el.style.textWrap = 'wrap'` on each
  heading and paragraph, then read the last line (`Range` over the final
  text node, or line count with a one-word last line). Fix a stranded word with
  `sm:text-balance` or a literal ` ` between the last two words.
- **Reveal sweep at 320×568.** An element with `data-reveal` taller than about
  3400px never reaches the 15% visibility threshold on a phone and stays at
  opacity 0 forever. At 320×568 scroll the whole page, then list
  `[data-reveal]` still below opacity 1 (the scroll snippet above does this).
  The fix is a reveal per card or tile, not one on the container.
- **Motion** (reduced motion on, visible pane only): the hero still
  cross-fades and the pills still fill; the drift and reveal slides do not
  move. In a hidden pane this whole line is UNMET.
- **Wall button.** On `/` at 375, 768, 1024 and 1440 the floating
  "see the gallery" button must cover no face, no lone dish and no lettering
  on tile 9; read the tile under it from a viewport screenshot. The wall must
  close flush with no holes (`.hwall-grid` children fill every area).
- **Contact columns end flush.** At 1024 and 1440 the bottoms of the form
  column and the reach-us column match (`getBoundingClientRect().bottom`); a
  shorter reach-us card takes the `client.contact.promo` photo tile.
- **Gallery rows.** At 768 and up `/gallery/` rows fill edge to edge with no
  one-tile first row; the last row sits centred near row height.

## Critique checklist

**Critical (must fix before deploy)**
- Horizontal overflow at 375px (any sideways scroll)
- Hero text illegible over its photo. Fix it by **swapping the slide, tightening
  the crop, or deepening the text shadow** — never by adding a scrim or filter
  across the hero frame (a corner shade pool behind the copy is the one approved
  exception, `3-site-signature`). The photography is the point of the page (`2-site-build`'s theming.md).
  Choose the slide by measuring the band the headline actually lands in, not by
  judging the frame whole — a photograph can be dark overall and still have a
  lit doorway exactly where the second line sits:

  ```bash
  magick <frame>.webp -gravity center -crop 62%x26%+0-40 +repage -colorspace gray \
    -format 'mean=%[fx:int(mean*255)] sd=%[fx:int(standard_deviation*255)]\n' info:
  ```

  Low `sd` matters more than low `mean`: an even mid-tone holds type, while a
  dark frame with `sd` over ~40 has something bright in it. A frame carrying the
  business's **own signage** is disqualified whatever it measures — two sets of
  large white type in one rectangle read as a mistake. And a high-contrast
  display face (a didone, anything engraved) wants weight 700 rather than the
  stock 600 over photography: at 72px its hairlines are about a pixel, and a
  pixel of white over a lit photograph disappears.
- Two adjacent full-width bands sharing one colour with no edge between them.
  The usual offender is the gallery: it is secondary-700 by default and so are
  the footer and the scrolled header, so the bottom of the page becomes one
  slab. Fix with `theme.style.galleryTone: 'brand'` (or `'ink'`).
- A translucent header over a light band reading as washed-out grey while the
  footer stays solid. Pages that pad past the fixed header need
  `bg-secondary-700` on that padding.
- Contrast failures: white-on-primary and primary-on-white both readable at
  the sizes used (AA: 4.5:1 body, 3:1 large text)
- Broken/missing images, stretched or wrongly-cropped photos
- Overlapping or clipped text at any viewport
- Header/nav broken: mobile menu doesn't open, links dead, logo distorted
- Ordering iframe double-scrollbar on the menus page (iframe taller than the
  viewport minus header — the classic gotcha; check at 375px)

**Major (fix unless there's a stated reason)**
- Template sameness: the page would pass as the stock template (or your last
  build) with recolored buttons — shape tokens, motion, and type must show a
  committed design direction (`2-site-build`'s theming.md), not defaults
- Direction incoherence: pill buttons with a stark serif fine-dining layout,
  playful palette with animations off, etc. — tokens fighting each other
- Typography scale flat or chaotic (hero ≫ section headings ≫ body should
  step down clearly; display font actually loading — check for fallback-font
  rendering)
- Spacing rhythm: sections cramped or cavernous relative to each other
- Tap targets < 44px on mobile (nav links, buttons, social icons)
- Low-quality/upscaled images where a better extracted image exists
- Gallery grid with obvious placeholder images left in
- **Owner's recurring calls** (2026-10-01 v2 round, four sites):
  - Filled buttons in a hue other than the client's main brand colour.
  - Ornament on headings or band edges: a motif under the title, a banner behind
    the eyebrow, a stripe or scallop repeated across sections.
  - A split band (contact, visit, private dining) where one column ends short of
    its neighbour and leaves dead space, or hours set as a narrow list beside
    empty desktop width. Measure the column bottoms at 1024 and 1440, not by eye.
  - A wall or gallery of uniform tiles. Give it rhythm: the homepage wall's
    feature and portrait tiles (`theme.components.homeWall`), an edge-to-edge
    mosaic or justified rows on `/gallery/` (never CSS columns), hover zoom, a
    link through to the full gallery.
  - A map embed too tight to show the cross streets (`!1d` under ~1800 m).
- **Owner's recurring calls** (2026-11-18, lone-star-riverboat revamp; the owner
  called the result the bar every build should reach on the first pass):
  - **Content cards are photo cards.** Tours, boats, events, rooms: text sits on
    the photo (kicker, title, one meta line, price, buttons) over a bottom-up
    black gradient on the text block itself, never a white card under a photo
    and never a row of horizontal bars. Lay them out asymmetrically (7+5 then
    5+7 on a 12-column grid, or one tall feature beside a stack of smaller cards
    whose total height matches it), with every card in a row the same height.
    Measure the heights per row, and that the text block fits inside every card
    from 320 to 1440. Hero bands still get no scrim; the caption gradient is
    only for cards.
  - **The gallery page is the wall and nothing else.** Edge to edge, a mosaic
    with 2x2 feature, tall and wide tiles (`grid-auto-flow: dense`, no holes).
    The frame equals the tile gap on all four sides, including under the fixed
    header and above the footer. No heading or intro copy on the page (keep an
    `sr-only` h1). Probe the gap at each side and count the cells against
    columns × rows at 375, 768 and 1440.
  - **Reviews are Google's.** Use the `google-reviews` skill: rating summary,
    star row, "Read them on Google", six cards and "View more". Never a
    hand-written quote rail.
  - **No blank space beside short content.** On a detail page with short copy,
    the photos go beside the sticky facts card, not in a row underneath. Side-by-side
    menus stack in flex columns, not grid rows that leave a gap. An empty slot
    under a contact column gets a promo photo card that links to another page.
    Measure the column bottoms.
  - **Form iframes sit bare.** No card, border or second heading around an
    88 or RG form, because it brings its own title and ground. Set the frame
    height to the measured form height at each breakpoint, so it never scrolls
    inside itself on desktop or phone.
  - **Small legacy photos get remade in the first pass.** Anything under about
    1200px wide that renders wider than about 600px gets upscaled and graded
    (`client-media` or `restaurant-photos`, same subject). Send the
    before/after sheet in the same pass as the layout, and swap the files in
    on the owner's yes.
  - **Every homepage band leads with a photograph** (cards, wall, an inset photo
    beside facts), except the reviews band. A band that is only a heading and
    paragraphs reads as "lame".
- **Near-duplicate photographs.** Two frames of the same subject seconds apart
  read as a mistake, worst in adjacent gallery cells. Filenames won't tell you:
  `g7.webp` and `g8.webp` were the same bar with the same time on the POS
  screen, and shipped four times over — the about collage, a menu card and two
  neighbouring grid cells. **Judge the contact sheet, not the file list**, and
  when two frames are the same shot, delete the loser rather than leave it for
  a later build to reach for by accident.
- **Headline line count, measured.** A heading that wraps to three lines at
  1440 or five at 375 is a layout problem, not a copy preference, and it is
  invisible until counted. Read it off the page rather than guessing:

  ```js
  const h = document.querySelector('h1'), r = h.getBoundingClientRect();
  Math.round(r.height / parseFloat(getComputedStyle(h).lineHeight))  // lines
  ```

  Two lines at desktop, four at 375, is the working ceiling for a display face.
  A keyword that costs a third desktop line costs more than it returns — cut
  the word, don't shrink the type.
- Footer content wrapping badly on mobile
- **Total the bytes each page references.** Oversizing is invisible in a
  screenshot — the page looks *better*, not worse — so it survives every visual
  pass, and the checklist item above it looks for the opposite failure. One
  build shipped 4.18MB on the homepage because a carousel took the gallery
  masters as its display `src` and pulled eleven 1920px photographs into eleven
  ~400px cards. Anything over ~2.5MB, find the offender:

  ```bash
  python3 - <<'PY'
  import re, os
  for page in ['dist/index.html', 'dist/gallery/index.html']:
      h = open(page).read()
      srcs = set(re.findall(r'(?:src|data-src)="(/assets/images/[^"]+)"', h))
      tot = sum(os.path.getsize('dist' + s) for s in srcs if os.path.exists('dist' + s))
      print(f'{page}: {len(srcs)} images, {tot/1e6:.2f} MB')
  PY
  ```

  The fix is a second rendition, not a lower quality: keep the master for the
  lightbox and serve a ~1200px file to anything rendering in a column or a card.

**Polish (fix if quick)**
- Hero portrait crops actually serving on mobile (inspect `<picture>`)
- Scroll-reveal animating sensibly, not hiding above-the-fold content
- Consistent border-radius / shadow treatment across cards
- Map embed centered on the right address

## Fixing a heading that breaks badly

Measure, then fix. Both of these are arithmetic, not taste:

- **Desktop line breaks are arithmetic.** A headline is a fixed string in a
  fixed face at a fixed size, so measure the candidate lines and pick the
  measure that produces the break you want, rather than reading the wrap off a
  screenshot: `c.font = "700 72px 'Bodoni Moda'"; c.measureText('Newari & Nepali Cooking').width`
  → 898px, which needs `lg:max-w-5xl` and not the stock `max-w-3xl`. Ceilings:
  two lines at 1440, four at 375. When a heading in a `.section-head` breaks
  badly, widen the head (`lg:max-w-4xl`) rather than the lede — `.lede` carries
  its own `mx-auto max-w-2xl` and stays readable inside a wider block.

  Without a browser, measure with ImageMagick over the face's own TTF:
  `magick -font X.ttf -pointsize 30 -kerning <tracking*size> label:"…" -format '%w' info:`.
  Two things make that measurement lie. **Check the file's weight** —
  `fc-scan --format '%{weight}\n' X.ttf` on fontconfig's scale, where 80 is
  Regular, 100 **Medium**, 180 Demibold, 200 Bold; a Google Fonts download is
  frequently already Medium, so "add ~4% because the nav is 500" double-counts.
  And ImageMagick cannot set a **variable** font's axes or read woff2, so for a
  static instance at an exact weight:
  `curl -s -A "Mozilla/4.0" "https://fonts.googleapis.com/css?family=Bitter:600"`
  returns a plain `.ttf` URL.
- **On a phone the gutters have a floor, and past it the SIZE has to move.**
  "Reduce the padding so it fits on two lines" is often arithmetically
  impossible, and it is worth proving before spending a round trip on it. At
  375px `.container-site` (`px-6`, then `lg:px-10 2xl:px-16`) leaves 327px, and a card inside it
  less again. If the longest candidate line is wider than the viewport itself,
  no gutter setting produces the break — "A Himalayan Restaurant" measures
  345px in Bitter SemiBold at `text-3xl`, so that heading breaks three ways at
  every padding. Stepping the base size down one notch (`text-2xl sm:text-4xl`
  on the `h2`, leaving `.section-title`'s ladder intact from `sm`) brought the
  same string to 270px and gave a clean two-line break inside `px-6`. Pick the
  padding that breaks *cleanly* rather than the widest one: an extra 8px is
  what pulls one more word up and strands a two-character orphan.

## Performance numbers

Run Lighthouse against a static server over `dist/` (`npx http-server dist -c-1`),
never `npm run serve`. The dev server has no cache headers, no compression, and
injects an unminified `reload-client.js` — all three score as findings that don't
exist in a deploy. The sample photos aren't the client's either, so the number is
a template baseline, not a site's score. What does transfer: critical-path
structure (LCP element, render-blocking resources, layout shift).

## After the visual pass

**Check the path-prefixed build.** Preview is served from a subfolder, and the
local screenshot pass runs at `/` — where a missing prefix is still a correct
URL, so a broken reference looks perfect right up until it is deployed. Build
the way the deploy does and confirm every asset reference carries exactly one
prefix:

```bash
npm run build:preview
grep -ohE '(src|data-src|srcset|data-srcset)="[^"]*\.(webp|png|jpg|svg)[^"]*"|url\([^)]*\.(webp|png|jpg)[^)]*\)' dist/*.html dist/*/*.html | sort -u
```

Every line must start with `/<site-name>/assets/…`. A bare `/assets/…` is a
404 on the preview server; a doubled `/<site-name>/<site-name>/…` is the same
bug from the other direction. See the `EleventyHtmlBasePlugin` comment in
`.eleventy.js` for which references need `| url` and which must not have it —
inline `background-image` and `data-src` are the two the plugin cannot reach.
Rebuild with `npm run build` afterwards so the local server is serving root
paths again.

**Measure the menu page** when `/menus/` is the ordering iframe. A
screenshot cannot show that 88's pinned category bar sits a few pixels under
the header, so run the probe from the template checkout against the served
root build, with and without `--premium`:

```bash
node <template>/scripts/test/menu-frame.mjs http://127.0.0.1:<port>/menus/
node <template>/scripts/test/menu-frame.mjs --premium http://127.0.0.1:<port>/menus/
```

Every row must PASS. A floating header or a hanging logo fails until
`styles.scss` declares `--header-top`/`--header-overhang`; `menus.md` ("The
`/menus/` iframe page") has the flags and environment variables.

Run the full `pre-deploy-checklist.md` at the repo root (report-only QA gate).
The placeholder grep must come back clean — any leftover "Test Restaurant",
"test.com", "(555) 123-4567", lorem ipsum, or template stock images are a
failed gate, not a warning.

Kill the local server when done.
