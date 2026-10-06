# Theming: writing theme.js

The design half of the build phase. The copy half is `content.md`; which key
feeds which section is `template-map.md` at the repo root.

The whole restyle happens in two data files. Never edit `.njk` templates,
`tailwind.config.js`, or `styles.scss` just to retheme — colors, fonts,
radii, shadows, and motion all have hooks. In the *generated client repo* you
may go further: add pages, add new component variants, restructure a section
— that's how sites stay distinct. But if a pure restyle need makes you reach
for config/scss, the template is missing a hook and that's a template
improvement, not a per-site hack.

## Design direction (choose FIRST, before any token)

Every build commits to one direction, chosen from the research (photography
style, price point, copy tone, vibe notes). The direction drives palette
temperature, font pairing, and every `theme.style` token together — that
coherence is what makes sites look designed rather than templated.

| Direction | Radii (btn/card) | Shadows | Animations | Type feel |
| --- | --- | --- | --- | --- |
| Upscale-minimal (fine dining, law, boutique hotel) | 0–0.25rem | none or hairline | off, or slow subtle fade (1s, 12px) | display serif or airy sans, generous tracking |
| Warm-classic (trattoria, family-run, B&B) | 0.375–0.5rem | soft resting shadow | default 0.7s ease-out | serif display + humanist body |
| Casual-expressive (taqueria, cafe, salon) | pill buttons (9999px), 0.75–1rem cards | lifted hover shadow | snappy 0.45s, staggered | characterful display, rounded sans body |
| Bold-modern (gym, barbershop, new-wave spot) | 0 or full pill contrast | hard/none | quick 0.4s, short distance | heavy condensed display, tight leading |

Recipes are starting points — adjust, but stay coherent. **Anti-sameness
check:** if the last site you built (or the stock template) would look like a
sibling of this one with the colors swapped, you haven't picked a direction —
change shape + motion + type, not just hue.

## Design mandate (governs everything below)

The new site is a **complete rework, not a clone**. The old site contributes
brand identity — its colors, logo, and photos. The new site's layout,
typography quality, spacing, and polish come from this template plus your own
design judgment (load the `frontend-design` skill before making these calls).

- Derive a *refined* palette FROM their colors: a muddy `#8b2f2f` becomes a
  rich, controlled red scale — same family, better execution.
- Pick a stronger font pairing *in the same spirit* as their fonts, not a
  literal copy of a dated choice (their Arial body → Inter or Nunito; their
  script logo face → a display serif with personality).
- Never copy the old site's layout, markup, or CSS.
- In the final report, say "inspired by", not "matched to".

## Building the color scales

Pick 1 primary brand hex (and optionally a secondary; otherwise keep the
template's slate secondary — it's a neutral that works with everything).

Generate the 50–950 scale as an HSL lightness ladder anchored at the brand
color (~500 or 600 depending on its darkness):

| Step | ~Lightness | Use |
| --- | --- | --- |
| 50  | 97% | tinted backgrounds |
| 100 | 94% | |
| 200 | 86% | |
| 300 | 74% | |
| 400 | 60% | |
| 500 | 50% | main brand / buttons |
| 600 | 42% | hover, links |
| 700 | 35% | |
| 800 | 28% | |
| 900 | 22% | |
| 950 | 12% | near-black tint |

Keep hue constant (drift ±4° toward warm at the light end looks natural);
reduce saturation slightly at the extremes. Sanity-check contrast: white text
on 500 and 600 must pass WCAG AA for large text (≥3:1), 700 for body (≥4.5:1).

## The accent scale — the third slot

`theme.colors.accent` is optional, and filled buttons stay in the client's
main brand colour unless it measurably fails as one. Everything interactive
answers in it: filled CTAs, hover states, the eyebrow relit on dark grounds,
the card hover outline. Leave it out and every `accent-*` utility falls back to the same
step of `primary`, so a theme without one renders exactly as it did before the
slot existed — the fallback is the client's own brand colour, which is what
makes the slot safe to wire into shared components. The filled CTAs and their
hover states already read it.

Reach for it when the brand colour is:

- **too loud as a plane** — a saturated brand ground repeated on every button,
  band and card is four copies of the logo competing with the photography;
- **failing AA** as a button fill in either direction (white type on it, or it
  as type on white);
- **too close to the chrome** to read as an accent at all.

Measure before you reach. Ramerino's teal passed AA as a fill at 4.53:1, and
the build still made brass the button colour; Deux Amis's build put a
plate-rim cobalt on a red brand's buttons. The owner moved both back to the main brand colour
(2026-10-01). When the brand hue does fail, try a deeper or lighter step of
the same hue first. A second hue goes on details (stars, rules, the lit
eyebrow), and if it does go on the buttons, tell the owner it is a choice
they can reverse.

