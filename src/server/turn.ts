import {ApiResponse, Phase, Turn} from "../types/types";

export const PHASE_LISTS: Phase[] = [1,2,3,4,5];

const ALL_PHASES: {[key in Phase]: number} = {
    1: 20,
    2: 10,
    3: 5,
    4: 5,
    5: 5,
};

export function lengthOfPhase(phase: Phase, turn: number): number {
    let base = ALL_PHASES[phase];

    if (turn == 1) {
        if (phase == 1) {
            base += 10;
        } else if (phase == 3) {
            base += 5;
        }
    } else if (turn == 3) {
        if (phase == 2) {
            base += 5;
        } else if (phase == 5) {
            base += 10;
        }
    }

    return base;
}

export function nextDate(phase: Phase, turn: number) {
    const date = new Date();
    date.setMilliseconds(0);
    date.setMinutes(date.getMinutes() + lengthOfPhase(phase, turn));
    return date;
}

export function toApiResponse(turn: Turn, forceRefresh: boolean = false): ApiResponse {
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
        active: turn.active
    };
}

export function tickTurn(turn: Turn): Turn {
    let newPhase: Phase;
    let newTurn = turn.turnNumber;

    switch (turn.phase) {
        case 1:
            newPhase = 2;
            break;
        case 2:
            newPhase = 3;
            break;
        case 3:
            newPhase = 4;
            break;
        case 4:
            newPhase = 5;
            break;
        case 5:
            newPhase = 1;
            newTurn += 1;
            break;
        default:
            throw new Error('Unknown phase');
    }

    return {
        ...turn,
        phaseEnd: nextDate(newPhase, newTurn).toString(),
        phase: newPhase,
        turnNumber: newTurn,
        active: true
    };
}

export function pauseResume(turn: Turn, active: boolean): Turn {
    const newTurn = {...turn};

    if (active) {
        if (newTurn.frozenTurn) {
            const phaseEnd = new Date();
            phaseEnd.setSeconds(phaseEnd.getSeconds() + newTurn.frozenTurn.phaseEnd);

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
    const newTurn: Turn = {...turn}

    switch (newTurn.phase) {
        case 1:
            if (newTurn.turnNumber !== 1) {
                newTurn.phase = 5;
                newTurn.turnNumber = Math.max(1, newTurn.turnNumber - 1);
            }
            break;
        case 2:
            newTurn.phase = 1;
            break;
        case 3:
            newTurn.phase = 2;
            break;
        case 4:
            newTurn.phase = 3;
            break;
        case 5:
            newTurn.phase = 4;
    }

    newTurn.phaseEnd = nextDate(newTurn.phase, newTurn.turnNumber).toString();

    if (newTurn.frozenTurn) {
        newTurn.frozenTurn = toApiResponse(newTurn, true);
    }

    return newTurn;
}
export function backATurn(turn: Turn): Turn {
    const newTurn = {...turn};
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
