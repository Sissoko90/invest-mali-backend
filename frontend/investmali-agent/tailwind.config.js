/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html",
  ],
  theme: {
    extend: {
      colors: {
        // Palette simplifiée à 2 couleurs : Primary (bleu) + Neutral (gris)
        primary: {
          50:  '#0078C8',
          100: '#0078C8',
          200: '#0078C8',
          300: '#0078C8',
          400: '#0078C8',
          500: '#0078C8',
          600: '#0078C8',
          700: '#0078C8',
          800: '#0078C8',
          900: '#0078C8',
        },
        // Alias pour compatibilité avec l'ancien code
        'mali-emerald': '#0078C8',
        'mali-emerald-dark': '#025890ff',
        'mali-gold': '#4189b9ff',
        'mali-light': '#9fc7e1ff',
        'mali-dark': 'rgba(0, 47, 113, 1)',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: 0 },
          '100%': { opacity: 1 },
        },
        'fade-in-up': {
          '0%': { opacity: 0, transform: 'translateY(12px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
        'fade-in-down': {
          '0%': { opacity: 0, transform: 'translateY(-12px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
        'scale-in': {
          '0%': { opacity: 0, transform: 'scale(0.96)' },
          '100%': { opacity: 1, transform: 'scale(1)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 500ms ease-out both',
        'fade-in-up': 'fade-in-up 500ms ease-out both',
        'fade-in-down': 'fade-in-down 500ms ease-out both',
        'scale-in': 'scale-in 300ms ease-out both',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
}
