// Type definitions for CSS modules
declare module '*.css' {
  const content: { [className: string]: string };
  export default content;
}

// Type definitions for SCSS modules
declare module '*.scss' {
  const content: { [className: string]: string };
  export default content;
}

// Type definitions for Tailwind CSS
declare module 'tailwindcss/colors' {
  export const gray: any;
  export const red: any;
  export const green: any;
  export const blue: any;
  export const indigo: any;
  export const purple: any;
  export const pink: any;
  export const yellow: any;
  export const teal: any;
  export const cyan: any;
  export const orange: any;
  export const amber: any;
  export const lime: any;
  export const emerald: any;
  export const sky: any;
  export const violet: any;
  export const fuchsia: any;
  export const rose: any;
  export const white: string;
  export const black: string;
  export const current: string;
  export const transparent: string;
}

// Type definitions for @tailwindcss/forms
declare module '@tailwindcss/forms' {
  import { PluginCreator } from 'postcss';
  const plugin: PluginCreator;
  export default plugin;
}

// Type definitions for @tailwindcss/typography
declare module '@tailwindcss/typography' {
  import { PluginCreator } from 'postcss';
  const plugin: PluginCreator;
  export default plugin;
}
