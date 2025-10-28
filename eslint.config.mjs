import nextTypescript from "eslint-config-next/typescript";
import nextCoreWebVitals from "eslint-config-next/core-web-vitals";

const config = [
    ...nextTypescript,
    ...nextCoreWebVitals,
    {
        ignores: [
            "node_modules/**",
            ".next/**",
            "out/**",
            "build/**",
            "next-env.d.ts",
        ],
    },
];
export default config;
