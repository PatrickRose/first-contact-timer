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
    typeof import("../../../../src/app/game/[id]/control/api/trackers/route");

let POST: RouteModule["POST"];
let getGameRepo: Mock<() => ReturnType<typeof MakeRight<GameRepository>>>;

beforeAll(async () => {
    ({ POST } =
        await import("../../../../src/app/game/[id]/control/api/trackers/route"));
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

function trackersComponent(): Game["components"][0] {
    return {
        componentType: "Trackers",
        trackers: {
            Bar: {
                value: 3,
                type: "bar",
                max: 10,
            },
        },
    };
}

describe("POST /game/[id]/control/api/trackers", () => {
    test("returns a 400 for an invalid body", async () => {
        const repo = makeFakeGameRepo(
            makeActiveGame({ components: [trackersComponent()] }),
        );
        getGameRepo.mockReturnValue(MakeRight(repo));

        const response = await POST(
            makeRequest({ tracker: "Bar" }),
            makeProps(),
        );

        expect(response.status).toBe(400);
        expect(await response.json()).toEqual({ error: "Incorrect request" });
    });

    test("returns a 500 when the repository is not available", async () => {
        getGameRepo.mockReturnValue(MakeLeft("No database") as never);

        const response = await POST(
            makeRequest({ tracker: "Bar", value: 5 }),
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
            makeRequest({ tracker: "Bar", value: 5 }),
            makeProps(),
        );

        expect(response.status).toBe(404);
        expect(await response.json()).toEqual({ error: "Game not found" });
    });

    describe("setting a tracker", () => {
        test("sets the value of an existing tracker", async () => {
            const repo = makeFakeGameRepo(
                makeActiveGame({ components: [trackersComponent()] }),
            );
            getGameRepo.mockReturnValue(MakeRight(repo));

            const response = await POST(
                makeRequest({ tracker: "Bar", value: 7 }),
                makeProps(),
            );

            expect(response.status).toBe(200);

            const body = await response.json();

            expect(body.components[0].trackers.Bar.value).toBe(7);
        });

        test("returns a 500 for an unknown tracker", async () => {
            const repo = makeFakeGameRepo(
                makeActiveGame({ components: [trackersComponent()] }),
            );
            getGameRepo.mockReturnValue(MakeRight(repo));

            const response = await POST(
                makeRequest({ tracker: "Missing", value: 7 }),
                makeProps(),
            );

            expect(response.status).toBe(500);
            expect(await response.json()).toEqual({
                error: "No Missing tracker found for game test-game",
            });
        });

        test("returns a 500 when the game has no trackers component", async () => {
            const repo = makeFakeGameRepo(makeActiveGame());
            getGameRepo.mockReturnValue(MakeRight(repo));

            const response = await POST(
                makeRequest({ tracker: "Bar", value: 7 }),
                makeProps(),
            );

            expect(response.status).toBe(500);
            expect(await response.json()).toEqual({
                error: "No Trackers component component for game test-game",
            });
        });

        test("also updates the frozen turn when the game is inactive", async () => {
            const repo = makeFakeGameRepo(
                makeInactiveGame(
                    { components: [trackersComponent()] },
                    { components: [trackersComponent()] },
                ),
            );
            getGameRepo.mockReturnValue(MakeRight(repo));

            const response = await POST(
                makeRequest({ tracker: "Bar", value: 9 }),
                makeProps(),
            );

            const body = await response.json();

            expect(body.active).toBe(false);
            expect(body.components[0].trackers.Bar.value).toBe(9);
        });
    });

    describe("adding a tracker", () => {
        const newTracker = {
            value: 0,
            type: "circle",
            max: 5,
        };

        test("adds a new tracker", async () => {
            const repo = makeFakeGameRepo(
                makeActiveGame({ components: [trackersComponent()] }),
            );
            getGameRepo.mockReturnValue(MakeRight(repo));

            const response = await POST(
                makeRequest({
                    tracker: "Circle",
                    trackerDefinition: newTracker,
                }),
                makeProps(),
            );

            expect(response.status).toBe(200);

            const body = await response.json();

            expect(body.components[0].trackers).toEqual({
                Bar: {
                    value: 3,
                    type: "bar",
                    max: 10,
                },
                Circle: newTracker,
            });
        });

        test("returns a 500 when the tracker already exists", async () => {
            const repo = makeFakeGameRepo(
                makeActiveGame({ components: [trackersComponent()] }),
            );
            getGameRepo.mockReturnValue(MakeRight(repo));

            const response = await POST(
                makeRequest({ tracker: "Bar", trackerDefinition: newTracker }),
                makeProps(),
            );

            expect(response.status).toBe(500);
            expect(await response.json()).toEqual({
                error: "Bar tracker already exists for game test-game",
            });
        });

        test("also updates the frozen turn when the game is inactive", async () => {
            const repo = makeFakeGameRepo(
                makeInactiveGame(
                    { components: [trackersComponent()] },
                    { components: [trackersComponent()] },
                ),
            );
            getGameRepo.mockReturnValue(MakeRight(repo));

            const response = await POST(
                makeRequest({
                    tracker: "Circle",
                    trackerDefinition: newTracker,
                }),
                makeProps(),
            );

            const body = await response.json();

            expect(body.active).toBe(false);
            expect(body.components[0].trackers.Circle).toEqual(newTracker);
        });
    });

    describe("deleting a tracker", () => {
        test("deletes an existing tracker", async () => {
            const repo = makeFakeGameRepo(
                makeActiveGame({ components: [trackersComponent()] }),
            );
            getGameRepo.mockReturnValue(MakeRight(repo));

            const response = await POST(
                makeRequest({ tracker: "Bar", action: "delete" }),
                makeProps(),
            );

            expect(response.status).toBe(200);

            const body = await response.json();

            expect(body.components[0].trackers).toEqual({});
        });

        test("returns a 500 for an unknown tracker", async () => {
            const repo = makeFakeGameRepo(
                makeActiveGame({ components: [trackersComponent()] }),
            );
            getGameRepo.mockReturnValue(MakeRight(repo));

            const response = await POST(
                makeRequest({ tracker: "Missing", action: "delete" }),
                makeProps(),
            );

            expect(response.status).toBe(500);
            expect(await response.json()).toEqual({
                error: "No Missing tracker found for game test-game",
            });
        });

        test("also updates the frozen turn when the game is inactive", async () => {
            const repo = makeFakeGameRepo(
                makeInactiveGame(
                    { components: [trackersComponent()] },
                    { components: [trackersComponent()] },
                ),
            );
            getGameRepo.mockReturnValue(MakeRight(repo));

            const response = await POST(
                makeRequest({ tracker: "Bar", action: "delete" }),
                makeProps(),
            );

            const body = await response.json();

            expect(body.active).toBe(false);
            expect(body.components[0].trackers).toEqual({});
        });
    });
});
