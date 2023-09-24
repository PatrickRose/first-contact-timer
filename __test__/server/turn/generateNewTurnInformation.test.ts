import {
    afterEach,
    beforeEach,
    describe,
    expect,
    jest,
    test,
} from "@jest/globals";
import { phases, setupInformation, testPhases } from "./helpers";
import { generateNewTurnInformation } from "@fc/server/turn";
import { isLeft } from "fp-ts/Either";
import { Game } from "@fc/types/types";

describe("generateNewTurnInformation", () => {
    const mockCurrentDate = new Date(2023, 1, 15, 0, 0, 0, 0);

    beforeEach(() => {
        jest.useFakeTimers();
        jest.setSystemTime(mockCurrentDate);
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    test("Unknown phase returns error message", () => {
        let result = generateNewTurnInformation(1, 1, setupInformation);

        expect(isLeft(result)).toBe(true);
    });

    testPhases.forEach((phase, index) => {
        test(`Index ${index + 1} should return a date ${
            phase.length
        } minutes in the future`, () => {
            let result = generateNewTurnInformation(index + 1, 1, {
                ...setupInformation,
                phases: testPhases,
            });

            expect(isLeft(result)).toBe(false);
            if (isLeft(result)) {
                return;
            }

            const expected: Game["turnInformation"] = {
                turnNumber: 1,
                currentPhase: index + 1,
                phaseEnd: new Date(
                    mockCurrentDate.getTime() + phase.length * 60 * 1000,
                ).toString(),
            };

            expect(result.right).toEqual(expected);
        });
    });

    [
        [1, 1],
        [2, 2],
        [3, 1],
        [4, 5],
        [5, 1],
    ].forEach(([turnNumber, length]) => {
        test(`Turn ${turnNumber} should return ${length} minutes in the future`, () => {
            let result = generateNewTurnInformation(1, turnNumber, {
                ...setupInformation,
                phases,
            });

            expect(isLeft(result)).toBe(false);
            if (isLeft(result)) {
                return;
            }

            const expected: Game["turnInformation"] = {
                turnNumber: turnNumber,
                currentPhase: 1,
                phaseEnd: new Date(
                    mockCurrentDate.getTime() + length * 60 * 1000,
                ).toString(),
            };

            expect(result.right).toEqual(expected);
        });
    });
});
