/**
 * @jest-environment node
 */
import {
    afterAll,
    afterEach,
    beforeEach,
    describe,
    expect,
    jest,
    test,
} from "@jest/globals";
import { isLeft, isRight } from "fp-ts/Either";
import { MongoClient } from "mongodb";
import { MongoRepository } from "@fc/server/repository/game/mongo";
import { MakeLeft, MakeRight } from "@fc/lib/io-ts-helpers";
import { Game } from "@fc/types/types";
import { makeActiveGame } from "../../../fixtures/game";

type FakeCursor = {
    next: () => Promise<Game | null>;
    sort: (spec: Record<string, 1 | -1>) => FakeCursor;
    skip: (n: number) => FakeCursor;
    limit: (n: number) => FakeCursor;
    toArray: () => Promise<Game[]>;
};

function makeFakeMongo() {
    // The list() cursor chain: sort/skip/limit return the cursor so they can be
    // chained, and toArray resolves the results. The chain methods are wired to
    // return `cursor` after construction to avoid referencing it before init.
    const cursor = {
        next: jest.fn<() => Promise<Game | null>>(async () => null),
        sort: jest.fn<FakeCursor["sort"]>(),
        skip: jest.fn<FakeCursor["skip"]>(),
        limit: jest.fn<FakeCursor["limit"]>(),
        toArray: jest.fn<() => Promise<Game[]>>(async () => []),
    };
    cursor.sort.mockReturnValue(cursor);
    cursor.skip.mockReturnValue(cursor);
    cursor.limit.mockReturnValue(cursor);
    const collection = {
        find: jest.fn<(query: unknown) => typeof cursor>(() => cursor),
        countDocuments: jest.fn<(query: unknown) => Promise<number>>(
            async () => 0,
        ),
        insertOne: jest.fn<(game: unknown) => Promise<object>>(
            async () => ({}),
        ),
        updateOne: jest.fn<
            (filter: unknown, update: unknown) => Promise<object>
        >(async () => ({})),
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
    test("returns the game when it exists", async () => {
        const { cursor, collection, db, client, repository } = makeFakeMongo();
        const game = makeActiveGame();

        cursor.next.mockResolvedValue(game);

        const result = await repository.get("test-game");

        expect(result).toEqual(MakeRight(game));
        expect(db.collection).toHaveBeenCalledWith("games");
        expect(collection.find).toHaveBeenCalledWith({ _id: "test-game" });
        expect(client.connect).toHaveBeenCalled();
        expect(client.close).toHaveBeenCalled();
    });

    test("returns a left when the game does not exist", async () => {
        const { cursor, client, repository } = makeFakeMongo();

        cursor.next.mockResolvedValue(null);

        const result = await repository.get("missing-game");

        expect(result).toEqual(MakeLeft(false));
        expect(client.close).toHaveBeenCalled();
    });

    test("returns a left when the connection fails", async () => {
        const { client, repository } = makeFakeMongo();
        const logSpy = jest
            .spyOn(console, "log")
            .mockImplementation(() => undefined);

        client.connect.mockRejectedValue(new Error("Connection refused"));

        const result = await repository.get("test-game");

        expect(result).toEqual(MakeLeft(false));
        expect(client.close).toHaveBeenCalled();

        logSpy.mockRestore();
    });
});

