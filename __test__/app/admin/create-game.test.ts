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
import { makeActiveGame, makeFakeGameRepo } from "../../fixtures/game";
import { makeRequest } from "../../fixtures/routes";
import GameRepository from "@fc/server/repository/game";
import { Game, GameType } from "@fc/types/types";

jest.mock("@fc/server/repository/game", () => ({
    __esModule: true,
    getGameRepo: jest.fn(),
}));

type RouteModule =
    typeof import("../../../src/app/admin/game/create/api/route");

let POST: RouteModule["POST"];
let getGameRepo: Mock<() => ReturnType<typeof MakeRight<GameRepository>>>;

beforeAll(async () => {
    ({ POST } = await import("../../../src/app/admin/game/create/api/route"));
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

const ALL_GAME_TYPES: GameType[] = [
    "first-contact",
    "aftermath",
    "wts-1970",
    "dow",
    "dow-new-eden",
    "running-hot",
    "AYNOHYEB",
    "DeedsAndDestiny",
    "faes-anatomy",
    "dead-britannia",
    "dev-test-game",
    "touched-by-darkness",
];

describe("POST /admin/game/create/api", () => {
    test("returns a 400 for an unknown game type", async () => {
        const response = await POST(
            makeRequest({ gameID: "new-game", type: "monopoly" }),
        );

        expect(response.status).toBe(400);
        expect(await response.json()).toEqual({
            result: false,
            errors: ["Incorrect request"],
        });
    });

    test("returns a 500 when the repository is not available", async () => {
        getGameRepo.mockReturnValue(MakeLeft("No database") as never);

        const response = await POST(
            makeRequest({ gameID: "new-game", type: "dow" }),
        );

        expect(response.status).toBe(500);
        expect(await response.json()).toEqual({
            result: false,
            errors: ["Couldn't get the games repo", "No database"],
        });
    });

    test("returns a 500 when inserting the game fails", async () => {
        const repo = makeFakeGameRepo(makeActiveGame());
        repo.insert.mockResolvedValue(MakeLeft("Insert failed"));
        getGameRepo.mockReturnValue(MakeRight(repo));

        const response = await POST(
            makeRequest({ gameID: "new-game", type: "dow" }),
        );

        expect(response.status).toBe(500);
        expect(await response.json()).toEqual({
            result: false,
            errors: ["Failed to insert game", "Insert failed"],
        });
    });

    test("creates a Den of Wolves game", async () => {
        const repo = makeFakeGameRepo(makeActiveGame());
        getGameRepo.mockReturnValue(MakeRight(repo));

        const response = await POST(
            makeRequest({ gameID: "new-game", type: "dow" }),
        );

        expect(response.status).toBe(200);
        expect(await response.json()).toEqual({ result: true });

        // The first phase (Action Phase) is 18 minutes long
        const expectedPhaseEnd = new Date(2023, 1, 2, 3, 22, 5, 0);
        const expectedComponents: Game["components"] = [
            {
                componentType: "DoWWolfAttack",
                inProgress: false,
            },
        ];

        expect(repo.insert).toHaveBeenCalledWith({
            _id: "new-game",
            active: false,
            breakingNews: [],
            components: expectedComponents,
            setupInformation: expect.objectContaining({
                gameName: "Den of Wolves",
                theme: "first-contact",
                press: {
                    name: "INC",
                    logo: "/inc.png",
                },
            }),
            turnInformation: {
                turnNumber: 1,
                currentPhase: 1,
                phaseEnd: expectedPhaseEnd.toString(),
            },
            frozenTurn: {
                active: false,
                breakingNews: [],
                components: expectedComponents,
                turnNumber: 1,
                phase: 1,
                phaseEnd: 18 * 60,
            },
        });
    });

    describe("creates every game type", () => {
        ALL_GAME_TYPES.forEach((type) => {
            test(`creates a ${type} game`, async () => {
                const repo = makeFakeGameRepo(makeActiveGame());
                getGameRepo.mockReturnValue(MakeRight(repo));

                const response = await POST(
                    makeRequest({ gameID: `${type}-game`, type }),
                );

                expect(response.status).toBe(200);
                expect(await response.json()).toEqual({ result: true });
                expect(repo.insert).toHaveBeenCalledWith(
                    expect.objectContaining({
                        _id: `${type}-game`,
                        active: false,
                        turnInformation: expect.objectContaining({
                            turnNumber: 1,
                            currentPhase: 1,
                        }),
                    }),
                );
            });
        });
    });
});
