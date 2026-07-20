import { describe, expect, test } from "@jest/globals";
import { Game } from "@fc/types/types";
import { toGameSummary } from "@fc/server/turn";
import {
    makeActiveGame,
    makeInactiveGame,
    setupInformation,
} from "../../fixtures/game";

describe("toGameSummary", () => {
    test("summarises an active game from its live turn information", () => {
        const game = makeActiveGame({
            _id: "alpha",
            turnInformation: {
                turnNumber: 3,
                currentPhase: 2,
                phaseEnd: new Date().toString(),
            },
        });

        expect(toGameSummary(game)).toEqual({
            code: "alpha",
            gameName: "TEST GAME",
            turnNumber: 3,
            phaseNumber: 2,
            phaseName: "Phase 2",
            totalPhases: 3,
            paused: false,
        });
    });

    test("summarises a paused game from its frozen turn, not turnInformation", () => {
        // The live turnInformation deliberately disagrees with the frozen turn
        // so we can prove the summary uses the frozen (displayed) values.
        const game = makeInactiveGame(
            {
                _id: "bravo",
                turnInformation: {
                    turnNumber: 9,
                    currentPhase: 3,
                    phaseEnd: new Date().toString(),
                },
            },
            { turnNumber: 2, phase: 1 },
        );

        expect(toGameSummary(game)).toEqual({
            code: "bravo",
            gameName: "TEST GAME",
            turnNumber: 2,
            phaseNumber: 1,
            phaseName: "Phase 1",
            totalPhases: 3,
            paused: true,
        });
    });

    test("falls back to Unknown when the phase index is out of range", () => {
        const game = makeActiveGame({
            _id: "charlie",
            turnInformation: {
                turnNumber: 1,
                currentPhase: 99,
                phaseEnd: new Date().toString(),
            },
        });

        const summary = toGameSummary(game);

        expect(summary.phaseName).toBe("Unknown");
        expect(summary.totalPhases).toBe(3);
    });

    test("degrades gracefully for a game with no phases", () => {
        const game = makeActiveGame({
            _id: "delta",
            setupInformation: { ...setupInformation, phases: [] },
        });

        const summary = toGameSummary(game);

        expect(summary.phaseName).toBe("Unknown");
        expect(summary.totalPhases).toBe(0);
    });

    test("falls back to the code when the game name is missing", () => {
        const game = {
            ...makeActiveGame({ _id: "echo" }),
            setupInformation: undefined,
        } as unknown as Game;

        const summary = toGameSummary(game);

        expect(summary.gameName).toBe("echo");
        expect(summary.phaseName).toBe("Unknown");
        expect(summary.totalPhases).toBe(0);
    });
});
