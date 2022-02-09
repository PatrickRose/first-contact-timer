const defaultTheme = require('tailwindcss/defaultTheme')

module.exports = {
  content: [
      "src/**/*.{ts,tsx}"
  ],
  safelist: ['__next'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Century Gothic Regular"', ...defaultTheme.fontFamily.sans],
      },
      animation: {
        marquee: 'slide 10s linear infinite'
      },
      keyframes: {
        slide: {
          from: { left: "100%", transform: "translate(100%, 0)" },
          to: { left: "-100%", transform: "translate(-100%, 0)" }
        }
      },
      colors: {
        'first-contact': '#757380',
      }
    },
  },
  plugins: [
      require('@tailwindcss/forms')
  ],
}
