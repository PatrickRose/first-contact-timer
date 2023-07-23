import {ApiResponse, Game, Phase, SetupInformation, Turn} from "../types/types";
import {Either, isLeft} from "fp-ts/Either";
import {MakeLeft, MakeRight} from "../lib/io-ts-helpers";

export const PHASE_LISTS: Phase[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

const ALL_PHASES: { [key in Phase]: number } = {
    1: 10,
    2: 2,
    3: 20,
    4: 2,
    5: 10,
    6: 2,
    7: 5,
    8: 2,
    9: 5,
    10: 2,
};

export const PHASE_TITLES: Record<Phase, string> = {
    1: "Team Time",
    2: "BUFFER",
    3: "Action Phase 1",
    4: "BUFFER",
    5: "Action Phase 2",
    6: "BUFFER",
    7: "Action Phase 3",
    8: "BUFFER",
    9: "Press Broadcast",
    10: "BUFFER",
};

function isPhase(phase: unknown): phase is Phase {
    if (typeof phase !== "number") {
        return false;
    }

    return Object.keys(ALL_PHASES).includes(`${phase}`);
}

export function isBreatherPhase(phase: Phase): boolean {
    return phase % 2 == 0;
}

export function lengthOfPhase(phase: number, turn: number, setupInformation: SetupInformation): Either<string, number> {
    const phases = setupInformation.phases;

    const thisPhaseInfo = getCurrentPhase(phase, setupInformation);

    if (isLeft(thisPhaseInfo)) {
        return MakeLeft(`Tried to get length of phase ${phase}, but there are only ${phases.length} phases`);
    }

    let length = thisPhaseInfo.right.length;

    if (thisPhaseInfo.right.extraTime?.[turn] !== undefined) {
        length += thisPhaseInfo.right.extraTime[turn]
    }

    return MakeRight(length);
}

export function nextDate(phase: number, turn: number, setupInformation: SetupInformation): Either<string, Date> {
    const date = new Date();
    date.setMilliseconds(0);
    const phaseLength = lengthOfPhase(phase, turn, setupInformation);
    if (isLeft(phaseLength)) {
        return phaseLength
    }

    date.setMinutes(date.getMinutes() + phaseLength.right);
    return MakeRight(date);
}

export function toApiResponse(
    turn: Game,
    forceRefresh: boolean = false
): ApiResponse {
    if (!turn.active  && !forceRefresh) {
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

    return {
        ...turn,
        turnNumber: turn.turnInformation.turnNumber,
        phase: turn.turnInformation.currentPhase,
        phaseEnd: secondsLeft,
    };
}

export function nextPhase(phase: number, setup: SetupInformation): number {
    const newPhaseNumber = phase + 1;

    return newPhaseNumber >= setup.phases.length
        ? 1
        : newPhaseNumber
}

export function tickTurn(game: Game): Game {
    const newPhase: number = nextPhase(game.turnInformation.currentPhase, game.setupInformation);
    const newTurn = newPhase == 1 ? game.turnInformation.turnNumber + 1 : game.turnInformation.turnNumber;

    const turnInformation = generateNewTurnInformation(
        newPhase,
        newTurn,
        game.setupInformation
    )

    if (isLeft(turnInformation)) {
        throw new Error('Should not happen');
    }

    return {
        ...game,
        turnInformation: turnInformation.right
    };
}

export function pauseResume(turn: Turn, active: boolean): Turn {
    const newTurn = { ...turn };

    if (active) {
        if (newTurn.frozenTurn) {
            const phaseEnd = new Date();
            phaseEnd.setSeconds(
                phaseEnd.getSeconds() + newTurn.frozenTurn.phaseEnd
            );

            newTurn.phaseEnd = phaseEnd.toString();
        }

        newTurn.frozenTurn = null;
        newTurn.active = true;
    } else {
        newTurn.active = false;
        newTurn.frozenTurn = toApiResponse(newTurn, true);
    }

    return newTurn;
}

export function hasFinished(game: Game): boolean {
    return game.active && new Date(game.turnInformation.phaseEnd) < new Date();
}
export function backAPhase(turn: Turn): Turn {
    // eslint-disable-next-line default-case
    const newTurn: Turn = { ...turn };

    if (newTurn.phase != 1 || newTurn.turnNumber != 1) {
        const newPhaseNumber = newTurn.phase - 1;

        newTurn.phase = isPhase(newPhaseNumber)
            ? newPhaseNumber
            : (Math.max(...PHASE_LISTS) as Phase);
        newTurn.turnNumber =
            newTurn.phase == Math.max(...PHASE_LISTS)
                ? newTurn.turnNumber - 1
                : newTurn.turnNumber;
    }

    newTurn.phaseEnd = nextDate(newTurn.phase, newTurn.turnNumber).toString();

    if (newTurn.frozenTurn) {
        newTurn.frozenTurn = toApiResponse(newTurn, true);
    }

    return newTurn;
}
export function backATurn(turn: Turn): Turn {
    const newTurn = { ...turn };
    newTurn.turnNumber = Math.max(1, newTurn.turnNumber - 1);
    newTurn.phase = 1;
    newTurn.phaseEnd = nextDate(1, newTurn.turnNumber).toString();

    if (newTurn.frozenTurn) {
        newTurn.frozenTurn = toApiResponse(newTurn, true);
    }

    return newTurn;
}

export function turnMatches(first: Turn, second: Turn): boolean {
    return first.phase == second.phase || first.turnNumber == second.turnNumber;
}

export function createGame(id: Game["_id"], setupInformation: Game["setupInformation"], components: Game["components"]): Either<string, Game> {
    let date = nextDate(1, 1, setupInformation);

    if (isLeft(date)) {
        return date;
    }

    const turnInformation: Game["turnInformation"] = {
        turnNumber: 1,
        currentPhase: 1,
        phaseEnd: date.right.toString()
    }

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
        frozenTurn: {...toApiResponse(base), active: false}
    });
}

export function getCurrentPhase(phase: number, setupInformation: SetupInformation):Either<false, SetupInformation["phases"][0]>{
    const possible = setupInformation.phases[phase - 1];

    if (possible === undefined) {
        return MakeLeft(false);
    }

    return MakeRight(possible);
}

export function generateNewTurnInformation(phase: Game["turnInformation"]["currentPhase"], turn: Game["turnInformation"]["turnNumber"], setupInfo: Game["setupInformation"]): Either<string, Game["turnInformation"]> {
    const newPhaseEnd = nextDate(phase, turn, setupInfo);

    if (isLeft(newPhaseEnd)) {
        return newPhaseEnd;
    }

    return MakeRight({
        turnNumber: turn,
        currentPhase: phase,
        phaseEnd: newPhaseEnd.right.toString()
    });
}
