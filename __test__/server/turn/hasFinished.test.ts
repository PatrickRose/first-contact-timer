import {
    afterEach,
    beforeEach,
    describe,
    expect,
    jest,
    test,
} from "@jest/globals";
import { Game } from "@fc/types/types";
import { hasFinished } from "@fc/server/turn";

describe("hasfinished", () => {
    const mockCurrentDate = new Date(2023, 1, 15, 0, 0, 0, 0);

    beforeEach(() => {
        jest.useFakeTimers();
        jest.setSystemTime(mockCurrentDate);
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    const baseGame: Game = {
        _id: "TEST",
        turnInformation: {
            currentPhase: 1,
            phaseEnd: "TO BE REPLACED",
            turnNumber: 1,
        },
        setupInformation: {
            phases: [],
            breakingNewsBanner: false,
            components: [],
            theme: "first-contact",
            gameName: "TEST",
        },
        breakingNews: [],
        components: [],
        active: true,
    };

    const testCases: { name: string; difference: number; expected: boolean }[] =
        [
            {
                name: "Date 1 second in future",
                difference: 1,
                expected: false,
            },
            {
                name: "Date 10 second in future",
                difference: 10,
                expected: false,
            },
            {
                name: "Date 20 second in future",
                difference: 20,
                expected: false,
            },
            {
                name: "Date 1 second in past",
                difference: -1,
                expected: true,
            },
            {
                name: "Date 10 second in past",
                difference: -10,
                expected: true,
            },
            {
                name: "Date 20 second in past",
                difference: -20,
                expected: true,
            },
            {
                name: "Date is the same as now",
                difference: 0,
                expected: false,
            },
        ];

    testCases.forEach(({ name, difference, expected }) => {
        test(`${name} - ${expected}`, () => {
            const newDate = new Date(
                mockCurrentDate.getTime() + difference * 1000,
            );
            const game = { ...baseGame };
            game.turnInformation.phaseEnd = newDate.toString();

            expect(hasFinished(game)).toBe(expected);
        });
    });

    testCases.forEach(({ name, difference, expected }) => {
        test(`${name} - when inactive forced to false`, () => {
            const newDate = new Date(
                mockCurrentDate.getTime() + difference * 1000,
            );
            const game: Game = {
                ...baseGame,
                active: false,
                frozenTurn: {
                    turnNumber: 1,
                    active: false,
                    components: [],
                    phaseEnd: 1,
                    breakingNews: [],
                    phase: 1,
                },
            };
            game.turnInformation.phaseEnd = newDate.toString();

            expect(hasFinished(game)).toBe(false);
        });
    });
});
