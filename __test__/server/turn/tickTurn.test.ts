import {
    afterEach,
    beforeEach,
    describe,
    expect,
    jest,
    test,
} from "@jest/globals";
import { setupInformation } from "./helpers";
import { Game, SetupInformation } from "@fc/types/types";
import { tickTurn } from "@fc/server/turn";

describe("tickTurn", () => {
    beforeEach(() => {
        jest.useFakeTimers();
        jest.setSystemTime(0);
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    for (let currentTurn = 1; currentTurn <= 5; currentTurn++) {
        for (let maxPhases = 1; maxPhases <= 5; maxPhases++) {
            const phases: SetupInformation["phases"] = [];

            for (let i = 1; i <= maxPhases; i++) {
                phases.push({
                    title: `${i}`,
                    length: i,
                    hidden: false,
                });
            }

            const baseGame: Game = {
                _id: "TEST",
                setupInformation: {
                    ...setupInformation,
                    phases,
                },
                turnInformation: {
                    turnNumber: currentTurn,
                    currentPhase: maxPhases,
                    phaseEnd: "TEST",
                },
                components: [],
                active: true,
                breakingNews: [],
            };

            for (let phaseToTest = 1; phaseToTest < maxPhases; phaseToTest++) {
                test(`phase after ${phaseToTest} for ${maxPhases} phase game should be ${
                    phaseToTest + 1
                }`, () => {
                    const game = { ...baseGame };
                    game.turnInformation = {
                        ...game.turnInformation,
                        currentPhase: phaseToTest,
                    };

                    const expectedGame = {
                        ...baseGame,
                        turnInformation: {
                            turnNumber: currentTurn,
                            currentPhase: phaseToTest + 1,
                            phaseEnd: new Date(
                                (phaseToTest + 1) * 60 * 1000,
                            ).toString(),
                        },
                    };
                    expectedGame.turnInformation.currentPhase = phaseToTest + 1;

                    expect(tickTurn(game)).toEqual(expectedGame);
                });
            }

            test(`phase after ${maxPhases} for ${maxPhases} phase game should be 1`, () => {
                const expectedGame = {
                    ...baseGame,
                    turnInformation: {
                        turnNumber: currentTurn + 1,
                        currentPhase: 1,
                        phaseEnd: new Date(60 * 1000).toString(),
                    },
                };

                expect(tickTurn(baseGame)).toEqual(expectedGame);
            });
        }
    }
});
