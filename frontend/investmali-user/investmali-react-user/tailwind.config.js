/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // InvestMali Official Brand Colors - Standardized System
        'investmali-primary': {
          50: '#f4f3ff',
          100: '#ebe8ff', 
          200: '#d9d4ff',
          300: '#beb5ff',
          400: '#9c8aff',
          500: '#261e73',  // Main primary color
          600: '#1a1456',
          700: '#140f42',
          800: '#0f0a2e',
          900: '#0a061a',
          light: '#3d2f8f',
          dark: '#1a1456',
          DEFAULT: '#261e73'
        },
        'investmali-secondary': {
          50: '#ffebee',
          100: '#ffcdd2',
          200: '#ef9a9a',
          300: '#e57373',
          400: '#ef5350',
          500: '#c50100',  // Main secondary color
          600: '#8f0000',
          700: '#d32f2f',
          800: '#c62828',
          900: '#b71c1c',
          light: '#e53935',
          dark: '#8f0000',
          DEFAULT: '#c50100'
        },
        'investmali-accent': {
          50: '#f1f8e9',
          100: '#dcedc8',
          200: '#c5e1a5',
          300: '#aed581',
          400: '#9ccc65',
          500: '#59af47',  // Main accent color
          600: '#3e7b2f',
          700: '#689f38',
          800: '#558b2f',
          900: '#33691e',
          light: '#7bc142',
          dark: '#3e7b2f',
          DEFAULT: '#59af47'
        },
        // Neutral colors
        'investmali-neutral': {
          white: '#ffffff',
          light: '#f7f7fa',
          dark: '#23272a',
          50: '#fafafa',
          100: '#f5f5f5',
          200: '#eeeeee',
          300: '#e0e0e0',
          400: '#bdbdbd',
          500: '#9e9e9e',
          600: '#757575',
          700: '#616161',
          800: '#424242',
          900: '#212121'
        },
        // Status colors
        'investmali-success': '#59af47',
        'investmali-warning': '#ffb800',
        'investmali-error': '#c50100',
        'investmali-info': '#261e73',
        // Legacy colors (deprecated - use investmali-* instead)
        'mali-emerald': {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
          'dark': '#15803d',
          DEFAULT: '#176B5C',
        },
        'mali-gold': {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
          DEFAULT: '#FFB800',
        },
        'mali-indigo': '#4B3F72',
        'mali-dark': '#23272A',
        'mali-light': '#F7F7FA',
        'mali-white': '#FFFFFF',
        'mali-purple': '#A259F7',
        'mali-red': '#E4572E'
      },
      fontFamily: {
        'inter': ['Inter', 'sans-serif']
      },
      animation: {
        'fade-in': 'fadeIn 0.6s ease-out',
        'slide-up': 'slideUp 0.8s ease-out',
        'draw-line': 'drawLine 2s ease-in-out infinite',
        'float': 'float 3s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate'
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(30px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        drawLine: {
          '0%': { strokeDasharray: '0 100' },
          '100%': { strokeDasharray: '100 0' }
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' }
        },
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(23, 107, 92, 0.5)' },
          '100%': { boxShadow: '0 0 20px rgba(23, 107, 92, 0.8)' }
        }
      }
    },
  },
  plugins: [],
}
