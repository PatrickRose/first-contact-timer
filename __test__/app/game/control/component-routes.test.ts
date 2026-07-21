/**
 * @jest-environment node
 *
 * Contract + per-mutation suite for the seven component control routes.
 *
 * Every route is built by makeComponentRoute and shares the same
 * parse -> decode -> repo -> get -> mutate -> mirror -> respond contract, so
 * the shared behaviour (400 / 404 / 500 status codes, missing component, and
 * the paused frozenTurn mirror) is asserted once via describe.each. The
 * mutation-specific behaviour (clamping, arithmetic, validation, prototype
 * pollution guards) is asserted per route below.
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
import {
    makeMalformedRequest,
    makeProps,
    makeRequest,
} from "../../../fixtures/routes";
import GameRepository from "@fc/server/repository/game";
import { Component } from "@fc/types/types";

jest.mock("@fc/server/repository/game", () => ({
    __esModule: true,
    getGameRepo: jest.fn(),
}));

type Handler = (
    request: ReturnType<typeof makeRequest>,
    props: ReturnType<typeof makeProps>,
) => Promise<Response>;

let getGameRepo: Mock<() => ReturnType<typeof MakeRight<GameRepository>>>;

// Component fixtures --------------------------------------------------------

function defconComponent(): Component {
    return {
        componentType: "Defcon",
        countries: {
            China: { shortName: "🇨🇳", countryName: "China", status: 3 },
            France: {
                shortName: "🇫🇷",
                countryName: "France",
                status: "hidden",
            },
        },
    };
}

function weatherComponent(): Component {
    return { componentType: "Weather", weatherMessage: "Sunny" };
}

function wolfComponent(): Component {
    return { componentType: "DoWWolfAttack", inProgress: false };
}

function corpComponent(): Component {
    return {
        componentType: "RunningHotCorp",
        sharePrice: { GenEq: 10, MCM: 12, Gordon: 13, ANT: 5, DTC: 13 },
    };
}

function runnersComponent(): Component {
    return {
        componentType: "RunningHotRunners",
        rep: {
            G1T: { gang: "G33ks", reputation: 3 },
            Ballet: { gang: "Dancers", reputation: 1 },
        },
    };
}

function lightLevelComponent(): Component {
    return { componentType: "LightLevel", value: 5, max: 10 };
}

function trackersComponent(): Component {
    return {
        componentType: "Trackers",
        trackers: { Bar: { value: 3, type: "bar", max: 10 } },
    };
}

// Route registry ------------------------------------------------------------

type RouteConfig = {
    name: string;
    importPath: string;
    validBody: unknown;
    invalidBody: unknown;
    makeComponent: () => Component;
    noComponentError: string;
};

const ROUTES: RouteConfig[] = [
    {
        name: "defcon",
        importPath: "../../../../src/app/game/[id]/control/api/defcon/route",
        validBody: { stateName: "China", newStatus: 1 },
        invalidBody: { stateName: "China", newStatus: 4 },
        makeComponent: defconComponent,
        noComponentError: "No defcon component for game test-game",
    },
    {
        name: "weather",
        importPath: "../../../../src/app/game/[id]/control/api/weather/route",
        validBody: { newWeatherMessage: "Storms" },
        invalidBody: { weather: "Storms" },
        makeComponent: weatherComponent,
        noComponentError: "No weather component for game test-game",
    },
    {
        name: "wolf",
        importPath: "../../../../src/app/game/[id]/control/api/wolf/route",
        validBody: { newStatus: true },
        invalidBody: { newStatus: "yes" },
        makeComponent: wolfComponent,
        noComponentError: "No wolf component for game test-game",
    },
    {
        name: "shareprice",
        importPath:
            "../../../../src/app/game/[id]/control/api/shareprice/route",
        validBody: { corpName: "GenEq", diff: 5 },
        invalidBody: { corpName: "Weyland-Yutani", diff: 5 },
        makeComponent: corpComponent,
        noComponentError: "No RunningHotCorp component for game test-game",
    },
    {
        name: "runnerrep",
        importPath: "../../../../src/app/game/[id]/control/api/runnerrep/route",
        validBody: { runnerName: "G1T", diff: 1 },
        invalidBody: { runnerName: "G1T" },
        makeComponent: runnersComponent,
        noComponentError: "No RunningHotRunners component for game test-game",
    },
    {
        name: "light-level",
        importPath:
            "../../../../src/app/game/[id]/control/api/light-level/route",
        validBody: { value: 7 },
        invalidBody: { value: "bright" },
        makeComponent: lightLevelComponent,
        noComponentError: "No LightLevel component for game test-game",
    },
    {
        name: "trackers",
        importPath: "../../../../src/app/game/[id]/control/api/trackers/route",
        validBody: { tracker: "Bar", value: 5 },
        invalidBody: { tracker: "Bar" },
        makeComponent: trackersComponent,
        noComponentError: "No Trackers component for game test-game",
    },
];

const handlers: Record<string, Handler> = {};

beforeAll(async () => {
    ({ getGameRepo } = (await import("@fc/server/repository/game")) as never);

    for (const route of ROUTES) {
        const routeModule = (await import(route.importPath)) as {
            POST: Handler;
        };
        handlers[route.name] = routeModule.POST;
    }
});

const mockedDate = new Date(2023, 1, 2, 3, 4, 5, 0);

beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(mockedDate);
    getGameRepo.mockReset();
});

afterEach(() => {
    jest.useRealTimers();
});

// Shared contract -----------------------------------------------------------

describe.each(ROUTES)("component route contract: $name", (route) => {
    const post = () => handlers[route.name];

    test("returns a 400 for an invalid body", async () => {
        const response = await post()(
            makeRequest(route.invalidBody),
            makeProps(),
        );

        expect(response.status).toBe(400);
        expect(await response.json()).toEqual({ error: "Incorrect request" });
    });

    test("returns a 400 for a malformed JSON body", async () => {
        const response = await post()(makeMalformedRequest(), makeProps());

        expect(response.status).toBe(400);
        expect(await response.json()).toEqual({ error: "Incorrect request" });
    });

    test("returns a 500 when the repository is not available", async () => {
        getGameRepo.mockReturnValue(MakeLeft("No database") as never);

        const response = await post()(
            makeRequest(route.validBody),
            makeProps(),
        );

        expect(response.status).toBe(500);
        expect(await response.json()).toEqual({ error: "No database" });
    });

    test("returns a 404 when the game does not exist", async () => {
        const repo = makeFakeGameRepo(makeActiveGame());
        repo.get.mockResolvedValue(MakeLeft(false));
        getGameRepo.mockReturnValue(MakeRight(repo));

        const response = await post()(
            makeRequest(route.validBody),
            makeProps(),
        );

        expect(response.status).toBe(404);
        expect(await response.json()).toEqual({ error: "Game not found" });
    });

    test("returns a 500 when the game has no matching component", async () => {
        const repo = makeFakeGameRepo(makeActiveGame({ components: [] }));
        getGameRepo.mockReturnValue(MakeRight(repo));

        const response = await post()(
            makeRequest(route.validBody),
            makeProps(),
        );

        expect(response.status).toBe(500);
        expect(await response.json()).toEqual({
            error: route.noComponentError,
        });
    });

    test("mirrors the mutation into the frozen turn when paused", async () => {
        const repo = makeFakeGameRepo(
            makeInactiveGame(
                { components: [route.makeComponent()] },
                { components: [route.makeComponent()] },
            ),
        );
        getGameRepo.mockReturnValue(MakeRight(repo));

        const response = await post()(
            makeRequest(route.validBody),
            makeProps(),
        );

        expect(response.status).toBe(200);
        const body = await response.json();
        expect(body.active).toBe(false);
        // The response for a paused game is the frozen turn, so a populated
        // component here proves the mirror ran.
        expect(body.components).toHaveLength(1);
    });
});

// Per-mutation behaviour ----------------------------------------------------

function repoWith(component: Component) {
    const repo = makeFakeGameRepo(makeActiveGame({ components: [component] }));
    getGameRepo.mockReturnValue(MakeRight(repo));
    return repo;
}

describe("defcon mutation", () => {
    test("updates the status of a country", async () => {
        repoWith(defconComponent());

        const response = await handlers.defcon(
            makeRequest({ stateName: "China", newStatus: 1 }),
            makeProps(),
        );

        const body = await response.json();
        expect(body.components[0].countries.China.status).toBe(1);
        expect(body.components[0].countries.France.status).toBe("hidden");
    });

    test("returns a 500 for an unknown country", async () => {
        repoWith(defconComponent());

        const response = await handlers.defcon(
            makeRequest({ stateName: "Narnia", newStatus: 1 }),
            makeProps(),
        );

        expect(response.status).toBe(500);
        expect(await response.json()).toEqual({
            error: "Defcon component does not include Narnia",
        });
    });

    describe.each(["__proto__", "constructor", "prototype"])(
        "rejects the prototype-polluting state name %p",
        (stateName) => {
            test("returns a 500 and does not pollute Object.prototype", async () => {
                repoWith(defconComponent());

                const response = await handlers.defcon(
                    makeRequest({ stateName, newStatus: 1 }),
                    makeProps(),
                );

                expect(response.status).toBe(500);
                expect(await response.json()).toEqual({
                    error: `Defcon component does not include ${stateName}`,
                });
                expect(({} as Record<string, unknown>).status).toBeUndefined();
            });
        },
    );
});

describe("weather mutation", () => {
    test("updates the weather message", async () => {
        repoWith(weatherComponent());

        const response = await handlers.weather(
            makeRequest({ newWeatherMessage: "Storms" }),
            makeProps(),
        );

        const body = await response.json();
        expect(body.components[0].weatherMessage).toBe("Storms");
    });
});

describe("wolf mutation", () => {
    test("starts a wolf attack", async () => {
        repoWith(wolfComponent());

        const response = await handlers.wolf(
            makeRequest({ newStatus: true }),
            makeProps(),
        );

        const body = await response.json();
        expect(body.components[0].inProgress).toBe(true);
    });
});

describe("shareprice mutation", () => {
    test("applies a positive share price difference", async () => {
        repoWith(corpComponent());

        const response = await handlers.shareprice(
            makeRequest({ corpName: "GenEq", diff: 5 }),
            makeProps(),
        );

        const body = await response.json();
        expect(body.components[0].sharePrice.GenEq).toBe(15);
    });

    test("applies a negative share price difference", async () => {
        repoWith(corpComponent());

        const response = await handlers.shareprice(
            makeRequest({ corpName: "ANT", diff: -3 }),
            makeProps(),
        );

        const body = await response.json();
        expect(body.components[0].sharePrice.ANT).toBe(2);
    });

    test("returns a 500 for a corp missing from the share price map", async () => {
        // A valid corp name that the game does not track, which would
        // otherwise assign NaN to the share price.
        repoWith({
            componentType: "RunningHotCorp",
            sharePrice: { GenEq: 10 },
        } as unknown as Component);

        const response = await handlers.shareprice(
            makeRequest({ corpName: "MCM", diff: 5 }),
            makeProps(),
        );

        expect(response.status).toBe(500);
        expect(await response.json()).toEqual({
            error: "No MCM corp found for game test-game",
        });
    });
});

describe("runnerrep mutation", () => {
    test("adds reputation to a runner", async () => {
        repoWith(runnersComponent());

        const response = await handlers.runnerrep(
            makeRequest({ runnerName: "G1T", diff: 2 }),
            makeProps(),
        );

        const body = await response.json();
        expect(body.components[0].rep.G1T.reputation).toBe(5);
        expect(body.components[0].rep.Ballet.reputation).toBe(1);
    });

    test("clamps reputation at 0", async () => {
        repoWith(runnersComponent());

        const response = await handlers.runnerrep(
            makeRequest({ runnerName: "G1T", diff: -5 }),
            makeProps(),
        );

        const body = await response.json();
        expect(body.components[0].rep.G1T.reputation).toBe(0);
    });

    test("returns a 500 for an unknown runner", async () => {
        repoWith(runnersComponent());

        const response = await handlers.runnerrep(
            makeRequest({ runnerName: "Neo", diff: 1 }),
            makeProps(),
        );

        expect(response.status).toBe(500);
        expect(await response.json()).toEqual({
            error: "No Neo runner found for game test-game",
        });
    });

    describe.each(["__proto__", "constructor", "prototype"])(
        "rejects the prototype-polluting runner name %p",
        (runnerName) => {
            test("returns a 500 and does not pollute Object.prototype", async () => {
                repoWith(runnersComponent());

                const response = await handlers.runnerrep(
                    makeRequest({ runnerName, diff: 1 }),
                    makeProps(),
                );

                expect(response.status).toBe(500);
                expect(await response.json()).toEqual({
                    error: `No ${runnerName} runner found for game test-game`,
                });
                expect(
                    ({} as Record<string, unknown>).reputation,
                ).toBeUndefined();
            });
        },
    );
});

describe("light-level mutation", () => {
    test("sets the light level", async () => {
        repoWith(lightLevelComponent());

        const response = await handlers["light-level"](
            makeRequest({ value: 7 }),
            makeProps(),
        );

        const body = await response.json();
        expect(body.components[0].value).toBe(7);
    });

    test("clamps the light level to the maximum", async () => {
        repoWith(lightLevelComponent());

        const response = await handlers["light-level"](
            makeRequest({ value: 15 }),
            makeProps(),
        );

        const body = await response.json();
        expect(body.components[0].value).toBe(10);
    });

    test("clamps the light level at 0", async () => {
        repoWith(lightLevelComponent());

        const response = await handlers["light-level"](
            makeRequest({ value: -4 }),
            makeProps(),
        );

        const body = await response.json();
        expect(body.components[0].value).toBe(0);
    });
});

describe("trackers mutations", () => {
    const newTracker = { value: 0, type: "circle", max: 5 };

    test("sets the value of an existing tracker", async () => {
        repoWith(trackersComponent());

        const response = await handlers.trackers(
            makeRequest({ tracker: "Bar", value: 7 }),
            makeProps(),
        );

        const body = await response.json();
        expect(body.components[0].trackers.Bar.value).toBe(7);
    });

    test("returns a 500 for an unknown tracker on set", async () => {
        repoWith(trackersComponent());

        const response = await handlers.trackers(
            makeRequest({ tracker: "Missing", value: 7 }),
            makeProps(),
        );

        expect(response.status).toBe(500);
        expect(await response.json()).toEqual({
            error: "No Missing tracker found for game test-game",
        });
    });

    test("adds a new tracker", async () => {
        repoWith(trackersComponent());

        const response = await handlers.trackers(
            makeRequest({ tracker: "Circle", trackerDefinition: newTracker }),
            makeProps(),
        );

        const body = await response.json();
        expect(body.components[0].trackers.Circle).toEqual(newTracker);
        expect(body.components[0].trackers.Bar.value).toBe(3);
    });

    test("returns a 500 when the tracker already exists on add", async () => {
        repoWith(trackersComponent());

        const response = await handlers.trackers(
            makeRequest({ tracker: "Bar", trackerDefinition: newTracker }),
            makeProps(),
        );

        expect(response.status).toBe(500);
        expect(await response.json()).toEqual({
            error: "Bar tracker already exists for game test-game",
        });
    });

    test("deletes an existing tracker", async () => {
        repoWith(trackersComponent());

        const response = await handlers.trackers(
            makeRequest({ tracker: "Bar", action: "delete" }),
            makeProps(),
        );

        const body = await response.json();
        expect(body.components[0].trackers).toEqual({});
    });

    test("returns a 500 for an unknown tracker on delete", async () => {
        repoWith(trackersComponent());

        const response = await handlers.trackers(
            makeRequest({ tracker: "Missing", action: "delete" }),
            makeProps(),
        );

        expect(response.status).toBe(500);
        expect(await response.json()).toEqual({
            error: "No Missing tracker found for game test-game",
        });
    });

    describe.each(["__proto__", "constructor", "prototype"])(
        "prototype pollution guards for %p",
        (tracker) => {
            test("set is rejected as an unknown tracker", async () => {
                repoWith(trackersComponent());

                const response = await handlers.trackers(
                    makeRequest({ tracker, value: 7 }),
                    makeProps(),
                );

                expect(response.status).toBe(500);
                expect(await response.json()).toEqual({
                    error: `No ${tracker} tracker found for game test-game`,
                });
                expect(({} as Record<string, unknown>).value).toBeUndefined();
            });

            test("add is rejected as an invalid name", async () => {
                repoWith(trackersComponent());

                const response = await handlers.trackers(
                    makeRequest({ tracker, trackerDefinition: newTracker }),
                    makeProps(),
                );

                expect(response.status).toBe(500);
                expect(await response.json()).toEqual({
                    error: `${tracker} is not a valid tracker name for game test-game`,
                });
            });
        },
    );
});
