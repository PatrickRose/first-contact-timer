import {
    afterEach,
    beforeAll,
    beforeEach,
    describe,
    expect,
    jest,
    test,
} from "@jest/globals";
import { render } from "@testing-library/react";
import { Game, SetupInformation } from "@fc/types/types";
import {
    makeActiveGame,
    makeInactiveGame,
    setupInformation,
} from "../fixtures/game";

// Capture the delay handed to every useInterval call. GameWrapper registers
// the poll interval first and the 1s local countdown second, so
// mockIntervalDelays[0] is the poll cadence this test is about.
const mockIntervalDelays: (number | null)[] = [];
jest.mock("@fc/lib/useInterval", () => ({
    __esModule: true,
    default: (_callback: () => void, delay: number | null) => {
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

describe("GameWrapper poll interval", () => {
    beforeEach(() => {
        mockIntervalDelays.length = 0;
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
});
