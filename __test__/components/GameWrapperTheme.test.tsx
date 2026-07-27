import {
    beforeAll,
    beforeEach,
    describe,
    expect,
    jest,
    test,
} from "@jest/globals";
import { render, screen } from "@testing-library/react";
import { Game, SetupInformation } from "@fc/types/types";
import { makeActiveGame, setupInformation } from "../fixtures/game";

// useInterval is irrelevant to theme selection; stub it so nothing schedules.
jest.mock("@fc/lib/useInterval", () => ({
    __esModule: true,
    default: () => {},
}));

// A registry that only knows the first-contact theme (and exposes it as the
// default). This lets us drive GameWrapper with a theme that is NOT registered
// and assert it falls back rather than rendering `undefined` (which React turns
// into an "Element type is invalid" crash).
jest.mock("@fc/components/theme/registry", () => ({
    __esModule: true,
    DEFAULT_THEME: "first-contact",
    THEME_REGISTRY: {
        "first-contact": () => <div>first-contact theme</div>,
    },
}));

type GameWrapperModule = typeof import("../../src/app/game/[id]/GameWrapper");
let GameWrapper: GameWrapperModule["default"];

beforeAll(async () => {
    ({ default: GameWrapper } =
        await import("../../src/app/game/[id]/GameWrapper"));
});

beforeEach(() => {
    // GameWrapper constructs an Audio element in an effect; jsdom has no media.
    (window as unknown as { Audio: unknown }).Audio = class {
        play() {
            return Promise.resolve();
        }
    };
});

describe("GameWrapper theme selection", () => {
    test("renders the registered theme when the game's theme is known", () => {
        render(<GameWrapper game={makeActiveGame()} mode="Player" />);

        expect(screen.getByText("first-contact theme")).toBeInTheDocument();
    });

    test("falls back to the default theme for an unregistered theme", () => {
        // Simulate a stale / hand-edited DB record carrying a theme the current
        // registry does not know about.
        const staleSetup = {
            ...setupInformation,
            theme: "some-removed-theme",
        } as unknown as SetupInformation;
        const staleGame: Game = makeActiveGame({
            setupInformation: staleSetup,
        });

        expect(() =>
            render(<GameWrapper game={staleGame} mode="Player" />),
        ).not.toThrow();

        expect(screen.getByText("first-contact theme")).toBeInTheDocument();
    });
});
