/**
 * @jest-environment node
 */
import {
    afterEach,
    beforeAll,
    beforeEach,
    describe,
    expect,
    jest,
    test,
} from "@jest/globals";
import type { Mock } from "jest-mock";
import { MakeLeft, MakeRight } from "@fc/lib/io-ts-helpers";
import {
    makeActiveGame,
    makeFakeGameRepo,
    makeInactiveGame,
} from "../../fixtures/game";
import { makeProps, makeRequest } from "../../fixtures/routes";
import GameRepository from "@fc/server/repository/game";

jest.mock("@fc/server/repository/game", () => ({
    __esModule: true,
    getGameRepo: jest.fn(),
}));

type RouteModule = typeof import("../../../src/app/game/[id]/press/api/route");

let POST: RouteModule["POST"];
let getGameRepo: Mock<() => ReturnType<typeof MakeRight<GameRepository>>>;

beforeAll(async () => {
    ({ POST } = await import("../../../src/app/game/[id]/press/api/route"));
    ({ getGameRepo } = (await import("@fc/server/repository/game")) as never);
});

const mockedDate = new Date(2023, 1, 2, 3, 4, 5, 0);

beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(mockedDate);
});

afterEach(() => {
    jest.useRealTimers();
});

describe("POST /game/[id]/press/api", () => {
    test("returns a 400 for an invalid body", async () => {
        const response = await POST(
            makeRequest({ breakingNews: "Big news" }),
            makeProps(),
        );

        expect(response.status).toBe(400);
        expect(await response.json()).toEqual({ error: "Incorrect request" });
    });

    test("returns a 500 when the repository is not available", async () => {
        getGameRepo.mockReturnValue(MakeLeft("No database") as never);

        const response = await POST(
            makeRequest({ breakingNews: "Big news", pressAccount: 1 }),
            makeProps(),
        );

        expect(response.status).toBe(500);
        expect(await response.json()).toEqual({ error: "No database" });
    });

    test("returns a 404 when the game does not exist", async () => {
        const repo = makeFakeGameRepo(makeActiveGame());
        repo.get.mockResolvedValue(MakeLeft(false));
        getGameRepo.mockReturnValue(MakeRight(repo));

        const response = await POST(
            makeRequest({ breakingNews: "Big news", pressAccount: 1 }),
            makeProps(),
        );

        expect(response.status).toBe(404);
        expect(await response.json()).toEqual({ error: "Game not found" });
    });

    test("rejects breaking news for an inactive game", async () => {
        const repo = makeFakeGameRepo(makeInactiveGame());
        getGameRepo.mockReturnValue(MakeRight(repo));

        const response = await POST(
            makeRequest({ breakingNews: "Big news", pressAccount: 1 }),
            makeProps(),
        );

        expect(response.status).toBe(400);
        expect(await response.json()).toEqual({
            error: "Game not active, please wait",
        });
        expect(repo.setBreakingNews).not.toHaveBeenCalled();
    });

    test("stores the breaking news", async () => {
        const game = makeActiveGame();
        const newsItem = {
            newsText: "Big news",
            date: mockedDate.toISOString(),
            turn: 1,
            phase: 1,
            pressAccount: 2,
        };

        const repo = makeFakeGameRepo(game);
        repo.setBreakingNews.mockResolvedValue(
            MakeRight({ ...game, breakingNews: [newsItem] }),
        );
        getGameRepo.mockReturnValue(MakeRight(repo));

        const response = await POST(
            makeRequest({ breakingNews: "Big news", pressAccount: 2 }),
            makeProps(),
        );

        expect(response.status).toBe(200);
        expect(repo.setBreakingNews).toHaveBeenCalledWith(game, "Big news", 2);
        expect(await response.json()).toEqual({
            active: true,
            breakingNews: [newsItem],
            components: [],
            turnNumber: 1,
            phase: 1,
            phaseEnd: 65,
        });
    });

    test("returns a 500 when storing the breaking news fails", async () => {
        const repo = makeFakeGameRepo(makeActiveGame());
        repo.setBreakingNews.mockResolvedValue(MakeLeft("Update failed"));
        getGameRepo.mockReturnValue(MakeRight(repo));

        const response = await POST(
            makeRequest({ breakingNews: "Big news", pressAccount: 1 }),
            makeProps(),
        );

        expect(response.status).toBe(500);
        expect(await response.json()).toEqual({ error: "Update failed" });
    });
});
