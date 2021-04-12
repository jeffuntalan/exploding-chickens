module.exports = {
  purge: [
      '../../templates/*.hbs',
      '../js/game/*.js'
  ],
  darkMode: false, // or 'media' or 'class'
  theme: {
    extend: {},
  },
  variants: {
    extend: {
      ringColor: ['responsive', 'dark', 'focus-within', 'focus', 'active'],
      ringOffsetColor: ['responsive', 'dark', 'focus-within', 'focus', 'active'],
      ringOffsetWidth: ['responsive', 'focus-within', 'focus', 'active'],
      ringOpacity: ['responsive', 'dark', 'focus-within', 'focus', 'active'],
      ringWidth: ['responsive', 'focus-within', 'focus', 'active'],
      outline: ['responsive', 'focus-within', 'focus', 'active']
    },
  },
  plugins: [],
}
