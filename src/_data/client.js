module.exports = {
  // Basic Restaurant Information
  name: 'Test Restaurant',
  restaurantName: 'Test Restaurant', // Full display name
  cuisine: 'American Cuisine',

  // Contact Information
  address: {
    street: '1234 Testing Ln',
    city: 'Test City',
    state: 'TX',
    zip: '12345',
    full: '1234 Testing Ln, Test City, TX 12345',
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

  // Contact Information for Info Component
  contact: {
    address: '1234 Testing Ln, Test City, TX 12345',
    phone: '(555) 123-4567',
    email: 'info@testrestaurant.com',
  },

  // Location & Maps
  coordinates: {
    lat: 30.2672,
    lng: -97.7431,
  },
  googleMapsUrl: 'https://maps.google.com/test-location',
  googleMapsEmbedUrl:
    'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3345.8400021938537!2d-97.0494780872197!3d33.007993472033455!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x864c2c56f4bec7a7%3A0xa6d2a1b3c5c33796!2s1111%20Lexington%20Ave%2C%20Flower%20Mound%2C%20TX%2075028!5e0!3m2!1sen!2sus!4v1757601973305!5m2!1sen!2sus',

  // Online Services
  reservationUrl: 'https://testrestaurant.com/reservations',
  orderUrl: 'https://testrestaurant.com/order',
  contactFormUrl: 'https://88restaurants.com/1119/contact_forms',
  widgetUrl: 'https://88restaurants.com/1119/widgets/5129',

  // System Integration IDs
  id: '1119',

  // Social Media (placeholders for future use)
  socialMedia: {
    facebook: '',
    instagram: '',
    yelp: '',
    googleBusiness: '',
  },

  // Menu Categories
  menuCategories: {
    food: 'Food Menu',
    beverages: 'Beverages',
    platter: 'Family Platter',
    dessert: 'Dessert',
  },
}
