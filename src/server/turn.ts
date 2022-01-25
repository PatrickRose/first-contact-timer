import {ApiResponse, Phase, Turn} from "../types/types";

const SECONDS_IN_PHASE = process.env.SECONDS_IN_PHASE ? Number.parseInt(process.env.SECONDS_IN_PHASE, 10) : 15;
export function nextDate() {
    const date = new Date();
    date.setMilliseconds(0);
    date.setSeconds(date.getSeconds() + SECONDS_IN_PHASE);

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
        secondsLeft = phaseEnd.getTime() - now.getTime();
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
        phaseEnd: nextDate().toString(),
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

    newTurn.phaseEnd = nextDate().toString();

    if (newTurn.frozenTurn) {
        newTurn.frozenTurn = toApiResponse(newTurn, true);
    }

    return newTurn;
}
export function backATurn(turn: Turn): Turn {
    const newTurn = {...turn};
    newTurn.turnNumber = Math.max(1, newTurn.turnNumber - 1);
    newTurn.phase = 1;
    newTurn.phaseEnd = nextDate().toString();

    if (newTurn.frozenTurn) {
        newTurn.frozenTurn = toApiResponse(newTurn, true);
    }

    return newTurn;
}
