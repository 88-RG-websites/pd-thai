# The signature pass: making one client's site structurally its own

Tokens (palette, type, radii, motion) make two sites look different at a
glance. They do not make them *structurally* different — the sections still
arrive in the same order, in the same rhythm, wearing the same shapes. Two
sites themed a hundred percent correctly can still be recognised as the same
template by anyone who has seen both.

This pass is where that gets fixed. After the tokens and the content are in
place and the build passes, make **two to four deliberate departures** from the
stock composition, chosen for this client, and different from the departures
the last client got.

The generated repo is the client's own — its `index.njk`, its components, its
`styles.scss`. Editing them there is the intended way to do this. What stays
untouched is the *template repo's* plumbing (`tailwind.config.js`,
`theme-vars.njk`, base layout mechanics); a restyle need that reaches for
those is a missing hook and belongs upstream.

## The four axes

Pick from these. Two well-executed departures beat four half-ones.

### 1. Internal composition

**This is the main axis.** Not the order of the sections — the organisation
*inside* them. The stock spine (`hero → about → menus → carousel → reserve →
visit → newsletter → contact`) is the order that works, and shuffling it is
not what makes a site distinctive; it mostly makes it worse. What makes two
sites read as different designers' work is that each section is arranged for
its own client.

Take two or three sections and rebuild how they are laid out:

- A row of equal cards becomes one feature card and a stack, when the three
  things are not actually equal.
- A single photo beside a copy column becomes a collage of three, or the
  heading leaves the copy column and runs full width, or the copy column
  narrows to a real reading measure and the photo takes the rest.
- A section of identical cards becomes typography: a table, a list, a band of
  columns, whichever the content actually is.
- The section leads with a different thing than the template leads with —
  hours before the map, the picture before the prose.

**One left edge per column.** Whatever a section is rebuilt into, its
heading, body and buttons start on one vertical. Pulling one block sideways
to sit in a curve or a gap read as three left edges on the page that tried
it; step the whole column instead.

The test is whether the change encodes something true about *this* client. A
feature card because the menu is what the traffic came for; hours first
because the kitchen closes on Wednesdays and a wasted drive is the cost of
missing that. Rearranging for variety alone reads as arbitrary.

Presence is part of this axis too: drop a section the client has nothing to
fill, add one they have real content for. Dropping and adding is fine —
reordering the spine is the move to leave alone.

If a genuine reason to reorder does appear, **re-derive the ground
alternation** afterwards. The stock grounds are white / secondary-50 / white /
photo / white / secondary-700 / primary-600 / secondary-50, arranged so no two
neighbours share one; a naive reorder puts two light sections together and the
page reads as one slab.

### 2. Ground and value

The grounds are the other half of composition. A section can change what it is
made of without changing what it contains: the stock white band goes dark ink,
a tinted band goes to the brand's deep end, a card-on-white becomes an
edge-to-edge plaque.

Two rules. **Re-derive the alternation** whenever a ground changes — no two
neighbours share one, and two dark neighbours need a clear step in hue *and*
value or they read as a single slab. And anything embedded in a band has to
come with it: a Google Maps embed left stock punches a white rectangle through
a dark section, so it gets filtered
(`filter: invert(90%) hue-rotate(180deg) saturate(0.85) contrast(0.92)`) with
the dark ground on the wrapper so the pre-paint flash matches too.

### 3. Texture and ground

The stock grounds are flat colour. A client whose world has a material in it
can have that material on the page:

- **Layered CSS gradients** — a subtle vertical falloff, a
  two-stop radial glow behind a heading.
- **An SVG noise or pattern as a `data:` URI background** — grain over a dark
  band, a hairline grid, a repeated motif at low opacity. Inline, so no extra
  request.
- **A knocked-out brand motif as decorative art** — the engraving off their
  printed menu, their crest, a silhouette, at low opacity behind or above a
  heading.

Rules that apply to all three:

- **Body text over a texture must still pass WCAG AA.** Check it, don't
  eyeball it.
