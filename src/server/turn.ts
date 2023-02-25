import { ApiResponse, Phase, Turn } from "../types/types";

export const PHASE_LISTS: Phase[] = [1, 2, 3];

const ALL_PHASES: { [key in Phase]: number } = {
    1: 15,
    2: 15,
    3: 5,
};

export const PHASE_TITLES: Record<Phase, string> = {
    1: "Setup Phase",
    2: "Action Phase",
    3: "Team Time",
};

function isPhase(phase: unknown): phase is Phase {
    if (typeof phase !== "number") {
        return false;
    }

    return Object.keys(ALL_PHASES).includes(`${phase}`);
}

export function isBreatherPhase(phase: Phase): boolean {
    return false;
}

export function lengthOfPhase(phase: Phase, turn: number): number {
    let base = ALL_PHASES[phase];

    return base;
}

export function nextDate(phase: Phase, turn: number) {
    const date = new Date();
    date.setMilliseconds(0);
    date.setMinutes(date.getMinutes() + lengthOfPhase(phase, turn));
    return date;
}

export function toApiResponse(
    turn: Turn,
    forceRefresh: boolean = false
): ApiResponse {
    if (turn.frozenTurn !== null && !forceRefresh) {
        return turn.frozenTurn;
    }

    const phaseEnd = new Date(turn.phaseEnd);

    const now = new Date();
    let secondsLeft;

    if (phaseEnd > now) {
        secondsLeft = Math.ceil((phaseEnd.getTime() - now.getTime()) / 1000);
    } else {
        secondsLeft = 0;
    }

    return {
        turnNumber: turn.turnNumber,
        phase: turn.phase,
        phaseEnd: secondsLeft,
        breakingNews: turn.breakingNews || null,
        active: turn.active,
    };
}

export function nextPhase(phase: Phase): Phase {
    const newPhaseNumber = phase + 1;

    return isPhase(newPhaseNumber) ? newPhaseNumber : 1;
}

export function tickTurn(turn: Turn): Turn {
    const newPhase: Phase = nextPhase(turn.phase);
    const newTurn = newPhase == 1 ? turn.turnNumber + 1 : turn.turnNumber;

    return {
        ...turn,
        phaseEnd: nextDate(newPhase, newTurn).toString(),
        phase: newPhase,
        turnNumber: newTurn,
        active: true,
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

export function hasFinished(turn: Turn): boolean {
    return turn.active && new Date(turn.phaseEnd) < new Date();
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
