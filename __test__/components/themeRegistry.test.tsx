import { describe, expect, test } from "@jest/globals";
import { THEME_REGISTRY } from "@fc/components/theme/registry";
import { ThemeDecode } from "@fc/types/io-ts-def";

describe("THEME_REGISTRY", () => {
    test("has an entry for every theme the decoder accepts", () => {
        // Pull the accepted theme literals straight off the io-ts union so the
        // registry can't silently fall out of sync with the decoder.
        const themes = ThemeDecode.types.map((t) => t.value);

        for (const theme of themes) {
            expect(THEME_REGISTRY).toHaveProperty(theme);
            expect(THEME_REGISTRY[theme]).toBeDefined();
        }
    });

    test("does not carry any extra themes", () => {
        const themes = ThemeDecode.types.map((t) => t.value);

        expect(Object.keys(THEME_REGISTRY).sort()).toEqual([...themes].sort());
    });

    test("each entry is a renderable component", () => {
        for (const component of Object.values(THEME_REGISTRY)) {
            // next/dynamic returns a component (function or forwardRef object).
            expect(["function", "object"]).toContain(typeof component);
        }
    });
});
