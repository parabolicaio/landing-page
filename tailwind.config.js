/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        DEFAULT: '100%',
        sm: '640px',
        md: '768px',
        lg: '1024px',
        xl: '1200px',
      },
    },
    extend: {
      colors: {
        parabolica: {
          50: '#E6FFFB',
          100: '#CCFFF7',
          200: '#99FEEF',
          300: '#66FDF0',
          400: '#33FBEF',
          DEFAULT: '#0FBAB0',
          600: '#0EA89F',
          700: '#0D867F',
          800: '#0B635F',
          900: '#08423F',
        },
        neutral: {
          900: '#0B0F12',
          800: '#1A1F23',
          700: '#2B3438',
          300: '#D6E0E3',
          200: '#E9EEF0',
          100: '#F6F8F9',
        },
      },
      borderRadius: {
        surface: '1rem', // rounded-2xl equivalent
        pill: '9999px',
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'ui-sans-serif', 'system-ui'],
      },
      maxWidth: {
        '8xl': '1200px',
      },
    },
  },
  plugins: [],
};

