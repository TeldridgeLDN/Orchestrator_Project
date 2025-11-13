/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // Enable class-based dark mode
  theme: {
    extend: {
      // Custom icon sizes for consistent usage
      iconSize: {
        'xs': '12px',
        'sm': '16px',
        'md': '24px',
        'lg': '32px',
        'xl': '48px',
        '2xl': '64px',
      },
      // Animation for icon transitions
      transitionProperty: {
        'icon': 'color, transform, opacity',
      },
      // Custom colors for icon states
      colors: {
        // Landing page brand colors (approved 2025-11-13)
        brand: {
          primary: '#667eea',
          accent: '#764ba2',
        },
        // Semantic colors for icons
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444',
        neutral: '#6b7280',
        // Icon state colors (existing)
        icon: {
          primary: 'var(--icon-primary, currentColor)',
          secondary: 'var(--icon-secondary, #6b7280)',
          accent: 'var(--icon-accent, #3b82f6)',
          muted: 'var(--icon-muted, #9ca3af)',
        },
      },
    },
  },
  plugins: [],
}

