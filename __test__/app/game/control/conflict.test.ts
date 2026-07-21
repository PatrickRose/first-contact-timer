/**
 * @jest-environment node
 *
 * Tests the shared CAS-conflict handling (retry once, then 409) that both the
 * component route factory and the pause/play control route go through. See
 * #783.
 */
import {
    afterEach,
    beforeAll,
    beforeEach,
    describe,
    expect,
    jest,
    test,
} from "@jest/globals";
import type { Mock } from "jest-mock";
import { isLeft } from "fp-ts/Either";
import { MakeLeft, MakeRight } from "@fc/lib/io-ts-helpers";
import { makeActiveGame } from "../../../fixtures/game";
import { makeProps, makeRequest } from "../../../fixtures/routes";
import GameRepository, { UPDATE_CONFLICT } from "@fc/server/repository/game";
import { Game } from "@fc/types/types";

jest.mock("@fc/server/repository/game", () => ({
    __esModule: true,
    getGameRepo: jest.fn(),
    // Use the real sentinel symbol so the route's conflict dispatch is exercised
    // exactly as in production, not against a stand-in string.
    UPDATE_CONFLICT: (
        jest.requireActual("@fc/server/repository/game") as {
            UPDATE_CONFLICT: symbol;
        }
    ).UPDATE_CONFLICT,
}));

type Handler = (
    request: ReturnType<typeof makeRequest>,
    props: ReturnType<typeof makeProps>,
) => Promise<Response>;

let defconPost: Handler;
let controlPost: Handler;
let getGameRepo: Mock<() => ReturnType<typeof MakeRight<GameRepository>>>;

beforeAll(async () => {
    ({ getGameRepo } = (await import("@fc/server/repository/game")) as never);
    ({ POST: defconPost } =
        (await import("../../../../src/app/game/[id]/control/api/defcon/route")) as {
            POST: Handler;
        });
    ({ POST: controlPost } =
        (await import("../../../../src/app/game/[id]/control/api/route")) as {
            POST: Handler;
        });
});

const mockedDate = new Date(2023, 1, 2, 3, 4, 5, 0);

beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(mockedDate);
    getGameRepo.mockReset();
});

afterEach(() => {
    jest.useRealTimers();
});

function makeRepo(
    runControlAction: GameRepository["runControlAction"],
): GameRepository {
    const game = makeActiveGame();
    return {
        get: jest.fn<GameRepository["get"]>(async () => MakeRight(game)),
        list: jest.fn<GameRepository["list"]>(async () =>
            MakeRight({ games: [game], total: 1, page: 1 }),
        ),
        insert: jest.fn<GameRepository["insert"]>(async () =>
            MakeRight<true>(true),
        ),
        nextTurn: jest.fn<GameRepository["nextTurn"]>(async (current) =>
            MakeRight(current),
        ),
        runControlAction: jest.fn(runControlAction),
        setBreakingNews: jest.fn<GameRepository["setBreakingNews"]>(
            async (current) => MakeRight(current),
        ),
    };
}

describe("CAS conflict handling", () => {
    describe.each([
        {
            name: "control route (pause)",
            post: () => controlPost,
            body: { action: "pause" },
        },
        {
            name: "component route (defcon)",
            post: () => defconPost,
            body: { stateName: "China", newStatus: 1 },
        },
    ])("$name", ({ post, body }) => {
        test("retries once and succeeds when the first update conflicts", async () => {
            let calls = 0;
            const runControlAction = jest.fn(async () => {
                calls += 1;
                return calls === 1
                    ? MakeLeft(UPDATE_CONFLICT)
                    : MakeRight(makeActiveGame());
            }) as unknown as GameRepository["runControlAction"];

            const repo = makeRepo(runControlAction);
            getGameRepo.mockReturnValue(MakeRight(repo));

            const response = await post()(makeRequest(body), makeProps());

            expect(response.status).toBe(200);
            expect(repo.runControlAction).toHaveBeenCalledTimes(2);
            // Initial fetch + one re-fetch for the retry.
            expect(repo.get).toHaveBeenCalledTimes(2);
        });

        test("returns 409 after a persistent conflict and only retries once", async () => {
            const repo = makeRepo(async () => MakeLeft(UPDATE_CONFLICT));
            getGameRepo.mockReturnValue(MakeRight(repo));

            const response = await post()(makeRequest(body), makeProps());

            expect(response.status).toBe(409);
            expect(await response.json()).toEqual({ error: "conflict" });
            expect(repo.runControlAction).toHaveBeenCalledTimes(2);
        });

        test("does not retry for a non-conflict error", async () => {
            const repo = makeRepo(async () => MakeLeft("some other failure"));
            getGameRepo.mockReturnValue(MakeRight(repo));

            const response = await post()(makeRequest(body), makeProps());

            expect(response.status).toBe(500);
            expect(await response.json()).toEqual({
                error: "some other failure",
            });
            expect(repo.runControlAction).toHaveBeenCalledTimes(1);
        });

        test("returns 404 when the game vanishes before the retry", async () => {
            const repo = makeRepo(async () => MakeLeft(UPDATE_CONFLICT));
            // First get succeeds, the retry re-fetch finds nothing.
            (repo.get as Mock<GameRepository["get"]>)
                .mockResolvedValueOnce(MakeRight(makeActiveGame()))
                .mockResolvedValueOnce(MakeLeft(false));
            getGameRepo.mockReturnValue(MakeRight(repo));

            const response = await post()(makeRequest(body), makeProps());

            expect(response.status).toBe(404);
            // The action never ran a second time because the re-fetch failed.
            expect(repo.runControlAction).toHaveBeenCalledTimes(1);
        });
    });
});

