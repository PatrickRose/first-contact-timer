import {
    afterEach,
    beforeEach,
    describe,
    expect,
    jest,
    test,
} from "@jest/globals";
import {
    ApiResponse,
    FrozenTurn,
    Game,
    SetupInformation,
} from "@fc/types/types";
import { setupInformation } from "./helpers";
import { toApiResponse, toFrozenTurn } from "@fc/server/turn";

describe("toApiResponse", () => {
    const mockedDate = new Date(2023, 1, 2, 3, 4, 5, 0);
    const phaseEnd = new Date(2023, 1, 2, 3, 4, 10, 0);

    const phases: SetupInformation["phases"] = [
        {
            title: "1",
            length: 1,
            hidden: false,
        },
        {
            title: "2",
            length: 2,
            hidden: false,
        },
        {
            title: "3",
            length: 3,
            hidden: false,
        },
    ];

    const setup: SetupInformation = {
        ...setupInformation,
        phases,
    };

    const baseGame: Game = {
        _id: "test",
        setupInformation: setup,
        components: [],
        active: true,
        breakingNews: [],
        turnInformation: {
            turnNumber: 1,
            currentPhase: 1,
            phaseEnd: phaseEnd.toString(),
        },
    };

    beforeEach(() => {
        jest.useFakeTimers();

        jest.setSystemTime(mockedDate);
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    test("converts game to apiResponse", () => {
        const expected: ApiResponse = {
            active: true,
            breakingNews: [],
            components: [],
            phase: 1,
            phaseEnd: 5,
            turnNumber: 1,
            lastUpdated: 0,
        };

        expect(toApiResponse(baseGame)).toEqual(expected);
    });

    for (let seconds = 10; seconds >= 0; seconds--) {
        test(`phaseEnd changes based on the time (${seconds} seconds left)`, () => {
            jest.setSystemTime(phaseEnd.getTime() - seconds * 1000);

            const expected: ApiResponse = {
                active: true,
                breakingNews: [],
                components: [],
                phase: 1,
                phaseEnd: seconds,
                turnNumber: 1,
                lastUpdated: 0,
            };

            expect(toApiResponse(baseGame)).toEqual(expected);
        });
    }

    for (let seconds = 1; seconds <= 10; seconds++) {
        test(`phaseEnd always returns 0 (${seconds} seconds after)`, () => {
            jest.setSystemTime(phaseEnd.getTime() + seconds * 1000);

            const expected: ApiResponse = {
                active: true,
                breakingNews: [],
                components: [],
                phase: 1,
                phaseEnd: 0,
                turnNumber: 1,
                lastUpdated: 0,
            };

            expect(toApiResponse(baseGame)).toEqual(expected);
        });
    }

    test("sorts breaking news so that newest are first", () => {
        type BreakingNewsType = Game["breakingNews"][0];

        const newest: BreakingNewsType = {
            newsText: "Newest",
            turn: 1,
            phase: 1,
            pressAccount: 1,
            date: new Date(3000).toString(),
        };
        const middle = {
            newsText: "Middle",
            turn: 1,
            phase: 1,
            pressAccount: 1,
            date: new Date(2000).toString(),
        };
        const oldest = {
            newsText: "Oldest",
            turn: 1,
            phase: 1,
            pressAccount: 1,
            date: new Date(1000).toString(),
        };

        const breakingNews: Game["breakingNews"] = [oldest, newest, middle];

        const game = {
            ...baseGame,
            breakingNews,
        };

        const expected: ApiResponse = {
            active: true,
            breakingNews: [newest, middle, oldest],
            components: [],
            phase: 1,
            phaseEnd: 5,
            turnNumber: 1,
            lastUpdated: 0,
        };

        expect(toApiResponse(game)).toEqual(expected);
    });

    test("Inactive turns returns the frozen turn", () => {
        const frozenTurn: FrozenTurn = {
            active: false,
            breakingNews: [],
            components: [],
            phase: 0,
            phaseEnd: 0,
            turnNumber: 0,
        };

        const game: Game = {
            ...baseGame,
            active: false,
            frozenTurn,
        };

        expect(toApiResponse(game)).toEqual({
            ...frozenTurn,
            lastUpdated: 0,
        });
    });

    test("Can force a refresh of an inactive turn", () => {
        const frozenTurn: FrozenTurn = {
            active: false,
            breakingNews: [],
            components: [],
            phase: 0,
            phaseEnd: 0,
            turnNumber: 0,
        };

        const game: Game = {
            ...baseGame,
            breakingNews: [
                {
                    newsText: "News",
                    pressAccount: 1,
                    phase: 1,
                    turn: 1,
                    date: "TEST DATE",
                },
            ],
            components: [
                {
                    componentType: "Weather",
                    weatherMessage: "New Weather",
                },
            ],
            active: false,
            frozenTurn,
        };

        const expected: ApiResponse = {
            active: false,
            breakingNews: game.breakingNews,
            components: game.components,
            phase: 1,
            phaseEnd: 5,
            turnNumber: 1,
            lastUpdated: 0,
        };

        expect(toApiResponse(game, true)).toEqual(expected);
    });

    describe("lastUpdated", () => {
        test("reports 0 for a game with no stamp", () => {
            // Games written before editing existed have no `lastUpdated` at all.
            // They must report a constant, and it must be lower than any real
            // stamp: a game reporting "now" would always look newer than the
            // stamp a client rendered with, so every device would reload forever.
            expect(baseGame.lastUpdated).toBeUndefined();
            expect(toApiResponse(baseGame).lastUpdated).toBe(0);
        });

        test("reports the game's stamp for an active game", () => {
            const game: Game = { ...baseGame, lastUpdated: 1700000000000 };

            expect(toApiResponse(game).lastUpdated).toBe(1700000000000);
        });

        test("overlays the game's stamp onto a paused game's stored snapshot", () => {
            // The load-bearing case. A paused game serves `frozenTurn` verbatim,
            // and that snapshot was written *before* the edit that changed the
            // game - so the stamp has to come from the document, or an edit
            // would be invisible to every paused screen.
            const game: Game = {
                ...baseGame,
                active: false,
                frozenTurn: {
                    active: false,
                    breakingNews: [],
                    components: [],
                    phase: 2,
                    phaseEnd: 42,
                    turnNumber: 3,
                },
                lastUpdated: 1700000000000,
            };

            expect(toApiResponse(game)).toEqual({
                active: false,
                breakingNews: [],
                components: [],
                phase: 2,
                phaseEnd: 42,
                turnNumber: 3,
                lastUpdated: 1700000000000,
            });
        });
    });
});

describe("toFrozenTurn", () => {
    // toFrozenTurn is what gets *persisted*, so it must never carry the
    // document-level stamp - otherwise the stored copy could drift from the
    // document and a paused game would serve a stale one.
    const phaseEnd = new Date(2023, 1, 2, 3, 4, 10, 0);

    const baseGame: Game = {
        _id: "test",
        setupInformation,
        components: [],
        active: true,
        breakingNews: [],
        turnInformation: {
            turnNumber: 1,
            currentPhase: 1,
            phaseEnd: phaseEnd.toString(),
        },
        lastUpdated: 1700000000000,
    };

    beforeEach(() => {
        jest.useFakeTimers();
        jest.setSystemTime(new Date(2023, 1, 2, 3, 4, 5, 0));
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    test("omits lastUpdated even when the game has one", () => {
        const frozen = toFrozenTurn(baseGame);

        expect(Object.hasOwn(frozen, "lastUpdated")).toBe(false);
        expect(frozen).toEqual({
            active: true,
            breakingNews: [],
            components: [],
            phase: 1,
            phaseEnd: 5,
            turnNumber: 1,
        });
    });

    test("returns the stored snapshot verbatim for a paused game", () => {
        const frozenTurn: FrozenTurn = {
            active: false,
            breakingNews: [],
            components: [],
            phase: 0,
            phaseEnd: 0,
            turnNumber: 0,
        };

        const game: Game = { ...baseGame, active: false, frozenTurn };

        expect(toFrozenTurn(game)).toBe(frozenTurn);
    });
});
