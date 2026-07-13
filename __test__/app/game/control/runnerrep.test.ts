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
    typeof import("../../../../src/app/game/[id]/control/api/runnerrep/route");

let POST: RouteModule["POST"];
let getGameRepo: Mock<() => ReturnType<typeof MakeRight<GameRepository>>>;

beforeAll(async () => {
    ({ POST } =
        await import("../../../../src/app/game/[id]/control/api/runnerrep/route"));
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

function runnersComponent(): Game["components"][0] {
    return {
        componentType: "RunningHotRunners",
        rep: {
            G1T: {
                gang: "G33ks",
                reputation: 3,
            },
            Ballet: {
                gang: "Dancers",
                reputation: 1,
            },
        },
    };
}

describe("POST /game/[id]/control/api/runnerrep", () => {
    test("returns a 400 for an invalid body", async () => {
        const response = await POST(
            makeRequest({ runnerName: "G1T" }),
            makeProps(),
        );

        expect(response.status).toBe(400);
        expect(await response.json()).toEqual({ error: "Incorrect request" });
    });

    test("returns a 500 when the repository is not available", async () => {
        getGameRepo.mockReturnValue(MakeLeft("No database") as never);

        const response = await POST(
            makeRequest({ runnerName: "G1T", diff: 1 }),
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
            makeRequest({ runnerName: "G1T", diff: 1 }),
            makeProps(),
        );

        expect(response.status).toBe(404);
        expect(await response.json()).toEqual({ error: "Game not found" });
    });

    test("returns a 500 when the game has no runners component", async () => {
        const repo = makeFakeGameRepo(makeActiveGame());
        getGameRepo.mockReturnValue(MakeRight(repo));

        const response = await POST(
            makeRequest({ runnerName: "G1T", diff: 1 }),
            makeProps(),
        );

        expect(response.status).toBe(500);
        expect(await response.json()).toEqual({
            error: "No RunningHotRunners component component for game test-game",
        });
    });

    test("returns a 500 for an unknown runner", async () => {
        const repo = makeFakeGameRepo(
            makeActiveGame({ components: [runnersComponent()] }),
        );
        getGameRepo.mockReturnValue(MakeRight(repo));

        const response = await POST(
            makeRequest({ runnerName: "Neo", diff: 1 }),
            makeProps(),
        );

        expect(response.status).toBe(500);
        expect(await response.json()).toEqual({
            error: "No Neo runner found for game test-game",
        });
    });

    test("adds reputation to a runner", async () => {
        const repo = makeFakeGameRepo(
            makeActiveGame({ components: [runnersComponent()] }),
        );
        getGameRepo.mockReturnValue(MakeRight(repo));

        const response = await POST(
            makeRequest({ runnerName: "G1T", diff: 2 }),
            makeProps(),
        );

        expect(response.status).toBe(200);

        const body = await response.json();

        expect(body.components[0].rep.G1T.reputation).toBe(5);
        expect(body.components[0].rep.Ballet.reputation).toBe(1);
    });

    test("clamps reputation at 0", async () => {
        const repo = makeFakeGameRepo(
            makeActiveGame({ components: [runnersComponent()] }),
        );
        getGameRepo.mockReturnValue(MakeRight(repo));

        const response = await POST(
            makeRequest({ runnerName: "G1T", diff: -5 }),
            makeProps(),
        );

        const body = await response.json();

        expect(body.components[0].rep.G1T.reputation).toBe(0);
    });

    test("also updates the frozen turn when the game is inactive", async () => {
        const repo = makeFakeGameRepo(
            makeInactiveGame(
                { components: [runnersComponent()] },
                { components: [runnersComponent()] },
            ),
        );
        getGameRepo.mockReturnValue(MakeRight(repo));

        const response = await POST(
            makeRequest({ runnerName: "Ballet", diff: 4 }),
            makeProps(),
        );

        expect(response.status).toBe(200);

        const body = await response.json();

        expect(body.active).toBe(false);
        expect(body.components[0].rep.Ballet.reputation).toBe(5);
    });
});
