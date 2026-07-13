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
import { DefconComponent } from "@fc/types/types";

jest.mock("@fc/server/repository/game", () => ({
    __esModule: true,
    getGameRepo: jest.fn(),
}));

type RouteModule =
    typeof import("../../../../src/app/game/[id]/control/api/defcon/route");

let POST: RouteModule["POST"];
let getGameRepo: Mock<() => ReturnType<typeof MakeRight<GameRepository>>>;

beforeAll(async () => {
    ({ POST } =
        await import("../../../../src/app/game/[id]/control/api/defcon/route"));
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

function defconComponent(): DefconComponent {
    return {
        componentType: "Defcon",
        countries: {
            China: {
                shortName: "🇨🇳",
                countryName: "China",
                status: 3,
            },
            France: {
                shortName: "🇫🇷",
                countryName: "France",
                status: "hidden",
            },
        },
    };
}

describe("POST /game/[id]/control/api/defcon", () => {
    test("returns a 400 for an invalid body", async () => {
        const response = await POST(
            makeRequest({ stateName: "China", newStatus: 4 }),
            makeProps(),
        );

        expect(response.status).toBe(400);
        expect(await response.json()).toEqual({ error: "Incorrect request" });
    });

    test("returns a 500 when the repository is not available", async () => {
        getGameRepo.mockReturnValue(MakeLeft("No database") as never);

        const response = await POST(
            makeRequest({ stateName: "China", newStatus: 1 }),
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
            makeRequest({ stateName: "China", newStatus: 1 }),
            makeProps(),
        );

        expect(response.status).toBe(404);
        expect(await response.json()).toEqual({ error: "Game not found" });
    });

    test("returns a 500 when the game has no defcon component", async () => {
        const repo = makeFakeGameRepo(makeActiveGame());
        getGameRepo.mockReturnValue(MakeRight(repo));

        const response = await POST(
            makeRequest({ stateName: "China", newStatus: 1 }),
            makeProps(),
        );

        expect(response.status).toBe(500);
        expect(await response.json()).toEqual({
            error: "No defcon component for game test-game",
        });
    });

    test("returns a 500 for an unknown country", async () => {
        const repo = makeFakeGameRepo(
            makeActiveGame({ components: [defconComponent()] }),
        );
        getGameRepo.mockReturnValue(MakeRight(repo));

        const response = await POST(
            makeRequest({ stateName: "Narnia", newStatus: 1 }),
            makeProps(),
        );

        expect(response.status).toBe(500);
        expect(await response.json()).toEqual({
            error: "Defcon component does not include Narnia",
        });
    });

    test("updates the status of a country", async () => {
        const repo = makeFakeGameRepo(
            makeActiveGame({ components: [defconComponent()] }),
        );
        getGameRepo.mockReturnValue(MakeRight(repo));

        const response = await POST(
            makeRequest({ stateName: "China", newStatus: 1 }),
            makeProps(),
        );

        expect(response.status).toBe(200);

        const body = await response.json();

        expect(body.components).toEqual([
            {
                componentType: "Defcon",
                countries: {
                    China: {
                        shortName: "🇨🇳",
                        countryName: "China",
                        status: 1,
                    },
                    France: {
                        shortName: "🇫🇷",
                        countryName: "France",
                        status: "hidden",
                    },
                },
            },
        ]);
    });

    test("also updates the frozen turn when the game is inactive", async () => {
        const repo = makeFakeGameRepo(
            makeInactiveGame(
                { components: [defconComponent()] },
                { components: [defconComponent()] },
            ),
        );
        getGameRepo.mockReturnValue(MakeRight(repo));

        const response = await POST(
            makeRequest({ stateName: "China", newStatus: 2 }),
            makeProps(),
        );

        expect(response.status).toBe(200);

        // The response is the frozen turn, whose copy of the component must
        // have been updated too
        const body = await response.json();

        expect(body.active).toBe(false);
        expect(body.components[0].countries.China.status).toBe(2);
    });
});