/**
 * A repository whose runControlAction performs a real compare-and-set on
 * turnInformation. A concurrent writer advances the game by one phase right
 * after the first read, so the operator's action always conflicts on its first
 * attempt. This lets us assert the resulting turn VALUE (single vs double
 * advance), not just call counts.
 */
function makeCasRepo(): { repo: GameRepository; getStore: () => Game } {
    // Start on phase 1.
    let store = makeActiveGame({
        turnInformation: {
            turnNumber: 1,
            currentPhase: 1,
            phaseEnd: makeActiveGame().turnInformation.phaseEnd,
        },
    });
    let concurrentAdvancesLeft = 1;

    const get = jest.fn<GameRepository["get"]>(async () => {
        const snapshot = store;

        if (concurrentAdvancesLeft > 0) {
            concurrentAdvancesLeft -= 1;
            // Simulate another writer advancing the turn immediately after this
            // read, so the caller's snapshot is now stale.
            store = {
                ...store,
                turnInformation: {
                    ...store.turnInformation,
                    currentPhase: store.turnInformation.currentPhase + 1,
                },
            };
        }

        return MakeRight(snapshot);
    });

    const runControlAction = jest.fn<GameRepository["runControlAction"]>(
        async (currentGame, action) => {
            // Compare-and-set on turnInformation, mirroring the Mongo filter.
            if (
                JSON.stringify(store.turnInformation) !==
                JSON.stringify(currentGame.turnInformation)
            ) {
                return MakeLeft(UPDATE_CONFLICT);
            }

            const result = action(currentGame);

            if (isLeft(result)) {
                return result;
            }

            store = { ...store, ...result.right } as Game;
            return MakeRight(store);
        },
    );

    const repo: GameRepository = {
        get,
        list: jest.fn<GameRepository["list"]>(async () =>
            MakeRight({ games: [store], total: 1, page: 1 }),
        ),
        insert: jest.fn<GameRepository["insert"]>(async () =>
            MakeRight<true>(true),
        ),
        nextTurn: jest.fn<GameRepository["nextTurn"]>(async (current) =>
            MakeRight(current),
        ),
        runControlAction,
        setBreakingNews: jest.fn<GameRepository["setBreakingNews"]>(
            async (current) => MakeRight(current),
        ),
    };

    return { repo, getStore: () => store };
}

describe("retry safety by action type", () => {
    test("a relative turn action returns 409 without retrying or double-advancing", async () => {
        const { repo, getStore } = makeCasRepo();
        getGameRepo.mockReturnValue(MakeRight(repo));

        const response = await controlPost(
            makeRequest({ action: "forward-phase" }),
            makeProps(),
        );

        expect(response.status).toBe(409);
        expect(await response.json()).toEqual({ error: "conflict" });
        // No retry: the action was attempted exactly once.
        expect(repo.runControlAction).toHaveBeenCalledTimes(1);
        // The game advanced exactly once (to phase 2 by the concurrent writer),
        // NOT twice - the operator's forward-phase was not re-applied.
        expect(getStore().turnInformation.currentPhase).toBe(2);
        expect(getStore().turnInformation.turnNumber).toBe(1);
    });

    test("an idempotent action still retries once and succeeds", async () => {
        const { repo } = makeCasRepo();
        getGameRepo.mockReturnValue(MakeRight(repo));

        const response = await controlPost(
            makeRequest({ action: "pause" }),
            makeProps(),
        );

        expect(response.status).toBe(200);
        // First attempt conflicts, the re-fetched attempt succeeds.
        expect(repo.runControlAction).toHaveBeenCalledTimes(2);
    });
});
