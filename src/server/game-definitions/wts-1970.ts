import { GameDefinition } from "./types";

export const wts1970 = {
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
} satisfies GameDefinition;
