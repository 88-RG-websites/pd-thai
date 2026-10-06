/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.njk", "./src/**/*.html", "./src/**/*.md", "./src/**/*.js"],
  theme: {
    extend: {
      colors: {
        // Each step routes through a CSS variable emitted from
        // src/_data/theme.js (see components/theme-vars.njk), so a site is
        // re-themed by editing that data file alone. The fallbacks keep the
        // template rendering its stock palette if theme.js is removed.
        primary: {
          50: 'var(--c-primary-50, #FFF1F4)',
          100: 'var(--c-primary-100, #FFE4E8)',
          200: 'var(--c-primary-200, #FECDD6)',
          300: 'var(--c-primary-300, #FCA5B4)',
          400: 'var(--c-primary-400, #F87185)',
          500: 'var(--c-primary-500, #E00040)',
          600: 'var(--c-primary-600, #C70039)',
          700: 'var(--c-primary-700, #A8002E)',
          800: 'var(--c-primary-800, #8A0024)',
          900: 'var(--c-primary-900, #6B001C)',
          950: 'var(--c-primary-950, #4D0014)',
        },
        secondary: {
          50: 'var(--c-secondary-50, #F8FAFC)',
          100: 'var(--c-secondary-100, #F1F5F9)',
          200: 'var(--c-secondary-200, #E2E8F0)',
          300: 'var(--c-secondary-300, #CBD5E1)',
          400: 'var(--c-secondary-400, #94A3B8)',
          500: 'var(--c-secondary-500, #64748B)',
          600: 'var(--c-secondary-600, #475569)',
          700: 'var(--c-secondary-700, #0A1123)',
          800: 'var(--c-secondary-800, #080E1A)',
          900: 'var(--c-secondary-900, #060B13)',
          950: 'var(--c-secondary-950, #04080C)',
        },
        // The third slot: an interaction colour that is neither the brand nor
        // the ink. Filled buttons, hover states and the lit eyebrow answer in
        // it, so a client whose brand colour is wrong for a button — too loud
        // as a plane, too dark for white type, or under AA on white — can fix
        // that without repainting the brand. Before this existed a build had
        // two bad options: ship a button it did not like, or hard-code a hex
        // into a component where no data file could see it.
        //
        // Optional. Omit `theme.colors.accent` and every fallback below is the
        // stock primary red, so a theme.js without the block renders exactly
        // as it did before the slot existed.
        //
        // Each step falls back to the SAME STEP OF `primary`, not to a literal
        // hex. That is what makes the slot safe to wire into components: a
        // client who sets a brand colour and no accent gets their brand on
        // every button, exactly as before. Falling back to the stock red would
        // have repainted those buttons the template's own red the moment a
        // component started reading `accent-*`.
        accent: {
          50: 'var(--c-accent-50, var(--c-primary-50, #FFF1F4))',
          100: 'var(--c-accent-100, var(--c-primary-100, #FFE4E8))',
          200: 'var(--c-accent-200, var(--c-primary-200, #FECDD6))',
          300: 'var(--c-accent-300, var(--c-primary-300, #FCA5B4))',
          400: 'var(--c-accent-400, var(--c-primary-400, #F87185))',
          500: 'var(--c-accent-500, var(--c-primary-500, #E00040))',
          600: 'var(--c-accent-600, var(--c-primary-600, #C70039))',
          700: 'var(--c-accent-700, var(--c-primary-700, #A8002E))',
          800: 'var(--c-accent-800, var(--c-primary-800, #8A0024))',
          900: 'var(--c-accent-900, var(--c-primary-900, #6B001C))',
          950: 'var(--c-accent-950, var(--c-primary-950, #4D0014))',
        },
      },
      fontFamily: {
        display: ['var(--font-display, Roboto)', 'sans-serif'],
        body: ['var(--font-body, Roboto)', 'sans-serif'],
      },
      // No fontSize override: this site keeps Tailwind's stock line-heights on the
      // large sizes, which is what its headings were set with before the sync.
      // Shape tokens from theme.js `style` — rounded-btn/card/img and
      // shadow-card(-hover) instead of raw rounded-*/shadow-* in components,
      // so the whole shape language changes from the data file.
      borderRadius: {
        btn: 'var(--radius-btn, 0.375rem)',
        card: 'var(--radius-card, 0.5rem)',
        img: 'var(--radius-img, 0.5rem)',
      },
      boxShadow: {
        card: 'var(--shadow-card, 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1))',
        'card-hover': 'var(--shadow-card-hover, 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1))',
      },
    },
  },
  plugins: [],
};
