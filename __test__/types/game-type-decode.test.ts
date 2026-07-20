import { describe, expect, test } from "@jest/globals";
import { GameTypeDecode } from "@fc/types/io-ts-def";
import { GAME_DEFINITIONS } from "@fc/server/game-definitions";

describe("GameTypeDecode", () => {
    const definitionKeys = Object.keys(GAME_DEFINITIONS);

    test("is derived from every game definition key", () => {
        // The decoder should recognise exactly the keys of GAME_DEFINITIONS,
        // guaranteeing the type list and the data cannot drift apart.
        expect(Object.keys(GameTypeDecode.keys).sort()).toEqual(
            [...definitionKeys].sort(),
        );
    });

    test.each(definitionKeys)("accepts the %s definition key", (key) => {
        expect(GameTypeDecode.is(key)).toBe(true);
    });

    test.each(["monopoly", "first_contact", "", "FIRST-CONTACT", "dow "])(
        "rejects the unknown game type %p",
        (value) => {
            expect(GameTypeDecode.is(value)).toBe(false);
        },
    );

    test("rejects non-string values", () => {
        expect(GameTypeDecode.is(1)).toBe(false);
        expect(GameTypeDecode.is(null)).toBe(false);
        expect(GameTypeDecode.is(undefined)).toBe(false);
        expect(GameTypeDecode.is({})).toBe(false);
    });
});
