import { describe, expect, test } from "@jest/globals";
import { MakeLeft, MakeRight } from "@fc/lib/io-ts-helpers";

describe("io-ts-helpers", () => {
    const testParams: Record<string, any> = {
        false: false,
        true: true,
        number: 1,
        string: "test",
        array: [1, 2, 3],
        object: { some: "keys" },
    };

    describe("MakeLeft", () => {
        Object.entries(testParams).forEach(([key, val]) => {
            test(`Returns ${key} as a left`, () => {
                expect(MakeLeft(val).left).toStrictEqual(val);
            });
        });
    });

    describe("MakeRight", () => {
        Object.entries(testParams).forEach(([key, val]) => {
            test(`Returns ${key} as a right`, () => {
                expect(MakeRight(val).right).toStrictEqual(val);
            });
        });
    });
});
