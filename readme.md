# Restaurant Website Template

A professional 11ty (Eleventy) template specifically designed for restaurant websites. This template provides a complete foundation for building beautiful, fast-loading restaurant sites with modern components and easy customization.

## Quick Start

### 1. Clone & Setup
```bash
# Use this template or clone directly
git clone https://github.com/your-username/restaurant-template.git client-restaurant-name
cd client-restaurant-name

# Install dependencies
npm install

# Start development server
npm run serve
```

Visit http://localhost:8080 to see your site with live reloading.

### 2. Build Your Restaurant Website

Follow this order of operations for the best workflow:

#### Step 1: Update Restaurant Information
Edit `src/_data/client.js` with your restaurant's details:
- Restaurant name, cuisine type, contact info
- Business hours and location
- Social media links
- Menu categories

#### Step 2: Customize Brand Colors
Update `tailwind.config.js` to match the restaurant's branding:
- Primary colors (main brand color)
- Secondary colors (accent/neutral colors)

#### Step 3: Choose Your Component Structure
Select from available components in `src/_includes/components/`:
- **Headers**: Choose from 2 header styles
- **Galleries**: Choose from 2 gallery layouts
- **Contact Sections**: Choose from 3 contact section styles
- **Hero Sections**: Multiple hero banner options

#### Step 4: Add Images & Content
- Replace images in `src/assets/images/`
- Update page content in `src/pages/`
- Customize component content as needed

#### Step 5: Add Google Analytics (Optional)
To enable Google Analytics tracking:
1. Edit `src/_includes/components/google_analytics.njk`
2. Replace `GA_TRACKING_ID` with your actual Google Analytics tracking ID
3. Uncomment the script block by removing the `{# #}` comment wrapper

#### Step 6: Test & Deploy
```bash
# Build for production
npm run build

# Deploy to Netlify or your preferred host
```

## Development Commands

| Command | Purpose |
|---------|---------|
| `npm run serve` | Start dev server with live reload at localhost:8080 |
| `npm run build` | Build for production (outputs to `dist/`) |
| `npm run watch` | Watch for changes and rebuild CSS/templates |
| `npm run build:css` | Compile SASS to CSS with TailwindCSS |

## Template Structure

```
restaurant-template/
├── src/
│   ├── _data/
│   │   └── client.js          # 📝 Restaurant info (START HERE)
│   ├── _includes/
│   │   ├── layouts/
│   │   │   └── base.njk       # Main layout template
│   │   └── components/        # 🎨 UI components
│   │       ├── header/        # Header variations
│   │       ├── gallery/       # Gallery layouts
│   │       ├── contact/       # Contact sections
│   │       └── hero/          # Hero banners
│   ├── assets/
│   │   ├── images/            # 📷 Replace with restaurant images
│   │   ├── sass/              # Custom styles
│   │   └── css/               # Compiled CSS (auto-generated)
│   └── pages/                 # Site pages
├── tailwind.config.js         # 🎨 Brand colors (CUSTOMIZE THIS)
└── dist/                      # Built site (auto-generated)
```

## Key Features

- **Restaurant-Focused**: Pre-built components for menus, hours, contact, galleries
- **Mobile-First**: Responsive design optimized for all devices
- **SEO Ready**: Schema markup, sitemap generation, optimized meta tags
- **Fast Loading**: Minified assets, optimized images, static generation
- **Easy Customization**: Data-driven content via `client.js`

## Customization Guide

### Colors & Branding
Edit `tailwind.config.js`:
```javascript
colors: {
  primary: {
    500: '#E00040',  // Main brand color
    // ... other shades
  },
  secondary: {
    700: '#0A1123', // Dark accent
    // ... other shades
  }
}
```

### Restaurant Data
Edit `src/_data/client.js`:
```javascript
module.exports = {
  name: 'Your Restaurant Name',
  cuisine: 'Italian Cuisine',
  phone: '(555) 123-4567',
  address: {
    street: '123 Main St',
    city: 'Your City',
    // ...
  }
  // ... more restaurant data
}
```

### Component Selection
Components are modular - simply include the ones you want in your pages:
```njk
{% include "components/header/header-style-1.njk" %}
{% include "components/gallery/gallery-grid.njk" %}
{% include "components/contact/contact-form.njk" %}
```

## Deployment

### Netlify (Recommended)
1. Push your repository to GitHub
2. Connect to Netlify
3. Build command: `npm run build`
4. Publish directory: `dist`

### Manual Deployment
```bash
npm run build
# Upload contents of dist/ folder to your web server
```

## Support

For questions about this template:
- Check the component examples in `src/_includes/components/`
- Review the sample data in `src/_data/client.js`
- Refer to [11ty documentation](https://www.11ty.dev/docs/) for advanced customization
