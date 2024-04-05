import { NextRequest, NextResponse } from "next/server";
import { ApiResponse } from "@fc/types/types";
import { isLeft } from "fp-ts/Either";
import { getGameRepo } from "@fc/server/repository/game";
import { SetTrackerDecode } from "@fc/types/io-ts-def";
import { toApiResponse } from "@fc/server/turn";
import { MakeLeft, MakeRight } from "@fc/lib/io-ts-helpers";

export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } },
): Promise<NextResponse<ApiResponse | { error: string }>> {
    const id = params.id;

    const body = await request.json();

    if (!SetTrackerDecode.is(body)) {
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
        (game) => {
            const newGame = { ...game };

            // Find the defcon component
            const tracker = newGame.components.find(
                (val) => val.componentType == "Trackers",
            );

            if (tracker?.componentType != "Trackers") {
                return MakeLeft(
                    `No RunningHotRunners component component for game ${id}`,
                );
            }

            if (tracker.trackers[body.tracker] === undefined) {
                return MakeLeft(
                    `No ${body.tracker} tracker found for game ${id}`,
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
        },
    );

    if (isLeft(newGame)) {
        return NextResponse.json({ error: newGame.left }, { status: 500 });
    }

    return NextResponse.json(toApiResponse(newGame.right));
}
