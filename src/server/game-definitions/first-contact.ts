import { GameDefinition } from "./types";

export const firstContact = {
    setupInformation: {
        gameName: "First Contact: 2035",
        phases: [
            {
                title: "Team Time",
                length: 10,
                hidden: false,
            },
            {
                title: "Action Phase 1 begins in",
                length: 2,
                hidden: true,
            },
            {
                title: "Action Phase 1",
                length: 20,
                hidden: false,
            },
            {
                title: "Action Phase 2 begins in",
                length: 2,
                hidden: true,
            },
            {
                title: "Action Phase 2",
                length: 10,
                hidden: false,
            },
            {
                title: "Action Phase 3 begins in",
                length: 2,
                hidden: true,
            },
            {
                title: "Action Phase 3",
                length: 5,
                hidden: false,
            },
            {
                title: "Press Broadcast begins in",
                length: 2,
                hidden: true,
            },
            {
                title: "Press Broadcast",
                length: 5,
                hidden: false,
            },
            {
                title: "Next turn (Team Time) begins in",
                length: 2,
                hidden: true,
            },
        ],
        theme: "first-contact",
        breakingNewsBanner: true,
        components: ["Defcon"],
        hidePressInSidebar: true,
    },
    components: [
        {
            componentType: "Defcon",
            countries: {
                China: {
                    shortName: "🇨🇳",
                    countryName: "China",
                    status: 3,
                },
                France: {
                    shortName: "🇫🇷",
                    countryName: "France",
                    status: 3,
                },
                Russia: {
                    shortName: "🇷🇺",
                    countryName: "Russia",
                    status: 3,
                },
                UnitedStates: {
                    shortName: "🇺🇸",
                    countryName: "United States",
                    status: 3,
                },
                UnitedKingdom: {
                    shortName: "🇬🇧",
                    countryName: "United Kingdom",
                    status: 3,
                },
                Pakistan: {
                    shortName: "🇵🇰",
                    countryName: "Pakistan",
                    status: 3,
                },
                India: {
                    shortName: "🇮🇳",
                    countryName: "India",
                    status: 3,
                },
                Israel: {
                    shortName: "🇮🇱",
                    countryName: "Israel",
                    status: "hidden",
                },
            },
        },
    ],
} satisfies GameDefinition;
