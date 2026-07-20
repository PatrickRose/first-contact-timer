import { GameDefinition } from "./types";

export const deedsAndDestiny = {
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
                background: "bg-linear-to-b from-neutral-100 to-neutral-400",
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
} satisfies GameDefinition;
