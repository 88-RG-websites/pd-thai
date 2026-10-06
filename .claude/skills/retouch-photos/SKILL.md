---
name: retouch-photos
description: >
  Grade a folder of photographs the way a seasoned photo editor would — fix
  colour casts, open crushed shadows, recover blown highlights, set black and
  white points, add restrained vibrance and local contrast. Measures every
  image, looks at it, applies a bounded set of ImageMagick operations in
  professional order, then re-measures and reverts anything it made worse.
  Use when asked to "touch up the photos", "fix the lighting on these images",
  "the photos look flat/orange/dark", or as the retouch step of a client-site
  build.
---

# Retouch photos

Four steps: **measure → look → apply → verify**. Objective numbers on both
ends, human judgment in the middle. Never grade from the numbers alone and
never from the picture alone — each catches what the other misses.

Everything runs through one script:

```bash
.claude/skills/retouch-photos/scripts/retouch.sh <check|measure|apply|verify|restore>
```

## Requirement

ImageMagick. Nothing else — no npm packages, no jq, no python, so this skill
travels with the template to whoever clones it.

**Always run `check` first.** Exit 3 means ImageMagick is absent: report that
photos were left as-is, print the install hint the script gives you, and carry
on. A missing optional tool is never a failed build.

```bash
scripts/retouch.sh check || { echo "photo retouch skipped"; }
```

## 1. Measure

```bash
scripts/retouch.sh measure src/assets/images extraction/retouch
```

Read-only. Writes `measure.tsv` (dimensions, brightness, contrast, per-channel
means, shadow/highlight clipping, ICC profile) and `sheet-N.jpg` contact sheets
— nine labelled thumbnails each, so the looking step costs the same whether the
folder holds 12 photos or 200.

Building an *ad-hoc* review grid outside the script: `magick montage` needs a
font for its labels and dies with `unable to read font ''` on a machine without
one — including when the label is set empty. Point it at a file rather than
giving the labels up, because a labelled sheet is what makes the near-duplicate
cull possible:

```bash
magick montage -font /System/Library/Fonts/Supplemental/Arial.ttf -label '%t' \
  '*.webp' -tile 3x -geometry 400x225+6+6 -background '#222' -fill white sheet.jpg
```

Without a usable font anywhere, fall back to `+append` for rows and `-append`
to stack them, and keep the order written down instead.

Logos, favicons, `og-image*`, anything with an alpha channel and anything under
400px are skipped automatically. Flat brand art is not photography and grading
it shifts the brand colour.

### Grade what the pages serve, not what the folder holds

An image folder is not an image set. On one client site 182 files measured as
154 photographs, and the built pages referenced 82 of them — the rest were two
closed locations and a superseded gallery. Grading those costs time, inflates
the diff, and puts churn in front of a reviewer for files nobody loads.

Derive the used set from the markup before writing the plan, and intersect it
with what `measure` actually measured:

```bash
grep -rhoE '/assets/images/[A-Za-z0-9_./-]+\.(jpg|jpeg|png|webp)' src \
  --include='*.njk' --include='*.html' --include='*.js' --include='*.scss' \
  | sed 's|.*/images/||' | sort -u
```

Anything absent from the plan is untouched by definition, so the plan doubles
as the record of what was in scope. Say in the report how many files the folder
holds versus how many the site serves — "graded 71 of 154" invites the obvious
question, and the answer is a good one.

## 2. Look

Read every contact sheet. For each photo, hold the stats against the picture
and decide what is actually wrong — see `references/grading.md` for reading the
numbers, deriving white-balance gains, and the parameter ranges.

Then write a plan file:

```
@source    src/assets/images
@originals photo-originals
@artifacts extraction/retouch
@output    format=preserve quality=86

kobe-trio.jpg | wb=0.95,1.00,1.06 gamma=1.10 shadows=25 vibrance=6 | warm tungsten cast, blacks crushed at 3.4%
sushi.jpg     | wb=0.98,1.00,1.06 curve=2,45 shadows=20            | warm and flat
menu-bg.jpg   |                                                     | already clean, left alone
```

Every line needs a reason. A photo that needs nothing gets an empty op list —
that is a real answer and the most common correct one.

### Families: shared intent, per-file numbers

Modern markup serves one photograph as several files — a `.jpg` and its `.webp`
twin inside a `<picture>`, plus hand-cut srcset sizes under `opt/`. Three rules,
each of which has already gone wrong once:

- **Grade every file where it sits; do not regenerate the derivatives.** Thumbs
  are frequently centre crops rather than resizes — 400x400 cut from a 3:2
  master — so re-deriving them guesses at framing the markup already depends on.
- **Twins move together.** Grade `hero.jpg` and leave `hero.webp`, and the page
  serves the ungraded one to every browser that supports webp, which is all of
  them. The `.jpg` you were looking at is the fallback almost nobody gets.
- **Share the intent, compute the numbers per file.** Same gamma, shadows and
  vibrance across a family; white balance from each file's *own* R/G/B, because
  a crop has a different colour mix than the frame it came from. Build families
  by matching stats, not filename prefixes: on one build a master read `R − B`
  59 while `<name>-mobile` read 26 — a different framing that merely shared a
  name, and copying the master's gains onto it would have turned it blue.

