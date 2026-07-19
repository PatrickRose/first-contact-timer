import {
    afterAll,
    beforeEach,
    describe,
    expect,
    jest,
    test,
} from "@jest/globals";
import type { Mock } from "jest-mock";
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
                maxPoolSize: 5,
                serverSelectionTimeoutMS: 5000,
                connectTimeoutMS: 5000,
            },
        );
    });

    test("clears the cache after a failed connect so the next call retries", async () => {
        const initialiseMongo = (await import("@fc/server/mongo")).default;
        const { MongoClient } = await import("mongodb");
        const mockedClient = MongoClient as unknown as Mock;

        required.forEach((val) => (process.env[val] = val));

        const failingConnect = jest.fn(async () => {
            throw new Error("connection refused");
        });
        const succeedingConnect = jest.fn(async () => undefined);

        mockedClient.mockImplementationOnce(() => ({
            connect: failingConnect,
        }));
        mockedClient.mockImplementationOnce(() => ({
            connect: succeedingConnect,
        }));

        // The first connect rejects; awaiting the cached promise surfaces the
        // error and (crucially) clears the cache.
        const first = initialiseMongo();
        expect(isLeft(first)).toBe(false);
        if (isLeft(first)) {
            return;
        }
        await expect(first.right).rejects.toThrow("connection refused");

        // The next call must attempt a fresh connect rather than reusing the
        // poisoned, rejected promise.
        const second = initialiseMongo();
        expect(isLeft(second)).toBe(false);
        if (isLeft(second)) {
            return;
        }
        await expect(second.right).resolves.toBeUndefined();

        expect(failingConnect).toHaveBeenCalledTimes(1);
        expect(succeedingConnect).toHaveBeenCalledTimes(1);
    });

    test("closeClient closes the shared client and clears the cache", async () => {
        const { default: initialiseMongo, closeClient } =
            await import("@fc/server/mongo");
        const { MongoClient } = await import("mongodb");
        const mockedClient = MongoClient as unknown as Mock;

        required.forEach((val) => (process.env[val] = val));

        const close = jest.fn(async () => undefined);
        const connect = jest.fn(async () => ({ close }));
        mockedClient.mockImplementationOnce(() => ({ connect }));

        // Establish the shared client, then close it.
        initialiseMongo();
        await closeClient();

        expect(close).toHaveBeenCalledTimes(1);
        // The cache is cleared, so the next call constructs a fresh client.
        mockedClient.mockClear();
        initialiseMongo();
        expect(mockedClient).toHaveBeenCalledTimes(1);
    });

    test("closeClient is a no-op when no client is cached", async () => {
        const { closeClient } = await import("@fc/server/mongo");

        await expect(closeClient()).resolves.toBeUndefined();
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
                maxPoolSize: 5,
                serverSelectionTimeoutMS: 5000,
                connectTimeoutMS: 5000,
            },
        );
    });
});
