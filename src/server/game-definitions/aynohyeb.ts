import { GameDefinition } from "./types";

export const aynohyeb = {
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
} satisfies GameDefinition;
