import { GameType } from "@fc/types/types";
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

/**
 * Compile-time exhaustiveness check.
 *
 * `GameType` is derived from `GameTypeDecode`, which is in turn derived from the
 * keys of `GAME_DEFINITIONS`. These assertions fail to type-check if those two
 * ever fall out of step (a definition key the decoder does not recognise, or a
 * `GameType` with no definition), turning a missing definition into a compile
 * error. They are purely type-level and emit no runtime code.
 */
type MutuallyAssignable<A extends B, B extends C, C = A> = true;
export type GameTypeMatchesDefinitions = MutuallyAssignable<
    DefinedGameType,
    GameType
>;
