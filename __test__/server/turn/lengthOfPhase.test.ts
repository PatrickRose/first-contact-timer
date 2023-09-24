import { describe, expect, test } from "@jest/globals";
import { phases, setupInformation, testPhases } from "./helpers";
import { lengthOfPhase } from "@fc/server/turn";
import { isLeft } from "fp-ts/Either";

describe("lengthOfPhase", () => {
    test("Unknown phase returns error message", () => {
        let result = lengthOfPhase(1, 1, setupInformation);

        expect(isLeft(result)).toBe(true);
    });

    testPhases.forEach((phase, index) => {
        test(`Index ${index + 1} should return ${phase.length}`, () => {
            let result = lengthOfPhase(index + 1, 1, {
                ...setupInformation,
                phases: testPhases,
            });

            expect(result).toEqual({
                _tag: "Right",
                right: phase.length,
            });
        });
    });

    [
        [1, 1],
        [2, 2],
        [3, 1],
        [4, 5],
        [5, 1],
    ].forEach(([turnNumber, expected]) => {
        test(`Turn ${turnNumber} should return ${expected}`, () => {
            let result = lengthOfPhase(1, turnNumber, {
                ...setupInformation,
                phases,
            });

            expect(result).toEqual({
                _tag: "Right",
                right: expected,
            });
        });
    });
});
