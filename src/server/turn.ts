import { ApiResponse, Game, SetupInformation } from "../types/types";
import { Either, isLeft } from "fp-ts/Either";
import { MakeLeft, MakeRight } from "../lib/io-ts-helpers";

export function lengthOfPhase(
    phase: number,
    turn: number,
    setupInformation: SetupInformation
): Either<string, number> {
    const phases = setupInformation.phases;

    const thisPhaseInfo = getCurrentPhase(phase, setupInformation);

    if (isLeft(thisPhaseInfo)) {
        return MakeLeft(
            `Tried to get length of phase ${phase}, but there are only ${phases.length} phases`
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
    setupInformation: SetupInformation
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
    forceRefresh: boolean = false
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

        return 0;
    });

    return {
        ...turn,
        breakingNews,
        turnNumber: turn.turnInformation.turnNumber,
        phase: turn.turnInformation.currentPhase,
        phaseEnd: secondsLeft,
    };
}

export function nextPhase(phase: number, setup: SetupInformation): number {
    const newPhaseNumber = phase + 1;

    return newPhaseNumber >= setup.phases.length ? 1 : newPhaseNumber;
}

export function tickTurn(game: Game): Game {
    const newPhase: number = nextPhase(
        game.turnInformation.currentPhase,
        game.setupInformation
    );
    const newTurn =
        newPhase == 1
            ? game.turnInformation.turnNumber + 1
            : game.turnInformation.turnNumber;

    const turnInformation = generateNewTurnInformation(
        newPhase,
        newTurn,
        game.setupInformation
    );

    if (isLeft(turnInformation)) {
        throw new Error("Should not happen");
    }

    return {
        ...game,
        turnInformation: turnInformation.right,
    };
}

export function hasFinished(game: Game): boolean {
    return game.active && new Date(game.turnInformation.phaseEnd) < new Date();
}

export function createGame(
    id: Game["_id"],
    setupInformation: Game["setupInformation"],
    components: Game["components"]
): Either<string, Game> {
    let date = nextDate(1, 1, setupInformation);

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
    setupInformation: SetupInformation
): Either<false, SetupInformation["phases"][0]> {
    const possible = setupInformation.phases[phase - 1];

    if (possible === undefined) {
        return MakeLeft(false);
    }

    return MakeRight(possible);
}

export function generateNewTurnInformation(
    phase: Game["turnInformation"]["currentPhase"],
    turn: Game["turnInformation"]["turnNumber"],
    setupInfo: Game["setupInformation"]
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
