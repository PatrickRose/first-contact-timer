import { NextRequest, NextResponse } from "next/server";
import { ApiResponse, ControlAction, ControlAPI, Game } from "@fc/types/types";
import { isLeft } from "fp-ts/Either";
import { getGameRepo } from "@fc/server/repository/game";
import { ControlAPIDecode } from "@fc/types/io-ts-def";
import {
    generateNewTurnInformation,
    isAtTurnLimit,
    toApiResponse,
} from "@fc/server/turn";
import { MakeRight } from "@fc/lib/io-ts-helpers";

const CONTROL_ACTIONS: Record<ControlAPI["action"], ControlAction> = {
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

export async function POST(
    request: NextRequest,
    props: { params: Promise<{ id: string }> },
): Promise<NextResponse<ApiResponse | { error: string }>> {
    const params = await props.params;
    const id = params.id;

    const body = await request.json();

    if (!ControlAPIDecode.is(body)) {
        return NextResponse.json(
            { error: "Incorrect request" },
            { status: 400 },
        );
    }

    const gameRepo = getGameRepo();

    if (isLeft(gameRepo)) {
        return NextResponse.json({ error: gameRepo.left }, { status: 500 });
    }

    const game = await gameRepo.right.get(id);

    if (isLeft(game)) {
        return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }

    const newGame = await gameRepo.right.runControlAction(
        game.right,
        CONTROL_ACTIONS[body.action],
    );

    if (isLeft(newGame)) {
        return NextResponse.json({ error: newGame.left }, { status: 500 });
    }

    return NextResponse.json(toApiResponse(newGame.right));
}
