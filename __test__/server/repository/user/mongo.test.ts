/**
 * @jest-environment node
 */
import {
    afterAll,
    beforeAll,
    beforeEach,
    describe,
    expect,
    jest,
    test,
} from "@jest/globals";
import { isLeft, isRight } from "fp-ts/Either";
import { MongoClient } from "mongodb";
import { DEFAULT_PASSWORD } from "@fc/server/repository/user/consts";
import { MakeLeft, MakeRight } from "@fc/lib/io-ts-helpers";
import { DBUser } from "@fc/types/types";

// NB: jest.mock calls are not hoisted above imports by the SWC transform, so
// the module under test (and the mocked module) are imported dynamically in
// beforeAll, after the mock has been registered.
jest.mock("@fc/server/repository/user/argon", () => {
    return {
        hashPassword: jest.fn(() => Promise.resolve("HASHED PASSWORD")),
    };
});

type UserMongoModule = typeof import("@fc/server/repository/user/mongo");
type ArgonModule = typeof import("@fc/server/repository/user/argon");

let MongoRepository: UserMongoModule["MongoRepository"];
let hashPassword: ArgonModule["hashPassword"];

beforeAll(async () => {
    ({ MongoRepository } = await import("@fc/server/repository/user/mongo"));
    ({ hashPassword } = await import("@fc/server/repository/user/argon"));
});

const testUser: DBUser = {
    _id: "test-user",
    password: "STORED HASH",
    passwordNeedsReset: false,
};

function makeFakeMongo() {
    const cursor = {
        next: jest.fn<() => Promise<DBUser | null>>(async () => null),
    };
    const collection = {
        find: jest.fn<(query: unknown) => typeof cursor>(() => cursor),
        insertOne: jest.fn<(user: unknown) => Promise<object>>(
            async () => ({}),
        ),
        updateOne: jest.fn<
            (
                filter: unknown,
                update: unknown,
            ) => Promise<{ matchedCount: number }>
        >(async () => ({ matchedCount: 1 })),
    };
    const db = {
        collection: jest.fn<(name: string) => typeof collection>(
            () => collection,
        ),
    };
    const client = {
        connect: jest.fn(async () => undefined),
        db: jest.fn(() => db),
        close: jest.fn(async () => undefined),
    };

    return {
        cursor,
        collection,
        db,
        client,
        repository: new MongoRepository(client as unknown as MongoClient),
    };
}

describe("APIInstance", () => {
    const existingEnv = process.env;

    beforeEach(() => {
        process.env = { ...existingEnv };
    });

    afterAll(() => {
        process.env = existingEnv;
    });

    test("returns a repository when the environment is set up", () => {
        ["MONGO_URL", "MONGO_USERNAME", "MONGO_PASSWORD", "MONGO_DB"].forEach(
            (val) => (process.env[val] = val),
        );

        const result = MongoRepository.APIInstance();

        expect(isRight(result)).toBe(true);

        if (isRight(result)) {
            expect(result.right).toBeInstanceOf(MongoRepository);
        }
    });

    test("returns an error when the environment is not set up", () => {
        delete process.env.MONGO_URL;
        delete process.env.MONGO_USERNAME;
        delete process.env.MONGO_PASSWORD;
        delete process.env.MONGO_DB;

        const result = MongoRepository.APIInstance();

        expect(isLeft(result)).toBe(true);
    });
});

describe("get", () => {
    test("returns the user when they exist", async () => {
        const { cursor, collection, db, client, repository } = makeFakeMongo();

        cursor.next.mockResolvedValue(testUser);

        const result = await repository.get("test-user");

        expect(result).toEqual(MakeRight(testUser));
        expect(db.collection).toHaveBeenCalledWith("users");
        expect(collection.find).toHaveBeenCalledWith({ _id: "test-user" });
        expect(client.close).toHaveBeenCalled();
    });

    test("returns a left when the user does not exist", async () => {
        const { cursor, client, repository } = makeFakeMongo();

        cursor.next.mockResolvedValue(null);

        const result = await repository.get("missing-user");

        expect(result).toEqual(MakeLeft(false));
        expect(client.close).toHaveBeenCalled();
    });

    test("returns a left when the connection fails", async () => {
        const { client, repository } = makeFakeMongo();
        const logSpy = jest
            .spyOn(console, "log")
            .mockImplementation(() => undefined);

        client.connect.mockRejectedValue(new Error("Connection refused"));

        const result = await repository.get("test-user");

        expect(result).toEqual(MakeLeft(false));
        expect(client.close).toHaveBeenCalled();

        logSpy.mockRestore();
    });
});

describe("insert", () => {
    test("inserts a new user with the hashed default password", async () => {
        const { collection, client, repository } = makeFakeMongo();

        const result = await repository.insert("new-user");

        expect(result).toEqual(MakeRight(true));
        expect(hashPassword).toHaveBeenCalledWith(DEFAULT_PASSWORD);
        expect(collection.insertOne).toHaveBeenCalledWith({
            _id: "new-user",
            password: "HASHED PASSWORD",
            passwordNeedsReset: true,
        });
        expect(client.close).toHaveBeenCalled();
    });

    test("returns the error message when the insert fails", async () => {
        const { collection, repository } = makeFakeMongo();

        collection.insertOne.mockRejectedValue(new Error("Insert failed"));

        const result = await repository.insert("new-user");

        expect(result).toEqual(MakeLeft("Insert failed"));
    });
});

describe("update", () => {
    test("updates the user", async () => {
        const { collection, repository } = makeFakeMongo();

        const result = await repository.update("test-user", testUser);

        expect(result).toEqual(MakeRight(true));
        expect(collection.updateOne).toHaveBeenCalledWith(
            { _id: "test-user" },
            { $set: testUser },
        );
    });

    test("returns a left when no user matched", async () => {
        const { collection, repository } = makeFakeMongo();
        const logSpy = jest
            .spyOn(console, "log")
            .mockImplementation(() => undefined);

        collection.updateOne.mockResolvedValue({ matchedCount: 0 });

        const result = await repository.update("missing-user", testUser);

        expect(result).toEqual(
            MakeLeft("Failed to update - matched 0 when updating missing-user"),
        );

        logSpy.mockRestore();
    });

    test("returns the error message when the update fails", async () => {
        const { collection, repository } = makeFakeMongo();

        collection.updateOne.mockRejectedValue(new Error("Update failed"));

        const result = await repository.update("test-user", testUser);

        expect(result).toEqual(MakeLeft("Update failed"));
    });
});
