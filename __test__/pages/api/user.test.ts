/**
 * @jest-environment node
 */
import { beforeAll, describe, expect, jest, test } from "@jest/globals";
import type { Mock } from "jest-mock";
import type { NextApiRequest, NextApiResponse } from "next";
import { User } from "@fc/types/types";
import type { SessionType } from "@fc/lib/session";

jest.mock("iron-session", () => ({
    getIronSession: jest.fn(),
}));

let userRoute: (req: NextApiRequest, res: NextApiResponse) => Promise<unknown>;
let getIronSession: Mock<() => Promise<SessionType>>;

beforeAll(async () => {
    userRoute = (await import("@fc/pages/api/user")).default;
    ({ getIronSession } = (await import("iron-session")) as never);
});

function makeReqRes(session: SessionType) {
    const res = {
        json: jest.fn(),
    };

    getIronSession.mockResolvedValue(session);

    return {
        req: {} as NextApiRequest,
        res: res as unknown as NextApiResponse & typeof res,
    };
}

describe("userRoute", () => {
    test("returns the logged in user", async () => {
        const user: User = {
            isLoggedIn: true,
            login: "test-user",
            passwordNeedsReset: false,
        };

        const { req, res } = makeReqRes({ user });

        await userRoute(req, res);

        expect(res.json).toHaveBeenCalledWith({
            isLoggedIn: true,
            login: "test-user",
            passwordNeedsReset: false,
        });
    });

    test("returns a logged out user when there is no session", async () => {
        const { req, res } = makeReqRes({});

        await userRoute(req, res);

        expect(res.json).toHaveBeenCalledWith({
            isLoggedIn: false,
            login: "",
            passwordNeedsReset: false,
        });
    });
});
