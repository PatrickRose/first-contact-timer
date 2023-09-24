import {
    afterEach,
    beforeEach,
    describe,
    expect,
    jest,
    test,
} from "@jest/globals";
import { ApiResponse, Game, SetupInformation } from "@fc/types/types";
import { setupInformation } from "./helpers";
import { toApiResponse } from "@fc/server/turn";

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
        };

        expect(toApiResponse(game)).toEqual(expected);
    });

    test("Inactive turns returns the frozen turn", () => {
        const frozenTurn: ApiResponse = {
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

        expect(toApiResponse(game)).toEqual(frozenTurn);
    });

    test("Can force a refresh of an inactive turn", () => {
        const frozenTurn: ApiResponse = {
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
        };

        expect(toApiResponse(game, true)).toEqual(expected);
    });
});
