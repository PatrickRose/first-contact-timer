import { describe, expect, test } from "@jest/globals";
import { GAME_DEFINITIONS } from "@fc/server/game-definitions";
import { CorpNamesDecode } from "@fc/types/io-ts-def";
import { Game } from "@fc/types/types";

type Component = Game["components"][number];
type ShareComponent = Extract<Component, { componentType: "RunningHotCorp" }>;

const isShareComponent = (component: Component): component is ShareComponent =>
    component.componentType === "RunningHotCorp";

// The literal corp names the share-price component is allowed to hold. Derived
// from the decoder so this test tracks the schema automatically.
const CORP_NAMES = CorpNamesDecode.types.map((literal) => literal.value);

describe("game definitions share prices", () => {
    const definitions = Object.entries(GAME_DEFINITIONS);

    const withShareComponent = definitions.flatMap(([type, definition]) =>
        definition.components
            .filter(isShareComponent)
            .map((component) => [type, component] as const),
    );

    test("some definition exercises the share-price component", () => {
        // Guards against the assertion below silently passing because nothing
        // uses RunningHotCorp any more.
        expect(withShareComponent.length).toBeGreaterThan(0);
    });

    test.each(withShareComponent)(
        "%s lists a share price for every corp",
        (_type, component) => {
            const priced = Object.keys(component.sharePrice);
            // A missing corp would leave its price `undefined`, and any later
            // `undefined += n` turns the whole share price into NaN.
            expect(priced).toEqual(expect.arrayContaining(CORP_NAMES));
        },
    );
});
