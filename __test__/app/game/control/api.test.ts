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
} from "../../../fixtures/game";
import { makeProps, makeRequest } from "../../../fixtures/routes";
import GameRepository from "@fc/server/repository/game";

jest.mock("@fc/server/repository/game", () => ({
    __esModule: true,
    getGameRepo: jest.fn(),
}));

type RouteModule =
    typeof import("../../../../src/app/game/[id]/control/api/route");

let POST: RouteModule["POST"];
let getGameRepo: Mock<() => ReturnType<typeof MakeRight<GameRepository>>>;

beforeAll(async () => {
    ({ POST } =
        await import("../../../../src/app/game/[id]/control/api/route"));
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

describe("POST /game/[id]/control/api", () => {
    test("returns a 400 for an unknown action", async () => {
        const response = await POST(
            makeRequest({ action: "explode" }),
            makeProps(),
        );

        expect(response.status).toBe(400);
        expect(await response.json()).toEqual({ error: "Incorrect request" });
    });

    test("returns a 500 when the repository is not available", async () => {
        getGameRepo.mockReturnValue(MakeLeft("No database") as never);

        const response = await POST(
            makeRequest({ action: "pause" }),
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
            makeRequest({ action: "pause" }),
            makeProps("missing-game"),
        );

        expect(response.status).toBe(404);
        expect(await response.json()).toEqual({ error: "Game not found" });
        expect(repo.get).toHaveBeenCalledWith("missing-game");
    });

    test("returns a 500 when the control action fails", async () => {
        // With no phases, generating the new turn information fails
        const game = makeActiveGame({
            setupInformation: {
                theme: "first-contact",
                components: [],
                breakingNewsBanner: false,
                press: false,
                gameName: "TEST GAME",
                phases: [],
            },
        });
        const repo = makeFakeGameRepo(game);
        getGameRepo.mockReturnValue(MakeRight(repo));

        const response = await POST(
            makeRequest({ action: "forward-phase" }),
            makeProps(),
        );

        expect(response.status).toBe(500);
        expect(await response.json()).toEqual({
            error: "Tried to get length of phase 2, but there are only 0 phases",
        });
    });

    describe("pause", () => {
        test("freezes the current turn", async () => {
            // The game fixture's phase ends 65 seconds after the mocked time
            const repo = makeFakeGameRepo(makeActiveGame());
            getGameRepo.mockReturnValue(MakeRight(repo));

            const response = await POST(
                makeRequest({ action: "pause" }),
                makeProps(),
            );

            expect(response.status).toBe(200);
            expect(await response.json()).toEqual({
                active: false,
                breakingNews: [],
                components: [],
                turnNumber: 1,
                phase: 1,
                phaseEnd: 65,
            });
        });
    });

    describe("play", () => {
        test("resumes an inactive game from the frozen turn", async () => {
            // The default frozen turn has 60 seconds left of phase 1
            const repo = makeFakeGameRepo(makeInactiveGame());
            getGameRepo.mockReturnValue(MakeRight(repo));

            const response = await POST(
                makeRequest({ action: "play" }),
                makeProps(),
            );

            expect(response.status).toBe(200);
            expect(await response.json()).toEqual({
                active: true,
                breakingNews: [],
                components: [],
                turnNumber: 1,
                phase: 1,
                phaseEnd: 60,
            });
        });

        test("leaves an already active game untouched", async () => {
            const repo = makeFakeGameRepo(makeActiveGame());
            getGameRepo.mockReturnValue(MakeRight(repo));

            const response = await POST(
                makeRequest({ action: "play" }),
                makeProps(),
            );

            expect(response.status).toBe(200);
            expect(await response.json()).toEqual({
                active: true,
                breakingNews: [],
                components: [],
                turnNumber: 1,
                phase: 1,
                phaseEnd: 65,
            });
        });
    });

    describe("forward-phase", () => {
        test("moves to the next phase", async () => {
            const repo = makeFakeGameRepo(makeActiveGame());
            getGameRepo.mockReturnValue(MakeRight(repo));

            const response = await POST(
                makeRequest({ action: "forward-phase" }),
                makeProps(),
            );

            // Phase 2 is 2 minutes long
            expect(await response.json()).toEqual({
                active: true,
                breakingNews: [],
                components: [],
                turnNumber: 1,
                phase: 2,
                phaseEnd: 120,
            });
        });

        test("wraps to the next turn from the last phase", async () => {
            const game = makeActiveGame();
            game.turnInformation.currentPhase = 3;
            const repo = makeFakeGameRepo(game);
            getGameRepo.mockReturnValue(MakeRight(repo));

            const response = await POST(
                makeRequest({ action: "forward-phase" }),
                makeProps(),
            );

            expect(await response.json()).toEqual({
                active: true,
                breakingNews: [],
                components: [],
                turnNumber: 2,
                phase: 1,
                phaseEnd: 60,
            });
        });

        test("keeps returning the frozen turn for an inactive game", async () => {
            const repo = makeFakeGameRepo(makeInactiveGame());
            getGameRepo.mockReturnValue(MakeRight(repo));

            const response = await POST(
                makeRequest({ action: "forward-phase" }),
                makeProps(),
            );

            // The turn information changes, but the response is the
            // (unchanged) frozen turn until the game is played again
            expect(await response.json()).toEqual({
                active: false,
                breakingNews: [],
                components: [],
                turnNumber: 1,
                phase: 1,
                phaseEnd: 60,
            });
        });
    });

    describe("back-phase", () => {
        test("moves to the previous phase", async () => {
            const game = makeActiveGame();
            game.turnInformation.currentPhase = 3;
            const repo = makeFakeGameRepo(game);
            getGameRepo.mockReturnValue(MakeRight(repo));

            const response = await POST(
                makeRequest({ action: "back-phase" }),
                makeProps(),
            );

            expect(await response.json()).toEqual({
                active: true,
                breakingNews: [],
                components: [],
                turnNumber: 1,
                phase: 2,
                phaseEnd: 120,
            });
        });

        test("moves to the previous turn from the first phase", async () => {
            // Documents the current behaviour: going back from phase 1 lands
            // on phase `phases.length - 1` (not the final phase) of the
            // previous turn, and the turn number can reach 0
            const game = makeActiveGame();
            game.turnInformation.turnNumber = 2;
            const repo = makeFakeGameRepo(game);
            getGameRepo.mockReturnValue(MakeRight(repo));

            const response = await POST(
                makeRequest({ action: "back-phase" }),
                makeProps(),
            );

            expect(await response.json()).toEqual({
                active: true,
                breakingNews: [],
                components: [],
                turnNumber: 1,
                phase: 2,
                phaseEnd: 120,
            });
        });
    });

    describe("back-turn", () => {
        test("moves to the first phase of the previous turn", async () => {
            const game = makeActiveGame();
            game.turnInformation.turnNumber = 3;
            game.turnInformation.currentPhase = 2;
            const repo = makeFakeGameRepo(game);
            getGameRepo.mockReturnValue(MakeRight(repo));

            const response = await POST(
                makeRequest({ action: "back-turn" }),
                makeProps(),
            );

            expect(await response.json()).toEqual({
                active: true,
                breakingNews: [],
                components: [],
                turnNumber: 2,
                phase: 1,
                phaseEnd: 60,
            });
        });

        test("never goes below turn 1", async () => {
            const repo = makeFakeGameRepo(makeActiveGame());
            getGameRepo.mockReturnValue(MakeRight(repo));

            const response = await POST(
                makeRequest({ action: "back-turn" }),
                makeProps(),
            );

            expect(await response.json()).toEqual({
                active: true,
                breakingNews: [],
                components: [],
                turnNumber: 1,
                phase: 1,
                phaseEnd: 60,
            });
        });
    });

    describe("forward-turn", () => {
        test("moves to the first phase of the next turn", async () => {
            const game = makeActiveGame();
            game.turnInformation.currentPhase = 2;
            const repo = makeFakeGameRepo(game);
            getGameRepo.mockReturnValue(MakeRight(repo));

            const response = await POST(
                makeRequest({ action: "forward-turn" }),
                makeProps(),
            );

            expect(await response.json()).toEqual({
                active: true,
                breakingNews: [],
                components: [],
                turnNumber: 2,
                phase: 1,
                phaseEnd: 60,
            });
        });
    });
});