Anchor it on something real in the client's own material — a second colour in
the wordmark, the awning, the signage — not on a tint of the brand. Two things
to settle by measurement rather than preference:

- **Button label colour.** A light warm accent wants **ink** type, not white.
  Compute both ratios. A `#EC7A44` fill is 5.75:1 against a near-black ink and
  2.82:1 against white — dark type on a warm block is the legible half, and it
  reads as lit rather than painted.
- **Hover direction.** Go whichever way has the headroom. Lighter is right for
  a colour that behaves like light; darker is right for a dense one. "Hover is
  always the 600 step" is a habit, not a rule.

## The leading ladder belongs to the display face

`tailwind.config.js` ships measured line-heights for 2xl–7xl, and the numbers
there are computed against **Spectral**, the stock display face. A build that
changes the face must re-measure, because the ladder's floor is the face's own
ink:

```js
const c = document.createElement('canvas').getContext('2d');
c.font = "600 100px 'Your Display Face'";
const m = c.measureText('The Cooking Ig');   // needs an ascender AND a descender
(m.actualBoundingBoxAscent + m.actualBoundingBoxDescent) / 100;  // ink per em
```

Spectral measures 0.99em of ink per 1em of type; Bodoni Moda measures 1.02;
Archivo, a grotesque, measures 0.905. Every step of the ladder must clear the
number you measure by at least ~0.08em. Below that a wrapped headline sets
with its second line almost touching the first one's descenders — not a
collision, which is why it survives every visual review, and visibly wrong on
the page.

Sanity-check the measurement by measuring a generic `serif` at the same size
and confirming the two differ. If they match, the face had not loaded and you
measured the fallback.

## Fonts

