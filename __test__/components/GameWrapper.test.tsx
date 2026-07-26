import {
    afterEach,
    beforeAll,
    beforeEach,
    describe,
    expect,
    jest,
    test,
} from "@jest/globals";
import { act, render, screen } from "@testing-library/react";
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
// Mocking the registry rather than each theme keeps the theme selection out of
// these tests and avoids the async next/dynamic loadable entirely.
//
// The stand-in still renders `childComponent`, because that is where the control
// and press tools live and one of the tests below drives a control action.
jest.mock("@fc/components/theme/registry", () => ({
    __esModule: true,
    THEME_REGISTRY: new Proxy(
        {},
        {
            get:
                () =>
                ({ childComponent }: { childComponent: React.ReactNode }) => (
                    <>{childComponent}</>
                ),
        },
    ),
}));

// window.location.reload cannot be spied on in jsdom (Location's members are
// [LegacyUnforgeable], so both jest.spyOn and defineProperty throw), which is
// why GameWrapper goes through this module.
jest.mock("@fc/lib/reload", () => ({
    __esModule: true,
    hardReload: jest.fn(),
}));

// ControlTools is stubbed to a button that hands a response straight back, so we
// can prove the edit check also covers the mutation paths - not just the poll.
const controlResponse: { current: ApiResponse | null } = { current: null };
jest.mock("@fc/components/ControlTools", () => ({
    __esModule: true,
    default: ({
        setApiResponse,
    }: {
        setApiResponse: (apiResponse: ApiResponse) => void;
    }) => (
        <button
            type="button"
            onClick={() => {
                if (controlResponse.current !== null) {
                    setApiResponse(controlResponse.current);
                }
            }}
        >
            fake control action
        </button>
    ),
}));

// The module under test is imported dynamically after the mocks above are
// registered - the repo's established pattern (see __test__/app/game/api.test.ts).
type GameWrapperModule = typeof import("../../src/app/game/[id]/GameWrapper");
let GameWrapper: GameWrapperModule["default"];
let hardReload: jest.Mock<() => void>;

beforeAll(async () => {
    ({ default: GameWrapper } =
        await import("../../src/app/game/[id]/GameWrapper"));
    ({ hardReload } = (await import("@fc/lib/reload")) as never);
});

// Records every chime attempt so a "did not play" assertion can't pass because
// the stub was never wired up.
const audioPlay = jest.fn(() => Promise.resolve());

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

/**
 * The poll callback from the most recent render.
 *
 * Not `mockIntervalCallbacks[0]`: that closure is from the very first render,
 * before the effect that constructs the Audio element has run, so `audio` is
 * still undefined inside it and the turn-change chime can never fire. Tests that
 * care about the chime have to drive the latest closure.
 */
