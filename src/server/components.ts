import { Component, ComponentType, Game } from "@fc/types/types";
import { Either, isLeft } from "fp-ts/Either";
import { MakeLeft, MakeRight } from "@fc/lib/io-ts-helpers";

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
    notFoundLabel: string = `${type} component`,
): Either<string, Game> {
    const newGame = { ...game };

    const component = findComponent(newGame.components, type);

    if (component === undefined) {
        return MakeLeft(`No ${notFoundLabel} for game ${game._id}`);
    }

    const result = apply(component);

    if (isLeft(result)) {
        return result;
    }

    if (!newGame.active) {
        const frozenComponent = findComponent(
            newGame.frozenTurn.components,
            type,
        );

        if (frozenComponent !== undefined) {
            apply(frozenComponent);
        }
    }

    return MakeRight(newGame);
}
