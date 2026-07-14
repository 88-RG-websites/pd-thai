module.exports = {
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
  domain: 'https://testrestaurant.com',

  // Ordering (PD Thai uses Clover Online, not the 88Restaurants order flow)
  orderOnlineUrl: 'https://pd-thai-cuisine-llc-austin.cloveronline.com/menu/all',

  // Location & Maps
  googleMapsUrl: 'https://www.google.com/maps/dir/?api=1&destination=PD%20Thai%20Restaurant&destination_place_id=ChIJF1kf7X_KRIYR_T5-iRSzam4',
  googleMapsEmbedUrl: 'https://www.google.com/maps?q=3208+Guadalupe+St,+Austin,+TX+78705&output=embed',
  googlePlacesUrl: 'https://www.google.com/maps/place/PD+Thai+Restaurant+3208+Guadalupe+Street,+Austin+TX/data=!4m2!3m1!1s0x8644ca7fed1f5917:0x6e6ab314897e3efd',

  // Hours (kept intentionally general - confirm current hours before visiting)
  hoursNote: 'Lunch, Dinner & Late Night · Daily',
  hoursDisclaimer: 'Hours vary by day — please confirm current lunch, dinner & late-night hours before you visit.',

  // System Integration IDs
  id: '1119',

  // Social Media (placeholders for future use)
  socialMedia: {
    facebook: '',
    instagram: '',
    twitter: '',
    yelp: '',
    googleBusiness: '',
  },

  // Hero Section
  hero: {
    kicker: '2 blocks from UT Austin · The Drag',
    titleLine1: 'Real Thai Flavor,',
    titleLine2: 'Steps From Campus',
    subtitle: "Traditional Thai cooking made with locally grown herbs and spices, in a colorful, modern dining room on Guadalupe Street — quick enough between classes, easy enough for the whole family.",
    video: 'assets/videos/hero.mp4',
    poster: 'assets/images/gallery/g1.jpg',
  },

  // Quick Info Strip
  quickInfo: [
    {
      label: 'Location',
      value: '3208 Guadalupe St, Austin TX',
      icon: 'location',
    },
    {
      label: 'Hours',
      value: 'Lunch, Dinner & Late Night · Daily',
      icon: 'clock',
    },
    {
      label: 'Call In',
      value: '(512) 371-8777',
      icon: 'phone',
    },
    {
      label: 'Good To Know',
      value: 'Vegan & vegetarian options',
      icon: 'heart',
    },
  ],

  // Near Campus Section
  campus: {
    kicker: 'Two Blocks From The Forty Acres',
    heading: 'Built for campus life, loved by the whole neighborhood',
    paragraphOne: "Sitting right on Guadalupe Street, we're an easy walk from UT Austin — quick enough for a lunch break between classes, and stocked with fast, affordable, vegan-friendly plates for busy students.",
    paragraphTwo: "But we're not just a college spot — families, faculty, and neighbors from around Austin come in for the same fresh, made-to-order Thai cooking, every day of the week.",
    tags: ['Walk from campus', 'Fast & affordable', 'Vegan options', 'Family friendly'],
    image: 'assets/images/exterior-leaf.webp',
    imageAlt: 'Exterior of PD Thai Cuisine on Guadalupe Street',
    pinTopLeft: { image: 'assets/images/plate-4.webp', alt: 'Tom yum goong — spicy shrimp soup' },
    pinBottomRight: { image: 'assets/images/plate-5.webp', alt: 'Pad Thai with shrimp, lime and scallions' },
  },

  // Our Kitchen / Story Section
  about_title: 'Traditional recipes, fresh local ingredients',
  about_desc_one: "Eight years of history on Guadalupe Street meet an exciting new chapter under Arnaldo's ownership. Authenticity still defines us — every dish is crafted with real, fresh, locally grown ingredients, and a devoted team of five makes sure each plate reflects that dedication.",
  about_desc_two: "Our menu spans diverse options from vegetarian to gluten-free, so health-conscious guests are covered too. Add in convenient car parking, and it's easy to make PD Thai part of your regular routine.",
  about_desc_three: '',
  about_kicker: 'Our Kitchen',
  about_bg: 'assets/images/gallery/g12.jpg',

  // Menu Teaser Section
  menus: {
    kicker: 'Our Menus',
    title: 'Something for every craving',
    subtitle: 'From quick lunch specials to shareable dinner plates and full vegan options — browse it all and order online in minutes.',
  },
  menuCards: [
    {
      image: 'assets/images/gallery/g9.jpg',
      pretitle: 'Midday · Fast & Affordable',
      title: 'Lunch Specials',
    },
    {
      image: 'assets/images/gallery/g11.jpg',
      pretitle: 'Shareable Plates',
      title: 'Dinner Favorites',
    },
    {
      image: 'assets/images/gallery/g6.jpg',
      pretitle: 'Plant-Based',
      title: 'Vegan & Vegetarian',
    },
  ],

  // Gallery Section
  galleryIntro: {
    kicker: 'Gallery',
    heading: 'A taste of PD Thai',
  },
  galleryImages: [
    { thumb: 'assets/images/gallery/t1.jpg', full: 'assets/images/gallery/g1.jpg', alt: 'A dish or scene from PD Thai Restaurant' },
    { thumb: 'assets/images/gallery/t2.jpg', full: 'assets/images/gallery/g2.jpg', alt: 'A dish or scene from PD Thai Restaurant' },
    { thumb: 'assets/images/gallery/t3.jpg', full: 'assets/images/gallery/g3.jpg', alt: 'A dish or scene from PD Thai Restaurant' },
    { thumb: 'assets/images/gallery/t4.jpg', full: 'assets/images/gallery/g4.jpg', alt: 'A dish or scene from PD Thai Restaurant' },
    { thumb: 'assets/images/gallery/t5.jpg', full: 'assets/images/gallery/g5.jpg', alt: 'A dish or scene from PD Thai Restaurant' },
    { thumb: 'assets/images/gallery/t6.jpg', full: 'assets/images/gallery/g6.jpg', alt: 'A dish or scene from PD Thai Restaurant' },
    { thumb: 'assets/images/gallery/t7.jpg', full: 'assets/images/gallery/g7.jpg', alt: 'A dish or scene from PD Thai Restaurant' },
    { thumb: 'assets/images/gallery/t8.jpg', full: 'assets/images/gallery/g8.jpg', alt: 'A dish or scene from PD Thai Restaurant' },
    { thumb: 'assets/images/gallery/t9.jpg', full: 'assets/images/gallery/g9.jpg', alt: 'A dish or scene from PD Thai Restaurant' },
    { thumb: 'assets/images/gallery/t10.jpg', full: 'assets/images/gallery/g10.jpg', alt: 'A dish or scene from PD Thai Restaurant' },
    { thumb: 'assets/images/gallery/t11.jpg', full: 'assets/images/gallery/g11.jpg', alt: 'A dish or scene from PD Thai Restaurant' },
    { thumb: 'assets/images/gallery/t12.jpg', full: 'assets/images/gallery/g12.jpg', alt: 'A dish or scene from PD Thai Restaurant' },
  ],

  // Reviews Section
  reviewsIntro: {
    kicker: 'Reviews',
    heading: 'What people are saying',
  },
  reviews: [
    { name: 'A O.', text: "One of the best Thai food I've tried so far, so fresh and tasty, and the restaurant is very clean. We ordered pad Thai and thin noodles with beef and basil rice with shrimp — it was amazing." },
    { name: '_HeyS.', text: "The drunken noodles were so fresh and flavorful! My only problem with the steamed dumplings is that I didn't buy more. Easy 10/10 for me." },
    { name: 'Tessa T.', text: 'The food always tastes fresh and is hot! My favorite is the pad see ew. Portions are plentiful — if I order for dinner I can have leftovers for lunch the next day.' },
    { name: 'Kristy K.', text: 'Phenomenal tasting food, always piping hot and freshly cooked. Always nice conversation with their staff and a nice, quiet dining room to have my lunch.' },
    { name: 'Vegan T.', text: 'The fresh rolls were exceptional. My Panang curry was also delicious. I ordered both with soft tofu.' },
  ],

  // Contact Section
  contact: {
    kicker: 'Visit Us',
    heading: 'Find us on Guadalupe',
  },
};
