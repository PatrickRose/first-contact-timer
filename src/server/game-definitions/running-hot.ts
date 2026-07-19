import { GameDefinition } from "./types";
import { RunningHotRunners } from "@fc/types/types";

const runningHotGangs: RunningHotRunners["rep"] = {};
// g33ks
["G1T", "$0FTW4R3", "CYCL3", "$TUX", "Z3R0"].forEach((val) => {
    runningHotGangs[val] = {
        gang: "G33ks",
        reputation: 1,
    };
});
// Dancers
["Ballet", "Tap", "Swing", "Hustle"].forEach((val) => {
    runningHotGangs[val] = {
        gang: "Dancers",
        reputation: 1,
    };
});
// Facers
["Next", "Ghost", "Con", "Wicker", "Vampire"].forEach((val) => {
    runningHotGangs[val] = {
        gang: "Facers",
        reputation: 1,
    };
});
// Gruffsters
["Pale", "Bitter", "Groucho", "Scorer"].forEach((val) => {
    runningHotGangs[val] = {
        gang: "Gruffsters",
        reputation: 1,
    };
});

export const runningHot = {
    setupInformation: {
        phases: [
            {
                title: "Setup Phase",
                length: 15,
                hidden: false,
            },
            {
                title: "Action Phase",
                length: 15,
                hidden: false,
            },
            {
                title: "Team Time",
                length: 5,
                hidden: false,
            },
        ],
        theme: "first-contact",
        breakingNewsBanner: true,
        components: [],
        gameName: "Running Hot",
        press: [
            {
                name: "Business Times",
                logo: "/RunningHot/BusinessTimes.png",
            },
            {
                name: "Th3 Undergr0und",
                logo: "/RunningHot/Th3Underground.png",
            },
        ],
        logo: "/RunningHot/RunningHot.webp",
    },
    components: [
        {
            componentType: "RunningHotCorp",
            sharePrice: {
                GenEq: 10,
                MCM: 12,
                Gordon: 13,
                ANT: 5,
                DTC: 13,
            },
        },
        {
            componentType: "RunningHotRunners",
            rep: runningHotGangs,
        },
    ],
} satisfies GameDefinition;
