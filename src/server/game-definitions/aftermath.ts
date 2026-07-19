import { GameDefinition } from "./types";

export const aftermath = {
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
} satisfies GameDefinition;
