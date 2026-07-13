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

function makeFakeMongo() {
    const cursor = {
        next: jest.fn<() => Promise<Game | null>>(async () => null),
    };
    const collection = {
        find: jest.fn<(query: unknown) => typeof cursor>(() => cursor),
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
