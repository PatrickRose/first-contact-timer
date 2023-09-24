import { describe, expect, test } from "@jest/globals";
import { SetupInformation } from "@fc/types/types";
import { setupInformation } from "./helpers";
import { getCurrentPhase } from "@fc/server/turn";
import { Left, Right } from "fp-ts/Either";

describe("getCurrentPhase", () => {
    for (let numPhases = 1; numPhases < 10; numPhases++) {
        const phases: SetupInformation["phases"] = [];

        for (let phase = 1; phase <= numPhases; phase++) {
            phases.push({
                title: `${phase}`,
                length: phase,
                hidden: false,
            });
        }

        const setup: SetupInformation = {
            ...setupInformation,
            phases,
        };

        for (let phaseToCheck = 1; phaseToCheck <= numPhases; phaseToCheck++) {
            const expected = phases[phaseToCheck - 1];

            test(`Get phase ${phaseToCheck} from ${numPhases} game`, () => {
                const expected: Right<SetupInformation["phases"][0]> = {
                    _tag: "Right",
                    right: {
                        title: `${phaseToCheck}`,
                        length: phaseToCheck,
                        hidden: false,
                    },
                };

                expect(getCurrentPhase(phaseToCheck, setup)).toEqual(expected);
            });
        }

        [-1, 0, numPhases + 1].forEach((phaseToCheck) => {
            const expected: Left<false> = {
                _tag: "Left",
                left: false,
            };

            test(`Get phase ${phaseToCheck} from ${numPhases} game should return error`, () => {
                expect(getCurrentPhase(phaseToCheck, setup)).toEqual(expected);
            });
        });
    }
});
