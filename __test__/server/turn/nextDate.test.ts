import {
    afterEach,
    beforeEach,
    describe,
    expect,
    test,
    jest,
} from "@jest/globals";
import { isLeft } from "fp-ts/Either";
import { nextDate } from "@fc/server/turn";
import { phases, setupInformation, testPhases } from "./helpers";

describe("nextDate", () => {
    const mockCurrentDate = new Date(2023, 1, 15, 0, 0, 0, 0);

    beforeEach(() => {
        jest.useFakeTimers();
        jest.setSystemTime(mockCurrentDate);
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    test("Unknown phase returns error message", () => {
        let result = nextDate(1, 1, setupInformation);

        expect(isLeft(result)).toBe(true);
    });

    testPhases.forEach((phase, index) => {
        test(`Index ${index + 1} should return a date ${
            phase.length
        } minutes in the future`, () => {
            let result = nextDate(index + 1, 1, {
                ...setupInformation,
                phases: testPhases,
            });

            expect(isLeft(result)).toBe(false);
            if (isLeft(result)) {
                return;
            }

            expect(result.right.getTime() - mockCurrentDate.getTime()).toEqual(
                phase.length * 60 * 1000,
            );
        });
    });

    [
        [1, 1],
        [2, 2],
        [3, 1],
        [4, 5],
        [5, 1],
    ].forEach(([turnNumber, expected]) => {
        test(`Turn ${turnNumber} should return ${expected} minutes in the future`, () => {
            let result = nextDate(1, turnNumber, {
                ...setupInformation,
                phases,
            });

            expect(isLeft(result)).toBe(false);
            if (isLeft(result)) {
                return;
            }

            expect(result.right.getTime() - mockCurrentDate.getTime()).toEqual(
                expected * 60 * 1000,
            );
        });
    });
});
