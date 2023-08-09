import { NextRequest, NextResponse } from "next/server";
import { ApiResponse } from "../../../../../../types/types";
import { isLeft } from "fp-ts/Either";
import { getGameRepo } from "../../../../../../server/repository/game";
import { DefconAPIBodyDecode } from "../../../../../../types/io-ts-def";
import { toApiResponse } from "../../../../../../server/turn";
import { MakeLeft, MakeRight } from "../../../../../../lib/io-ts-helpers";

export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } },
): Promise<NextResponse<ApiResponse | { error: string }>> {
    const id = params.id;

    const body = await request.json();

    if (!DefconAPIBodyDecode.is(body)) {
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
            const defconComponent = newGame.components.find(
                (val) => val.componentType == "Defcon",
            );

            if (defconComponent?.componentType != "Defcon") {
                return MakeLeft(`No defcon component for game ${id}`);
            }

            const country = defconComponent.countries[body.stateName];

            if (!country) {
                return MakeLeft(
                    `Defcon component does not include ${body.stateName}`,
                );
            }

            defconComponent.countries[body.stateName].status = body.newStatus;

            if (!newGame.active) {
                const frozenComponent = newGame.frozenTurn.components.find(
                    (val) => val.componentType == "Defcon",
                );

                if (frozenComponent?.componentType == "Defcon") {
                    frozenComponent.countries[body.stateName].status =
                        body.newStatus;
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
