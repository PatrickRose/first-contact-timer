module.exports = {
  content: [
      "src/**/*.{ts,tsx}"
  ],
  safelist: ['__next'],
  theme: {
    extend: {
      animation: {
        marquee: 'slide 10s linear infinite'
      },
      keyframes: {
        slide: {
          from: { left: "100%", transform: "translate(100%, 0)" },
          to: { left: "-100%", transform: "translate(-100%, 0)" }
        }
      }
    },
  },
  plugins: [
      require('@tailwindcss/forms')
  ],
}
