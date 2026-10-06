# Content: copy, pages and SEO

Everything that goes into `client.js` besides the design tokens. Where each key
renders is in `template-map.md`; this file is about what to put in it.

`client.js` is data only. The 88restaurants URL shapes, the menu-subdomain
link builder and the hours flattener live in `lib/site.js`, which `client.js`
hands its raw object to on its last line
(`module.exports = require('../../lib/site')(client)`). Never re-derive
`urls.menus`/`menusAbsolute`/`embedScript` or `hours.windows` by hand: set
`hoursSchedule` (12h rows as guests read them, one per run of days, both
ranges on a day with lunch and dinner) and the client-configurable URLs
(`order`/`reserve`/`menusFrame`), and call `menuLink(slug, scheduleId)` for
any menu href in `nav`, `menuCards` or elsewhere.

## Copy

- **Rewrite from facts, never paste.** Copy comes from `extraction.json`
  (`aboutFacts`, `menuHighlights`, `vibeNotes`) and is written fresh: no lorem
  ipsum, no verbatim scrapes. The exception is a Brief that says to reuse the
  client's copy, and even then tighten it.
- **A number in the copy is a promise the client has to keep.** Capacities,
  party sizes, lead times, delivery radii, years in business: write none of
  them from inference. Either the source states it or the page does not say it.
  **Attribution is not verification.** An events page shipped "the form takes
  parties up to 39", with a comment crediting 39 to the inquiry embed's guest
  select, which actually runs to "100+". Nobody had fetched it, and a cited
  number reads as a checked one. Fetch the thing you cite:
  ```bash
  curl -s https://88restaurants.com/<id>/party_inquiry_forms | grep -o '<option[^>]*>[^<]*</option>' | tail -3
  ```
  With no source, write the version that is true without a number: the
  business will confirm what it can do.
- **Headings are Title Case.** Capitalise every word except articles (a, an,
  the), coordinating conjunctions (and, but, or, nor) and prepositions of four
  letters or fewer (at, by, in, of, on, to, up); always the first and last
  word. "The Cooking Is Newari", "On Broadway, Under the Red Awning". Applies to
  `hero_title`, `about_title`, every `*.title`, `formTitle`, `reachTitle`,
  `visitTitle`, `moreTitle`, `notFound.title` and `homeLabel`. Not to
  eyebrows, pretitles or CTA labels (CSS-uppercased), nor ledes and body copy.
- **Say what is actually true of this business.** `serviceRows` lists only
  services it offers; the newsletter lede says what the list sends, not "join
  our newsletter"; `heroBar.hoursNote` is one line, not the schedule.
- `hero_eyebrow`, if any, renders white. The accent goes on buttons, never on
  type over a photograph.
- **Alt text describes the frame.** Every gallery and hero photo gets alt
  text for what is actually in it: open the file, don't guess from the
  filename or generate a template string. Name the business only where the
  photo shows it (the exterior, signage, an award); on every image it is
  keyword stuffing and noise to a screen reader. A wrong specific (a named
  dish that isn't what's pictured) is worse than a general one ("sashimi"
  beats a guessed species).
- **This site never types a menu price**, in copy or in the FAQ; it links to
  the menu (`menus.md`).

## Which pages exist

- **Pages follow the content.** If the business has real content beyond the
  homepage (services, story, private dining), add a page: a `.njk` in `src/`
  extending the base layout, a `client.seo.<slug>` entry and a `client.nav`
  entry. Don't invent pages with nothing to say.
- **Never build a page out of menu content.** Food, drink, wine, specials and
  catering menus are all served by the ordering iframe on `/menus/`, and a
  hand-typed page is a second source of truth that goes stale at the next
  price change. Nav entries for those categories are fine: point them at
  `menuLink('<slug>', <scheduleId>)` (`menus.md` has the schedule-id recipe).
- **Large parties have a page already.** Set `theme.components.events: true`,
  fill `client.events` and `client.forms.partyInquiry`, add a `/events/` nav
  entry. Same for `/employment/`. A hand-rolled version is a second source of
  truth for the same form.
- **One source → a question, not a page.** A client's ordering account carried
  a full catering menu, and a `/catering/` page was built from it with every
  claim traceable. The client said they did not cater, so the page was
  rewritten as an events page. They *do* cater. Three passes. A live ordering
  menu says what the platform will sell, which is a different claim from what
  the business will do, and only a person can close that gap. When a page or
  a major section would rest on one source that the client's own website
  contradicts or omits, name the source and ask (`BLOCKING` in `BUILD.md`).
  The test is the blast radius: deleting a page means ask, editing a sentence
  means decide and record it.
