import { Request } from "next/dist/compiled/@edge-runtime/primitives";
import {
    CreateGameResponse,
    Game,
    GameType,
    RunningHotRunners,
} from "@fc/types/types";
import {
    CreateGameRequestDecode,
    RunningHotRunnersDecode,
} from "@fc/types/io-ts-def";
import { NextResponse } from "next/server";
import { createGame } from "../../../../../server/turn";
import { isLeft } from "fp-ts/Either";
import { getGameRepo } from "../../../../../server/repository/game";

const runningHotGangs: RunningHotRunners["rep"] = {};
// g33ks
["G1T", "$0FTW4R3", "CYCL3", "$TUX", "Z3R0"].forEach((val) => {
    runningHotGangs[val] = {
        gang: "G33ks",
        reputation: 1,
    };
});
// Dancers
["Ballet", "Tap", "Swing", "Hustle"].forEach((val) => {
    runningHotGangs[val] = {
        gang: "Dancers",
        reputation: 1,
    };
});
// Facers
["Next", "Ghost", "Con", "Wicker", "Vampire"].forEach((val) => {
    runningHotGangs[val] = {
        gang: "Facers",
        reputation: 1,
    };
});
// Gruffsters
["Pale", "Bitter", "Groucho", "Scorer"].forEach((val) => {
    runningHotGangs[val] = {
        gang: "Gruffsters",
        reputation: 1,
    };
});
const GAME_TYPES: Record<
    GameType,
    {
        setupInformation: Game["setupInformation"];
        components: Game["components"];
    }
