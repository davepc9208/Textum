/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: '#0d1f3c',
          light: '#1a3160',
          dark: '#070f1e',
        },
        gold: {
          DEFAULT: '#c9a84c',
          light: '#e2c06e',
          pale: '#f0dfa0',
        },
        cream: {
          DEFAULT: '#faf7f2',
          dark: '#f0ebe1',
        },
      },
      fontFamily: {
        serif: ['Cormorant Garamond', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'float': 'floatOrb 8s ease-in-out infinite',
        'shimmer': 'shimmer 4s linear infinite',
        'gradient': 'gradientShift 12s ease infinite',
      },
    },
  },
  plugins: [],
};
