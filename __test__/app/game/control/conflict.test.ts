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
import { MakeLeft, MakeRight } from "@fc/lib/io-ts-helpers";
import { makeActiveGame } from "../../../fixtures/game";
import { makeProps, makeRequest } from "../../../fixtures/routes";
import GameRepository, { UPDATE_CONFLICT } from "@fc/server/repository/game";

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
