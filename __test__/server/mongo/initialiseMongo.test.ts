import {
    afterAll,
    beforeEach,
    describe,
    expect,
    jest,
    test,
} from "@jest/globals";
import { isLeft, Left } from "fp-ts/Either";

jest.mock("mongodb", () => {
    return {
        MongoClient: jest.fn().mockImplementation(() => ({
            // The client promise is created via client.connect(); the cache
            // never awaits it in these tests, so resolving to undefined is fine.
            connect: jest.fn(async () => undefined),
        })),
    };
});
describe("initialiseMongo", () => {
    const existingEnv = process.env;
    const globalWithMongo = globalThis as typeof globalThis & {
        _mongoClientPromise?: unknown;
    };

    beforeEach(() => {
        process.env = { ...existingEnv };
        // The client is cached on globalThis, so reset it between tests to
        // exercise the construction path with each connection string.
        delete globalWithMongo._mongoClientPromise;
    });

    afterAll(() => {
        process.env = existingEnv;
    });

    const required = [
        "MONGO_URL",
        "MONGO_USERNAME",
        "MONGO_PASSWORD",
        "MONGO_DB",
    ];

    for (let i = 0; i < 2 ** required.length - 1; i++) {
        const envToSet = required.filter((_, index) => {
            return ((1 << index) & i) != 0;
        });
        const notSetEnv = required.filter((val) => !envToSet.includes(val));

        test(`Initialising mongo with ${envToSet.join(
            ", ",
        )} (but missing ${notSetEnv.join(
            ", ",
        )}) returns an error`, async () => {
            const initialiseMongo = (await import("@fc/server/mongo")).default;

            envToSet.forEach((val) => (process.env[val] = "SET"));

            const expected: Left<string> = {
                _tag: "Left",
                left:
                    "Some environment variables were not set: " +
                    notSetEnv.join(", "),
            };

            expect(initialiseMongo()).toEqual(expected);
        });
    }

    test("Passing all env returns a MongoClient", async () => {
        const initialiseMongo = (await import("@fc/server/mongo")).default;
        const { MongoClient } = await import("mongodb");

        required.forEach((val) => (process.env[val] = val));

        const result = initialiseMongo();

        expect(isLeft(result)).toBe(false);

        if (isLeft(result)) {
            return;
        }

        expect(MongoClient).toHaveBeenCalledWith(
            `mongodb+srv://MONGO_USERNAME:MONGO_PASSWORD@MONGO_URL/MONGO_DB?retryWrites=true&w=majority`,
            {
                maxPoolSize: 10,
                serverSelectionTimeoutMS: 5000,
                connectTimeoutMS: 5000,
            },
        );
    });

    test("MONGO_PROTOCOL and MONGO_OPTIONS override the connection string", async () => {
        const initialiseMongo = (await import("@fc/server/mongo")).default;
        const { MongoClient } = await import("mongodb");

        required.forEach((val) => (process.env[val] = val));
        process.env.MONGO_PROTOCOL = "mongodb";
        process.env.MONGO_OPTIONS = "authSource=admin";

        const result = initialiseMongo();

        expect(isLeft(result)).toBe(false);

        expect(MongoClient).toHaveBeenCalledWith(
            `mongodb://MONGO_USERNAME:MONGO_PASSWORD@MONGO_URL/MONGO_DB?authSource=admin`,
            {
                maxPoolSize: 10,
                serverSelectionTimeoutMS: 5000,
                connectTimeoutMS: 5000,
            },
        );
    });
});
