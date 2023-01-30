const defaultTheme = require("tailwindcss/defaultTheme");

module.exports = {
    content: ["src/**/*.{ts,tsx}"],
    safelist: ["__next"],
    theme: {
        extend: {
            fontFamily: {
                sans: [
                    '"Century Gothic Regular"',
                    ...defaultTheme.fontFamily.sans,
                ],
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
            },
        },
    },
    plugins: [require("@tailwindcss/forms")],
};
