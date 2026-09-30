/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#FAFAF9',
        foreground: '#0C0A09',
        primary: {
          DEFAULT: '#0F172A',
          foreground: '#F8FAFC',
          hover: '#1E293B',
        },
        accent: {
          DEFAULT: '#D97706',
          foreground: '#FFFFFF',
          subtle: '#FEF3C7',
          hover: '#B45309',
        },
        card: {
          DEFAULT: '#FFFFFF',
          foreground: '#0C0A09',
        },
        muted: {
          DEFAULT: '#F5F5F4',
          foreground: '#78716C',
        },
        border: '#E7E5E4',
        success: {
          DEFAULT: '#059669',
          subtle: '#D1FAE5',
        },
        warning: {
          DEFAULT: '#D97706',
          subtle: '#FEF3C7',
        },
        destructive: {
          DEFAULT: '#DC2626',
          subtle: '#FEE2E2',
        },
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
        display: ['Plus Jakarta Sans', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
