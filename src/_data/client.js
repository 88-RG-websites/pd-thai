module.exports = {
  // Basic Restaurant Information
  name: 'Test Restaurant',
  restaurantName: 'Test Restaurant', // Full display name
  cuisine: 'American Cuisine',

  // Page Content
  hero_title: 'Experience Authentic Restaurant Cuisine',
  hero_subtitle: 'Fresh ingredients, skilled chefs, and an unforgettable dining experience.',
  about_title: 'About Title',
  about_desc_one: 'A template restaurant for testing purposes. Features a variety of delicious dishes made with fresh ingredients and excellent service.',
  about_desc_two: 'Faucibus commodo massa rhoncus, volutpat. Dignissim sed eget risus enim. Mattis mauris semper sed amet vitae sed turpis id. Id dolor praesent donec est. Odio penatibus risus viverra tellus varius sit neque erat velit. Faucibus commodo massa rhoncus, volutpat. Dignissim sed eget risus enim. Mattis mauris semper sed amet vitae sed turpis id.',
  about_desc_three: 'Et vitae blandit facilisi magna lacus commodo. Vitae sapien duis odio id et. Id blandit molestie auctor fermentum dignissim. Lacus diam tincidunt ac cursus in vel. Mauris varius vulputate et ultrices hac adipiscing egestas. Iaculis convallis ac tempor et ut. Ac lorem vel integer orci.',

  // Contact Information
  address: {
    street: '1234 Testing Ln',
    city: 'Test City',
    state: 'TX',
    zip: '12345',
  },
  phone: '(555) 123-4567',
  email: 'info@testrestaurant.com',
  domain: 'https://testrestaurant.com',

  // Business Hours
  hours: {
    schedule: [
      { day: 'Monday', lunch: '11:30am - 2:00pm', dinner: '3:00pm - 8:45pm' },
      {
        day: 'Tuesday - Thursday',
        lunch: '11:30am - 2:00pm',
        dinner: '3:00pm - 8:30pm',
      },
      {
        day: 'Friday - Saturday',
        lunch: '11:30am - 2:00pm',
        dinner: '3:00pm - 8:45pm',
      },
      { day: 'Sunday', lunch: '11:30am - 2:00pm', dinner: '3:00pm - 8:15pm' },
    ],
  },


  // Location & Maps
  googleMapsUrl: 'https://maps.google.com/test-location',

  // System Integration IDs
  id: '1119',

  // Social Media (placeholders for future use)
  socialMedia: {
    facebook: 'test.com',
    instagram: 'test.com',
    twitter: 'test.com',
    yelp: 'test.com',
    googleBusiness: 'test.com',
  },

  // Menu Cards for Info Component
  menuCards: [
    {
      image: 'assets/images/restaurant-gallery-1000x1000.jpg',
      pretitle: 'LUNCH & DINNER',
      title: 'ALL DAY'
    },
    {
      image: 'assets/images/restaurant-gallery-1000x1000.jpg',
      pretitle: 'LUNCH',
      title: 'PRE-FIXE'
    },
    {
      image: 'assets/images/restaurant-gallery-1000x1000.jpg',
      pretitle: 'EVENTS',
      title: 'PARTY MENUS'
    }
  ],
}
