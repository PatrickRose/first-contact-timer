import { ApiResponse, ControlAction } from "@fc/types/types";
import { isLeft } from "fp-ts/Either";
import { NextResponse } from "next/server";
import { getGameRepo, UPDATE_CONFLICT } from "@fc/server/repository/game";
import { toApiResponse } from "@fc/server/turn";

export type ControlRouteResponse = NextResponse<
    ApiResponse | { error: string }
>;

/**
 * Runs a control action for a game and maps the result to a response, shared by
 * the component route factory and the pause/play control route.
 *
 * The repository update is a compare-and-set on turnInformation, which can lose
 * to a concurrent writer (e.g. a lazy auto-advance triggered by a player's
 * poll). On such a conflict this re-fetches the game and re-applies the action
 * once; a persistent conflict surfaces as HTTP 409 rather than a silent success
 * with the other writer's state. See #783.
 */
export async function runControlActionRoute(
    id: string,
    action: ControlAction,
): Promise<ControlRouteResponse> {
    const gameRepo = getGameRepo();

    if (isLeft(gameRepo)) {
        return NextResponse.json({ error: gameRepo.left }, { status: 500 });
    }

    const game = await gameRepo.right.get(id);

    if (isLeft(game)) {
        return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }

    let result = await gameRepo.right.runControlAction(game.right, action);

    if (isLeft(result) && result.left === UPDATE_CONFLICT) {
        const fresh = await gameRepo.right.get(id);

        if (isLeft(fresh)) {
            return NextResponse.json(
                { error: "Game not found" },
                { status: 404 },
            );
        }

        result = await gameRepo.right.runControlAction(fresh.right, action);
    }

    if (isLeft(result)) {
        if (result.left === UPDATE_CONFLICT) {
            return NextResponse.json({ error: "conflict" }, { status: 409 });
        }

        return NextResponse.json({ error: result.left }, { status: 500 });
    }

    return NextResponse.json(toApiResponse(result.right));
}
