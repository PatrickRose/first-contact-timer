import { GameDefinition } from "./types";
import { firstContact } from "./first-contact";
import { aftermath } from "./aftermath";
import { wts1970 } from "./wts-1970";
import { dow } from "./dow";
import { dowNewEden } from "./dow-new-eden";
import { runningHot } from "./running-hot";
import { devTestGame } from "./dev-test-game";
import { deedsAndDestiny } from "./deeds-and-destiny";
import { aynohyeb } from "./aynohyeb";
import { faesAnatomy } from "./faes-anatomy";
import { deadBritannia } from "./dead-britannia";
import { touchedByDarkness } from "./touched-by-darkness";

/**
 * The single source of truth for the games that can be created.
 *
 * Adding a new game is a data-only change: add a definition file and wire it in
 * here. The `GameType` union and its io-ts decoder (`GameTypeDecode`) are
 * derived from these keys, so the type list and the data cannot drift apart.
 *
 * The `satisfies` clause makes a malformed definition a compile error while
 * keeping the literal key types available for `keyof`/`t.keyof` derivation.
 */
export const GAME_DEFINITIONS = {
    "first-contact": firstContact,
    aftermath: aftermath,
    "wts-1970": wts1970,
    dow: dow,
    "dow-new-eden": dowNewEden,
    "running-hot": runningHot,
    "dev-test-game": devTestGame,
    DeedsAndDestiny: deedsAndDestiny,
    AYNOHYEB: aynohyeb,
    "faes-anatomy": faesAnatomy,
    "dead-britannia": deadBritannia,
    "touched-by-darkness": touchedByDarkness,
} satisfies Record<string, GameDefinition>;

export type DefinedGameType = keyof typeof GAME_DEFINITIONS;

/*
 * Drift protection lives in two independent places, so no extra type-level
 * assertion is needed here:
 *
 *   1. `satisfies Record<string, GameDefinition>` above makes a malformed or
 *      incomplete definition a compile error.
 *   2. `GameType`/`GameTypeDecode` are derived from `t.keyof(GAME_DEFINITIONS)`
 *      (see `src/types/io-ts-def.ts`), so the type union and the data are the
 *      same source and cannot fall out of step.
 *
 * An assertion comparing `DefinedGameType` against `GameType` would be
 * tautological: both derive from these keys, so it could never fail.
 */
