import { GameDefinition } from "./types";
import { RunningHotRunners } from "@fc/types/types";

// A few runners spread across every gang so the runnerrep control route has
// data to edit.
const demoRunners: RunningHotRunners["rep"] = {
    Cipher: { gang: "G33ks", reputation: 3 },
    Waltz: { gang: "Dancers", reputation: 2 },
    Mask: { gang: "Facers", reputation: 4 },
    Grumble: { gang: "Gruffsters", reputation: 1 },
};

/**
 * A demo game that includes every component type, so the control desk exposes
 * all seven control routes (defcon, weather, wolf, shareprice, runnerrep,
 * light-level, trackers) against a single game. Intended for manual testing.
 */
export const demo = {
    setupInformation: {
        gameName: "Demo (All Components)",
        phases: [
            { title: "Action Phase", length: 15, hidden: false },
            { title: "Team Phase", length: 10, hidden: false },
            { title: "Hidden Phase", length: 5, hidden: true },
        ],
        theme: "first-contact",
        breakingNewsBanner: true,
        components: [],
        maxTurns: 8,
        press: [
            { name: "Demo Press", logo: "/MGC.png" },
            { name: "Second Press", logo: "/Icon-VLHG.png" },
        ],
    },
    components: [
        {
            componentType: "Defcon",
            countries: {
                China: { shortName: "🇨🇳", countryName: "China", status: 3 },
                Russia: { shortName: "🇷🇺", countryName: "Russia", status: 3 },
                UnitedStates: {
                    shortName: "🇺🇸",
                    countryName: "United States",
                    status: 3,
                },
            },
        },
        {
            componentType: "Weather",
            weatherMessage: "Clear skies over the demo zone.",
        },
        {
            componentType: "DoWWolfAttack",
            inProgress: false,
            alert: {
                text: "Wolf attack in progress",
                label: "Wolf attack",
                emoji: "🐺",
            },
        },
        {
            componentType: "RunningHotCorp",
            sharePrice: { GenEq: 10, MCM: 12, Gordon: 13, ANT: 5, DTC: 13 },
        },
        {
            componentType: "RunningHotRunners",
            rep: demoRunners,
        },
        {
            componentType: "LightLevel",
            value: 10,
            max: 10,
        },
        {
            componentType: "Trackers",
            trackers: {
                Bar: { value: 3, type: "bar", max: 10 },
                Circle: { value: 12, type: "circle", max: 35 },
            },
        },
    ],
} satisfies GameDefinition;
