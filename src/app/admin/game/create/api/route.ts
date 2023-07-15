import {Request} from "next/dist/compiled/@edge-runtime/primitives";
import {CreateGameRequest, CreateGameResponse, Game, GameType, Turn} from "../../../../../types/types";
import {CreateGameRequestDecode} from "../../../../../types/io-ts-def";
import {NextResponse} from "next/server";
import {set} from "fp-ts";
import {createGame} from "../../../../../server/turn";
import {isRight} from "fp-ts/lib/Either";
import {isLeft} from "fp-ts/Either";
import {getGameRepo} from "../../../../../server/repository/game";

const GAME_TYPES: Record<GameType, { setupInformation: Game["setupInformation"], components: Game["components"] }> = {
    "first-contact": {
        setupInformation: {
            phases: [
                {
                    title: "Team Time",
                    length: 10,
                    hidden: true,
                },
                {
                    title: "Action Phase 1 begins in",
                    length: 2,
                    hidden: true
                },
                {
                    title: "Action Phase 1",
                    length: 20,
                    hidden: true
                },
                {
                    title: "Action Phase 2 begins in",
                    length: 2,
                    hidden: true
                },
                {
                    title: "Action Phase 2",
                    length: 10,
                    hidden: true
                },
                {
                    title: "Action Phase 3 begins in",
                    length: 2,
                    hidden: true
                },
                {
                    title: "Action Phase 3",
                    length: 5,
                    hidden: true
                },
                {
                    title: "Press Broadcast begins in",
                    length: 2,
                    hidden: true
                },
                {
                    title: "Press Broadcast",
                    length: 5,
                    hidden: true
                },
                {
                    title: "Next turn (Team Time) begins in",
                    length: 2,
                    hidden: true
                },
            ],
            theme: "first-contact",
            breakingNewsBanner: false,
            components: ['Defcon'],
        },
        components: [
            {
                componentType: "Defcon",
                countries: {
                    China: 3,
                    France: 3,
                    Russia: 3,
                    UnitedStates: 3,
                    UnitedKingdom: 3,
                    Pakistan: 3,
                    India: 3,
                    Israel: "hidden",
                }
            }
        ]
    }
}

export async function POST(request: Request): Promise<NextResponse<CreateGameResponse>> {
    const createGameReq = await request.json()

    if (!CreateGameRequestDecode.is(createGameReq)) {
        return NextResponse.json(
            {
                result: false,
                errors: [
                    "Incorrect request"
                ]
            },
            {status: 400}
        );
    }

    const {setupInformation, components} = GAME_TYPES[createGameReq.type]

    const game = createGame(createGameReq.gameID, setupInformation, components);

    if (isLeft(game)) {
        return NextResponse.json(
            {
                result: false,
                errors: [
                    "Failed to create game",
                    game.left
                ]
            },
            {status: 500}
        );
    }

    const gamesRepo = getGameRepo();

    if (isLeft(gamesRepo)) {
        return NextResponse.json(
            {
                result: false,
                errors: [
                    "Couldn't get the games repo",
                    gamesRepo.left
                ]
            },
            {status: 500}
        );
    }

    const result = await gamesRepo.right.insert(game.right);

    if (isLeft(result)) {
        return NextResponse.json(
            {
                result: false,
                errors: [
                    "Failed to insert game",
                    result.left
                ]
            },
            {status: 500}
        );
    }

    return NextResponse.json({result: true});
}
