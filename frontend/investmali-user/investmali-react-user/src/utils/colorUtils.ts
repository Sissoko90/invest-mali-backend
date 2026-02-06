// Color utility functions for InvestMali application
import { colors } from '../styles/colors';

/**
 * Get color class names for Tailwind CSS based on semantic usage
 */
export const getColorClasses = {
  // Primary actions and branding
  primary: {
    bg: 'bg-investmali-primary',
    bgHover: 'hover:bg-investmali-primary-light',
    bgActive: 'active:bg-investmali-primary-dark',
    text: 'text-investmali-primary',
    textHover: 'hover:text-investmali-primary-light',
    border: 'border-investmali-primary',
    gradient: 'bg-gradient-to-r from-investmali-primary to-investmali-accent'
  },

  // Secondary actions and highlights
  secondary: {
    bg: 'bg-investmali-secondary',
    bgHover: 'hover:bg-investmali-secondary-light',
    bgActive: 'active:bg-investmali-secondary-dark',
    text: 'text-investmali-secondary',
    textHover: 'hover:text-investmali-secondary',
    border: 'border-investmali-secondary',
    gradient: 'bg-gradient-to-r from-investmali-secondary to-investmali-primary'
  },

  // Success states and positive actions
  accent: {
    bg: 'bg-investmali-accent',
    bgHover: 'hover:bg-investmali-accent-light',
    bgActive: 'active:bg-investmali-accent-dark',
    text: 'text-investmali-accent',
    textHover: 'hover:text-investmali-accent',
    border: 'border-investmali-accent',
    gradient: 'bg-gradient-to-r from-investmali-accent to-investmali-primary'
  },

  // Neutral elements
  neutral: {
    bg: 'bg-investmali-neutral-100',
    bgLight: 'bg-investmali-neutral-50',
    bgDark: 'bg-investmali-neutral-900',
    text: 'text-investmali-neutral-700',
    textLight: 'text-investmali-neutral-500',
    textDark: 'text-investmali-neutral-900',
    border: 'border-investmali-neutral-200'
  },

  // Status indicators
  status: {
    success: 'text-investmali-success bg-investmali-accent-50 border-investmali-accent-200',
    warning: 'text-investmali-warning bg-yellow-50 border-yellow-200',
    error: 'text-investmali-error bg-investmali-secondary-50 border-investmali-secondary-200',
    info: 'text-investmali-info bg-investmali-primary-50 border-investmali-primary-200'
  }
};

/**
 * Get button classes based on variant and size
 */
export const getButtonClasses = (variant: 'primary' | 'secondary' | 'accent' | 'outline' | 'ghost', size: 'sm' | 'md' | 'lg' = 'md') => {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2';
  
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  };

  const variantClasses = {
    primary: `${getColorClasses.primary.bg} ${getColorClasses.primary.bgHover} text-white focus:ring-investmali-primary-300`,
    secondary: `${getColorClasses.secondary.bg} ${getColorClasses.secondary.bgHover} text-white focus:ring-investmali-secondary-300`,
    accent: `${getColorClasses.accent.bg} ${getColorClasses.accent.bgHover} text-white focus:ring-investmali-accent-300`,
    outline: `border-2 ${getColorClasses.primary.border} ${getColorClasses.primary.text} ${getColorClasses.primary.textHover} hover:bg-investmali-primary-50 focus:ring-investmali-primary-300`,
    ghost: `${getColorClasses.primary.text} ${getColorClasses.primary.textHover} hover:bg-investmali-primary-50 focus:ring-investmali-primary-300`
  };

  return `${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]}`;
};

/**
 * Get card classes for consistent styling
 */
export const getCardClasses = (variant: 'default' | 'elevated' | 'bordered' = 'default') => {
  const baseClasses = 'bg-white rounded-lg';
  
  const variantClasses = {
    default: 'shadow-sm',
    elevated: 'shadow-lg hover:shadow-xl transition-shadow duration-200',
    bordered: 'border border-investmali-neutral-200'
  };

  return `${baseClasses} ${variantClasses[variant]}`;
};

/**
 * Get input classes for form elements
 */
export const getInputClasses = (state: 'default' | 'error' | 'success' = 'default') => {
  const baseClasses = 'w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-1 transition-colors duration-200';
  
  const stateClasses = {
    default: 'border-investmali-neutral-300 focus:border-investmali-primary focus:ring-investmali-primary-200',
    error: 'border-investmali-error focus:border-investmali-error focus:ring-investmali-secondary-200',
    success: 'border-investmali-success focus:border-investmali-accent focus:ring-investmali-accent-200'
  };

  return `${baseClasses} ${stateClasses[state]}`;
};

/**
 * Get text classes based on semantic meaning
 */
export const getTextClasses = {
  heading: {
    primary: 'text-investmali-primary font-bold',
    secondary: 'text-investmali-secondary font-bold',
    neutral: 'text-investmali-neutral-900 font-bold'
  },
  body: {
    primary: 'text-investmali-neutral-700',
    secondary: 'text-investmali-neutral-600',
    muted: 'text-investmali-neutral-500'
  },
  link: {
    primary: `${getColorClasses.primary.text} ${getColorClasses.primary.textHover} underline-offset-4 hover:underline`,
    secondary: `${getColorClasses.secondary.text} hover:text-investmali-secondary underline-offset-4 hover:underline`,
    accent: `${getColorClasses.accent.text} hover:text-investmali-accent underline-offset-4 hover:underline`
  }
};

/**
 * Migration helper: maps old color classes to new standardized ones
 */
export const colorMigrationMap = {
  // Old mali-emerald colors to new accent colors
  'bg-mali-emerald': 'bg-investmali-accent',
  'text-mali-emerald': 'text-investmali-accent',
  'border-mali-emerald': 'border-investmali-accent',
  'bg-mali-emerald-dark': 'bg-investmali-accent-dark',
  'text-mali-emerald-dark': 'text-investmali-accent-dark',
  
  // Old mali-gold colors to new warning/accent colors
  'bg-mali-gold': 'bg-investmali-warning',
  'text-mali-gold': 'text-investmali-warning',
  'border-mali-gold': 'border-investmali-warning',
  
  // Old mali colors to new neutral colors
  'bg-mali-light': 'bg-investmali-neutral-light',
  'text-mali-dark': 'text-investmali-neutral-dark',
  'bg-mali-white': 'bg-white',
  
  // Old mali-red to new secondary
  'bg-mali-red': 'bg-investmali-secondary',
  'text-mali-red': 'text-investmali-secondary',
  
  // Old mali-indigo to new primary
  'bg-mali-indigo': 'bg-investmali-primary',
  'text-mali-indigo': 'text-investmali-primary'
};

export default {
  getColorClasses,
  getButtonClasses,
  getCardClasses,
  getInputClasses,
  getTextClasses,
  colorMigrationMap
};
