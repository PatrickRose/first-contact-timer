import { NextRequest, NextResponse } from "next/server";
import { AddTracker, ApiResponse, Game, SetTracker } from "@fc/types/types";
import { isLeft } from "fp-ts/Either";
import GameRepository, { getGameRepo } from "@fc/server/repository/game";
import { AddTrackerDecode, SetTrackerDecode } from "@fc/types/io-ts-def";
import { toApiResponse } from "@fc/server/turn";
import { MakeLeft, MakeRight } from "@fc/lib/io-ts-helpers";

async function AddTrackerAction(
    body: AddTracker,
    game: Game,
    gameRepo: GameRepository,
): Promise<NextResponse<ApiResponse | { error: string }>> {
    const newGame = await gameRepo.runControlAction(game, (game) => {
        const newGame = { ...game };

        // Find the tracker component
        const tracker = newGame.components.find(
            (val) => val.componentType == "Trackers",
        );

        if (tracker?.componentType != "Trackers") {
            return MakeLeft(
                `No Trackers component component for game ${game._id}`,
            );
        }

        if (tracker.trackers[body.tracker] !== undefined) {
            return MakeLeft(
                `${body.tracker} tracker already exists for game ${game._id}`,
            );
        }

        tracker.trackers = {
            ...tracker.trackers,
            [body.tracker]: body.trackerDefinition,
        };

        if (!newGame.active) {
            const frozenComponent = newGame.frozenTurn.components.find(
                (val) => val.componentType == "Trackers",
            );

            if (frozenComponent?.componentType == "Trackers") {
                frozenComponent.trackers = {
                    ...frozenComponent.trackers,
                    [body.tracker]: body.trackerDefinition,
                };
            }
        }

        return MakeRight(newGame);
    });

    if (isLeft(newGame)) {
        return NextResponse.json({ error: newGame.left }, { status: 500 });
    }

    return NextResponse.json(toApiResponse(newGame.right));
}
async function SetTrackerAction(
    body: SetTracker,
    game: Game,
    gameRepo: GameRepository,
): Promise<NextResponse<ApiResponse | { error: string }>> {
    const newGame = await gameRepo.runControlAction(game, (game) => {
        const newGame = { ...game };

        // Find the tracker component
        const tracker = newGame.components.find(
            (val) => val.componentType == "Trackers",
        );

        if (tracker?.componentType != "Trackers") {
            return MakeLeft(
                `No Trackers component component for game ${game._id}`,
            );
        }

        if (tracker.trackers[body.tracker] === undefined) {
            return MakeLeft(
                `No ${body.tracker} tracker found for game ${game._id}`,
            );
        }

        tracker.trackers[body.tracker].value = body.value;

        if (!newGame.active) {
            const frozenComponent = newGame.frozenTurn.components.find(
                (val) => val.componentType == "Trackers",
            );

            if (frozenComponent?.componentType == "Trackers") {
                frozenComponent.trackers[body.tracker].value = body.value;
            }
        }

        return MakeRight(newGame);
    });

    if (isLeft(newGame)) {
        return NextResponse.json({ error: newGame.left }, { status: 500 });
    }

    return NextResponse.json(toApiResponse(newGame.right));
}

export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } },
): Promise<NextResponse<ApiResponse | { error: string }>> {
    const id = params.id;

    const gameRepo = getGameRepo();

    if (isLeft(gameRepo)) {
        return NextResponse.json({ error: gameRepo.left }, { status: 500 });
    }

    const game = await gameRepo.right.get(id);

    if (isLeft(game)) {
        return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }

    const body = await request.json();

    if (SetTrackerDecode.is(body)) {
        return SetTrackerAction(body, game.right, gameRepo.right);
    }

    if (AddTrackerDecode.is(body)) {
        return AddTrackerAction(body, game.right, gameRepo.right);
    }

    return NextResponse.json({ error: "Incorrect request" }, { status: 400 });
}
