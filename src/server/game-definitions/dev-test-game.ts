import { GameDefinition } from "./types";

export const devTestGame = {
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
        maxTurns: 8,
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
} satisfies GameDefinition;