## 3. Apply

```bash
scripts/retouch.sh apply extraction/retouch/plan.txt
```

Copies each original to `photo-originals/` before touching it (never
overwriting an existing backup, so repeated rounds stay revertible), then runs
one ImageMagick command per image — a single decode and encode, no
intermediate files — in this fixed order:

```
auto-orient → ICC to sRGB → white balance → exposure → black/white point
→ tone curve → shadows/highlights → vibrance → local contrast
→ resize → sharpen
```

**The order is the craft, and the plan cannot change it.** White balance comes
before anything tonal because correcting a cast after boosting saturation bakes
the cast into the boost. Sharpening comes after the resize because sharpening
for 2000px and then shrinking to 1200px throws the sharpening away. You choose
parameters; you do not reorder stages or invent operators.

### `auto-orient` trusts a tag the photograph may contradict

Phone exports carry an EXIF orientation that is occasionally just wrong, and
stage one rotates by it. On one batch a `RightTop` frame was already upright, so
`apply` laid it on its side; two `BottomRight` frames in the same folder were
fine. `verify` does not catch this — it measures colour and clipping, not which
way is up.

Check the tag against the graded result for anything that carries one:

```bash
magick identify -format '%[orientation] %wx%h\n' photo-originals/<f>
magick identify -format '%wx%h\n' <source>/<f>
```

A 90° tag shows up as swapped dimensions. **A 180° tag does not show up at all**,
so those have to be looked at rather than measured. Fix by rotating the graded
file back (`-rotate -90`, `-rotate 180`) — not by re-running `apply`, which
re-reads the same tag and redoes the same rotation.

### `@output` changes files in ways the op list never mentions

Both of its knobs do something the reasons column will not explain later.

**`maxedge` resizes.** Grading an existing site, dimensions are an invariant —
the markup carries `width`/`height` and the srcset carries the sizes — so
**omit `maxedge` entirely**. The example plans set 2000 because they came from
the client-site build, which is generating those derivatives in the first
place; left in, it silently shrinks every master over 2000px. Prove it did not
happen rather than assuming:

```bash
magick identify -format '%wx%h' photo-originals/<f>
magick identify -format '%wx%h' src/assets/images/<f>
```

**`quality` is a page-weight decision.** Photographs that were already
optimised will grow when re-encoded: one pass at q88 added **28%** to a
photo-heavy landing page, which is a real performance regression traded for a
colour correction nobody asked to pay for. Total the graded set against
`photo-originals/`, and if the grade costs more than roughly 10%, drop the
quality and run `apply` again — it always works from the preserved original, so
a second pass re-encodes the original rather than compounding a re-encode. One
site landed at +7% at q80. Then confirm the lower quality did not introduce
blocking: crop a few hundred pixels out of the largest file at 1:1, before and
after, and look. Downscaled before/after pairs cannot show you compression
artefacts.

## 4. Verify

```bash
scripts/retouch.sh verify extraction/retouch/plan.txt
```

Re-measures every graded image and **automatically restores the original** for
any that regressed:

| Guard | Trips when |
| --- | --- |
| Shadow clipping | grew by >0.5 points **and** ended above 2% of the frame |
| Highlight clipping | same test |
| Saturation | ended above 1.25× the original's own HSB saturation |
| Brightness | overall mean moved more than 25 points |

Clipping needs both a relative and an absolute test: trading four points of
recovered shadow for 0.9% blown highlights is a deliberate editor's trade, not
damage. Saturation is judged against each photo's own baseline because a
naturally vivid dish can start higher than a ruined one ends.

Then read the `ba-*.jpg` before/after pairs it writes. Numbers cannot tell you
a photo now looks over-processed. If a grade is too strong, soften the plan and
re-run — `apply` always works from the preserved original, so rounds do not
compound.

At most two rounds. After that, report what is still imperfect honestly rather
than grinding.

`scripts/restore <plan>` puts everything back.

## Guardrails

- **Grading only, never generative.** No inventing content, no removing or
  adding objects, no retouching faces or bodies. These are photographs of a
  real business's real food and real room; a plausible fabrication is far worse
  than a flat photo. The operator set is closed, so this holds structurally.
- **Restraint is the default.** Four or five ops on a photo is a lot. If one
  seems to need all nine, the source is beyond rescue — say so instead.
- **Originals are never destroyed.** `photo-originals/` is gitignored and sits
  outside `src/assets/`, which Eleventy passthrough-copies wholesale — put
  backups in there and they deploy.
- **Report what happened**: how many graded, how many deliberately left alone,
  how many auto-reverted and why — and, when the folder holds more than the
  site serves, how many were never in scope.
- **The site has to serve the graded bytes.** Grading edits source files;
  what ships is a build. Rebuild, then hash one graded file against the one the
  server hands back, because a stale build directory and a caching static
  server both fail by showing you the picture you already had:

  ```bash
  md5 -q src/assets/images/<f>
  curl -s http://127.0.0.1:<port>/assets/images/<f> | md5 -q
  ```
