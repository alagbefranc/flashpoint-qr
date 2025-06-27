import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Base colors
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        
        // Card colors
        card: {
          DEFAULT: 'var(--card-background)',
          foreground: 'var(--card-foreground)',
        },
        
        // Brand colors
        primary: {
          DEFAULT: 'var(--primary)',
          dark: 'var(--primary-dark)',
          light: 'var(--primary-light)',
          foreground: 'var(--primary-foreground)',
        },
        
        // UI colors
        muted: {
          DEFAULT: 'var(--muted)',
          foreground: 'var(--muted-foreground)',
        },
        accent: {
          DEFAULT: 'var(--accent)',
          hover: 'var(--accent-hover)',
        },
        
        // Status colors
        success: 'var(--success)',
        warning: 'var(--warning)',
        error: 'var(--error)',
        info: 'var(--info)',
        
        // Border colors
        border: 'var(--card-border)',
      },
    },
  },
  plugins: [],
};

export default config;
