import {
    ApiResponse,
    Component,
    ComponentType,
    ControlAction,
    Game,
} from "@fc/types/types";
import { Either, isLeft } from "fp-ts/Either";
import { MakeLeft, MakeRight } from "@fc/lib/io-ts-helpers";
import { NextRequest, NextResponse } from "next/server";
import { getGameRepo, UPDATE_CONFLICT } from "@fc/server/repository/game";
import { toApiResponse } from "@fc/server/turn";

/**
 * The concrete component variant for a given componentType discriminant.
 */
export type ComponentOfType<T extends ComponentType> = Extract<
    Component,
    { componentType: T }
>;

/**
 * A mutation applied to a single component in place. Returns a `Left` to
 * signal a domain error (e.g. an unknown country / runner / tracker) or a
 * `Right<void>` on success.
 */
export type ComponentMutation<T extends ComponentType> = (
    component: ComponentOfType<T>,
    game: Game,
) => Either<string, void>;

function findComponent<T extends ComponentType>(
    components: Component[],
    type: T,
): ComponentOfType<T> | undefined {
    const component = components.find((val) => val.componentType == type);

    if (component?.componentType != type) {
        return undefined;
    }

    return component as ComponentOfType<T>;
}

/**
 * Owns the "find the component, mutate it, and mirror the mutation into the
 * frozen turn when the game is paused" logic in one tested place.
 *
 * Previously every control route hand-repeated the frozenTurn mirror step;
 * forgetting it meant a paused display silently stopped updating. Centralising
 * it removes that whole class of bug.
 *
 * The mutation is applied independently to the live component and (when paused)
 * the frozen copy, so any clamping/arithmetic is recomputed consistently from
 * each copy's own state.
 */
export function updateComponent<T extends ComponentType>(
    game: Game,
    type: T,
    apply: ComponentMutation<T>,
    notFoundLabel: string = type,
): Either<string, Game> {
    const newGame = { ...game };

    const component = findComponent(newGame.components, type);

    if (component === undefined) {
        return MakeLeft(`No ${notFoundLabel} component for game ${game._id}`);
    }

    const result = apply(component, newGame);

    if (isLeft(result)) {
        return result;
    }

    if (!newGame.active) {
        const frozenComponent = findComponent(
            newGame.frozenTurn.components,
            type,
        );

        if (frozenComponent !== undefined) {
            const frozenResult = apply(frozenComponent, newGame);

            if (isLeft(frozenResult)) {
                return frozenResult;
            }
        }
    }

    return MakeRight(newGame);
}

type Decoder<B> = { is: (u: unknown) => u is B };

/**
 * One (decoder, mutation) pairing for a component route. A route may accept
 * several body shapes for the same component (e.g. trackers set/add/delete).
 * The body type is erased to `unknown` internally but preserved at the call
 * site via this factory.
 */
export type ComponentRouteAction<T extends ComponentType> = {
    is: (u: unknown) => boolean;
    apply: (
        body: unknown,
        component: ComponentOfType<T>,
        game: Game,
    ) => Either<string, void>;
};

export function componentAction<T extends ComponentType, B>(
    componentType: T,
    decoder: Decoder<B>,
    apply: (
        body: B,
        component: ComponentOfType<T>,
        game: Game,
    ) => Either<string, void>,
): ComponentRouteAction<T> {
    // componentType is only used to bind T for inference at the call site.
    void componentType;
    return {
        is: (u): boolean => decoder.is(u),
        apply: (body, component, game) => apply(body as B, component, game),
    };
}

type ControlRouteResponse = NextResponse<ApiResponse | { error: string }>;

type ComponentRouteHandler = (
    request: NextRequest,
    props: { params: Promise<{ id: string }> },
) => Promise<ControlRouteResponse>;

/**
 * Runs a control action for a game and maps the result to a response, shared by
 * the component routes and the pause/play control route.
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

/**
 * Builds a control route handler for a component. Collapses the ~70-line
 * copy-pasted handler (parse -> decode -> repo -> get -> mutate -> mirror ->
 * error-map -> respond) into a decoder + mutation pair, preserving the exact
 * status codes: 400 (bad body), 404 (game not found), 500 (errors).
 */
export function makeComponentRoute<T extends ComponentType>(
    componentType: T,
    notFoundLabel: string,
    actions: ComponentRouteAction<T>[],
): ComponentRouteHandler {
    return async (request, props) => {
        const params = await props.params;
        const id = params.id;

        let body: unknown;
        try {
            body = await request.json();
        } catch {
            // A malformed JSON body is a client error, not a server error;
            // fall through to the same 400 the invalid-body path returns.
            return NextResponse.json(
                { error: "Incorrect request" },
                { status: 400 },
            );
        }

        const action = actions.find((candidate) => candidate.is(body));

        if (action === undefined) {
            return NextResponse.json(
                { error: "Incorrect request" },
                { status: 400 },
            );
        }

        return runControlActionRoute(id, (g) =>
            updateComponent(
                g,
                componentType,
                (component, currentGame) =>
                    action.apply(body, component, currentGame),
                notFoundLabel,
            ),
        );
    };
}
