import { GameDefinition } from "./types";

export const dowNewEden = {
    setupInformation: {
        gameName: "Den of Wolves: New Eden",
        phases: [
            {
                title: "Maintenance",
                length: 5,
                hidden: false,
                extraTime: { 1: 5 },
            },
            {
                title: "Coordination",
                length: 15,
                hidden: false,
                extraTime: { 1: 10 },
            },
        ],
        theme: "first-contact",
        breakingNewsBanner: true,
        components: [],
        logo: "/dow-new-eden.png",
        maxTurns: 8,
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
} satisfies GameDefinition;
