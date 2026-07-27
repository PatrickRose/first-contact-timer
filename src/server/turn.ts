import {
    ApiResponse,
    ControlAction,
    ControlAPI,
    Game,
    SetupInformation,
} from "@fc/types/types";
import { Either, isLeft } from "fp-ts/Either";
import { MakeLeft, MakeRight } from "@fc/lib/io-ts-helpers";

export function lengthOfPhase(
    phase: number,
    turn: number,
    setupInformation: SetupInformation,
): Either<string, number> {
    const phases = setupInformation.phases;

    const thisPhaseInfo = getCurrentPhase(phase, setupInformation);

    if (isLeft(thisPhaseInfo)) {
        return MakeLeft(
            `Tried to get length of phase ${phase}, but there are only ${phases.length} phases`,
        );
    }

    let length = thisPhaseInfo.right.length;

    if (thisPhaseInfo.right.extraTime?.[turn] !== undefined) {
        length += thisPhaseInfo.right.extraTime[turn];
    }

    return MakeRight(length);
}

export function nextDate(
    phase: number,
    turn: number,
    setupInformation: SetupInformation,
): Either<string, Date> {
    const date = new Date();
    date.setMilliseconds(0);
    const phaseLength = lengthOfPhase(phase, turn, setupInformation);
    if (isLeft(phaseLength)) {
        return phaseLength;
    }

    date.setMinutes(date.getMinutes() + phaseLength.right);
    return MakeRight(date);
}

export function toApiResponse(
    turn: Game,
    forceRefresh: boolean = false,
): ApiResponse {
    if (!turn.active && !forceRefresh) {
        return turn.frozenTurn;
    }

    const phaseEnd = new Date(turn.turnInformation.phaseEnd);

    const now = new Date();
    let secondsLeft;

    if (phaseEnd > now) {
        secondsLeft = Math.ceil((phaseEnd.getTime() - now.getTime()) / 1000);
    } else {
        secondsLeft = 0;
    }

    const breakingNews = [...turn.breakingNews];
    breakingNews.sort((a, b) => {
        if (a.date < b.date) {
            return 1;
        }

        if (a.date > b.date) {
            return -1;
        }

        /* istanbul ignore next */
        return 0;
    });

    return {
        active: turn.active,
        components: turn.components,
        breakingNews,
        turnNumber: turn.turnInformation.turnNumber,
        phase: turn.turnInformation.currentPhase,
        phaseEnd: secondsLeft,
    };
}

// A lightweight, display-ready view of a game for the admin games list.
export type GameSummary = {
    code: string;
    gameName: string;
    turnNumber: number;
    phaseNumber: number; // 1-indexed
    phaseName: string;
    totalPhases: number;
    paused: boolean;
};

// Map a stored game to its display summary. The turn/phase shown must match
// what the live views render, so for a paused game we read from `frozenTurn`
// (exactly what `toApiResponse` returns when `!active`) rather than the live
// `turnInformation`. Access is defensive because stored games are cast, not
// decoded, so a legacy/corrupt document must degrade gracefully instead of
// throwing and taking down the whole list.
export function toGameSummary(game: Game): GameSummary {
    const paused = game.active === false;

    const turnNumber = paused
        ? game.frozenTurn.turnNumber
        : game.turnInformation.turnNumber;
    const phaseNumber = paused
        ? game.frozenTurn.phase
        : game.turnInformation.currentPhase;

    const phases = game.setupInformation?.phases;

    return {
        code: game._id,
        gameName: game.setupInformation?.gameName ?? game._id,
        turnNumber,
        phaseNumber,
        phaseName: phases?.[phaseNumber - 1]?.title ?? "Unknown",
        totalPhases: phases?.length ?? 0,
        paused,
    };
}

export function nextPhase(phase: number, setup: SetupInformation): number {
    const newPhaseNumber = phase + 1;

    return newPhaseNumber > setup.phases.length ? 1 : newPhaseNumber;
}

export function atTurnLimit(
    turnNumber: number,
    currentPhase: number,
    setupInformation: SetupInformation,
): boolean {
    const maxTurns = setupInformation.maxTurns;

    return (
        maxTurns !== undefined &&
        turnNumber >= maxTurns &&
        currentPhase >= setupInformation.phases.length
    );
}

export function isAtTurnLimit(game: Game): boolean {
    return atTurnLimit(
        game.turnInformation.turnNumber,
        game.turnInformation.currentPhase,
        game.setupInformation,
    );
}

export function tickTurn(game: Game): Game {
    if (isAtTurnLimit(game)) {
        return game;
    }

    const newPhase: number = nextPhase(
        game.turnInformation.currentPhase,
        game.setupInformation,
    );
    const newTurn =
        newPhase == 1
            ? game.turnInformation.turnNumber + 1
            : game.turnInformation.turnNumber;

    const turnInformation = generateNewTurnInformation(
        newPhase,
        newTurn,
        game.setupInformation,
    );

    if (isLeft(turnInformation)) {
        /* istanbul ignore next */
        throw new Error("Should not happen");
    }

    return {
        ...game,
        turnInformation: { ...turnInformation.right },
    };
}

export function hasFinished(game: Game): boolean {
    return (
        game.active &&
        !isAtTurnLimit(game) &&
        new Date(game.turnInformation.phaseEnd) < new Date()
    );
}

