/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#fafafa',
          100: '#f4f4f5',
          200: '#e4e4e7',
          300: '#d4d4d8',
          400: '#a1a1aa',
          500: '#71717a',
          600: '#52525b',
          700: '#27272a',
          800: '#18181b',
          900: '#09090b',
          950: '#000000',
        },
        // Map emerald to refined monochrome (white, silver, zinc, black)
        emerald: {
          50: '#fafafa',
          100: '#f4f4f5',
          200: '#e4e4e7',
          300: '#d4d4d8',
          400: '#ffffff',
          500: '#f4f4f5',
          600: '#27272a',
          700: '#18181b',
          800: '#09090b',
          900: '#000000',
          950: '#000000',
        },
        // Map teal to silver/platinum monochrome
        teal: {
          50: '#fafafa',
          100: '#f4f4f5',
          200: '#e4e4e7',
          300: '#d4d4d8',
          400: '#e4e4e7',
          500: '#a1a1aa',
          600: '#71717a',
          700: '#52525b',
          800: '#27272a',
          900: '#18181b',
          950: '#09090b',
        },
        // Map gold/amber to metallic silver and deep charcoal
        gold: {
          400: '#f4f4f5',
          500: '#e4e4e7',
          600: '#a1a1aa',
        },
        amber: {
          50: '#fafafa',
          100: '#f4f4f5',
          200: '#e4e4e7',
          300: '#d4d4d8',
          400: '#f4f4f5',
          500: '#e4e4e7',
          600: '#a1a1aa',
          700: '#52525b',
          800: '#27272a',
          900: '#18181b',
        },
        // Map indigo & blue to monochrome zinc/silver
        indigo: {
          50: '#fafafa',
          100: '#f4f4f5',
          200: '#e4e4e7',
          300: '#f4f4f5',
          400: '#e4e4e7',
          500: '#a1a1aa',
          600: '#71717a',
          700: '#52525b',
          800: '#27272a',
          900: '#18181b',
          950: '#09090b',
        },
        blue: {
          50: '#fafafa',
          100: '#f4f4f5',
          200: '#e4e4e7',
          300: '#f4f4f5',
          400: '#e4e4e7',
          500: '#a1a1aa',
          600: '#71717a',
          700: '#52525b',
          800: '#27272a',
          900: '#18181b',
          950: '#09090b',
        },
        sky: {
          50: '#fafafa',
          100: '#f4f4f5',
          200: '#e4e4e7',
          300: '#f4f4f5',
          400: '#e4e4e7',
          500: '#a1a1aa',
          600: '#71717a',
          700: '#52525b',
          800: '#27272a',
          900: '#18181b',
          950: '#09090b',
        },
        // True neutral dark monochrome surfaces
        slate: {
          700: '#3f3f46',
          750: '#2d2d32',
          800: '#27272a',
          850: '#18181b',
          900: '#0f0f12',
          950: '#000000',
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}