- Both faces must be on Google Fonts. Build `googleFontsUrl` with every
  family + weight actually used — headings are `font-semibold`, so the display
  face needs **600** (and 700 if the client's look wants it), and the body face
  needs 400;500;600;700. A weight the templates use but the URL omits gets
  faux-bolded by the browser and looks smeared.
- **Fonts are served from the site, not Google.** After any `theme.fonts`
  change, run `npm run fonts` (`scripts/self-host-fonts.js`) and commit
  `src/assets/fonts/` and `src/_data/fontFaces.json`. Until then the layout
  sees the URL changed and falls back to the Google stylesheet,
  render-blocking from two more hosts.
- The stock pairing is Spectral over Inter. It is a deliberate neutral, not a
  default to keep: replace it with something that belongs to this client's
  direction (see the table above).
- Display face carries the restaurant's personality; body face stays highly
  legible (Inter, Nunito, Source Sans 3, Lora for a serif body).
- **Check the scale and the tracking against the face you chose.** Two stock
  settings assume a lowercase grotesque and are wrong for anything else. Both
  belong in the client repo's `tailwind.config.js`, not in component classes —
  an override on one element is invisible to the next section that needs the
  same thing, and you will not remember to repeat it.
  - `.section-title` uses `tracking-tight` (−0.025em). Correct for lowercase
    at display size, wrong for any capitals-first or inscriptional face —
    Cinzel, Trajan-likes, most all-caps display — where capitals want
    *positive* tracking. Roughly 0.015em at 48px opening to 0.07em at 18px:
    the smaller the capital, the more air it needs between letters. A face
    whose lowercase are small capitals (Cinzel again) is a capitals face at
    every size, so this applies to its body headings too.
  - `text-base` is 16px, a UI default rather than an editorial one — the size
    of a form label, not of prose someone reads three paragraphs of. A body
    face with a small x-height (Karla, Work Sans, Jost) also sets visibly
    smaller than Inter at the same nominal size. If the prose reads small,
    move the bottom of the scale up one step — 13/15/17/19/21 keeps the ~2px
    intervals — rather than patching `text-base` per component. Leave the
    display sizes alone; they are rarely what reads small.
- Update `theme.meta.tileColor` (Windows pinned tile) to the new brand. That
  meta tag in `core/head.njk` is the only wired tile colour: `browserconfig.xml` and
  its `mstile-150x150.png` are gone from the template, because no page ever
  referenced the XML and nothing but the XML referenced the PNG. A favicon
  generator will hand you both again — drop them. There is no `themeColor`
  knob either: the mobile status bar and the iPhone notch are the page ground,
  so `core/head.njk` reads that colour from `colors.secondary[700]` — the same token
  the `html` rule paints, which is the only way the two can't drift apart. The
  manifest needs nothing: `src/site.webmanifest.njk` renders, taking its names
  from `client.js` and both its colours from that token.

## Fallback palettes by cuisine / business vibe (no usable brand colors found)

Starting points, not rules — adjust to the photography and vibe notes:

| Cuisine / vibe | Primary direction |
| --- | --- |
| Mexican / Tex-Mex | chile red or marigold |
| Italian trattoria | terracotta, olive, warm cream |
| Japanese / sushi | ink charcoal + vermilion accent |
| Steakhouse / grill | oxblood, espresso brown, brass |
| Seafood / coastal | deep marine blue, seafoam |
| Cafe / brunch | warm ochre, sage |
| Fine dining | near-black + gold or burgundy |
| BBQ / smokehouse | burnt sienna, charcoal |
| Salon / spa / beauty | blush, warm neutral, soft gold |
| Gym / fitness | high-contrast charcoal + electric accent |
| Law / finance / professional | navy or forest, muted gold, cool gray |
| Trades (auto, plumbing, landscaping) | strong utilitarian blue/green + safety accent |
| Boutique retail | ink + one saturated signature hue |

State in the final report that the palette was derived from cuisine/vibe, not
extracted brand colors.

## Font pairings by cuisine / vibe (same fallback rule)

Display / body, all on Google Fonts. Starting points — pick the one that
matches the direction, then check it against the photography:

| Cuisine / vibe | Display / body |
| --- | --- |
| Mexican / Tex-Mex | Bitter or Alfa Slab One / Source Sans 3 |
| Italian trattoria | Fraunces or Playfair Display / Lora |
| Japanese / sushi | Cormorant Garamond or Zen Old Mincho / Inter |
| Steakhouse / grill | Oswald or Archivo Black / Roboto |
| Seafood / coastal | Bodoni Moda / Karla |
| Cafe / brunch | Poppins or Quicksand / Nunito |
| Fine dining | Cormorant Garamond or Marcellus / Inter |
| BBQ / smokehouse | Rye or Bebas Neue / Barlow |
| Salon / spa / beauty | Italiana or Marcellus / Jost |
| Gym / fitness | Anton or Teko / Inter |
| Law / finance / professional | Libre Baskerville / Source Sans 3 |
| Trades (auto, plumbing, landscaping) | Barlow Condensed / Barlow |
| Boutique retail | Instrument Serif / Work Sans |

Pair the type with the shape + motion tokens from the direction table — a
condensed display face over pill buttons and a soft shadow reads confused.

## theme.js checklist

- `colors.primary` (+ `secondary` if derived) — full scales per above
- `fonts` + `googleFontsUrl`
- `overlay` — tune to the hero photography (busy/bright photos need 0.55–0.65;
  dark moody photos can drop to 0.35–0.45)
- `meta.tileColor` (theme-color is derived from `secondary[700]`, not set here)
- `style` — the shape + motion language (see Design direction above):
  `radius.btn/card/img`, `shadowCard`/`shadowCardHover` ('none' is a valid,
  deliberate choice), and `animations` ({reveal, duration, distance, easing,
  stagger} — `reveal: false` disables entrance animation entirely), plus
  `heroBarTone`: `'dark'` (default — the hero info strip matches the nav and
  footer) or `'brand'` (primary-600 accent band).
- `style.titleRule` — `'none'` or `'bar'`, a short rule under **every**
  section title in the eyebrow's colour. All or nothing.
- `style.seam` — `'none'` or `'brush'`, the curve that cuts a photograph in
  `about_seam` / `menus_schedule`. Only ever a photograph's edge.
- `style.animations.hero` (`'none'` / `'rise'`) and `.navUnderline` — the
  hero's own entrance and the accent hairline under a hovered nav link. Pick
  a preset for the whole site: **quiet** (reveal 0.45s, hero none, no
  underline), **composed** (0.9s / 10px, rise, underline), **lively** (0.7s /
  28px, rise, underline).
- `galleryTone` — `'dark'` (secondary-700) or `'brand'` (primary-900). The
  gallery band sits directly above the footer and the footer is *also*
  secondary-700, so on `'dark'` the photo grid, the footer and the scrolled
  header share one colour and the bottom of every page reads as a single slab.
  Prefer `'brand'` whenever the client's primary-900 is a usable dark.
**Which sections exist is decided here; what shape they take is not.** Set
the presence flags from what the client actually has (`events`, `catering`,
`employment`, `newsletter`, `galleryOnHome`, `galleryMasonry`) and write the
content their blocks need. Leave the shape slots (`components.about`, `.menus`,
`.contact`, `style.seam`, `style.titleRule`, the motion preset) stock unless
the Brief demands one: `3-site-signature` picks them as one tuple against the
sibling builds. The notes below are what that phase chooses from.

- `components.menus` — `'menus'` (three cards) or `'menus_schedule'` (the
  photograph beside the day's schedule as type) — the second whenever the
  kitchen has one list and a schedule rather than three menus, and
  `client.serviceRows` then carries only services that are true.
- `components.about` — add `'about_seam'` to the choice: a tinted panel over
  a full-bleed frame with its edge cut by `style.seam`. Needs a frame whose
  subject sits right of centre.
- `components.catering` / `components.employment` — on only for a client
  with a real catering business / a real hiring form; each has its own
  `client.*` block.
- `components` — `galleryOnHome` (photos are already on `/gallery/`; turn this
  on only for a client with photography worth repeating), `newsletter` (the
  email-list band, on by default — off for a business with no list), and pick variants
  that fit the content: `contact_with_map` when
  the location is the story, `contact_with_parallax` with strong photography,
  `galleryMasonry: false` when photos are scarce (never pad with placeholders)

### Two things that are not choices

- **`header` is always `'header'`.** The bar starts transparent over the hero
  photograph and only takes a ground on scroll; that treatment is what the
  whole shell is built around. `header_center`'s plaque was tried on a client
  build and rejected outright. Do not use it, and do not invent a boxed or
  centred-logo nav.
- **Never dim the hero photography.** No scrim, overlay, tint or filter over
  the hero slides — the gradient behind the nav and the text/button shadows
  already carry legibility, and the client's photographs are the point of the
  page. If a headline will not hold, change the frame, tighten the crop, or
  deepen the text shadow. Keep `theme.overlay` on parallax bands as light as
  the copy allows, for the same reason.

One more that is a measurement rather than a choice: **`hero_eyebrow`
renders white.** A light warm accent sits in the same value range as salmon,
wood and flame, and the client could not read "Now Open" over any of three
frames. The accent goes on the button, not on type over the photograph.

Those two are the *shell* — the header treatment and the hero photography.
They don't move.

Everything below the shell does. Palette, type, shape tokens and motion are
the first layer of distinctiveness; section order, one restructured section,
texture and a signature element are the second, and every build does both.
That's the signature pass (`3-site-signature`), and it happens in the
generated client repo, never in the template's plumbing.

## Generated assets

- **Favicons**: from the logo — 16/32/180px PNGs into `src/assets/favicons/`
  (`sips -z <h> <w>`), plus `favicon.ico` if ImageMagick is available.

  A downscaled logo is only a favicon when the logo survives 32px. A wordmark,
  a fine engraving, or anything with hairline detail turns to grey mush at that
  size — **open the 32px PNG and look at it** before accepting it. When it does
  not hold, draw a simplified mark instead: the brand's single strongest shape
  (an initial, a silhouette, the one motif from the logo) as flat geometry in
  brand colours, via ImageMagick `-draw` primitives, and hand-author a matching
  SVG so the two agree. A legible abstraction beats an illegible reduction.

  Do not round-trip through SVG to rasterize. ImageMagick's `svg` delegate is
  frequently a stub (a shim invoking an Inkscape that isn't installed) and
  fails by writing a blank image rather than erroring — the same silent-success
  failure mode as the missing fonts in `retouch-photos`. Rasterize from PNG,
  and check any generated icon is non-blank:
  `magick favicon-32.png -format '%[fx:standard_deviation]' info:` near 0 means
  you generated an empty square.
- **og-image.jpg** (or `.png`, never webp; content.md, "SEO"): 1200×630 crop
  of the best hero image (with the logo overlaid only if trivially clean to
  do).

## Two things the palette does that are easy to miss

- **`secondary` is doing two jobs, and a warm palette exposes it.** Components
  write Tailwind's cool `gray-*` for body copy, ledes and hairlines (114
  utilities across 19 files), which is invisible against the stock slate and
  reads plainly blue on cream or clay. Sweeping them to `secondary-*` is **not
  safe as a blanket rename**: the stock scale is a neutral ramp at 50–600 and
  then jumps to the near-black chrome at 700+ (`#0A1123`), so `text-gray-700`
  → `text-secondary-700` collapses a lede into its own heading. A client whose
  `secondary` is a real ramp all the way up can sweep them in its own repo and
  then check every 700/800 hit by eye.
- **Two dark grounds, one rule.** `.ground-ink` (a dark colour) and
  `.ground-photo` (a photograph under the overlay) both relight `.eyebrow` from
  one selector list in `styles.scss`, so a build that relights its dark colour
  bands can't ship a night photograph still carrying the light-ground brand
  colour. The value is a measurement and the two grounds need not share it: a
  photograph under a scrim is a *range*, so measure the lightest pixel in the
  strip the eyebrow occupies rather than the average.
