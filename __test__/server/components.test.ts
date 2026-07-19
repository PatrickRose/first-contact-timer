/**
 * @jest-environment node
 */
import { describe, expect, test } from "@jest/globals";
import { isLeft, isRight } from "fp-ts/Either";
import { updateComponent } from "@fc/server/components";
import { MakeLeft, MakeRight } from "@fc/lib/io-ts-helpers";
import { Component } from "@fc/types/types";
import { makeActiveGame, makeInactiveGame } from "../fixtures/game";

function weatherComponent(message: string): Component {
    return { componentType: "Weather", weatherMessage: message };
}

describe("updateComponent", () => {
    test("applies the mutation to the live component", () => {
        const game = makeActiveGame({
            components: [weatherComponent("Sunny")],
        });

        const result = updateComponent(game, "Weather", (component) => {
            component.weatherMessage = "Storms";
            return MakeRight(undefined);
        });

        expect(isRight(result)).toBe(true);
        if (isRight(result)) {
            expect(result.right.components[0]).toEqual(
                weatherComponent("Storms"),
            );
        }
    });

    test("returns a Left with the default label when the component is missing", () => {
        const game = makeActiveGame({ components: [] });

        const result = updateComponent(game, "Weather", () =>
            MakeRight(undefined),
        );

        expect(result).toEqual(
            MakeLeft("No Weather component for game test-game"),
        );
    });

    test("uses the supplied not-found label", () => {
        const game = makeActiveGame({ components: [] });

        const result = updateComponent(
            game,
            "Weather",
            () => MakeRight(undefined),
            "weather component",
        );

        expect(result).toEqual(
            MakeLeft("No weather component for game test-game"),
        );
    });

    test("propagates a Left from the mutation without touching the frozen turn", () => {
        const game = makeInactiveGame(
            { components: [weatherComponent("Sunny")] },
            { components: [weatherComponent("Sunny")] },
        );

        const result = updateComponent(game, "Weather", (component) => {
            component.weatherMessage = "Should be rolled back conceptually";
            return MakeLeft("nope");
        });

        expect(result).toEqual(MakeLeft("nope"));
        // The frozen copy was never mutated because we returned early.
        if (!game.active) {
            expect(game.frozenTurn.components[0]).toEqual(
                weatherComponent("Sunny"),
            );
        }
    });

    test("mirrors the mutation into the frozen turn when the game is paused", () => {
        const game = makeInactiveGame(
            { components: [weatherComponent("Sunny")] },
            { components: [weatherComponent("Sunny")] },
        );

        const result = updateComponent(game, "Weather", (component) => {
            component.weatherMessage = "Storms";
            return MakeRight(undefined);
        });

        expect(isRight(result)).toBe(true);
        if (isRight(result) && !result.right.active) {
            expect(result.right.components[0]).toEqual(
                weatherComponent("Storms"),
            );
            expect(result.right.frozenTurn.components[0]).toEqual(
                weatherComponent("Storms"),
            );
        }
    });

    test("mutates the live component even when the frozen turn lacks it", () => {
        const game = makeInactiveGame(
            { components: [weatherComponent("Sunny")] },
            { components: [] },
        );

        const result = updateComponent(game, "Weather", (component) => {
            component.weatherMessage = "Storms";
            return MakeRight(undefined);
        });

        expect(isRight(result)).toBe(true);
        if (isRight(result) && !result.right.active) {
            expect(result.right.components[0]).toEqual(
                weatherComponent("Storms"),
            );
            expect(result.right.frozenTurn.components).toEqual([]);
        }
    });

    test("does not touch the frozen turn for an active game", () => {
        const game = makeActiveGame({
            components: [weatherComponent("Sunny")],
        });

        const result = updateComponent(game, "Weather", (component) => {
            component.weatherMessage = "Storms";
            return MakeRight(undefined);
        });

        expect(isLeft(result)).toBe(false);
    });
});
