import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class', // 支持暗色模式
  theme: {
    extend: {
      colors: {
        primary: 'rgb(var(--primary-color) / <alpha-value>)',
        'primary-dark': 'rgb(var(--primary-dark-color) / <alpha-value>)',
        'primary-light': 'rgb(var(--primary-light-color) / <alpha-value>)',
        'text-light': 'rgb(var(--text-light-color) / <alpha-value>)',
        'bg-card': 'rgb(var(--bg-card-color) / <alpha-value>)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
      boxShadow: {
        'inner-top': 'inset 0 1px 2px 0 rgb(0 0 0 / 0.05)',
      },
      height: {
        'header': '64px',
        'screen-minus-header': 'calc(100vh - 64px)',
      },
      zIndex: {
        'modal': '1000',
        'dropdown': '100',
        'sidebar': '50',
      },
      typography: (theme: any) => ({
        DEFAULT: {
          css: {
            maxWidth: '100%',
            color: theme('colors.gray.700'),
            a: {
              color: theme('colors.primary'),
              '&:hover': {
                color: theme('colors.primary-dark'),
              },
            },
            'h1, h2, h3, h4': {
              fontWeight: theme('fontWeight.bold'),
              marginTop: theme('spacing.8'),
              marginBottom: theme('spacing.4'),
            },
          },
        },
        dark: {
          css: {
            color: theme('colors.gray.300'),
            a: {
              color: theme('colors.primary-light'),
              '&:hover': {
                color: theme('colors.primary'),
              },
            },
            'h1, h2, h3, h4': {
              color: theme('colors.white'),
            },
          },
        },
      }),
    },
  },
  plugins: [require('@tailwindcss/typography')],
}
export default config 