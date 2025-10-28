/* eslint-disable @typescript-eslint/no-require-imports */
const defaultTheme = require("tailwindcss/defaultTheme");

module.exports = {
    content: ["src/**/*.{ts,tsx}"],
    safelist: ["__next"],
    theme: {
        extend: {
            fontFamily: {
                sans: ['"Century Gothic"', ...defaultTheme.fontFamily.sans],
            },
            animation: {
                "marquee-1": "slide-1 10s linear infinite",
                "marquee-2": "slide-2 20s linear infinite",
                "marquee-3": "slide-3 30s linear infinite",
            },
            keyframes: {
                "slide-1": {
                    from: { left: "100%", transform: "translate(100%, 0)" },
                    to: { left: "-100%", transform: "translate(-100%, 0)" },
                },
                "slide-2": {
                    from: { left: "200%", transform: "translate(100%, 0)" },
                    to: { left: "-200%", transform: "translate(-110%, 0)" },
                },
                "slide-3": {
                    from: { left: "300%", transform: "translate(100%, 0)" },
                    to: { left: "-300%", transform: "translate(-210%, 0)" },
                },
            },
            colors: {
                "first-contact": "#757380",
                "turn-counter-current": "#257a25",
                "turn-counter-future": "#123812",
                "turn-counter-past-light": "#1a1a1a",
                "turn-counter-past-dark": "#333333",
                "defcon-1-light": "#751616",
                "defcon-1-dark": "#590e07",
                "defcon-2-light": "#634011",
                "defcon-2-dark": "#472e0c",
                "defcon-3-light": "#1a521a",
                "defcon-3-dark": "#113311",
                aftermath: "#c20000",
                "aftermath-alert": "#ffd710",
            },
            fontSize: {
                "big-time": "12em",
            },
        },
    },
    plugins: [require("@tailwindcss/forms")],
};