describe("list", () => {
    test("returns the paginated slice with the total and applies pagination", async () => {
        const { cursor, collection, repository } = makeFakeMongo();
        const games = [
            makeActiveGame({ _id: "alpha" }),
            makeActiveGame({ _id: "bravo" }),
        ];

        collection.countDocuments.mockResolvedValue(25);
        cursor.toArray.mockResolvedValue(games);

        const result = await repository.list({ page: 2, pageSize: 10 });

        expect(result).toEqual(MakeRight({ games, total: 25, page: 2 }));
        expect(collection.countDocuments).toHaveBeenCalledWith({});
        expect(collection.find).toHaveBeenCalledWith({});
        expect(cursor.sort).toHaveBeenCalledWith({ _id: 1 });
        expect(cursor.skip).toHaveBeenCalledWith(10);
        expect(cursor.limit).toHaveBeenCalledWith(10);
    });

    test("builds a case-insensitive regex filter from a trimmed search term", async () => {
        const { collection, repository } = makeFakeMongo();

        collection.countDocuments.mockResolvedValue(1);

        await repository.list({ search: "  Alpha  ", page: 1, pageSize: 10 });

        expect(collection.find).toHaveBeenCalledWith({
            _id: { $regex: "Alpha", $options: "i" },
        });
    });

    test("escapes regex metacharacters in the search term", async () => {
        const { collection, repository } = makeFakeMongo();

        collection.countDocuments.mockResolvedValue(0);

        const result = await repository.list({
            search: "a(b)[c].*",
            page: 1,
            pageSize: 10,
        });

        // Must not throw and must escape every metacharacter.
        expect(isRight(result)).toBe(true);
        expect(collection.find).toHaveBeenCalledWith({
            _id: {
                $regex: "a\\(b\\)\\[c\\]\\.\\*",
                $options: "i",
            },
        });
    });

    test("treats a whitespace-only search as no filter", async () => {
        const { collection, repository } = makeFakeMongo();

        collection.countDocuments.mockResolvedValue(3);

        await repository.list({ search: "   ", page: 1, pageSize: 10 });

        expect(collection.find).toHaveBeenCalledWith({});
    });

    test("clamps an out-of-range page down to the last available page", async () => {
        const { cursor, collection, repository } = makeFakeMongo();

        // 5 games, 10 per page => only 1 page exists.
        collection.countDocuments.mockResolvedValue(5);

        const result = await repository.list({ page: 999, pageSize: 10 });

        expect(isRight(result)).toBe(true);
        if (isRight(result)) {
            expect(result.right.page).toBe(1);
        }
        // skip is never negative and never past the results.
        expect(cursor.skip).toHaveBeenCalledWith(0);
    });

    test("returns an empty page with page 1 when there are no games", async () => {
        const { cursor, collection, repository } = makeFakeMongo();

        collection.countDocuments.mockResolvedValue(0);
        cursor.toArray.mockResolvedValue([]);

        const result = await repository.list({ page: 3, pageSize: 10 });

        expect(result).toEqual(MakeRight({ games: [], total: 0, page: 1 }));
        expect(cursor.skip).toHaveBeenCalledWith(0);
    });

    test("returns the error message when the query fails", async () => {
        const { collection, client, repository } = makeFakeMongo();

        collection.countDocuments.mockRejectedValue(new Error("List failed"));

        const result = await repository.list({ page: 1, pageSize: 10 });

        expect(result).toEqual(MakeLeft("List failed"));
        expect(client.close).toHaveBeenCalled();
    });
});

describe("insert", () => {
    test("inserts the game", async () => {
        const { collection, client, repository } = makeFakeMongo();
        const game = makeActiveGame();

        const result = await repository.insert(game);

        expect(result).toEqual(MakeRight(true));
        expect(collection.insertOne).toHaveBeenCalledWith(game);
        expect(client.close).toHaveBeenCalled();
    });

    test("returns the error message when the insert fails", async () => {
        const { collection, client, repository } = makeFakeMongo();

        collection.insertOne.mockRejectedValue(new Error("Insert failed"));

        const result = await repository.insert(makeActiveGame());

        expect(result).toEqual(MakeLeft("Insert failed"));
        expect(client.close).toHaveBeenCalled();
    });
});

