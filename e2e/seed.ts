import * as argon2 from "argon2";
import type { Db } from "mongodb";
import type { Game } from "../src/types/types";

/**
 * Deterministic seed data for the e2e suite. Games are inserted directly with
 * the Mongo driver (rather than via the app's create-game flow) so the data is
 * stable and independent of the timer advancing.
 *
 * Game ids are referenced by the spec files, so keep them in sync.
 */

// Matches src/server/repository/user/consts.ts. Kept as a literal so the seeder
// has no runtime dependency on the app's path aliases.
export const DEFAULT_PASSWORD = "DefaultMegaminPasswordPleaseReset";
export const ADMIN_USERNAME = "e2e-admin";

const GAME_IDS = {
    firstContact: "e2e-first-contact",
    multipress: "e2e-multipress",
    paused: "e2e-paused",
    lightLevel: "e2e-light-level",
    aftermath: "e2e-aftermath",
} as const;

export const games = GAME_IDS;

/** A phaseEnd far enough in the future that active games never auto-advance. */
function futurePhaseEnd(): string {
    return new Date(Date.now() + 60 * 60 * 1000).toString();
}

const standardPhases: Game["setupInformation"]["phases"] = [
    { title: "Team Time", length: 10, hidden: false },
    { title: "Action Phase", length: 20, hidden: false },
    { title: "Debrief", length: 5, hidden: false },
];

function activeGame(
    id: string,
    setup: Game["setupInformation"],
    components: Game["components"],
): Game {
    return {
        _id: id,
        setupInformation: setup,
        turnInformation: {
            turnNumber: 1,
            currentPhase: 1,
            phaseEnd: futurePhaseEnd(),
        },
        breakingNews: [],
        components,
        active: true,
    };
}

const defconComponent: Game["components"][number] = {
    componentType: "Defcon",
    countries: {
        China: { shortName: "🇨🇳", countryName: "China", status: 3 },
        France: { shortName: "🇫🇷", countryName: "France", status: 3 },
        Russia: { shortName: "🇷🇺", countryName: "Russia", status: 3 },
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
        Pakistan: { shortName: "🇵🇰", countryName: "Pakistan", status: 3 },
        India: { shortName: "🇮🇳", countryName: "India", status: 3 },
        Israel: { shortName: "🇮🇱", countryName: "Israel", status: "hidden" },
    },
};

function buildGames(): Game[] {
    return [
        // Player display + press submit. Has a Defcon component (→ "Defcon" tab)
        // and single-press (→ "Press" tab).
        activeGame(
            GAME_IDS.firstContact,
            {
                gameName: "E2E First Contact",
                theme: "first-contact",
                breakingNewsBanner: true,
                components: ["Defcon"],
                phases: standardPhases,
                press: { name: "The Times" },
            },
            [defconComponent],
        ),

        // Multi-press picker + press feed filter.
        activeGame(
            GAME_IDS.multipress,
            {
                gameName: "E2E Multi Press",
                theme: "first-contact",
                breakingNewsBanner: true,
                components: [],
                phases: standardPhases,
                press: [
                    { name: "Business Times" },
                    { name: "The Underground" },
                ],
            },
            [],
        ),

        // Paused game: "GAME PAUSED" banner + press submit disabled.
        {
            _id: GAME_IDS.paused,
            setupInformation: {
                gameName: "E2E Paused",
                theme: "first-contact",
                breakingNewsBanner: true,
                components: [],
                phases: standardPhases,
                press: { name: "The Times" },
            },
            turnInformation: {
                turnNumber: 1,
                currentPhase: 1,
                phaseEnd: new Date(Date.now() + 60 * 60 * 1000).toString(),
            },
            breakingNews: [],
            components: [],
            active: false,
            frozenTurn: {
                turnNumber: 1,
                phase: 1,
                breakingNews: [],
                active: false,
                phaseEnd: 300,
                components: [],
            },
        },

        // Control tools: Light Level +/-/Set.
        activeGame(
            GAME_IDS.lightLevel,
            {
                gameName: "E2E Light Level",
                theme: "first-contact",
                breakingNewsBanner: false,
                components: [],
                phases: standardPhases,
                press: false,
            },
            [{ componentType: "LightLevel", value: 5, max: 10 }],
        ),

        // Aftermath theme smoke.
        activeGame(
            GAME_IDS.aftermath,
            {
                gameName: "E2E Aftermath",
                theme: "aftermath",
                breakingNewsBanner: false,
                components: ["Weather"],
                phases: standardPhases,
                press: false,
            },
            [{ componentType: "Weather", weatherMessage: "Clear skies" }],
        ),
    ];
}

interface DBUserDoc {
    _id: string;
    password: string;
    passwordNeedsReset: boolean;
}

/** A fresh copy of a single seeded game, used by tests to reset mutable state. */
export function gameById(id: string): Game {
    const game = buildGames().find((candidate) => candidate._id === id);
    if (game === undefined) {
        throw new Error(`No seed game with id "${id}"`);
    }
    return game;
}

export async function seedDatabase(db: Db): Promise<void> {
    const gamesCollection = db.collection<Game>("games");
    const usersCollection = db.collection<DBUserDoc>("users");

    await gamesCollection.deleteMany({});
    await usersCollection.deleteMany({});

    await gamesCollection.insertMany(buildGames());

    await usersCollection.insertOne({
        _id: ADMIN_USERNAME,
        password: await argon2.hash(DEFAULT_PASSWORD, {
            type: argon2.argon2id,
            timeCost: 5,
        }),
        passwordNeedsReset: true,
    });
}
