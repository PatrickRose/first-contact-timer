import { describe, expect, test } from "@jest/globals";
import { phases, setupInformation } from "./helpers";
import { nextPhase } from "@fc/server/turn";

describe("nextPhase", () => {
    for (let maxPhases = 1; maxPhases <= 5; maxPhases++) {
        const info = {
            ...setupInformation,
            phases: new Array(maxPhases).fill(phases[0]),
        };

        for (let phaseToTest = 1; phaseToTest < maxPhases; phaseToTest++) {
            test(`phase after ${phaseToTest} for ${maxPhases} phase game should be ${
                phaseToTest + 1
            }`, () => {
                expect(nextPhase(phaseToTest, info)).toEqual(phaseToTest + 1);
            });
        }

        test(`phase after ${maxPhases} for ${maxPhases} phase game should be 1`, () => {
            expect(nextPhase(maxPhases, info)).toEqual(1);
        });
    }
});
