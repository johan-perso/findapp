const defaultTheme = require('tailwindcss/defaultTheme')

module.exports = {
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter var', ...defaultTheme.fontFamily.sans],
      },
    },
  },
  variants: {
    extend: {},
  },
  content: [
    './public/*.{html,js}',
    './public/script/*.{html,js}',
  ],
  plugins: [require('daisyui')],
}
