/**
 * @jest-environment node
 */
import {
    afterEach,
    beforeEach,
    describe,
    expect,
    jest,
    test,
} from "@jest/globals";
import { isRight } from "fp-ts/Either";
import { CONTROL_ACTIONS } from "@fc/server/turn";
import {
    makeActiveGame,
    makeInactiveGame,
    setupInformation,
} from "../../fixtures/game";

const mockedDate = new Date(2023, 1, 2, 3, 4, 5, 0);

beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(mockedDate);
});

afterEach(() => {
    jest.useRealTimers();
});

describe("CONTROL_ACTIONS", () => {
    describe("pause", () => {
        test("freezes the current turn", () => {
            const result = CONTROL_ACTIONS.pause(makeActiveGame());

            expect(isRight(result)).toBe(true);
            if (isRight(result)) {
                // The fixture's phase ends 65 seconds after the mocked time
                expect(result.right).toMatchObject({
                    active: false,
                    frozenTurn: {
                        active: false,
                        turnNumber: 1,
                        phase: 1,
                        phaseEnd: 65,
                    },
                });
            }
        });
    });

    describe("play", () => {
        test("resumes an inactive game from the frozen turn", () => {
            const result = CONTROL_ACTIONS.play(makeInactiveGame());

            expect(isRight(result)).toBe(true);
            if (isRight(result)) {
                expect(result.right.active).toBe(true);
                expect(result.right.turnInformation).toEqual({
                    turnNumber: 1,
                    currentPhase: 1,
                    phaseEnd: new Date(
                        mockedDate.getTime() + 60 * 1000,
                    ).toString(),
                });
            }
        });

        test("leaves an already active game untouched", () => {
            const game = makeActiveGame();
            const result = CONTROL_ACTIONS.play(game);

            expect(result).toEqual({ _tag: "Right", right: game });
        });
    });

    describe("forward-phase", () => {
        test("moves to the next phase", () => {
            const result = CONTROL_ACTIONS["forward-phase"](makeActiveGame());

            expect(isRight(result)).toBe(true);
            if (isRight(result)) {
                expect(result.right.turnInformation?.currentPhase).toBe(2);
                expect(result.right.turnInformation?.turnNumber).toBe(1);
            }
        });

        test("wraps to the next turn from the last phase", () => {
            const game = makeActiveGame();
            game.turnInformation.currentPhase = 3;

            const result = CONTROL_ACTIONS["forward-phase"](game);

            expect(isRight(result)).toBe(true);
            if (isRight(result)) {
                expect(result.right.turnInformation).toMatchObject({
                    currentPhase: 1,
                    turnNumber: 2,
                });
            }
        });

        test("does nothing at the turn limit", () => {
            const game = makeActiveGame({
                setupInformation: { ...setupInformation, maxTurns: 2 },
            });
            game.turnInformation.turnNumber = 2;
            game.turnInformation.currentPhase = 3;

            const result = CONTROL_ACTIONS["forward-phase"](game);

            expect(result).toEqual({ _tag: "Right", right: game });
        });

        test("returns a Left when the new turn information cannot be generated", () => {
            const game = makeActiveGame({
                setupInformation: { ...setupInformation, phases: [] },
            });

            const result = CONTROL_ACTIONS["forward-phase"](game);

            expect(result).toEqual({
                _tag: "Left",
                left: "Tried to get length of phase 2, but there are only 0 phases",
            });
        });
    });

    describe("back-phase", () => {
        test("moves to the previous phase", () => {
            const game = makeActiveGame();
            game.turnInformation.currentPhase = 3;

            const result = CONTROL_ACTIONS["back-phase"](game);

            expect(isRight(result)).toBe(true);
            if (isRight(result)) {
                expect(result.right.turnInformation?.currentPhase).toBe(2);
            }
        });

        test("wraps to the final phase of the previous turn", () => {
            const game = makeActiveGame();
            game.turnInformation.turnNumber = 2;

            const result = CONTROL_ACTIONS["back-phase"](game);

            expect(isRight(result)).toBe(true);
            if (isRight(result)) {
                expect(result.right.turnInformation).toMatchObject({
                    currentPhase: 3,
                    turnNumber: 1,
                });
            }
        });

        test("restarts the phase on turn 1 phase 1", () => {
            const result = CONTROL_ACTIONS["back-phase"](makeActiveGame());

            expect(isRight(result)).toBe(true);
            if (isRight(result)) {
                expect(result.right.turnInformation).toMatchObject({
                    currentPhase: 1,
                    turnNumber: 1,
                });
            }
        });
    });

    describe("back-turn", () => {
        test("moves to the first phase of the previous turn", () => {
            const game = makeActiveGame();
            game.turnInformation.turnNumber = 3;
            game.turnInformation.currentPhase = 2;

            const result = CONTROL_ACTIONS["back-turn"](game);

            expect(isRight(result)).toBe(true);
            if (isRight(result)) {
                expect(result.right.turnInformation).toMatchObject({
                    currentPhase: 1,
                    turnNumber: 2,
                });
            }
        });

        test("never goes below turn 1", () => {
            const result = CONTROL_ACTIONS["back-turn"](makeActiveGame());

            expect(isRight(result)).toBe(true);
            if (isRight(result)) {
                expect(result.right.turnInformation?.turnNumber).toBe(1);
            }
        });
    });

    describe("forward-turn", () => {
        test("moves to the first phase of the next turn", () => {
            const game = makeActiveGame();
            game.turnInformation.currentPhase = 2;

            const result = CONTROL_ACTIONS["forward-turn"](game);

            expect(isRight(result)).toBe(true);
            if (isRight(result)) {
                expect(result.right.turnInformation).toMatchObject({
                    currentPhase: 1,
                    turnNumber: 2,
                });
            }
        });

        test("does not go past the turn limit", () => {
            const game = makeActiveGame({
                setupInformation: { ...setupInformation, maxTurns: 2 },
            });
            game.turnInformation.turnNumber = 2;

            const result = CONTROL_ACTIONS["forward-turn"](game);

            expect(isRight(result)).toBe(true);
            if (isRight(result)) {
                expect(result.right.turnInformation?.turnNumber).toBe(2);
            }
        });
    });
});
