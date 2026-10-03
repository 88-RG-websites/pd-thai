---
name: 3-site-signature
description: >
  Phase 3 of a client site build: make the themed site structurally its own.
  Pick the variant tuple against sibling builds, build two to four deliberate
  departures from the stock composition, run the polish list, and write
  design-notes.md. Runs in the client repo after 2-site-build.
---

# 3 · Signature: structural departures

First read `.claude/skills/build-client-site/references/handoff.md` and do its
"at the start" steps. Hold the direction recorded in `BUILD.md`; this phase
shapes it, it doesn't re-choose it.

Tokens make two sites look different at a glance; identically ordered
sections in identical shapes are still recognisable as one template. This
phase is where each build gets its own structure. Follow
`references/signature.md`; `template-map.md` has every section's variants and
grounds.

## Steps

1. **Read what the siblings spent.** Each sibling client repo's
   `design-notes.md` (and its `src/index.njk` order). Client repos sit beside
   the template on disk; older ones may be under `~/Software`. Only the notes,
   not the repos.
2. **Pick the variant tuple** (signature.md, "The first layer is a tuple"):
   `components.about/menus/contact`, the opt-in bands, `style.seam`,
   `style.titleRule`, the motion preset. It must differ from every sibling on
   at least three shape-changing slots. Fill any `client.js` keys the chosen
   variants read.
3. **Two to four departures** from the four axes: internal composition,
   ground and value, texture, one signature element. Each encodes something
   true about this client.
4. **Re-derive the grounds** after any change: no two neighbours share one,
   and check what is inside the neighbours first.
5. **Polish list.** Every one of these was a client round-trip; do them
   unprompted:
   - `hero_eyebrow` (if any) is white.
   - No backdrop filter on anything that animates at load.
   - Every CTA is one system (same case, tracking, padding): filled
     `btn-accent` beside an outlined twin with `border-transparent`.
   - One left edge per column: heading, body and buttons on one vertical.
   - Check 1024–1279: a two-column row inside a split band needs the column
     measured there, not assumed from 1440.
   - Two adjacent seams: the second enters at the x where the first exits.
   - Motion is one family: reveal, hero entrance and title rule share an ease
     and a tempo. Name the preset (quiet / composed / lively).
6. **Write `design-notes.md`** at the repo root: tuple first, then direction,
   departures (what and why), and what was left stock on purpose.
7. `npm run build` passes.

## Invariants

`header.njk` always; hero never dimmed; menu content stays in the iframe;
decorative rasters capped at half their source width; body text over any
texture passes AA; the `.section` / `.container-site` / `.section-head`
system stays the vertical and typographic system.

## Record in BUILD.md

- **Decisions:** "tuple and departures: see design-notes.md", plus anything
  that overturned a phase 2 decision and why.
- **Port upstream** for any template bug hit while restructuring.
- **Log:** one line naming the departures.

Screenshots are the next phase's job. Check a departure here only as far as
building it needs (one viewport of the section you are working on), not with
a full-page pass.

Then `Next: /clear, then /4-site-review`.
