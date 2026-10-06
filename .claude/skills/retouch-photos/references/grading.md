# Grading reference

How to turn measurements into parameters. The script owns the *order* of
operations; this file owns the *values*.

## Reading `measure.tsv`

| Column | What it tells you |
| --- | --- |
| `mean` | Overall brightness, 0–255. Under ~70 is dark, over ~200 is high-key. |
| `sd` | Contrast. Low `sd` on a mid `mean` is the classic flat, lifeless photo. |
| `R` `G` `B` | Channel means. `R − B` is the colour cast: positive is warm. |
| `shadowclip` | % of the frame crushed below 2%. Detail that no longer exists. |
| `highclip` | % blown past 98%. Blown highlights cannot be recovered, only hidden. |
| `profile` | `none` means untagged sRGB. A P3/AdobeRGB tag gets converted on apply. |

Rules of thumb from this template's own photos: a warm restaurant interior
runs `R − B` around 25–55. Anything over 20 is a visible cast. `shadowclip`
above 3% is worth fixing; above 10% the photo is genuinely damaged and can
only be improved, not saved.

## Look at the photo before you write numbers

The stats say *what* is unusual, never *whether it is wrong*. A moody
low-key interior shot and an underexposed mistake produce the same `mean=69`.
A neon-lit taqueria is supposed to be orange. Read the contact sheets, decide
what the photograph is trying to be, and grade toward that. When the stats and
the picture disagree, the picture wins.

The most common failure is not a bad parameter — it is grading a photo that
was already fine. Leaving the op list empty is a real answer:

```
menu-bg.jpg | | already clean, nothing to fix
```

## Deriving white balance

Gray-world assumes the average of a scene is neutral. Applied at full strength
it also strips the warmth a restaurant is *selling*, so apply a fraction of it:

```
gain_R = 1 + s * (G/R - 1)
gain_B = 1 + s * (G/B - 1)
gain_G = 1.00
```

with `s` = 0.10–0.25 for natural work. Worked example, `kobe-trio.jpg`
(R=100 G=63 B=45) at `s = 0.15`:

```
gain_R = 1 + 0.15 * (63/100 - 1) = 0.945
gain_B = 1 + 0.15 * (63/45  - 1) = 1.060   ->  wb=0.95,1.00,1.06
```

Never fully neutralise. `s = 1.0` on that photo turns seared beef grey.

## Parameter ranges

`natural` is the default and the right answer most of the time. The other
columns exist so a build's chosen design direction carries into the photography
instead of stopping at the typography.

| Op | natural (default) | upscale-minimal | warm-classic | casual-expressive / bold-modern |
| --- | --- | --- | --- | --- |
| `wb` strength `s` | 0.15 | 0.25 (cleaner, cooler) | 0.08 (keep the warmth) | 0.15 |
| `gamma` | 0.95–1.12 | 0.98–1.08 | 1.00–1.12 | 0.95–1.10 |
| `levels` lo,hi | 0.2,0.05 | 0.1,0.02 | 0.3,0.05 | 0.5,0.1 |
| `curve` a,b | 2,45 – 3,50 | 1.5,50 | 2,48 | 4,50 – 5,50 |
| `shadows` | 15–25 | 10–20 | 20–30 | 10–20 |
| `highlights` | 0–25 | 10–30 | 0–15 | 0–15 |
| `vibrance` | 4–8 | 2–5 | 5–10 | 10–18 |
| `clarity` r,a | 20,0.12 | 15,0.08 | 20,0.12 | 25,0.20 |
| `sharpen` r,a,t | 1,0.5,0.02 | 1,0.4,0.02 | 1,0.5,0.02 | 1,0.7,0.02 |

Standalone runs have no design direction — use the `natural` column.

### `curve`: the midpoint must track the image's own mean

`curve a,b` is `-sigmoidal-contrast`, and `b` is the **pivot**: everything above
it is lifted, everything below it is pushed down. The table's 45–50 assumes a
photo whose mean sits near the middle of the range. Restaurant interiors do not —
they land at 78–100 out of 255, i.e. 31–39%. Run a 50% pivot on one of those and
most of the frame is *below* the pivot, so the curve does not shape the picture,
it crushes it.

Set `b` to roughly `100 × mean / 255`, and on a frame whose `mean` is under ~85
leave `curve` out altogether — there is nothing beneath the pivot left to give.
On a real build, ten of nineteen photos were auto-reverted for shadow clipping
purely because every `curve` had been written at the default 50.

### `clarity` and `sharpen` inflate the clipping numbers, and that is fine

Unsharp masking puts a dark halo on the dark side of every edge. On a
detail-dense frame — chair spindles, wainscoting, railings — those halos are
hundreds of thousands of genuinely black pixels, so **sharpening alone raises
`shadowclip` even when the grade opened the shadows up**. Measured on one hero
frame: sharpening took it from 1.40% to 2.86%, while the shadow lift in the
same plan took it *down* to 0.87%.

`verify` accounts for this by counting clipping on a quarter-scale copy, where a
one-pixel halo averages away and a genuinely crushed region does not. Do not
"fix" a clipping number by dropping `sharpen`; look at the before/after pair and
decide whether the picture actually lost anything.

## A negative `R − B` is usually correct

Warm is the common indoor defect, so it is tempting to read a cool frame as the
same problem mirrored. It rarely is. Daylight exteriors, open sky, a shelf of
blue glass bottles, a room painted blue — all measure cool because they *are*
cool, and gray-world will warm them into something nobody photographed. On one
build every deliberate leave-alone was this: five exterior frames at `R − B`
around −30 and a bar shelf at −23, sitting in a set where every interior ran
+30 to +86.

Correct a negative cast only when the picture shows you a cast: a grey wall
that has gone blue, skin that has gone waxy. The number alone is not evidence.

## Matching the defect

| Measurement | Reach for |
| --- | --- |
| `R − B` > 20 | `wb` |
| `shadowclip` > 3% | `shadows`, and back off `levels` lo — and check the `curve` pivot before anything else |
| `highclip` > 4% | `highlights`; never raise `gamma` |
| low `sd`, mid `mean` | `curve`, then `clarity` |
| `mean` < 70 and the photo is not meant to be dark | `gamma` up to ~1.12, `shadows` 25 |
| `mean` > 200 | `highlights` 20–30, `gamma` slightly under 1 |
| `profile` is P3/AdobeRGB | nothing — apply converts it automatically |

## Budget

Restraint is a rule, not a preference. Automated grading fails by doing too
much, and the plasticky HDR look is worse than the flat original because it
looks *deliberate*.

- At most 4–5 ops on any one photo. Reaching for all nine means the source is
  beyond rescue; say so in the report instead.
- Never `vibrance` above 20. Verify reverts anything past 1.25× the original's
  saturation anyway.
- A grade that moves overall brightness more than 25 points gets reverted. If a
  photo truly needs that, it needs a human, not a bigger number.

## Plan format

```
@source    src/assets/images
@originals photo-originals
@artifacts extraction/retouch
@output    format=preserve quality=86

kobe-trio.jpg | wb=0.95,1.00,1.06 gamma=1.10 shadows=25 vibrance=6 | warm cast, blacks at 3.4%
menu-bg.jpg   | | already clean
```

`format=preserve` keeps each file's extension; `format=webp` converts (used by
the client-site pipeline, which lets this step own conversion so nothing
re-encodes the graded file afterwards). Lines are `path | ops | why`. The
rationale is not decoration — it is what makes the pass reviewable.
