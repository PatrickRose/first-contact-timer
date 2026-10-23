import { describe, expect, test } from "@jest/globals";
import * as t from "io-ts";
import {
    ComponentDecode,
    SetupInformationDecode,
    SetupInformationPhaseDecode,
} from "@fc/types/io-ts-def";
import { GAME_DEFINITIONS } from "@fc/server/game-definitions";
import { lengthOfPhase, nextDate } from "@fc/server/turn";
import { isRight } from "fp-ts/Either";
import { SetupInformation } from "@fc/types/types";

const ComponentsDecode = t.array(ComponentDecode);

function makePhase(
    overrides: Record<string, unknown> = {},
): Record<string, unknown> {
    return { title: "Action Phase", length: 10, hidden: false, ...overrides };
}

describe("SetupInformationDecode", () => {
    // Nothing in the app decoded setupInformation at runtime until the edit API
    // (#816), so these codecs had never been exercised against real data. They
    // are the contract the edit endpoint validates against: if a shipped game
    // fails to decode, that game becomes uneditable for no visible reason.
    test.each(Object.entries(GAME_DEFINITIONS))(
        "accepts the %s definition",
        (_name, definition) => {
            expect(SetupInformationDecode.is(definition.setupInformation)).toBe(
                true,
            );
            expect(ComponentsDecode.is(definition.components)).toBe(true);
        },
    );

    test("rejects setup information with no phases key", () => {
        expect(SetupInformationDecode.is({ gameName: "x" })).toBe(false);
    });
});

describe("SetupInformationPhaseDecode", () => {
    test.each([
        ["a bare phase", makePhase()],
        ["no extraTime", makePhase()],
        ["an empty extraTime", makePhase({ extraTime: {} })],
        ["a numeric-keyed extraTime", makePhase({ extraTime: { 1: 10 } })],
        [
            "several extraTime entries",
            makePhase({ extraTime: { 1: 10, 4: -5 } }),
        ],
    ])("accepts %s", (_label, phase) => {
        expect(SetupInformationPhaseDecode.is(phase)).toBe(true);
    });

    // These all returned `true` before the domain was changed to `t.string`:
    // with a `t.number` domain the codomain check was unreachable, so any value
    // at all was accepted. See the comment on the codec.
    test.each([
        [
            "a string value under a word key",
            makePhase({ extraTime: { a: "banana" } }),
        ],
        [
            "a string value under a numeric key",
            makePhase({ extraTime: { 1: "banana" } }),
        ],
        ["a null value", makePhase({ extraTime: { 1: null } })],
        ["a nested object value", makePhase({ extraTime: { 1: { 2: 3 } } })],
        ["a boolean value", makePhase({ extraTime: { 1: true } })],
    ])("rejects extraTime with %s", (_label, phase) => {
        expect(SetupInformationPhaseDecode.is(phase)).toBe(false);
    });

    test("rejects a phase whose length is not a number", () => {
        expect(
            SetupInformationPhaseDecode.is(makePhase({ length: "10" })),
        ).toBe(false);
    });
});

describe("the bug the extraTime domain guards against", () => {
    // Regression cover for the failure mode, not just the codec: a non-numeric
    // extraTime value made `lengthOfPhase` concatenate strings, so `nextDate`
    // produced an Invalid Date. Stored as `turnInformation.phaseEnd`, that made
    // `hasFinished` permanently false - a frozen timer with no way back.
    const poisoned = {
        gameName: "Poisoned",
        theme: "first-contact",
        breakingNewsBanner: false,
        components: [],
        phases: [makePhase({ length: 1, extraTime: { 1: "banana" } })],
    };

    test("the poisoned shape no longer decodes", () => {
        expect(SetupInformationDecode.is(poisoned)).toBe(false);
    });

    test("string concatenation produced an Invalid Date when it did decode", () => {
        // Cast past the codec to demonstrate what used to get through, so the
        // consequence stays documented even though the door is now shut.
        const setup = poisoned as unknown as SetupInformation;

        const length = lengthOfPhase(1, 1, setup);
        expect(isRight(length) && length.right).toBe("1banana");

        const date = nextDate(1, 1, setup);
        expect(isRight(date) && Number.isNaN(date.right.getTime())).toBe(true);
    });
});
