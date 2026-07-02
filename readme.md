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
| `npm run build:preview` | Build for a nested preview folder (adds a path prefix so `/assets`, links, etc. resolve). Override the prefix with `PATH_PREFIX=/your-folder/ npm run build:preview` |
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
│   │   ├── sass/              # 🎨 EDIT THESE - Custom styles (styles.scss)
│   │   └── css/               # ⚠️ AUTO-GENERATED - Do not edit directly
│   └── pages/                 # Site pages
├── tailwind.config.js         # 🎨 Brand colors (CUSTOMIZE THIS)
└── dist/                      # ⚠️ AUTO-GENERATED - Never edit (deployment folder)
```

## Key Features

- **Restaurant-Focused**: Pre-built components for menus, hours, contact, galleries
- **Mobile-First**: Responsive design optimized for all devices
- **SEO Ready**: Schema markup, sitemap generation, optimized meta tags
- **Fast Loading**: Minified assets, optimized images, static generation
- **Easy Customization**: Data-driven content via `client.js`

## ⚠️ Important File Editing Guidelines

### What TO Edit:
- **`src/assets/sass/styles.scss`** - Source file for custom styles
- **`src/_data/client.js`** - Restaurant information and content
- **`tailwind.config.js`** - Brand colors and Tailwind configuration
- **Files in `src/` directory** - Templates, components, and pages

### What NOT TO Edit:
- **`src/assets/css/styles.css`** - Auto-generated from SASS compilation
- **`dist/` folder** - Auto-generated build output for deployment
- Any files marked as "auto-generated" in comments

**Remember**: Always edit the source SASS file (`styles.scss`), never the compiled CSS file. The build process will automatically compile your SASS changes into the CSS file.

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

### Using the Deploy Script
This template includes a deployment script that builds and uploads your site to
either **production** or a **preview** URL:

1. **Make the script executable:**
   ```bash
   chmod +x deploy.sh
   ```

2. **Set the site folder name** in `deploy.sh`:
   - Edit the `SITE_NAME` variable near the top of the script (defaults to
     `custom_template`). It's used for both the production and preview paths.

3. **Run the deployment:**
   ```bash
   ./deploy.sh
   ```

   The script prompts you to choose a target:
   - **1) Production** — deploys to the live site (asks for confirmation first)
   - **2) Preview** — deploys to the preview URL

   After you choose, it builds the site and uploads it via rsync. Preview
   deploys are served from a `/${SITE_NAME}/` subfolder, so the script builds
   them with a matching path prefix (via `npm run build:preview`) to keep all
   links and assets working.

### QA Checklists (Pre & Post Deploy)

Two Markdown checklists at the repo root act as a quality gate around each
deployment. They are designed to be **run by Claude Code** — each item names the
exact command to run, file to read, or URL to fetch — and Claude produces a
**Pass / Fail / Needs review** report. They are report-only and never modify
files, so they're safe to run anytime.

| File | When | What it checks |
|------|------|----------------|
| `pre-deploy-checklist.md` | Before `./deploy.sh` | Source & build: production build succeeds, no leftover `client.js` placeholders, SEO/meta tags, structured data, Google Analytics, sitemap/robots config, oversized images, dead/placeholder links |
| `post-deploy-checklist.md` | After deploying | The **live site** at `client.domain`: site is up, meta/social tags, structured data, GA firing, full sitemap validation (every `<loc>` resolves), dead links & missing assets |

**How to run them:** in Claude Code, just say:

- `Run the pre-deploy checklist` — before deploying
- `Run the post-deploy checklist` — after deploying (reads the live URL from
  `client.domain` in `src/_data/client.js`)

Each run ends with a "Recommended fixes" list you can review and approve.

## New to Git?

If you're just getting started with git and GitHub, read [Git Basics](git-basics.md)
for a friendly walkthrough of the everyday workflow — pull, commit, push, and
branches when you're ready.

## Support

For questions about this template:
- Check the component examples in `src/_includes/components/`
- Review the sample data in `src/_data/client.js`
- Refer to [11ty documentation](https://www.11ty.dev/docs/) for advanced customization