describe("nextTurn", () => {
    const mockedDate = new Date(2023, 1, 2, 3, 4, 5, 0);

    beforeEach(() => {
        jest.useFakeTimers();
        jest.setSystemTime(mockedDate);
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    test("ticks the turn and stores the new turn information", async () => {
        const { cursor, collection, repository } = makeFakeMongo();
        const game = makeActiveGame();

        // Phase 2 is 2 minutes long
        const expectedPhaseEnd = new Date(2023, 1, 2, 3, 6, 5, 0);
        const updatedGame = makeActiveGame({
            turnInformation: {
                turnNumber: 1,
                currentPhase: 2,
                phaseEnd: expectedPhaseEnd.toString(),
            },
        });

        cursor.next.mockResolvedValue(updatedGame);

        const result = await repository.nextTurn(game);

        expect(collection.updateOne).toHaveBeenCalledWith(
            {
                _id: game._id,
                turnInformation: game.turnInformation,
            },
            {
                $set: {
                    turnInformation: {
                        turnNumber: 1,
                        currentPhase: 2,
                        phaseEnd: expectedPhaseEnd.toString(),
                    },
                },
            },
        );
        expect(result).toEqual(MakeRight(updatedGame));
    });

    test("returns the error message when the update fails", async () => {
        const { collection, repository } = makeFakeMongo();

        collection.updateOne.mockRejectedValue(new Error("Update failed"));

        const result = await repository.nextTurn(makeActiveGame());

        expect(result).toEqual(MakeLeft("Update failed"));
    });

    test("returns a left when the game cannot be fetched after the update", async () => {
        const { cursor, repository } = makeFakeMongo();

        cursor.next.mockResolvedValue(null);

        const result = await repository.nextTurn(makeActiveGame());

        expect(result).toEqual(MakeLeft("Failed to get game?"));
    });
});

describe("runControlAction", () => {
    test("applies the action and stores the result", async () => {
        const { cursor, collection, repository } = makeFakeMongo();
        const game = makeActiveGame();
        const updatedGame = makeActiveGame({ breakingNews: [] });

        cursor.next.mockResolvedValue(updatedGame);

        const result = await repository.runControlAction(game, () =>
            MakeRight({ active: true }),
        );

        expect(collection.updateOne).toHaveBeenCalledWith(
            {
                _id: game._id,
                turnInformation: game.turnInformation,
            },
            { $set: { active: true } },
        );
        expect(result).toEqual(MakeRight(updatedGame));
    });

    test("returns the action error without updating when the action fails", async () => {
        const { collection, repository } = makeFakeMongo();

        const result = await repository.runControlAction(makeActiveGame(), () =>
            MakeLeft("Action failed"),
        );

        expect(result).toEqual(MakeLeft("Action failed"));
        expect(collection.updateOne).not.toHaveBeenCalled();
    });

    test("returns the error message when the update fails", async () => {
        const { collection, repository } = makeFakeMongo();

        collection.updateOne.mockRejectedValue(new Error("Update failed"));

        const result = await repository.runControlAction(makeActiveGame(), () =>
            MakeRight({ active: true }),
        );

        expect(result).toEqual(MakeLeft("Update failed"));
    });

    test("returns a left when the game cannot be fetched after the update", async () => {
        const { cursor, repository } = makeFakeMongo();

        cursor.next.mockResolvedValue(null);

        const result = await repository.runControlAction(makeActiveGame(), () =>
            MakeRight({ active: true }),
        );

        expect(result).toEqual(MakeLeft("Failed to get game?"));
    });
});

describe("setBreakingNews", () => {
    const mockedDate = new Date(2023, 1, 2, 3, 4, 5, 0);

    beforeEach(() => {
        jest.useFakeTimers();
        jest.setSystemTime(mockedDate);
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    test("pushes the news item and returns the updated game", async () => {
        const { cursor, collection, repository } = makeFakeMongo();
        const game = makeActiveGame();
        const updatedGame = makeActiveGame({
            breakingNews: [
                {
                    newsText: "Big news",
                    date: mockedDate.toISOString(),
                    turn: 1,
                    phase: 1,
                    pressAccount: 2,
                },
            ],
        });

        cursor.next.mockResolvedValue(updatedGame);

        const result = await repository.setBreakingNews(game, "Big news", 2);

        expect(collection.updateOne).toHaveBeenCalledWith(
            { _id: game._id },
            {
                $push: {
                    breakingNews: {
                        newsText: "Big news",
                        date: mockedDate.toISOString(),
                        turn: game.turnInformation.turnNumber,
                        phase: game.turnInformation.currentPhase,
                        pressAccount: 2,
                    },
                },
            },
        );
        expect(result).toEqual(MakeRight(updatedGame));
    });

    test("returns the error message when the update fails", async () => {
        const { collection, repository } = makeFakeMongo();

        collection.updateOne.mockRejectedValue(new Error("Update failed"));

        const result = await repository.setBreakingNews(
            makeActiveGame(),
            "Big news",
            1,
        );

        expect(result).toEqual(MakeLeft("Update failed"));
    });

    test("returns a left when the game cannot be fetched after the update", async () => {
        const { cursor, repository } = makeFakeMongo();

        cursor.next.mockResolvedValue(null);

        const result = await repository.setBreakingNews(
            makeActiveGame(),
            "Big news",
            1,
        );

        expect(result).toEqual(MakeLeft("Game does not exist?"));
    });
});