export function createGame(
    id: Game["_id"],
    setupInformation: Game["setupInformation"],
    components: Game["components"],
): Either<string, Game> {
    const date = nextDate(1, 1, setupInformation);

    if (isLeft(date)) {
        return date;
    }

    const turnInformation: Game["turnInformation"] = {
        turnNumber: 1,
        currentPhase: 1,
        phaseEnd: date.right.toString(),
    };

    const base: Game = {
        _id: id,
        turnInformation: turnInformation,
        breakingNews: [],
        active: true,
        setupInformation,
        components,
    };

    return MakeRight({
        ...base,
        active: false,
        frozenTurn: { ...toApiResponse(base), active: false },
    });
}

export function getCurrentPhase(
    phase: number,
    setupInformation: SetupInformation,
): Either<false, SetupInformation["phases"][0]> {
    const possible = setupInformation.phases[phase - 1];

    if (possible === undefined) {
        return MakeLeft(false);
    }

    return MakeRight(possible);
}

/**
 * The pause/play/back/forward turn arithmetic for the control desk. Lives next
 * to tickTurn so it is unit-tested with the rest of the turn maths rather than
 * only through the HTTP route.
 */
export const CONTROL_ACTIONS: Record<ControlAPI["action"], ControlAction> = {
    pause: (game) => {
        return MakeRight({
            active: false,
            frozenTurn: toApiResponse(
                { ...game, active: false, frozenTurn: toApiResponse(game) },
                true,
            ),
        });
    },
    play: (game) => {
        if (game.active) {
            return MakeRight(game);
        }

        const phaseEnd = new Date();
        phaseEnd.setSeconds(phaseEnd.getSeconds() + game.frozenTurn.phaseEnd);

        const turnInformation: Game["turnInformation"] = {
            turnNumber: game.frozenTurn.turnNumber,
            currentPhase: game.frozenTurn.phase,
            phaseEnd: phaseEnd.toString(),
        };

        return MakeRight({
            active: true,
            turnInformation,
        });
    },
    "back-phase": (game) => {
        const turnInformation = game.turnInformation;

        const currentPhase = turnInformation.currentPhase;

        let newPhase = currentPhase - 1;
        let turnNumber = turnInformation.turnNumber;

        if (currentPhase == 1) {
            if (turnNumber == 1) {
                // There is nothing before turn 1 phase 1, so restart the phase
                newPhase = 1;
            } else {
                newPhase = game.setupInformation.phases.length;
                turnNumber -= 1;
            }
        }

        const newTurnInformation = generateNewTurnInformation(
            newPhase,
            turnNumber,
            game.setupInformation,
        );

        if (isLeft(newTurnInformation)) {
            return newTurnInformation;
        }

        return MakeRight({
            turnInformation: newTurnInformation.right,
        });
    },
    "back-turn": (game) => {
        const turnInformation = game.turnInformation;

        const newPhase = 1;

        const turnNumber = Math.max(turnInformation.turnNumber - 1, 1);

        const newTurnInformation = generateNewTurnInformation(
            newPhase,
            turnNumber,
            game.setupInformation,
        );

        if (isLeft(newTurnInformation)) {
            return newTurnInformation;
        }

        return MakeRight({
            turnInformation: newTurnInformation.right,
        });
    },
    "forward-phase": (game) => {
        if (isAtTurnLimit(game)) {
            return MakeRight(game);
        }

        const turnInformation = game.turnInformation;

        const { newPhase, turnNumber } =
            turnInformation.currentPhase == game.setupInformation.phases.length
                ? { newPhase: 1, turnNumber: turnInformation.turnNumber + 1 }
                : {
                      newPhase: turnInformation.currentPhase + 1,
                      turnNumber: turnInformation.turnNumber,
                  };

        const newTurnInformation = generateNewTurnInformation(
            newPhase,
            turnNumber,
            game.setupInformation,
        );

        if (isLeft(newTurnInformation)) {
            return newTurnInformation;
        }

        return MakeRight({
            turnInformation: newTurnInformation.right,
        });
    },
    "forward-turn": (game) => {
        const turnInformation = game.turnInformation;

        const newPhase = 1;
        const turnNumber = Math.min(
            turnInformation.turnNumber + 1,
            game.setupInformation.maxTurns ?? Infinity,
        );

        const newTurnInformation = generateNewTurnInformation(
            newPhase,
            turnNumber,
            game.setupInformation,
        );

        if (isLeft(newTurnInformation)) {
            return newTurnInformation;
        }

        return MakeRight({
            turnInformation: newTurnInformation.right,
        });
    },
};

/**
 * The relative turn-navigation actions: each computes the new turn/phase as an
 * offset from the CURRENT state. Re-applying one on already-advanced state would
 * advance the game a second time, so on a CAS conflict the route must NOT retry
 * them (it returns 409 and lets the operator re-decide). pause/play are absent
 * because they set absolute state and are safe to re-apply on fresh state.
 */
export const RELATIVE_CONTROL_ACTIONS: ReadonlySet<ControlAPI["action"]> =
    new Set(["forward-phase", "back-phase", "forward-turn", "back-turn"]);

/**
 * Whether a control action is safe to auto-retry once on a CAS conflict.
 * Idempotent/absolute actions are; relative turn navigation is not.
 */
export function isRetrySafeAction(action: ControlAPI["action"]): boolean {
    return !RELATIVE_CONTROL_ACTIONS.has(action);
}

export function generateNewTurnInformation(
    phase: Game["turnInformation"]["currentPhase"],
    turn: Game["turnInformation"]["turnNumber"],
    setupInfo: Game["setupInformation"],
): Either<string, Game["turnInformation"]> {
    const newPhaseEnd = nextDate(phase, turn, setupInfo);

    if (isLeft(newPhaseEnd)) {
        return newPhaseEnd;
    }

    return MakeRight({
        turnNumber: turn,
        currentPhase: phase,
        phaseEnd: newPhaseEnd.right.toString(),
    });
}
