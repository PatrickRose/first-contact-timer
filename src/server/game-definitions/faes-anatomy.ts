import { GameDefinition } from "./types";

export const faesAnatomy = {
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
} satisfies GameDefinition;
