import {
    CreateGameResponse,
    Game,
    GameType,
    RunningHotRunners,
} from "@fc/types/types";
import { CreateGameRequestDecode } from "@fc/types/io-ts-def";
import { NextRequest, NextResponse } from "next/server";
import { createGame } from "@fc/server/turn";
import { isLeft } from "fp-ts/Either";
import { getGameRepo } from "@fc/server/repository/game";

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
            hidePressInSidebar: true,
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
        components: [
            {
                componentType: "Trackers",
                trackers: {
                    Bar: {
                        value: 0,
                        type: "bar",
                        max: 10,
                    },
                    Circle: {
                        value: 0,
                        type: "circle",
                        max: 35,
                    },
                },
            },
        ],
    },
    DeedsAndDestiny: {
        setupInformation: {
            gameName: "Deeds & Destiny",
            phases: [
                {
                    title: "Morning",
                    length: 5,
                    hidden: false,
                    phaseInformation: [
                        "Check for new quests",
                        "See whether the threats have developed",
                        "Do a little bartering",
                        "Talk to others",
                        "Gather your party before venturing forth",
                    ],
                    logo: "/DeedsAndDestiny/Morning.png",
                },
                {
                    title: "Day",
                    length: 15,
                    hidden: false,
                    phaseInformation: [
                        "Venture forth",
                        "Gather resources at the edge Hope’s Harbour",
                        "Build or improve buildings",
                        "Craft equipment",
                        "Trade, talk, negotiate, plot and plan",
                    ],
                    logo: "/DeedsAndDestiny/Day.png",
                },
                {
                    title: "Evening",
                    length: 5,
                    hidden: false,
                    phaseInformation: [
                        "Return to Hope’s Harbour",
                        "Talk, trade, gossip and brag with other adventurers",
                        "Upgrade and craft",
                        "Decided where you're going to spend the night",
                    ],
                    logo: "/DeedsAndDestiny/Evening.png",
                },
                {
                    title: "Night",
                    length: 5,
                    hidden: false,
                    phaseInformation: [
                        "Recover your dice pool",
                        "Spend XP to improve your Attributes and Health Points",
                        "Spend XP to learn new Skills or change Class at the appropriate building",
                        "Plot, plan and scheme",
                    ],
                    logo: "/DeedsAndDestiny/Night.png",
                },
            ],
            press: {
                name: "Town Crier",
            },
            theme: "first-contact",
            breakingNewsBanner: true,
            components: [],
            timerStyles: {
                activePhase: {
                    background: "bg-white",
                    text: "text-black",
                    border: "border-yellow-300",
                },
                pastPhase: {
                    background:
                        "bg-linear-to-b from-neutral-100 to-neutral-400",
                    text: "text-black",
                    border: "border-black",
                },
                futurePhase: {
                    background: "bg-neutral-400",
                    text: "text-black",
                    border: "border-black",
                },
            },
        },
        components: [],
    },
    AYNOHYEB: {
        setupInformation: {
            gameName: "Are You Now Or Have You Ever Been...",
            phases: [
                {
                    title: "Day Phase",
                    length: 10,
                    hidden: false,
                },
                {
                    title: "Night Phase",
                    length: 10,
                    hidden: false,
                },
                {
                    title: "Team Time",
                    length: 10,
                    hidden: false,
                },
            ],
            logo: "/AYNOHYEB/logo.jpg",
            theme: "first-contact",
            breakingNewsBanner: true,
            components: [],
            press: {
                name: "Maine Gazette",
                logo: "/AYNOHYEB/maine-gazette.png",
            },
        },
        components: [],
    },
    "faes-anatomy": {
        setupInformation: {
            gameName: "Fae's Anatomy",
            phases: [
                {
                    title: "Commune Phase",
                    length: 10,
                    hidden: false,
                    extraTime: {
                        1: 10,
                    },
                },
                {
                    title: "Medical Phase",
                    length: 10,
                    hidden: false,
                    extraTime: {
                        1: 5,
                    },
                },
                {
                    title: "Negotiation Phase",
                    length: 10,
                    hidden: false,
                },
                {
                    title: "Press time",
                    length: 5,
                    hidden: false,
                },
            ],
            logo: "/FaesAnatomy/logo.jpg",
            theme: "first-contact",
            breakingNewsBanner: true,
            components: [],
            press: {
                name: "Taliesin Journal",
                logo: "/FaesAnatomy/Taliesin Journal.png",
            },
        },
        components: [],
    },
    "dead-britannia": {
        setupInformation: {
            gameName: "Dead Britannia",
            phases: [
                {
                    title: "Settlement Administration",
                    length: 15,
                    hidden: false,
                },
                {
                    title: "Action Phase",
                    length: 25,
                    hidden: false,
                },
            ],
            logo: "/DeadBritannia/logo.jpeg",
            theme: "first-contact",
            breakingNewsBanner: false,
            components: [],
            press: false,
        },
        components: [],
    },
};

export async function POST(
    request: NextRequest,
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