- **Non-restaurant clients**: `ctas: []` or their own booking link, `id: ''`,
  `cuisine: ''`, the right `businessType`, nav labels that fit ("Services",
  not "Menu"), and the menus page repurposed or removed.
- **A business with no fixed place** (a food truck, a caterer): leave
  `address.street`, `address.zip` and `googleMapsUrl` as `''` and list where it
  works in `areaServed` (`{ type: 'State', name: 'New Jersey' }` for a state).
  The schema drops each blank key, and the FAQ and `llms.txt` print only the
  parts it has. A food `businessType` other than `Restaurant`
  (`FoodEstablishment`, `CafeOrCoffeeShop`, `Bakery`, …; the list is
  `FOOD_TYPES` in `lib/site.js`) still emits `servesCuisine` and the menu
  links. The seeded components that print the street (`footer`, `hero-bar`,
  `visit`, `info`, `events-inquiry`, the `contact` variants) print it
  unguarded: guard the ones the site uses (wraps-and-kebabs guards its four).

## Platform ids and forms

- `client.id` can't be scraped. If the user didn't supply it, set `''` and make
  it the headline Follow-up. If the user asks for the template's demo id as a
  stand-in, mark it in `client.js` as a placeholder and say in Follow-ups that
  `/menus/` and the reserve widget are serving **another restaurant's** menu
  and bookings. Shown to the client as-is, that is the wrong business's food on
  their own site.
- Form slugs (`client.forms`) come from the client's admin and can't be
  scraped: leave the placeholders; "confirm the four form slugs" is already in
  Follow-ups.
- A form paints its own card, so add no wrapper. What the site owns is the
  **slot width**: the form pairs fields two per row only above 575px of its own
  width, so a slot under 576px at `lg` ships a phone layout on a desktop.
  `forms.md` has the table.
- **Menu schedule names and descriptions** live in the 88 admin, not this
  repo (`menus.md`, "Naming and describing schedules"): name them for the meal
  (Lunch, Dinner), never Day/Night, and give an image- or PDF-only schedule a
  text version in its description. Changes there are a Follow-up for the
  admin.
- The newsletter band ships on. Turn it off for a business with no list. Its
  field and button colours come from the 88 Forms settings, not `theme.js`; if
  they clash with the palette, that is a Follow-up for the admin.

## SEO

`core/head.njk` and `core/schema.njk` emit canonical, OG, Twitter, the sitemap and the business schema
for free. What the build writes by hand:

