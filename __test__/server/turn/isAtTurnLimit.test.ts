import { describe, expect, test } from "@jest/globals";
import { setupInformation, testPhases } from "./helpers";
import { Game } from "@fc/types/types";
import { atTurnLimit, isAtTurnLimit } from "@fc/server/turn";

describe("atTurnLimit", () => {
    const setupWithLimit = {
        ...setupInformation,
        phases: testPhases,
        maxTurns: 3,
    };

    test("no maxTurns set - always false", () => {
        const setup = { ...setupInformation, phases: testPhases };

        for (let turn = 1; turn <= 10; turn++) {
            for (let phase = 1; phase <= testPhases.length; phase++) {
                expect(atTurnLimit(turn, phase, setup)).toBe(false);
            }
        }
    });

    const testCases: {
        name: string;
        turn: number;
        phase: number;
        expected: boolean;
    }[] = [
        {
            name: "below final turn, first phase",
            turn: 1,
            phase: 1,
            expected: false,
        },
        {
            name: "below final turn, last phase",
            turn: 2,
            phase: testPhases.length,
            expected: false,
        },
        {
            name: "final turn, first phase",
            turn: 3,
            phase: 1,
            expected: false,
        },
        {
            name: "final turn, middle phase",
            turn: 3,
            phase: 2,
            expected: false,
        },
        {
            name: "final turn, last phase",
            turn: 3,
            phase: testPhases.length,
            expected: true,
        },
        {
            name: "past final turn, last phase",
            turn: 4,
            phase: testPhases.length,
            expected: true,
        },
    ];

    testCases.forEach(({ name, turn, phase, expected }) => {
        test(`${name} - ${expected}`, () => {
            expect(atTurnLimit(turn, phase, setupWithLimit)).toBe(expected);
        });
    });

    testCases.forEach(({ name, turn, phase, expected }) => {
        test(`isAtTurnLimit: ${name} - ${expected}`, () => {
            const game: Game = {
                _id: "TEST",
                setupInformation: setupWithLimit,
                turnInformation: {
                    turnNumber: turn,
                    currentPhase: phase,
                    phaseEnd: "TEST",
                },
                components: [],
                active: true,
                breakingNews: [],
            };

            expect(isAtTurnLimit(game)).toBe(expected);
        });
    });
});
