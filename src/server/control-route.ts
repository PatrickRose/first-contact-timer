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
 * poll). How a conflict is handled depends on whether the action is safe to
 * re-apply on fresh state:
 *
 *  - Idempotent actions (component edits, and pause/play which set absolute
 *    state) are re-fetched and re-applied once; a persistent conflict is a 409.
 *  - Non-idempotent actions (relative turn navigation such as forward-phase)
 *    must NOT be retried: re-applying on already-advanced state would advance
 *    the game a second time. They return 409 immediately so the operator can
 *    re-decide against fresh state.
 *
 * Callers pass retryOnConflict accordingly (default true for the idempotent
 * component-edit path). See #783.
 */
export async function runControlActionRoute(
    id: string,
    action: ControlAction,
    retryOnConflict: boolean = true,
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

    if (isLeft(result) && result.left === UPDATE_CONFLICT && retryOnConflict) {
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
