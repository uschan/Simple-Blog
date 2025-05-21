/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: 'var(--color-primary)',
          light: 'var(--color-primary-light)',
          dark: 'var(--color-primary-dark)',
        },
        bg: {
          DEFAULT: 'var(--color-bg)',
          card: 'var(--color-bg-card)',
        },
        text: {
          DEFAULT: 'var(--color-text)',
          light: 'var(--color-text-light)',
        }
      },
      fontFamily: {
        sans: ['Raleway', 'sans-serif'],
      }
    },
  },
  plugins: [],
}; 