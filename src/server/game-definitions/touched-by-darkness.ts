import { GameDefinition } from "./types";

export const touchedByDarkness = {
    setupInformation: {
        gameName: "Touched By Darkness",
        phases: [
            {
                title: "Action Time",
                length: 18,
                hidden: false,
            },
            {
                title: "Faction Time",
                length: 5,
                hidden: false,
            },
            {
                title: "News Proclamation",
                length: 5,
                hidden: false,
            },
            {
                title: "Resolution",
                length: 2,
                hidden: false,
            },
        ],
        theme: "first-contact",
        breakingNewsBanner: true,
        components: [],
        press: { name: "The Herald" },
        logo: "/TouchedByDarkness/logo.png",
    },
    components: [
        {
            componentType: "DoWWolfAttack",
            inProgress: false,
            alert: {
                text: "Shadow attack in progress",
                label: "Shadow attack",
                emoji: "🌑",
            },
        },
        {
            componentType: "LightLevel",
            value: 10,
            max: 10,
        },
    ],
} satisfies GameDefinition;
