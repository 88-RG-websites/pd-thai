/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.njk", "./src/**/*.html", "./src/**/*.md", "./src/**/*.js"],
  theme: {
    extend: {
      colors: {
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
