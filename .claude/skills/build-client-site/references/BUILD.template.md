# Build: <Business Name> (<site_name>)

Source: <url> · 88 id: <id or "unknown"> · Socials: <urls or "none">
Type: <businessType> · Repo: <github url or "local only: reason">
Preview: https://preview.88restaurants.com/<site_name>/

## Status

| Phase | State | Commit | Note |
| --- | --- | --- | --- |
| 1-site-setup | — | | |
| 2-site-build | — | | |
| 3-site-signature | — | | |
| 4-site-review | — | | |
| 5-site-ship | — | | |

**Next:** `/2-site-build`

## Brief

> <the user's own words for this build, verbatim: colour/font instructions,
> things to keep, things to avoid>

## Decisions

<!-- what + why, one bullet each. Later phases hold these unless a finding forces a change. -->

## Open questions

<!-- - [ ] BLOCKING for <phase>: <question> (<source that raised it>)
     - [ ] Non-blocking: <question> -->

## Follow-ups

<!-- anything the human has to do; this list becomes the report's follow-ups -->
- Confirm the four form slugs (`client.forms` still holds the template placeholders)
- Google Analytics off (`client.analytics.ga4` is empty)

## v2-kit checklist

<!-- The template ships the kit as defaults. Tick each, or write why not. -->
- [ ] Defaults kept: `heroBar` off (address, grouped hours, phone and socials live in the About card), `carousel` off, `visit` off, `homeWall` wall chosen (`mosaic` / `strip` / `bento`) and different from siblings
- [ ] `scripts/optimize-gallery.sh` run; `src/_data/galleryDims.json` and the `gN-r.webp` tiles committed
- [ ] `client.homeWall` curated (9); the tile under the floating button (9) is plain, never a face, a lone dish or lettering
- [ ] Every `heroImages[]` entry has `width`, `height`, `alt` and `focus`; `heroDelay` left at 5000 unless there is a reason
- [ ] `hours.groups` read correctly on the About card, footer and contact (typed `hours.groups` only if the derived labels are wrong)
- [ ] Logo fits the fixed-height bar (`--header-height − 4px`); header-height table clean at 375/1024/1280/1400/1440
- [ ] Ground sequence re-derived after any reorder (`template-map.md`); `galleryTone` set if the wall touches the footer
- [ ] Review run in the built-in browser, never Playwright: x-scroll sweep (320–1920 incl. 640–1100), orphans, 320x568 reveal sweep, wall button, contact columns flush

## Port upstream

<!-- template bugs fixed in this repo: file, one-line reason. "none" if none. -->

## Photo retouch

<!-- graded / left alone / auto-reverted and why, or "skipped: no ImageMagick" -->

## Log

<!-- one line per phase, newest last -->