- **`llms.txt` carries one extra section on request.** `client.llms.notes`
  (`[]` omits it) adds a "More" bullet list for a fact an AI should know that no
  other section holds: in-room dining, a hotel's name. Markdown links are fine;
  every line obeys the same rule as the FAQ (only what the live site or the
  client's own public page says). Never edit `llms.txt.njk` for one client; it
  is `owned`.
- **Claim online ordering only where the live site does.** `extraction.json`'s
  `onlineOrdering` records whether the current site and socials mention
  ordering online. When it is false, set `onlineOrdering: false` in `client.js`
  (the FAQ drops its ordering question) and keep the topic out of every
  crawler- and AI-facing surface: copy, `client.seo`, `description`, FAQ
  extras, `llms.txt`, schema, `ctas` and nav. Takeout and delivery are the same
  claim. Build, then grep `dist` for `online.?order|order online|takeout|delivery`
  after a control that must match. An 88 account that only runs room service,
  say, is not a public ordering claim.

- **Titles:** every page (`index`, `menus`, `gallery`, `404`, any page
  added) gets a hand-written `client.seo.<slug>.title`, which is what
  `<title>`, `og:title` and `twitter:title` read. Pages carry no title in
  frontmatter. `<what a person searches> | <brand>`, under ~60
  characters, distinguishing word first, brand last, except the homepage,
  which leads with the brand. The distinguishing word is one the business can
  actually rank for: a specific regional cuisine or service beats the generic
  category in a crowded neighbourhood. The strings are literal, so re-check
  them if the name, city or cuisine changes later.
- **Descriptions lead with named things, not adjectives.** The dishes, the
  services, the neighbourhood: nouns people type, not "authentic",
  "delicious", "welcoming atmosphere". End on the fact that decides a visit;
  stay near 155 characters.
- **Every page has a real h1.** `/gallery/` renders "Explore " + name unless
  `gallery.title` is set; `/menus/` uses `menus.pageHeading`. Set both.
- **Schema facts:** `domain` and `geo` come from `extraction.json`, measured in
  setup (`geo` is the place marker's `!8m2!3d<lat>!4d<lng>` pair, never a
  geocoded street address). `cuisines` is the list the business should be
  filed under, separate from the human-readable `cuisine` label. Also fill
  `description` (one or two neutral sentences, distinct from
  `seo.index.description`), `shortName` (schema `alternateName`; omit it
  when there is no real short form), `areaServed`, `currenciesAccepted`,
  `paymentAccepted` and `acceptsReservations`. The comments beside each in
  `client.js` and `core/schema.njk` say what they emit.
- **The FAQ is generated, and it is the keyword vehicle.** `src/_data/faq.js`
  builds the homepage FAQ and its FAQPage schema from `client.js`/`theme.js`.
  Read the generated questions once the data is real: drop any that don't
  apply (no `events` means no large-party question) and check none quotes a
  price or a count that belongs on the menu. Then place the client's SEO
  keyword group (the owner's list, kept in `BUILD.md`; ask for it if absent):
  - **Each phrase lands once, in the answer whose question a guest would type
    it into**, worded the way a person says it. "Italian restaurants near Wall
    Street" becomes "Is there an Italian restaurant near Wall Street?", never
    a stuffed list, never the same phrase in every answer. Two phrases that
    suit one answer can share it.
  - **Three hooks in `client.js`, no edits to `faq.js`:** `neighborhood`
    (spliced into the cuisine and location answers, e.g. "Lower Manhattan's
    Financial District"), `faq.extra` (`[{ question, answer }]`, appended) and
    `faq.extra[].replaces: '<key>'` (rewords a generated question in place;
    keys are `reservations`, `hours`, `cuisine`, `order`, `events`,
    `location`, `hiring`; dropped when that entry isn't generated). Answers
    are HTML from the tag set in the `faq.js` header.
  - **The three questions a keyword group usually maps to** (Antica's shape,
    copy it for any restaurant):
    1. *What kind of food?* (`replaces: 'cuisine'`): lead with the style and
       cuisine words the owner uses ("authentic Italian cuisine"), then the
       neighborhood. Name the business in the first sentence, link the menu.
    2. *Is X a modern/upscale/<style> <cuisine> restaurant?* (`extra`): the
       home for every style word that is not the cuisine itself ("modern",
       "upscale", "family-owned"), backed by the room, the dishes and the wine
       the client copy already describes.
    3. *Is X located near <landmarks>?* (`extra`): list every district and
       landmark the owner wants, in the words a guest searches ("Wall Street",
       "Ground Zero", "Battery Park"). A private-dining or large-party keyword
       goes in the events question (`replaces: 'events'`).
    The generated location answer already carries `neighborhood`.
  - **Measure every proximity claim.** Put each landmark's latitude and
    longitude through the haversine against `client.geo` (a ten-line `node -e`);
    "a short walk" holds to about 0.75 mi straight line, anything farther is
    named by distance or left out. Keep the measured distances in a comment
    beside the extras, as Antica's `client.js` does, so the next editor can
    re-check.
  - **Owner copy is kept, tidied.** Write "we" as the business name (an answer
    is extracted from its page and has to name the business alone) and fix
    typos. A superlative ("the premier private dining space") or a count
    ("several menus") is the owner's claim: check what the code can back (the
    menu pages, the events page), keep it if the owner supplied it, and say in
    the report which claims the owner owns.
  - **Rules of `faq.js` still hold:** open with a direct yes/no that names the
    business, link to where a guest acts, no prices or counts, and nothing
    `client.js` doesn't already say. A proximity claim ("steps from", "a short
    walk") needs a source: the client's own copy, or `geo` measured against
    the landmark. Use only what the client copy or `geo` backs.
  - **An answer that restates a fact the page copy already carries** (what's
    on the menu, what the events page offers) quotes that wording, so the two
    can't drift.
- **`ogImage` is JPEG or PNG, never webp**, with an `ogImageAlt`: link
  scrapers, not browsers, fetch it, and LinkedIn/Slack-class crawlers still
  skip webp cards (`core/head.njk` reads the type off the extension).
- **A schema field is a factual claim.** No `aggregateRating` without verified
  data; no `acceptsReservations: false` on a business that takes reservations
  but does not surface them on this site.
- Never `{{ client.* }}` in frontmatter: it is not rendered, and a literal
  frontmatter `title:` beats `client.seo`.

## Replacing a live site

Every URL in `extraction.json`'s `legacyUrls` that the new site doesn't serve
gets an entry in `src/_data/legacyRedirects.js`; `src/legacy-redirects.njk`
writes one stub per entry, kept out of the sitemap. Two details bite: add the
stubs to `deploy.sh`'s pre-rsync check loop, and give them **no** `| url`
filter. The base plugin rewrites both `href` and a meta refresh's `content`,
so filtering doubles the prefix on preview.
