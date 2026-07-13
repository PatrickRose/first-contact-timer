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
    setupInformation,
} from "../../fixtures/game";
import { makeProps, makeRequest } from "../../fixtures/routes";
import GameRepository from "@fc/server/repository/game";

jest.mock("@fc/server/repository/game", () => ({
    __esModule: true,
    getGameRepo: jest.fn(),
}));

type RouteModule = typeof import("../../../src/app/game/[id]/api/route");

let GET: RouteModule["GET"];
let getGameRepo: Mock<() => ReturnType<typeof MakeRight<GameRepository>>>;

beforeAll(async () => {
    ({ GET } = await import("../../../src/app/game/[id]/api/route"));
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

describe("GET /game/[id]/api", () => {
    test("returns a 500 when the repository is not available", async () => {
        getGameRepo.mockReturnValue(MakeLeft("No database") as never);

        const response = await GET(makeRequest(), makeProps());

        expect(response.status).toBe(500);
        expect(await response.json()).toEqual({ error: "No database" });
    });

    test("returns a 404 when the game does not exist", async () => {
        const repo = makeFakeGameRepo(makeActiveGame());
        repo.get.mockResolvedValue(MakeLeft(false));
        getGameRepo.mockReturnValue(MakeRight(repo));

        const response = await GET(makeRequest(), makeProps("missing-game"));

        expect(response.status).toBe(404);
        expect(await response.json()).toEqual({ error: "Game not found" });
        expect(repo.get).toHaveBeenCalledWith("missing-game");
    });

    test("returns the current turn of a running game", async () => {
        // The game fixture's phase ends 65 seconds after the mocked time
        const repo = makeFakeGameRepo(makeActiveGame());
        getGameRepo.mockReturnValue(MakeRight(repo));

        const response = await GET(makeRequest(), makeProps());

        expect(response.status).toBe(200);
        expect(await response.json()).toEqual({
            active: true,
            breakingNews: [],
            components: [],
            turnNumber: 1,
            phase: 1,
            phaseEnd: 65,
        });
        expect(repo.nextTurn).not.toHaveBeenCalled();
    });

    test("ticks over to the next phase when the current phase has finished", async () => {
        const finishedGame = makeActiveGame();
        finishedGame.turnInformation.phaseEnd = new Date(
            2023,
            1,
            2,
            3,
            4,
            0,
            0,
        ).toString();

        const tickedGame = makeActiveGame({
            turnInformation: {
                turnNumber: 1,
                currentPhase: 2,
                phaseEnd: new Date(2023, 1, 2, 3, 6, 5, 0).toString(),
            },
        });

        const repo = makeFakeGameRepo(finishedGame);
        repo.nextTurn.mockResolvedValue(MakeRight(tickedGame));
        getGameRepo.mockReturnValue(MakeRight(repo));

        const response = await GET(makeRequest(), makeProps());

        expect(repo.nextTurn).toHaveBeenCalledWith(finishedGame);
        expect(await response.json()).toEqual({
            active: true,
            breakingNews: [],
            components: [],
            turnNumber: 1,
            phase: 2,
            phaseEnd: 120,
        });
    });

    test("falls back to the current turn when ticking over fails", async () => {
        const finishedGame = makeActiveGame();
        finishedGame.turnInformation.phaseEnd = new Date(
            2023,
            1,
            2,
            3,
            4,
            0,
            0,
        ).toString();

        const repo = makeFakeGameRepo(finishedGame);
        repo.nextTurn.mockResolvedValue(
            MakeLeft("Someone else updated the game"),
        );
        getGameRepo.mockReturnValue(MakeRight(repo));

        const response = await GET(makeRequest(), makeProps());

        expect(response.status).toBe(200);
        expect(await response.json()).toEqual({
            active: true,
            breakingNews: [],
            components: [],
            turnNumber: 1,
            phase: 1,
            phaseEnd: 0,
        });
    });

    test("does not tick over a game that has reached its turn limit", async () => {
        const game = makeActiveGame({
            setupInformation: {
                ...setupInformation,
                maxTurns: 1,
            },
        });
        game.turnInformation.currentPhase = 3;
        game.turnInformation.phaseEnd = new Date(
            2023,
            1,
            2,
            3,
            4,
            0,
            0,
        ).toString();

        const repo = makeFakeGameRepo(game);
        getGameRepo.mockReturnValue(MakeRight(repo));

        const response = await GET(makeRequest(), makeProps());

        expect(repo.nextTurn).not.toHaveBeenCalled();
        expect(await response.json()).toEqual({
            active: true,
            breakingNews: [],
            components: [],
            turnNumber: 1,
            phase: 3,
            phaseEnd: 0,
        });
    });

    test("returns the frozen turn of an inactive game", async () => {
        const repo = makeFakeGameRepo(makeInactiveGame());
        getGameRepo.mockReturnValue(MakeRight(repo));

        const response = await GET(makeRequest(), makeProps());

        expect(response.status).toBe(200);
        expect(await response.json()).toEqual({
            active: false,
            breakingNews: [],
            components: [],
            turnNumber: 1,
            phase: 1,
            phaseEnd: 60,
        });
        expect(repo.nextTurn).not.toHaveBeenCalled();
    });
});
