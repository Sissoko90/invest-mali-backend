<<<<<<< HEAD
// InvestMali Color System - Centralized color definitions
// This file provides a single source of truth for all colors used in the application

export const colors = {
  // Primary Brand Colors
  primary: {
    main: '#261e73',        // Bleu profond - Confiance & Professionnalisme
    light: '#3d2f8f',       // Version plus claire
    dark: '#1a1456',        // Version plus foncée
    50: '#f4f3ff',
    100: '#ebe8ff', 
    200: '#d9d4ff',
    300: '#beb5ff',
    400: '#9c8aff',
    500: '#261e73',
    600: '#1a1456',
    700: '#140f42',
    800: '#0f0a2e',
    900: '#0a061a'
  },

  secondary: {
    main: '#c50100',        // Rouge dynamique - Action & Urgence
    light: '#e53935',       // Version plus claire
    dark: '#8f0000',        // Version plus foncée
    50: '#ffebee',
    100: '#ffcdd2',
    200: '#ef9a9a',
    300: '#e57373',
    400: '#ef5350',
    500: '#c50100',
    600: '#8f0000',
    700: '#d32f2f',
    800: '#c62828',
    900: '#b71c1c'
  },

  accent: {
    main: '#59af47',        // Vert croissance - Succès & Prospérité
    light: '#7bc142',       // Version plus claire
    dark: '#3e7b2f',        // Version plus foncée
    50: '#f1f8e9',
    100: '#dcedc8',
    200: '#c5e1a5',
    300: '#aed581',
    400: '#9ccc65',
    500: '#59af47',
    600: '#3e7b2f',
    700: '#689f38',
    800: '#558b2f',
    900: '#33691e'
  },

  // Neutral Colors
  neutral: {
    white: '#ffffff',
    light: '#f7f7fa',       // Arrière-plans clairs
    gray: {
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
    dark: '#23272a'         // Textes sombres
  },

  // Status Colors
  status: {
    success: '#59af47',     // Utilise l'accent vert
    warning: '#ffb800',     // Jaune/orange pour les alertes
    error: '#c50100',       // Utilise le rouge secondaire
    info: '#261e73'         // Utilise le bleu primaire
  },

  // Interactive States
  interactive: {
    hover: {
      primary: '#3d2f8f',
      secondary: '#e53935',
      accent: '#7bc142'
    },
    active: {
      primary: '#1a1456',
      secondary: '#8f0000',
      accent: '#3e7b2f'
    },
    disabled: {
      background: '#f5f5f5',
      text: '#bdbdbd'
    }
  },

  // Gradients
  gradients: {
    primary: 'linear-gradient(135deg, #261e73 0%, #59af47 100%)',
    secondary: 'linear-gradient(135deg, #c50100 0%, #261e73 100%)',
    accent: 'linear-gradient(135deg, #59af47 0%, #261e73 100%)',
    hero: 'linear-gradient(135deg, #261e73 0%, #59af47 50%, #c50100 100%)'
  }
} as const;

// Utility functions for color manipulation
export const getColorWithOpacity = (color: string, opacity: number): string => {
  return `${color}${Math.round(opacity * 255).toString(16).padStart(2, '0')}`;
};

// CSS Custom Properties for dynamic theming
export const cssVariables = {
  '--color-primary': colors.primary.main,
  '--color-primary-light': colors.primary.light,
  '--color-primary-dark': colors.primary.dark,
  '--color-secondary': colors.secondary.main,
  '--color-secondary-light': colors.secondary.light,
  '--color-secondary-dark': colors.secondary.dark,
  '--color-accent': colors.accent.main,
  '--color-accent-light': colors.accent.light,
  '--color-accent-dark': colors.accent.dark,
  '--color-neutral-white': colors.neutral.white,
  '--color-neutral-light': colors.neutral.light,
  '--color-neutral-dark': colors.neutral.dark
};

export default colors;
=======
// InvestMali Color System - Centralized color definitions
// This file provides a single source of truth for all colors used in the application

export const colors = {
  // Primary Brand Colors
  primary: {
    main: '#261e73',        // Bleu profond - Confiance & Professionnalisme
    light: '#3d2f8f',       // Version plus claire
    dark: '#1a1456',        // Version plus foncée
    50: '#f4f3ff',
    100: '#ebe8ff', 
    200: '#d9d4ff',
    300: '#beb5ff',
    400: '#9c8aff',
    500: '#261e73',
    600: '#1a1456',
    700: '#140f42',
    800: '#0f0a2e',
    900: '#0a061a'
  },

  secondary: {
    main: '#c50100',        // Rouge dynamique - Action & Urgence
    light: '#e53935',       // Version plus claire
    dark: '#8f0000',        // Version plus foncée
    50: '#ffebee',
    100: '#ffcdd2',
    200: '#ef9a9a',
    300: '#e57373',
    400: '#ef5350',
    500: '#c50100',
    600: '#8f0000',
    700: '#d32f2f',
    800: '#c62828',
    900: '#b71c1c'
  },

  accent: {
    main: '#59af47',        // Vert croissance - Succès & Prospérité
    light: '#7bc142',       // Version plus claire
    dark: '#3e7b2f',        // Version plus foncée
    50: '#f1f8e9',
    100: '#dcedc8',
    200: '#c5e1a5',
    300: '#aed581',
    400: '#9ccc65',
    500: '#59af47',
    600: '#3e7b2f',
    700: '#689f38',
    800: '#558b2f',
    900: '#33691e'
  },

  // Neutral Colors
  neutral: {
    white: '#ffffff',
    light: '#f7f7fa',       // Arrière-plans clairs
    gray: {
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
    dark: '#23272a'         // Textes sombres
  },

  // Status Colors
  status: {
    success: '#59af47',     // Utilise l'accent vert
    warning: '#ffb800',     // Jaune/orange pour les alertes
    error: '#c50100',       // Utilise le rouge secondaire
    info: '#261e73'         // Utilise le bleu primaire
  },

  // Interactive States
  interactive: {
    hover: {
      primary: '#3d2f8f',
      secondary: '#e53935',
      accent: '#7bc142'
    },
    active: {
      primary: '#1a1456',
      secondary: '#8f0000',
      accent: '#3e7b2f'
    },
    disabled: {
      background: '#f5f5f5',
      text: '#bdbdbd'
    }
  },

  // Gradients
  gradients: {
    primary: 'linear-gradient(135deg, #261e73 0%, #59af47 100%)',
    secondary: 'linear-gradient(135deg, #c50100 0%, #261e73 100%)',
    accent: 'linear-gradient(135deg, #59af47 0%, #261e73 100%)',
    hero: 'linear-gradient(135deg, #261e73 0%, #59af47 50%, #c50100 100%)'
  }
} as const;

// Utility functions for color manipulation
export const getColorWithOpacity = (color: string, opacity: number): string => {
  return `${color}${Math.round(opacity * 255).toString(16).padStart(2, '0')}`;
};

// CSS Custom Properties for dynamic theming
export const cssVariables = {
  '--color-primary': colors.primary.main,
  '--color-primary-light': colors.primary.light,
  '--color-primary-dark': colors.primary.dark,
  '--color-secondary': colors.secondary.main,
  '--color-secondary-light': colors.secondary.light,
  '--color-secondary-dark': colors.secondary.dark,
  '--color-accent': colors.accent.main,
  '--color-accent-light': colors.accent.light,
  '--color-accent-dark': colors.accent.dark,
  '--color-neutral-white': colors.neutral.white,
  '--color-neutral-light': colors.neutral.light,
  '--color-neutral-dark': colors.neutral.dark
};

export default colors;
>>>>>>> 060c2b6fa (WIP: local changes before rebase)
