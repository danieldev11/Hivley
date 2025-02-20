/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#FF9F00', // Hively Orange
          dark: '#1A2B4C',    // Deep Navy
        },
        secondary: {
          DEFAULT: '#FFB940', // Honey Gold
          light: '#FFF1DC',   // Soft Amber
        },
        accent: {
          DEFAULT: '#2D6A4F', // Forest Green
        },
      },
    },
  },
  plugins: [],
};