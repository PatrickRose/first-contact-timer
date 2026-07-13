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
import { Game } from "@fc/types/types";

jest.mock("@fc/server/repository/game", () => ({
    __esModule: true,
    getGameRepo: jest.fn(),
}));

type RouteModule =
    typeof import("../../../../src/app/game/[id]/control/api/weather/route");

let POST: RouteModule["POST"];
let getGameRepo: Mock<() => ReturnType<typeof MakeRight<GameRepository>>>;

beforeAll(async () => {
    ({ POST } =
        await import("../../../../src/app/game/[id]/control/api/weather/route"));
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

function weatherComponent(): Game["components"][0] {
    return {
        componentType: "Weather",
        weatherMessage: "Sunny",
    };
}

describe("POST /game/[id]/control/api/weather", () => {
    test("returns a 400 for an invalid body", async () => {
        const response = await POST(
            makeRequest({ weather: "Storms" }),
            makeProps(),
        );

        expect(response.status).toBe(400);
        expect(await response.json()).toEqual({ error: "Incorrect request" });
    });

    test("returns a 500 when the repository is not available", async () => {
        getGameRepo.mockReturnValue(MakeLeft("No database") as never);

        const response = await POST(
            makeRequest({ newWeatherMessage: "Storms" }),
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
            makeRequest({ newWeatherMessage: "Storms" }),
            makeProps(),
        );

        expect(response.status).toBe(404);
        expect(await response.json()).toEqual({ error: "Game not found" });
    });

    test("returns a 500 when the game has no weather component", async () => {
        const repo = makeFakeGameRepo(makeActiveGame());
        getGameRepo.mockReturnValue(MakeRight(repo));

        const response = await POST(
            makeRequest({ newWeatherMessage: "Storms" }),
            makeProps(),
        );

        expect(response.status).toBe(500);
        expect(await response.json()).toEqual({
            error: "No weather component for game test-game",
        });
    });

    test("updates the weather message", async () => {
        const repo = makeFakeGameRepo(
            makeActiveGame({ components: [weatherComponent()] }),
        );
        getGameRepo.mockReturnValue(MakeRight(repo));

        const response = await POST(
            makeRequest({ newWeatherMessage: "Storms" }),
            makeProps(),
        );

        expect(response.status).toBe(200);

        const body = await response.json();

        expect(body.components).toEqual([
            {
                componentType: "Weather",
                weatherMessage: "Storms",
            },
        ]);
    });

    test("also updates the frozen turn when the game is inactive", async () => {
        const repo = makeFakeGameRepo(
            makeInactiveGame(
                { components: [weatherComponent()] },
                { components: [weatherComponent()] },
            ),
        );
        getGameRepo.mockReturnValue(MakeRight(repo));

        const response = await POST(
            makeRequest({ newWeatherMessage: "Storms" }),
            makeProps(),
        );

        expect(response.status).toBe(200);

        const body = await response.json();

        expect(body.active).toBe(false);
        expect(body.components[0].weatherMessage).toBe("Storms");
    });
});
