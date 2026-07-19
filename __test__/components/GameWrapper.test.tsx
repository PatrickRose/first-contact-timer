import {
    afterEach,
    beforeAll,
    beforeEach,
    describe,
    expect,
    jest,
    test,
} from "@jest/globals";
import { act, render } from "@testing-library/react";
import { ApiResponse, Game, SetupInformation } from "@fc/types/types";
import {
    makeActiveGame,
    makeInactiveGame,
    setupInformation,
} from "../fixtures/game";

// Capture the delay handed to every useInterval call. GameWrapper registers
// the poll interval first and the 1s local countdown second, so
// mockIntervalDelays[0] is the poll cadence this test is about.
const mockIntervalDelays: (number | null)[] = [];
const mockIntervalCallbacks: (() => void)[] = [];
jest.mock("@fc/lib/useInterval", () => ({
    __esModule: true,
    default: (callback: () => void, delay: number | null) => {
        mockIntervalCallbacks.push(callback);
        mockIntervalDelays.push(delay);
    },
}));

// The themes render a large component tree that's irrelevant here (and pulls
// in browser APIs jsdom can't provide); we only care about the poll interval.
jest.mock("@fc/components/theme/first-contact/FirstContactTheme", () => ({
    __esModule: true,
    FirstContactTheme: () => null,
}));
jest.mock("@fc/components/theme/aftermath/AftermathTheme", () => ({
    __esModule: true,
    AftermathTheme: () => null,
}));

// The module under test is imported dynamically after the mocks above are
// registered - the repo's established pattern (see __test__/app/game/api.test.ts).
type GameWrapperModule = typeof import("../../src/app/game/[id]/GameWrapper");
let GameWrapper: GameWrapperModule["default"];

beforeAll(async () => {
    ({ default: GameWrapper } =
        await import("../../src/app/game/[id]/GameWrapper"));
});

// The default fixture's phaseEnd is in the past, so toApiResponse yields
// phaseEnd === 0 - exactly the condition that used to collapse the poll
// interval to 100ms. maxTurns:1 + the final phase makes atTurnLimit true.
const finishedSetup: SetupInformation = { ...setupInformation, maxTurns: 1 };
const finishedGame: Game = makeActiveGame({
    setupInformation: finishedSetup,
    turnInformation: {
        turnNumber: 1,
        currentPhase: finishedSetup.phases.length,
        phaseEnd: new Date(2023, 1, 2, 3, 5, 10, 0).toString(),
    },
});

function pollDelay(): number {
    const delay = mockIntervalDelays[0];
    expect(typeof delay).toBe("number");
    return delay as number;
}

// GameWrapper registers exactly two intervals per render (poll, then the 1s
// countdown), so the poll delay from each render is at the even indices.
function pollDelays(): (number | null)[] {
    return mockIntervalDelays.filter((_, index) => index % 2 === 0);
}

describe("GameWrapper poll interval", () => {
    beforeEach(() => {
        mockIntervalDelays.length = 0;
        mockIntervalCallbacks.length = 0;
        // Fixed jitter factor -> deterministic delays: the multiplier is
        // 1 + 0.5 * 0.25 = 1.125.
        jest.spyOn(Math, "random").mockReturnValue(0.5);
        // jsdom doesn't implement media playback; GameWrapper constructs an
        // Audio element in an effect, so provide a harmless stub.
        (window as unknown as { Audio: unknown }).Audio = class {
            play() {
                return Promise.resolve();
            }
        };
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    test("polls at the steady active cadence for a running game", () => {
        render(<GameWrapper game={makeActiveGame()} mode="Player" />);

        // 5000 * 1.125
        expect(pollDelay()).toBe(5625);
    });

    test("does not fast-poll at a phase boundary (phaseEnd === 0)", () => {
        // The active fixture's phaseEnd is already in the past, so the initial
        // apiResponse has phaseEnd === 0 - the old code polled every 100ms here.
        render(<GameWrapper game={makeActiveGame()} mode="Player" />);

        expect(pollDelay()).toBeGreaterThanOrEqual(1000);
        expect(pollDelay()).not.toBe(100);
    });

    test("backs off to the slow cadence once the game has finished", () => {
        render(<GameWrapper game={finishedGame} mode="Player" />);

        // 30000 * 1.125
        expect(pollDelay()).toBe(33750);
    });

    test("never collapses to the 100ms fast-poll for a finished game", () => {
        render(<GameWrapper game={finishedGame} mode="Player" />);

        expect(pollDelay()).toBeGreaterThanOrEqual(30000);
        expect(pollDelay()).not.toBe(100);
    });

    test("backs off to the slow cadence while paused", () => {
        render(<GameWrapper game={makeInactiveGame()} mode="Player" />);

        expect(pollDelay()).toBe(33750);
    });

    test("floors the interval at 1s regardless of jitter", () => {
        // Smallest possible jitter factor -> no inflation, bare base delay.
        jest.spyOn(Math, "random").mockReturnValue(0);

        render(<GameWrapper game={makeActiveGame()} mode="Player" />);

        expect(pollDelay()).toBe(5000);
        expect(pollDelay()).toBeGreaterThanOrEqual(1000);
    });

    test("re-derives the cadence when the game finishes mid-session", async () => {
        // finished is a plain derived value, not memoised, so it must react to
        // apiResponse changing after mount. This game has a turn limit but
        // starts mid-game (phase 1), so it is not finished at mount.
        const game = makeActiveGame({
            setupInformation: finishedSetup,
            turnInformation: {
                turnNumber: 1,
                currentPhase: 1,
                phaseEnd: new Date(2023, 1, 2, 3, 5, 10, 0).toString(),
            },
        });

        // When the poll fires, the server reports the game has hit its limit.
        const finishedBody: ApiResponse = {
            turnNumber: 1,
            phase: finishedSetup.phases.length,
            breakingNews: [],
            active: true,
            phaseEnd: 0,
            components: [],
        };
        (global as unknown as { fetch: unknown }).fetch = jest.fn(() =>
            Promise.resolve({ json: () => Promise.resolve(finishedBody) }),
        );

        render(<GameWrapper game={game} mode="Player" />);

        // Mount: not finished yet -> steady active cadence.
        expect(pollDelays().at(-1)).toBe(5625);

        // Drive one poll cycle; the finished response flows into state and the
        // component re-renders.
        await act(async () => {
            mockIntervalCallbacks[0]();
        });

        // The re-render re-derives finished from the new apiResponse and backs
        // the poll interval off to the slow cadence - proving it is not frozen
        // at its mount value.
        expect(pollDelays().at(-1)).toBe(33750);
    });
});
