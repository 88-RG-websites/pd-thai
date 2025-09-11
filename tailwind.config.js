/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.njk", "./src/**/*.html", "./src/**/*.md"],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#FFF1F4',
          100: '#FFE4E8',
          200: '#FECDD6',
          300: '#FCA5B4',
          400: '#F87185',
          500: '#E00040',
          600: '#C70039',
          700: '#A8002E',
          800: '#8A0024',
          900: '#6B001C',
          950: '#4D0014',
        },
        secondary: {
          50: '#F8FAFC',
          100: '#F1F5F9',
          200: '#E2E8F0',
          300: '#CBD5E1',
          400: '#94A3B8',
          500: '#64748B',
          600: '#475569',
          700: '#0A1123',
          800: '#080E1A',
          900: '#060B13',
          950: '#04080C',
        },
      },
    },
  },
  plugins: [],
};
