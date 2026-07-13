/**
 * @jest-environment node
 */
import { beforeAll, describe, expect, jest, test } from "@jest/globals";
import type { Mock } from "jest-mock";
import type { NextRequest } from "next/server";
import { User } from "@fc/types/types";
import type { SessionType } from "@fc/lib/session";

jest.mock("iron-session", () => ({
    getIronSession: jest.fn(),
}));

let proxy: (request: NextRequest) => Promise<Response | undefined>;
let getIronSession: Mock<() => Promise<SessionType>>;

beforeAll(async () => {
    ({ proxy } = await import("../src/proxy"));
    ({ getIronSession } = (await import("iron-session")) as never);
});

const loggedInUser: User = {
    isLoggedIn: true,
    login: "test-user",
    passwordNeedsReset: false,
};

function makeRequest(path: string): NextRequest {
    return {
        nextUrl: { pathname: path },
        url: `https://timer.example.com${path}`,
    } as unknown as NextRequest;
}

describe("proxy", () => {
    test("ignores requests outside /admin", async () => {
        const response = await proxy(makeRequest("/game/test-game"));

        expect(response).toBeUndefined();
        expect(getIronSession).not.toHaveBeenCalled();
    });

    test("redirects to the login page when not logged in", async () => {
        getIronSession.mockResolvedValue({});

        const response = await proxy(makeRequest("/admin"));

        expect(response?.status).toBe(307);
        expect(response?.headers.get("location")).toBe(
            "https://timer.example.com/admin/login",
        );
    });

    test("lets a logged in user through to admin pages", async () => {
        getIronSession.mockResolvedValue({ user: loggedInUser });

        const response = await proxy(makeRequest("/admin"));

        expect(response?.status).toBe(200);
        expect(response?.headers.get("location")).toBeNull();
    });

    test("redirects a logged in user away from the login page", async () => {
        getIronSession.mockResolvedValue({ user: loggedInUser });

        const response = await proxy(makeRequest("/admin/login"));

        expect(response?.status).toBe(307);
        expect(response?.headers.get("location")).toBe(
            "https://timer.example.com/admin",
        );
    });

    test("lets a logged out user visit the login page", async () => {
        getIronSession.mockResolvedValue({});

        const response = await proxy(makeRequest("/admin/login"));

        expect(response?.status).toBe(200);
        expect(response?.headers.get("location")).toBeNull();
    });
});