> = {
    "first-contact": {
        setupInformation: {
            gameName: "First Contact: 2035",
            phases: [
                {
                    title: "Team Time",
                    length: 10,
                    hidden: false,
                },
                {
                    title: "Action Phase 1 begins in",
                    length: 2,
                    hidden: true,
                },
                {
                    title: "Action Phase 1",
                    length: 20,
                    hidden: false,
                },
                {
                    title: "Action Phase 2 begins in",
                    length: 2,
                    hidden: true,
                },
                {
                    title: "Action Phase 2",
                    length: 10,
                    hidden: false,
                },
                {
                    title: "Action Phase 3 begins in",
                    length: 2,
                    hidden: true,
                },
                {
                    title: "Action Phase 3",
                    length: 5,
                    hidden: false,
                },
                {
                    title: "Press Broadcast begins in",
                    length: 2,
                    hidden: true,
                },
                {
                    title: "Press Broadcast",
                    length: 5,
                    hidden: false,
                },
                {
                    title: "Next turn (Team Time) begins in",
                    length: 2,
                    hidden: true,
                },
            ],
            theme: "first-contact",
            breakingNewsBanner: true,
            components: ["Defcon"],
        },
        components: [
            {
                componentType: "Defcon",
                countries: {
                    China: {
                        shortName: "🇨🇳",
                        countryName: "China",
                        status: 3,
                    },
                    France: {
                        shortName: "🇫🇷",
                        countryName: "France",
                        status: 3,
                    },
                    Russia: {
                        shortName: "🇷🇺",
                        countryName: "Russia",
                        status: 3,
                    },
                    UnitedStates: {
                        shortName: "🇺🇸",
                        countryName: "United States",
                        status: 3,
                    },
                    UnitedKingdom: {
                        shortName: "🇬🇧",
                        countryName: "United Kingdom",
                        status: 3,
                    },
                    Pakistan: {
                        shortName: "🇵🇰",
                        countryName: "Pakistan",
                        status: 3,
                    },
                    India: {
                        shortName: "🇮🇳",
                        countryName: "India",
                        status: 3,
                    },
                    Israel: {
                        shortName: "🇮🇱",
                        countryName: "Israel",
                        status: "hidden",
                    },
                },
            },
        ],
    },
    aftermath: {
        setupInformation: {
            gameName: "Aftermath",
            phases: [
                {
                    title: "Planning",
                    length: 9,
                    hidden: false,
                },
                {
                    title: "BBC News Broadcast begins in",
                    length: 2,
                    hidden: true,
                },
                {
                    title: "BBC News",
                    length: 2,
                    hidden: false,
                },
                {
                    title: "FRB",
                    length: 2,
                    hidden: false,
                },
                {
                    title: "Action",
                    length: 20,
                    hidden: false,
                },
            ],
            theme: "aftermath",
            breakingNewsBanner: false,
            components: ["Weather"],
            press: false,
        },
        components: [
            {
                componentType: "Weather",
                weatherMessage: "",
            },
        ],
    },
    "wts-1970": {
        setupInformation: {
            gameName: "Watch the Skies: 1970",
            phases: [
                {
                    title: "Team Time",
                    length: 10,
                    hidden: false,
                },
                {
                    title: "Action Time",
                    length: 15,
                    hidden: false,
                },
                {
                    title: "Diplomacy Time",
                    length: 10,
                    hidden: false,
                },
                {
                    title: "End of turn",
                    length: 5,
                    hidden: false,
                },
            ],
            theme: "first-contact",
            breakingNewsBanner: true,
            components: [],
            logo: "/WTS_1970__Coulee_Con.png",
        },
        components: [],
    },
    dow: {
        setupInformation: {
            gameName: "Den of Wolves",
            phases: [
                {
                    title: "Action Phase",
                    length: 18,
                    hidden: false,
                },
                {
                    title: "Team Phase",
                    length: 12,
                    hidden: false,
                },
            ],
            theme: "first-contact",
            breakingNewsBanner: true,
            components: [],
            press: {
                name: "INC",
                logo: "/inc.png",
            },
        },
        components: [
            {
                componentType: "DoWWolfAttack",
                inProgress: false,
            },
        ],
    },
    "running-hot": {
        setupInformation: {
            phases: [
                {
                    title: "Setup Phase",
                    length: 15,
                    hidden: false,
                },
                {
                    title: "Action Phase",
                    length: 15,
                    hidden: false,
                },
                {
                    title: "Team Time",
                    length: 5,
                    hidden: false,
                },
            ],
            theme: "first-contact",
            breakingNewsBanner: true,
            components: [],
            gameName: "Running Hot",
            press: [
                {
                    name: "Business Times",
                    logo: "/RunningHot/BusinessTimes.png",
                },
                {
                    name: "Th3 Undergr0und",
                    logo: "/RunningHot/Th3Underground.png",
                },
            ],
            logo: "/RunningHot/RunningHot.webp",
        },
        components: [
            {
                componentType: "RunningHotCorp",
                sharePrice: {
                    GenEq: 10,
                    MCM: 12,
                    Gordon: 13,
                    ANT: 5,
                    DTC: 13,
                },
            },
            {
                componentType: "RunningHotRunners",
                rep: runningHotGangs,
            },
        ],
    },
    "dev-test-game": {
        setupInformation: {
            gameName: "Dev Test Game",
            phases: [
                {
                    title: "Action Phase",
                    length: 18,
                    hidden: false,
                },
                {
                    title: "Team Phase",
                    length: 12,
                    hidden: false,
                },
            ],
            theme: "first-contact",
            breakingNewsBanner: true,
            components: [],
            press: [
                {
                    name: "Test Press",
                    logo: "/MGC.png",
                },
                {
                    name: "Second Press",
                    logo: "/Icon-VLHG.png",
                },
            ],
        },
        components: [],
    },
};

export async function POST(
    request: Request,
): Promise<NextResponse<CreateGameResponse>> {
    const createGameReq = await request.json();

    if (!CreateGameRequestDecode.is(createGameReq)) {
        return NextResponse.json(
            {
                result: false,
                errors: ["Incorrect request"],
            },
            { status: 400 },
        );
    }

    const { setupInformation, components } = GAME_TYPES[createGameReq.type];

    const game = createGame(createGameReq.gameID, setupInformation, components);

    if (isLeft(game)) {
        return NextResponse.json(
            {
                result: false,
                errors: ["Failed to create game", game.left],
            },
            { status: 500 },
        );
    }

    const gamesRepo = getGameRepo();

    if (isLeft(gamesRepo)) {
        return NextResponse.json(
            {
                result: false,
                errors: ["Couldn't get the games repo", gamesRepo.left],
            },
            { status: 500 },
        );
    }

    const result = await gamesRepo.right.insert(game.right);

    if (isLeft(result)) {
        return NextResponse.json(
            {
                result: false,
                errors: ["Failed to insert game", result.left],
            },
            { status: 500 },
        );
    }

    return NextResponse.json({ result: true });
}
