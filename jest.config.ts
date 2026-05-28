import nextJest from "next/jest.js";
import type { Config } from "jest";

const createJestConfig = nextJest({
    // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
    dir: "./",
});

// Add any custom config to be passed to Jest
const config: Config = {
    // Add more setup options before each test is run
    // setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],

    testEnvironment: "jest-environment-jsdom",
    setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
    coveragePathIgnorePatterns: [
        "src/types/io-ts-def.ts",
        "src/server/user/consts.ts",
    ],
    moduleNameMapper: {
        // bson v7 ships ESM by default; force Jest to load the CJS build.
        "^bson$": "<rootDir>/node_modules/bson/lib/bson.cjs",
    },
};

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
export default createJestConfig(config);
