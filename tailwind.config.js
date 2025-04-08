/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eef9ff',
          100: '#dcf3ff',
          200: '#b3e8ff',
          300: '#6bd7ff',
          400: '#1cbeff',
          500: '#00a3ff',
          600: '#0083d4',
          700: '#0068ab',
          800: '#00578d',
          900: '#004974',
        },
        accent: {
          50: '#fff1f3',
          100: '#ffe4e8',
          200: '#ffccd5',
          300: '#ffa3b5',
          400: '#ff6a8a',
          500: '#f93963',
          600: '#e51b47',
          700: '#c11238',
          800: '#a11134',
          900: '#891434',
        },
        dark: {
          100: '#1a1b23',
          200: '#23242f',
          300: '#2b2c39',
          400: '#363745',
        }
      }
    },
  },
  plugins: [],
};