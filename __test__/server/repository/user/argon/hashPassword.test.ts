import { describe, expect, jest, test } from "@jest/globals";
import { argon2id } from "argon2";

jest.mock("argon2", () => {
    const real = jest.requireActual("argon2");

    if (typeof real !== "object") {
        throw Error("Could not load the argon2 module");
    }

    return {
        ...real,
        hash: jest.fn(() => Promise.resolve("HASHED PASSWORD")),
    };
});

describe("hashPassword", () => {
    test("hash a password", async () => {
        const { hash } = await import("argon2");
        const { hashPassword } = await import(
            "@fc/server/repository/user/argon"
        );

        expect(await hashPassword("test password")).toBe("HASHED PASSWORD");
        expect(hash).toBeCalledWith("test password", {
            type: argon2id,
            timeCost: 5,
        });
    });
});