- **Never on the hero.** The hero photography is never dimmed, tinted,
  patterned or filtered (`2-site-build`'s theming.md, "Two things that are not choices").
- **A decorative raster is capped at half its source width in CSS pixels** —
  a 1200px-wide file is upscaled and visibly blocky past ~600 CSS px on a 2x
  screen. `magick identify` the file first, then size it.
- Texture that reads as "a texture was applied" is worse than flat colour.
  If it announces itself, take it down until it doesn't.

### 4. The signature element

One thing the site is remembered by, drawn from the client's own world — the
`frontend-design` skill's vocabulary, and the same idea here. A hand-set
numeral treatment in the hours table. An oversized initial in the about copy.
A photograph cut to the shape of their own signage. A gallery hung like their
dining-room wall.

**Not on the headings, and not repeated.** A mark under every title, a banner
behind every eyebrow, a stripe carried onto the pills, cards and footer: the
owner rejected all of it on two sites in one review (Deux Amis's awning
scallops and valance, Bottega's stripe and crosshatch, 2026-10-01), and both
came out entirely. A signature appears once, inside one section. Headings stay
clean (`titleRule` `none` or the plain bar).

Spend the boldness once. Everything around the signature stays quiet — that
contrast is what makes it read as a decision rather than as decoration.

**Not at the seam.** A stripe, chevron, zigzag or woven band along the edge
where two grounds meet reads as a border, however it's drawn — the eye files
any hard edge at a boundary as chrome, not as ornament. Two of these were
built and rejected on the first client site before the right answer landed.
Put the mark *inside* the section (above the eyebrow, behind the heading) and
let the grounds change with nothing between them.

**The exception is a photograph's own cut edge.** A curve is not chrome when
it is the shape of the ground itself — a panel laid over a photograph, or a
photograph bleeding off the viewport, with its edge cut by `clip-path`
(`theme.style.seam`, `about_seam`, `menus_schedule`). Three rules keep it on
the right side of the line, each learned on BITE:

- **Only where a photograph meets a colour ground.** Between two colour
  grounds it is a divider; above a heading it is a squiggle. A hairline
  stroked along it was built and cut by the client — the cut edge alone.
- **Adjacent seams must be continuous, not merely aligned.** Two curves in
  the same column still stepped 136px sideways at the section break; the
  second has to *enter* at the x where the first *exits* (seam-defs.njk
  carries the arithmetic). Flip which way the bow goes so the copy on both
  bands gets the wide side.
- **Trace it off something the client owns.** Their site, their signage,
  their menu — sampled and fitted, not picked from a wave vocabulary. A
  traced edge is nearly straight for most of its run and then sweeps, which
  is exactly what a generic swoosh is not. And a curve's character does not
  survive a new aspect ratio: the vertical edge laid across a wide shallow
  band read as a tilted rule and needed its own shape.

**Take it off an object, not out of a vocabulary.** "Nepalese pattern" gets
you a generic motif; the flower carved into their own sign is theirs. Pull the
mark from a photograph, the menu, the signage or the packaging you already
extracted — then it needs no explanation on the page.

## Two construction rules

- **A section that bleeds to the viewport edge uses a breakout grid, never a
  positioned percentage.** The shape is
  `grid-cols-[minmax(2rem,1fr)_minmax(0,Xrem)_minmax(0,Yrem)_minmax(2rem,1fr)]`:
  copy sits in an inner column, and the bleeding panel spans its inner column
  *plus* the outer gutter. **X + Y = 76rem, not 80**: `.container-site` is
  border-box `max-w-7xl px-8`, so its text edge is `(100vw − 1280px)/2 + 32px`,
  and `1fr` outer tracks only agree with that at 76rem. Size the middle at 80
  and the section's type sits 32px left of every other section's at every
  width. A percentage fails worse: a panel edge is a share of the *viewport*
  while a grid column is a share of a centred *container*, so they drift apart
  as the window widens, and the value that clears an object at 1440 cuts
  through it at 2560.
- **A full-bleed photo panel is bound by height; `srcset` only knows width.**
  A 700px-wide panel asks for ~1400px of file and happily takes a 1200px one
  that then has to cover 700px of panel *height* after a cover crop: a 2x
  upscale from a file the browser considered correct. Give such a panel a flat
  `sizes="100vw"` and put the largest available frame at the top of the
  `srcset`. Check the source's real dimensions first: a 16:9 frame cropped to a
  near-square panel has only its 1080px of height to give.

## What never moves

These survive every signature pass. "Add personality" is not license to
reopen them:

- **The header is always `header.njk`** — transparent over the hero, taking a
  ground only on scroll. No boxed, plaqued or centred-logo nav.
- **The hero photography is never dimmed.** No scrim, tint, overlay, pattern
  or filter over the hero slides.
- **Menu content stays in the ordering iframe.** No hand-typed food, drink,
  wine or catering pages, however good a structural idea it seems — that's a
  second source of truth that goes stale at the next price change.
- **`.section` / `.container-site` / `.section-head` / `.eyebrow` /
  `.section-title` / `.lede` stay the vertical and typographic system.**
  Restructure inside them; don't re-pick `py-*` and heading sizes per section.
- Quality floor: responsive to 375px, visible keyboard focus, reduced motion
  respected, alt text.

## Per-section variation, and what each axis has already spent

"Pick a direction and commit to it" produces palette-and-font variation with
structural sameness — five sites that are the same page in different colours.
What actually makes two builds read as different designers' work is that
**each section is composed differently**. Hold the axes explicitly, and record
what previous builds have spent on them:

| Section | Axis | Himalayan (Frisco) | Woodside Cafe (Queens) | BITE Sushi (Dallas) |
| --- | --- | --- | --- | --- |
| About | composition | three-frame collage, one column | two rows, opposite temperatures, full-bleed colour/photo halves meeting on one seam | cream panel over a full-bleed room frame, its edge a curve traced off their own site (`about_seam`) |
| Menus | shape | feature card + two half-scale cards | press pull-quote + hairline type rows | photo bleeding off the left, seam-cut, beside the day's schedule as hairline rows (`menus_schedule`) |
| Dark ground | texture | fractal-noise grain | two soft radial neon washes | flat ink, deliberately none (a wave-scale pattern read as talavera on clay) |
| Signature | motif | engraved mountain range + ornament | a hairline eyebrow that only lights on dark grounds | one continuous drawn seam running through two bands; a short rule under every title |
| Visit | arrangement | dark ink band, hours first | white band, map two-thirds, three dark detail cards | ink band, map and panel inside the site wrapper |
| Newsletter | ground | brand colour band | full-bleed photograph under the ink overlay | cream, moved above visit as the light beat between two dark bands |
| Gallery | placement/tone | own page, brand tone | own page, ink tone + wash | own page, ink tone |
| CTA colour | source | brand primary | third accent slot, ink text | clay accent, ink text; every CTA one uppercase tracked system |
| Radius / motion | — | 0.125rem, composed 0.8s | 0, quick 0.45s | 0, slow 0.9s / 10px fade, hero rise, nav underline |
| Extra bands | presence | — | — | catering band on ink; /employment/ page |

Two rules that make the table usable rather than decorative:

- **A value in it is spent.** Reuse one only if the client's own material
  demands it, and say why in that build's `design-notes.md`. Add a column for
  each new build.
- **Vary at least three sections structurally, not just tonally.** Recolouring
  a section is not a departure; changing what it is made of is. The axes worth
  reaching for first are the ones that changed shape rather than colour:
  about's composition, the menus band's shape, the visit arrangement, and what
  the newsletter band is made of.

And one anti-pattern with a build behind it: **a mirrored layout is not an
asymmetric one.** Two rows with the sides swapped feel varied while you are
building them and read as a single repeated unit on the finished page. Real
asymmetry needs the halves to differ in *proportion* — different column spans,
a ground edge that does not line up with any column boundary — not only in
handedness. (Woodside kept a mirror deliberately, but only because the equal
tracks make the two photo panels meet corner to corner on one continuous seam.
A mirror needs to buy something like that.)

## The first layer is a tuple, and the tuple must differ

Before any hand-built departure, the template already offers a set of
choices that change what a page is *made of*. Treat them as one tuple and
pick it deliberately:

| Slot | Values |
| --- | --- |
| `components.about` | `about` / `about_parallax` / `about_seam` |
| `components.menus` | `menus` / `menus_schedule` |
| `components.contact` | `contact` / `contact_with_image` / `contact_with_map` / `contact_with_parallax` |
| `components.catering`, `.employment`, `.events`, `.info`, `.parallaxBreak` | on / off, by what the client actually has |
| `style.seam` | `none` / `brush` |
| `style.titleRule` | `none` / `bar` |
| `style.animations.hero`, `.navUnderline`, `.reveal` + duration/distance | `none`/`rise`, on/off, quiet / composed / lively |
| `style.button.text`, `heroBarTone`, `galleryTone`, radii, shadows | as `2-site-build`'s theming.md |

**Differ from every previous build on at least three slots that change
shape, not colour** — about, menus, seam, an extra band — before the
hand-built departures below add the rest. A tuple that only differs in
`galleryTone` and radius is the same page in a new coat. Write the chosen
tuple at the top of `design-notes.md` so the next build can read it in ten
seconds.

The polish a client asks for is also part of the tuple. BITE's last pass
added, by hand, exactly the things now behind tokens: a rule under every
title, a hero entrance, a nav underline, one button system. Decide those at
build time rather than waiting for the client to ask.

## Not repeating yourself

The point is that client A and client B are structurally different, which
means you have to know what A got.

`new-site.sh` creates client repos as siblings of this template on disk, and
earlier builds may sit elsewhere under `~/Software` — look for both. Before
choosing this build's departures, read the previous builds' `design-notes.md`
(and their `src/index.njk` section order) and pick differently. Then write this build's
own `design-notes.md` at the repo root:

```markdown
# Design notes — <business name>

**Direction:** <one of the four, plus a sentence on why, from the research>

**Departures from the stock composition**
1. <axis> — <what changed, and what about this client made it right>
2. …

**Left stock on purpose:** <anything considered and rejected>
```

It's a page, it's cheap, and it is the only thing that keeps the fifth client
from getting the first client's page with new colours.

## Where this lands

The departures go into the final report, named, alongside the design
direction. "Sections reordered so the gallery runs second" is a decision the
user can push back on; "themed to their brand" is not.
