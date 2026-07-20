import { GameDefinition } from "./types";

export const dow = {
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
} satisfies GameDefinition;
