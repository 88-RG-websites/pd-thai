// PD Thai's theme. Hand-built (Gen0) site brought onto the template's plumbing
// with its look unchanged: every value below is what tailwind.config.js, the
// <head> and styles.scss carried before the sync, moved here so the template's
// owned files (tailwind.config.js, core/head.njk, theme-vars.njk) can read it.
// Not a restyle: change a value only to restyle the site.
//
// Visual theme for the site. This file (plus client.js) is the ONLY surface
// that should change to restyle a site — components read everything through
// CSS variables emitted by components/theme-vars.njk, so never hardcode
// colors or font families in templates.
module.exports = {
  colors: {
    // Full 50–950 scales. Derive from the client's brand colors (see
    // .claude/skills/2-site-build/references/theming.md for the
    // scale recipe). These defaults match the template's stock look.
    primary: {
      50: '#f4f8f3',
      100: '#e7f0e6',
      200: '#cfe1cc',
      300: '#b2cfae',
      400: '#8cb885',
      500: '#5f9c56',
      600: '#52864a',
      700: '#44703e',
      800: '#375a32',
      900: '#2a4526',
      950: '#1c2f1a',
    },
    // Unused by this site's own markup (every component sets its own cream/ink
    // hex). Kept as the scale tailwind.config.js carried. Step 700 is the one
    // the template reads for <meta name="theme-color">: it is the page ground,
    // white, as the live site's theme-color has always been.
    secondary: {
      50: '#F8FAFC',
      100: '#F1F5F9',
      200: '#E2E8F0',
      300: '#CBD5E1',
      400: '#94A3B8',
      500: '#64748B',
      600: '#475569',
      700: '#FFFFFF',
      800: '#080E1A',
      900: '#060B13',
      950: '#04080C',
    },

    // OPTIONAL third scale — the interaction colour.
    //
    // `primary` is the brand and `secondary` is the ink. Everything a visitor
    // can press answers in `accent`: filled buttons, hover states, the lit
    // eyebrow on dark grounds, the card hover outline. The slot exists because
    // a brand colour is often wrong for a button — too loud as a plane, too
    // dark for white type, or under AA on white — and there was previously no
    // way to fix that without repainting the brand.
    //
    // Leave it out and every accent-* utility falls back to the SAME STEP of
    // `primary`, so a client with a brand colour and no accent block renders
    // exactly as before — the fallback is the brand, not the template's stock
    // red.
    //
    // What is already wired to it: the filled CTA buttons and their hover
    // states (header, hero, mobile menu, events, 404). Adding the block moves
    // those with no component edits. Anything else a build wants in the accent
    // — an eyebrow, a card outline, a link colour — is still a component edit;
    // the scale exists so that edit has somewhere to point.
    //
    // Anchor it on something real in the client's own material rather than on
    // a tint of the brand — a second colour from the logo, the awning, the
    // signage. Two things to check before committing to a value: a filled
    // button is `bg-accent-500`, and whether its label should be white or ink
    // is a contrast measurement, not a preference (a light warm accent wants
    // ink type); and hover should go whichever way has the headroom, lighter
    // or darker, rather than always darker.
    //
    // accent: {
    //   50: '#FEF6F1',
    //   100: '#FCE7DA',
    //   200: '#F9CBB1',
    //   300: '#F5AA82',
    //   400: '#F2946A',
    //   500: '#EC7A44',
    //   600: '#D15729',
    //   700: '#AE4520',
    //   800: '#8B381B',
    //   900: '#702F19',
    //   950: '#3D160A',
    // },
  },

  // A display serif over a neutral sans is the stock pairing: it gives the
  // headings a voice without committing the shell to a cuisine, and it's the
  // pairing every client build is expected to replace. Load exactly the
  // weights the templates use — 600 (font-semibold) carries every heading, so
  // a family shipped as 400/700 only gets faux-bolded by the browser.
  fonts: {
    display: { family: 'Poppins', fallback: '-apple-system, BlinkMacSystemFont, Segoe UI' },
    body: { family: 'Poppins', fallback: '-apple-system, BlinkMacSystemFont, Segoe UI' },
    // The exact stylesheet the site linked before the sync. After changing it,
    // run `npm run fonts` and commit: the site serves these files itself
    // (scripts/self-host-fonts.js) and uses Google until you do.
    googleFontsUrl:
      'https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,400;0,500;0,600;0,700;0,800;1,600&display=swap',
  },

  // Scrim over hero/parallax photos so text stays legible.
  overlay: 'rgba(0, 0, 0, 0.6)',

  // Shape + motion language. This is what keeps sites from sharing one
  // "template look" — an upscale client might run 0/0.125rem radii, no card
  // shadow, and animations off; a casual spot might run 9999px pill buttons,
  // 1rem cards, and a soft lifted shadow. See the design-direction recipes in
  // .claude/skills/2-site-build/references/theming.md.
  style: {
    radius: {
      btn: '0.375rem',   // buttons + CTA links (9999px = pill, 0 = square)
      card: '0.5rem',    // info cards, menu cards, embeds
      img: '0.5rem',     // gallery / standalone images
    },
    // Short rule under every section title: 'none' (stock) | 'bar'. A bar is
    // 2.75rem x 2px in primary-500 on light grounds and accent-500 on the
    // dark ones, drawn in with the scroll reveal. It is all-or-nothing on
    // purpose — a rule under two headings out of eight reads as a stray —
    // and it is a straight bar, never a decorative mark: a motif belongs
    // inside a section, not on its heading (signature.md).
    titleRule: 'none',
    // Curve that cuts a photograph where it meets a colour ground: 'none'
    // (stock) | 'brush'. Read by about_seam and menus_schedule; it is only
    // ever the edge of a photograph, never a divider between two grounds and
    // never a mark above a heading. Paths and the continuity arithmetic live
    // in components/seam-defs.njk.
    seam: 'none',
    // Ground for the hero info strip (components.heroBar): 'dark' matches the
    // nav and footer so it reads as site chrome; 'brand' puts it on
    // primary-600 as an accent band.
    heroBarTone: 'dark',
    // The filled CTA's type colour and hover direction.
    //   text:  'white' (default) | 'ink'  — secondary-950 type instead
    //   hover: 'darker' (default, accent 600) | 'lighter' (accent 400)
    // Whether white or ink is correct is a MEASUREMENT, not a preference: a
    // light warm accent (marigold, sand, butter) fails white outright — one
    // client's measured 2.54:1 against white and 7.33:1 against ink — and the
    // hover should go whichever side has the headroom, which for ink on a
    // light accent is lighter. Omit the key for the stock behaviour.
    // button: { text: 'white', hover: 'darker' },
    // Card resting + hover shadows ('none' for flat/editorial looks).
    shadowCard: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
    shadowCardHover: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    // Ground for the dark gallery band: 'dark' (secondary-700 — the same
    // value as the footer and the scrolled header) or 'brand' (primary-900).
    // The gallery sits directly above the footer, so on 'dark' the two share
    // an edge and read as one slab; reach for 'brand' whenever the client has
    // a dark brand tone worth putting there, or 'ink' (secondary-900 with the
    // shared .ground-ink treatment) when the brand colour is wrong for a full
    // band or sits too close to the chrome to be an edge — 'ink' steps down in
    // value rather than across in hue, so it works for any palette.
    galleryTone: 'dark',
    // Scroll-reveal motion. reveal:false = no entrance animation at all
    // (content renders statically; hover micro-interactions remain). The
    // other knobs shape the motion: slower + longer distance reads dramatic,
    // short + quick reads snappy, duration ~0.4s + distance 0 ≈ pure fade.
    // Reduced-motion users are handled either way.
    animations: {
      // Hero entrance: 'none' (stock) | 'rise'. 'rise' fades the eyebrow,
      // headline, subtitle and buttons up in four 150ms steps at load, with
      // the same ease as the scroll reveal so the page has one kind of
      // motion. The scroll reveal never touches the hero (it is above the
      // fold), so this is the only entrance it gets. Off under reduced motion.
      hero: 'none',
      // Desktop nav links: a hairline in the accent that slides in from the
      // left on hover (true) or the stock colour change only (false).
      navUnderline: false,
      reveal: true,
      duration: '0.7s',
      distance: '28px',                        // slide-up travel
      easing: 'cubic-bezier(0.16, 1, 0.3, 1)', // ease-out-expo feel
      stagger: '0.1s',                         // step per data-reveal-delay="1..4"
    },
  },

  // Windows pinned-tile colour — a brand accent is fine here, it never sits
  // against the page. The mobile status bar / notch is NOT configured here:
  // it is the page ground and base.njk reads it from colors.secondary[700].
  meta: {
    tileColor: '#da532c',
  },

  // Component variant slots — which partial fills each section. Options:
  //   header:  'header' — always. The transparent-over-hero bar is the look
  //            the shell is built around; 'header_center' still exists in
  //            _includes but was rejected on a client build and must not be
  //            selected for a new site.
  //   info:    '' (off) | 'info' | 'info_two' — hours/contact/menu card block
  //   about:   'about' (clean image + copy) | 'about_parallax' (fixed photo) |
  //            'about_seam' (tinted panel over a full-bleed photo, its edge
  //            cut with theme.style.seam; on secondary-50, so re-derive the
  //            grounds unless menus is 'menus_schedule')
  //   menus:   'menus' (three cards) | 'menus_schedule' (photo bleeding off
  //            the left, seam-cut, beside client.serviceRows set as type on
  //            an ink ground — for a kitchen with one list and a schedule)
  //   contact: 'contact' (reach-us + form) | 'contact_with_image' |
  //            'contact_with_map' | 'contact_with_parallax'
  //   heroBar:        address / hours / phone strip under the hero (true/false)
  //   carousel:       scrolling photo carousel (true/false)
  //   visit:          map + address/hours/phone cards (true/false)
  //   parallaxBreak:  full-bleed parallax photo band between sections (true/false)
  //   galleryMasonry: second, masonry-style gallery (true/false)
  //   newsletter:     email-list sign-up band (true/false). Also needs
  //                   client.id, like every other 88restaurants embed.
  //   catering:       ink band with two photographs and one action, between
  //                   reserve and visit (true/false). Needs client.catering.
  //   employment:     /employment/ careers page (true/false). Same gate as
  //                   events — client.id and a client.nav entry.
  //   events:         /events/ large-party page (true/false). Off by default:
  //                   it is a whole page, and a client who doesn't take large
  //                   parties shouldn't advertise one. Needs client.id too —
  //                   the page is built around the party-inquiry embed. Turn
  //                   it on and add a client.nav entry pointing at /events/.
  //   faq:            homepage FAQ accordion + FAQPage structured data
  //                   (true/false), src/_data/faq.js + components/faq.njk.
  //                   Entries are generated from client.js/theme.js, so
  //                   turning it on needs no copy of its own — just review
  //                   what it produced. Sits between visit and newsletter;
  //                   re-check its ground (the component's own comment) if a
  //                   build also disables visit or newsletter.
  //
  // Default homepage order: hero → about → menus → carousel → reserve →
  // visit → gallery → newsletter → contact. The defaults are deliberately flat
  // and modern: the reservation section is the only parallax treatment out of
  // the box.
  //
  // Section grounds alternate so no two neighbours share one — white,
  // secondary-50, white, photo, white, secondary-700, primary-600,
  // secondary-50 — with the dark gallery kept clear of the parallax band.
  // Tinted bands use secondary-50 rather than a Tailwind gray so they take the
  // client's hue; the newsletter band is the one saturated brand block.
  components: {
    header: 'header',
    info: '',
    about: 'about',
    menus: 'menus',
    contact: 'contact',
    // Homepage gallery strip. Off by default: the gallery lives on its own
    // page (src/gallery.njk) so photos get room and the homepage keeps its
    // pace. Set true for a client whose photos should also sit on the home
    // page (they'll show on both).
    galleryOnHome: false,
    heroBar: false,
    carousel: false,
    visit: false,
    parallaxBreak: false,
    galleryMasonry: false,
    newsletter: false,
    events: false,
    // Catering band between the reservation band and visit, on ink. Needs
    // client.catering filled — for a client whose catering is a real second
    // business, not a line on the footer.
    catering: false,
    // /employment/ careers page around the 88restaurants employment embed.
    // Same gate as events: needs client.id, plus a client.nav entry.
    employment: false,
    // Homepage FAQ accordion + FAQPage structured data. On by default: the
    // entries are generated from client.js/theme.js (src/_data/faq.js), so
    // there is no per-client copy to write before it is safe to ship.
    faq: true,
  },
};
