const client = {
  // Basic Restaurant Information
  name: 'PD Thai Cuisine',
  restaurantName: 'PD Thai Cuisine',
  cuisine: 'Thai Cuisine',

  // Contact Information
  address: {
    street: '3208 Guadalupe Street',
    city: 'Austin',
    state: 'TX',
    zip: '78705',
  },
  phone: '(512) 371-8777',
  email: 'pdthaicuisine@gmail.com',
  domain: 'https://pdthaiaustin.com',

  // Ordering (88 online ordering on the order.pdthaiaustin.com domain)
  orderOnlineUrl: 'https://order.pdthaiaustin.com/pd-thai-austin-austin-tx/online_orders/new',

  // Location & Maps
  googleMapsUrl: 'https://www.google.com/maps/dir/?api=1&destination=PD%20Thai%20Restaurant&destination_place_id=ChIJF1kf7X_KRIYR_T5-iRSzam4',
  googleMapsEmbedUrl: 'https://www.google.com/maps?q=3208+Guadalupe+St,+Austin,+TX+78705&output=embed',
  googlePlacesUrl: 'https://www.google.com/maps/place/PD+Thai+Restaurant+3208+Guadalupe+Street,+Austin+TX/data=!4m2!3m1!1s0x8644ca7fed1f5917:0x6e6ab314897e3efd',

  // Hours. `hours.schedule` is the one source the schema's
  // openingHoursSpecification and the FAQ read (lib/site.js flattens it);
  // the visible copy keeps its own display strings below. One all-day window,
  // written in the `lunch` slot because that is the first key the flattener reads.
  hours: {
    schedule: [{ day: 'Monday - Sunday', lunch: '10:00am - 3:00am' }],
  },
  timezone: 'America/Chicago',
  hoursNote: 'Daily · 10am – 3am',
  hoursDisclaimer: 'Open daily from 10am to 3am.',

  // Facts the template's schema block reads (core/schema.njk). Each is what
  // the hand-written JSON-LD in base.njk said before this sync.
  businessType: 'Restaurant',
  priceRange: '$$',
  cuisines: ['Thai'],
  geo: { lat: 30.299852, lng: -97.740363 }, // the Maps place marker (!3d/!4d), not an embed's centre
  acceptsReservations: true,
  logo: { src: '/assets/images/logo.png', alt: 'PD Thai Cuisine Logo' },
  ogImage: '/assets/images/og-pd-thai.jpg',
  ogImageAlt: 'Overhead view of Thai dishes from PD Thai Cuisine: dumplings, fried banana, spring rolls and a yellow curry',
  analytics: { ga4: 'G-VL6LLVRV6M' },

  // Page titles and meta descriptions, keyed by page file slug
  // (src/_data/eleventyComputed.js). Moved here from each page's front matter;
  // the wording is what the live site already serves.
  seo: {
    index: {
      title: 'PD Thai Cuisine - Authentic Thai Restaurant Near UT Austin',
      description: 'Real Thai flavor steps from UT Austin. Fresh, locally sourced ingredients, vegan & vegetarian options, and a colorful modern dining room on Guadalupe Street.',
    },
    menus: {
      title: 'Menu - PD Thai Cuisine',
      description: 'Browse our full menu and place online orders at PD Thai Cuisine. Fresh Thai dishes made with authentic ingredients and traditional recipes.',
    },
    gallery: {
      title: 'Gallery - PD Thai Cuisine',
      description: 'A look inside PD Thai Cuisine — our dishes, our dining room, and the food we serve near UT Austin.',
    },
    catering: {
      title: 'Catering - PD Thai Cuisine',
      description: 'Thai catering for birthdays, graduations, and office parties near UT Austin. Vegetarian, vegan, and gluten-free options available for pickup or delivery.',
    },
    parties: {
      title: 'Parties & Events - PD Thai Cuisine',
      description: "Planning a party or group event near UT Austin? Submit an inquiry with PD Thai Cuisine and we'll help you plan a table that fits.",
    },
    404: {
      title: 'Page Not Found - PD Thai Cuisine',
      description: 'That page is not on the PD Thai Cuisine site. Head back to the menu or the home page.',
    },
  },

  // System Integration IDs
  id: '828',

  // 88restaurants form slugs, read off the admin (Settings -> Website ->
  // Forms; each tag reads <div data-88-form="<slug>"></div>). The catering
  // and parties pages place theirs by slug too.
  forms: {
    contact: 'contact-us',
    newsletter: 'email-list',
    partyInquiry: 'party-inquiry',
    catering: 'catering-request',
  },

  // Ordering stays on the order.pdthaiaustin.com domain the live site links
  // to; every other urls.* key derives from `id` (lib/site.js).
  urls: {
    order: 'https://order.pdthaiaustin.com/pd-thai-austin-austin-tx/online_orders/new',
  },

  // Social Media (placeholders for future use)
  socialMedia: {
    facebook: '',
    instagram: '',
    twitter: '',
    yelp: '',
    googleBusiness: '',
  },

  // Reservations. `note` is quoted by the FAQ's reservation answer
  // (src/_data/faq.js) and by the home reservations section, so the two cannot
  // disagree.
  reserve: {
    note: 'We are currently accepting online reservations for parties of up to 10.',
  },

  // Hero Section
  hero: {
    kicker: '2 blocks from UT Austin · North Campus',
    titleLine1: 'Real Thai Flavor,',
    titleLine2: 'Steps From Campus',
    subtitle: "Traditional Thai cooking made with locally grown herbs and spices, in a colorful, modern dining room on Guadalupe Street — quick enough between classes, easy enough for the whole family.",
    video: '/assets/videos/hero.mp4',
    videoWebm: '/assets/videos/hero.webm',
    videoMobile: '/assets/videos/hero-mobile.mp4',
    videoMobileWebm: '/assets/videos/hero-mobile.webm',
    poster: '/assets/images/gallery/g1.jpg',
  },


  // Near Campus Section
  campus: {
    heading: 'Late Night Thai Cuisine. Steps from the UT Austin Campus',
    paragraphOne: "Eight years of history on Guadalupe Street meet an exciting new chapter under Ezron's ownership. We're still an easy walk from UT Austin — quick enough for a lunch break between classes, and stocked with fast, affordable, vegetarian and vegan friendly plates for busy students.",
    paragraphTwo: "We keep the woks going until 3am, every night of the week. Whether you're wrapping up a late night study session or heading home from Sixth Street, there's a hot plate of pad thai or drunken noodles waiting for you on Guadalupe Street.",
    image: '/assets/images/exterior-leaf.webp',
    imageAlt: 'Exterior of PD Thai Cuisine on Guadalupe Street',
    pinTopLeft: { image: '/assets/images/plate-extra.webp', alt: 'Tom yum soup with shrimp, surrounded by fresh Thai chilis, lime leaves and spices' },
    pinBottomRight: { image: '/assets/images/plate-5.webp', alt: 'Pad Thai with shrimp, lime and scallions' },
  },

  // Our Kitchen / Story Section
  about_title: 'Traditional recipes, fresh local ingredients',
  about_desc_one: "Authenticity still defines us — every dish is crafted with real, fresh, locally grown ingredients, and a devoted team of five makes sure each plate reflects that dedication.",
  about_desc_two: "Our menu spans diverse options from vegetarian to gluten-free, so health-conscious guests are covered too. Add in convenient car parking, and it's easy to make PD Thai part of your regular routine.",
  about_kicker: 'Our Kitchen',

  // Menu Teaser Section
  menus: {
    kicker: 'Our Menus',
    title: 'Something for every craving',
    subtitle: 'From quick lunch specials to shareable dinner plates and full vegan options — browse it all and order online in minutes.',
    // The /menus/ page's screen-reader-only h1 (the embed fills the page).
    pageHeading: 'PD Thai Cuisine Menu and Online Ordering',
  },
  menuGallery: [
    { image: '/assets/images/old-site-pics/spring-rolls.webp', alt: 'Crispy spring rolls with dipping sauce' },
    { image: '/assets/images/old-site-pics/chicken-stir-fry-1.webp', alt: 'Chicken stir-fried with green beans and chili' },
    { image: '/assets/images/old-site-pics/shrimp-stir-fry.webp', alt: 'Shrimp stir-fry with jasmine rice' },
    { image: '/assets/images/old-site-pics/grilled-beef.webp', alt: 'Grilled beef salad with mixed greens' },
    { image: '/assets/images/old-site-pics/pork-dumplings.webp', alt: 'Steamed pork dumplings with dipping sauce' },
    { image: '/assets/images/old-site-pics/greek-papaya.webp', alt: 'Green papaya salad with sticky rice' },
    { image: '/assets/images/old-site-pics/chicken-stir-fry-2.webp', alt: 'Chicken basil stir-fry with crispy fried egg' },
    { image: '/assets/images/old-site-pics/ground-pork.webp', alt: 'Ground pork larb salad with sticky rice' },
    { image: '/assets/images/old-site-pics/black-sticky-rice.webp', alt: 'Black sticky rice with mango' },
    { image: '/assets/images/old-site-pics/fried-banana.webp', alt: 'Fried banana with whipped cream and chocolate drizzle' },
  ],

  // Gallery Section
  galleryIntro: {
    kicker: 'Gallery',
    heading: 'A taste of PD Thai',
  },
  galleryImages: [
    { thumb: '/assets/images/old-site-pics/spring-rolls.webp', full: '/assets/images/old-site-pics/spring-rolls.webp', alt: 'Crispy spring rolls with dipping sauce' },
    { thumb: '/assets/images/old-site-pics/chicken-stir-fry-1.webp', full: '/assets/images/old-site-pics/chicken-stir-fry-1.webp', alt: 'Chicken stir-fried with green beans and chili' },
    { thumb: '/assets/images/old-site-pics/shrimp-stir-fry.webp', full: '/assets/images/old-site-pics/shrimp-stir-fry.webp', alt: 'Shrimp stir-fry with jasmine rice' },
    { thumb: '/assets/images/old-site-pics/grilled-beef.webp', full: '/assets/images/old-site-pics/grilled-beef.webp', alt: 'Grilled beef salad with mixed greens' },
    { thumb: '/assets/images/old-site-pics/pork-dumplings.webp', full: '/assets/images/old-site-pics/pork-dumplings.webp', alt: 'Steamed pork dumplings with dipping sauce' },
    { thumb: '/assets/images/old-site-pics/greek-papaya.webp', full: '/assets/images/old-site-pics/greek-papaya.webp', alt: 'Green papaya salad with sticky rice' },
    { thumb: '/assets/images/old-site-pics/chicken-stir-fry-2.webp', full: '/assets/images/old-site-pics/chicken-stir-fry-2.webp', alt: 'Chicken basil stir-fry with crispy fried egg' },
    { thumb: '/assets/images/old-site-pics/ground-pork.webp', full: '/assets/images/old-site-pics/ground-pork.webp', alt: 'Ground pork larb salad with sticky rice' },
    { thumb: '/assets/images/old-site-pics/black-sticky-rice.webp', full: '/assets/images/old-site-pics/black-sticky-rice.webp', alt: 'Black sticky rice with mango' },
    { thumb: '/assets/images/old-site-pics/fried-banana.webp', full: '/assets/images/old-site-pics/fried-banana.webp', alt: 'Fried banana with whipped cream and chocolate drizzle' },
  ],

  // Reviews Section
  reviewsIntro: {
    kicker: 'Reviews',
    heading: 'What people are saying',
  },
  // Build-time Google reviews (src/_data/reviews.js feeds the carousel in
  // components/home/reviews.njk; package @reservationgenie/google-reviews).
  // The Maps URL must contain the !1s0x…:0x… feature-id segment. Full
  // history caches at the repo root as reviews-cache.json — commit it, never
  // move it into src/_data/.
  reviews: {
    google_maps_url:
      'https://www.google.com/maps/place/PD%20Thai%20Cuisine/data=!4m2!3m1!1s0x8644ca7fed1f5917:0x6e6ab314897e3efd',
    display: { max_reviews: 12, min_rating: 5, require_text: true, min_text_length: 0 },
  },

  // Contact Section
  contact: {
    heading: 'Find us on Guadalupe',
    formHeading: 'Send Us a Message',
  },

  // Catering Page
  catering: {
    kicker: 'Catering',
    heading: 'Bring PD Thai To Your Next Austin Gathering',
    paragraphOne: "Birthdays, graduations, office parties — for eight years we've been cooking real, made-to-order Thai food for North Campus, and under Ezron's ownership that same care carries over into every catering order. Our small kitchen team preps each dish fresh, so your guests get the same quality we serve in the dining room.",
    paragraphTwo: "Vegetarian, vegan, and gluten-free options are all available, so there's something for everyone on the table. We cater parties of up to 40 guests, with pickup or delivery.",
    formNote: "Let us know your date and any special requests below, and our team will follow up to build a catering order around your event.",
  },

  // 404 page
  notFound: {
    kicker: '404',
    heading: "We can't find that page",
    text: 'The page you were looking for has moved or never existed. The menu and the home page are a click away.',
  },

  // Parties & Events Page
  parties: {
    kicker: 'Parties & Events',
    heading: 'Host Your Next Get-Together With Us',
    paragraphOne: "Birthday dinner, team lunch, or just a big group craving Thai food — we love hosting parties at PD Thai. Send us a few details about what you have in mind and we'll help you find a table that fits.",
    formNote: "Tell us your group size, preferred date, and any details about your event below, and our team will follow up to help plan it.",
  },
};

// lib/site.js fills in urls.*/menuHost/hours.windows/etc. and defaults for
// any key an older client.js doesn't set — see it for the derivation rules.
module.exports = require('../../lib/site')(client);
