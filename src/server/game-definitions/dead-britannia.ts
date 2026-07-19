import { GameDefinition } from "./types";

export const deadBritannia = {
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
} satisfies GameDefinition;