function latestPoll(): () => void {
    const polls = mockIntervalCallbacks.filter((_, index) => index % 2 === 0);
    const poll = polls.at(-1);

    expect(poll).toBeDefined();
    return poll as () => void;
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
        audioPlay.mockClear();
        (window as unknown as { Audio: unknown }).Audio = class {
            play = audioPlay;
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
            lastUpdated: 0,
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

describe("GameWrapper reload-on-edit", () => {
    // `setupInformation` (phase names/lengths, theme, press config) comes from the
    // server-rendered `game` prop and is never refreshed by polling, so a full
    // document load is the only way an admin edit reaches an open screen.
    // GameWrapper compares each response's stamp against the one it rendered
    // with; these tests pin the comparison and its side effects.
    function makeBody(overrides: Partial<ApiResponse> = {}): ApiResponse {
        return {
            turnNumber: 1,
            phase: 1,
            breakingNews: [],
            active: true,
            phaseEnd: 30,
            lastUpdated: 0,
            components: [],
            ...overrides,
        };
    }

    function mockPoll(body: ApiResponse) {
        (global as unknown as { fetch: unknown }).fetch = jest.fn(() =>
            Promise.resolve({ json: () => Promise.resolve(body) }),
        );
    }

    beforeEach(() => {
        mockIntervalDelays.length = 0;
        mockIntervalCallbacks.length = 0;
        controlResponse.current = null;
        hardReload.mockClear();
        jest.spyOn(Math, "random").mockReturnValue(0.5);
        audioPlay.mockClear();
        (window as unknown as { Audio: unknown }).Audio = class {
            play = audioPlay;
        };
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    test("reloads when the poll reports a newer stamp", async () => {
        mockPoll(makeBody({ lastUpdated: 1_700_000_000_000 }));

        render(<GameWrapper game={makeActiveGame()} mode="Player" />);

        await act(async () => {
            latestPoll()();
        });

        expect(hardReload).toHaveBeenCalledTimes(1);
    });

    test("does not reload when the stamp is unchanged", async () => {
        // Strict `>`: an equal stamp is the normal case on every single poll, so
        // a `>=` here would reload every device forever.
        mockPoll(makeBody({ lastUpdated: 500 }));

        render(
            <GameWrapper
                game={makeActiveGame({ lastUpdated: 500 })}
                mode="Player"
            />,
        );

        await act(async () => {
            latestPoll()();
        });

        expect(hardReload).not.toHaveBeenCalled();
    });

    test("does not reload when the stamp goes backwards", async () => {
        // Clock skew or a lagging replica should not trigger anything.
        mockPoll(makeBody({ lastUpdated: 100 }));

        render(
            <GameWrapper
                game={makeActiveGame({ lastUpdated: 5000 })}
                mode="Player"
            />,
        );

        await act(async () => {
            latestPoll()();
        });

        expect(hardReload).not.toHaveBeenCalled();
    });

    test("reloads a game that had no stamp before it was edited", async () => {
        // Most games predate the field, so this is the common first-edit path. A
        // "no baseline, do nothing" guard would break exactly this case.
        const game = makeActiveGame();
        expect(game.lastUpdated).toBeUndefined();

        mockPoll(makeBody({ lastUpdated: 1 }));

        render(<GameWrapper game={game} mode="Player" />);

        await act(async () => {
            latestPoll()();
        });

        expect(hardReload).toHaveBeenCalledTimes(1);
    });

    test("plays the chime on a turn change with an unchanged stamp", async () => {
        // The control for the test below: proves the chime does fire here, so
        // "did not play" there is a real assertion rather than a broken stub.
        mockPoll(makeBody({ turnNumber: 2, lastUpdated: 0 }));

        render(<GameWrapper game={makeActiveGame()} mode="Player" />);

        await act(async () => {
            latestPoll()();
        });

        expect(hardReload).not.toHaveBeenCalled();
        expect(audioPlay).toHaveBeenCalled();
    });

    test("does not play the chime when it is reloading", async () => {
        // An edit response can carry a new turn number too (the phase gets
        // recomputed), and that is not a turn change the players should hear.
        mockPoll(makeBody({ turnNumber: 2, lastUpdated: 1_700_000_000_000 }));

        render(<GameWrapper game={makeActiveGame()} mode="Player" />);

        await act(async () => {
            latestPoll()();
        });

        expect(hardReload).toHaveBeenCalledTimes(1);
        expect(audioPlay).not.toHaveBeenCalled();
    });

    test("does not adopt the response when it is reloading", async () => {
        // Applying a fresh phase against the stale phase list is what both themes
        // throw on, so the poll must return before setAPIResponse. Observed via
        // the poll cadence, which is derived from apiResponse: the finished body
        // would back it off to 33750 if it had been applied.
        const finishedish = makeBody({
            turnNumber: 1,
            phase: finishedSetup.phases.length,
            phaseEnd: 0,
            lastUpdated: 1_700_000_000_000,
        });
        mockPoll(finishedish);

        render(
            <GameWrapper
                game={makeActiveGame({
                    setupInformation: finishedSetup,
                    turnInformation: {
                        turnNumber: 1,
                        currentPhase: 1,
                        phaseEnd: new Date(2023, 1, 2, 3, 5, 10, 0).toString(),
                    },
                })}
                mode="Player"
            />,
        );

        expect(pollDelays().at(-1)).toBe(5625);

        await act(async () => {
            latestPoll()();
        });

        expect(hardReload).toHaveBeenCalledTimes(1);
        // Still the active cadence: the response never reached state.
        expect(pollDelays().at(-1)).toBe(5625);
    });

    test("also checks responses that come back from a control action", async () => {
        // The control desk, the seven component controls and the press form all
        // adopt a server ApiResponse directly. They go through the same funnel, so
        // whichever screen acts first picks up the edit.
        mockPoll(makeBody());
        controlResponse.current = makeBody({ lastUpdated: 1_700_000_000_000 });

        render(<GameWrapper game={makeActiveGame()} mode="Control" />);

        expect(hardReload).not.toHaveBeenCalled();

        await act(async () => {
            screen.getByRole("button", { name: "fake control action" }).click();
        });

        expect(hardReload).toHaveBeenCalledTimes(1);
    });
});
