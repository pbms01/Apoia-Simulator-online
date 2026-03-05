/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#e6eef5',
          100: '#ccdcea',
          200: '#99b9d5',
          300: '#6696c0',
          400: '#3373ab',
          500: '#1e3a5f',
          600: '#182e4c',
          700: '#122339',
          800: '#0c1726',
          900: '#060c13',
        },
        accent: {
          50: '#faf6e8',
          100: '#f5edd1',
          200: '#ebdba3',
          300: '#e0c975',
          400: '#d6b747',
          500: '#c9a227',
          600: '#a1821f',
          700: '#796117',
          800: '#51410f',
          900: '#282008',
        },
      },
    },
  },
  plugins: [],
};
