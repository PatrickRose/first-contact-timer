import { jest } from "@jest/globals";
import {
    ApiResponse,
    FrozenTurn,
    Game,
    SetupInformation,
} from "@fc/types/types";
import GameRepository from "@fc/server/repository/game";
import { isLeft } from "fp-ts/Either";
import { MakeRight } from "@fc/lib/io-ts-helpers";

export const phases: SetupInformation["phases"] = [
    {
        title: "Phase 1",
        length: 1,
        hidden: false,
    },
    {
        title: "Phase 2",
        length: 2,
        hidden: false,
    },
    {
        title: "Phase 3",
        length: 3,
        hidden: false,
    },
];

export const setupInformation: SetupInformation = {
    theme: "first-contact",
    components: [],
    breakingNewsBanner: false,
    press: false,
    gameName: "TEST GAME",
    phases,
};

/**
 * The persisted snapshot shape - what a paused game stores as `frozenTurn`. It
 * deliberately has no `lastUpdated`; that lives on the game document.
 */
export function makeFrozenTurn(
    overrides: Partial<FrozenTurn> = {},
): FrozenTurn {
    return {
        turnNumber: 1,
        phase: 1,
        breakingNews: [],
        active: false,
        phaseEnd: 60,
        components: [],
        ...overrides,
    };
}

/**
 * The wire shape - a frozen turn plus the game-level `lastUpdated` stamp. Use
 * this for asserting on route/`toApiResponse` bodies so that adding another
 * document-level field later is a one-line change here rather than an edit to
 * every assertion.
 */
export function makeApiResponse(
    overrides: Partial<ApiResponse> = {},
): ApiResponse {
    return { ...makeFrozenTurn(), lastUpdated: 0, ...overrides };
}

export function makeActiveGame(overrides: Partial<Game> = {}): Game {
    return {
        _id: "test-game",
        setupInformation,
        turnInformation: {
            turnNumber: 1,
            currentPhase: 1,
            phaseEnd: new Date(2023, 1, 2, 3, 5, 10, 0).toString(),
        },
        breakingNews: [],
        components: [],
        active: true,
        ...overrides,
    } as Game;
}

export function makeInactiveGame(
    overrides: Partial<Game> = {},
    frozenOverrides: Partial<ApiResponse> = {},
): Game {
    return {
        ...makeActiveGame(),
        active: false,
        frozenTurn: makeFrozenTurn(frozenOverrides),
        ...overrides,
    } as Game;
}

/**
 * A fake GameRepository whose runControlAction applies the given action to
 * the game in memory (like the real Mongo implementation does via $set),
 * so route tests exercise the control action logic embedded in each route.
 */
export function makeFakeGameRepo(game: Game) {
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
        runControlAction: jest.fn<GameRepository["runControlAction"]>(
            async (currentGame, action) => {
                const result = action(currentGame);

                if (isLeft(result)) {
                    return result;
                }

                return MakeRight({ ...currentGame, ...result.right } as Game);
            },
        ),
        setBreakingNews: jest.fn<GameRepository["setBreakingNews"]>(
            async (current) => MakeRight(current),
        ),
    };
}
