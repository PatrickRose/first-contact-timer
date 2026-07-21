/**
 * @jest-environment node
 */
import {
    beforeAll,
    beforeEach,
    describe,
    expect,
    jest,
    test,
} from "@jest/globals";
import type { Mock } from "jest-mock";
import type { NextApiRequest, NextApiResponse } from "next";
import { User } from "@fc/types/types";
import type { SessionType } from "@fc/lib/session";

jest.mock("iron-session", () => ({
    getIronSession: jest.fn(),
}));

let logoutRoute: (
    req: NextApiRequest,
    res: NextApiResponse,
) => Promise<unknown>;
let getIronSession: Mock<() => Promise<SessionType & { destroy: () => void }>>;

beforeAll(async () => {
    logoutRoute = (await import("@fc/pages/api/logout")).default;
    ({ getIronSession } = (await import("iron-session")) as never);
});

function makeReqRes(method: string) {
    const res = {
        status: jest.fn(),
        json: jest.fn(),
    };
    res.status.mockReturnValue(res);

    const session = {
        user: {
            isLoggedIn: true,
            login: "test-user",
            passwordNeedsReset: false,
        } as User | undefined,
        destroy: jest.fn(() => {
            session.user = undefined;
        }),
    };

    getIronSession.mockResolvedValue(session);

    return {
        req: { method } as NextApiRequest,
        res: res as unknown as NextApiResponse & typeof res,
        session,
    };
}

beforeEach(() => {
    getIronSession.mockReset();
});

describe("logoutRoute", () => {
    test("rejects non-POST requests without touching the session", async () => {
        const { req, res, session } = makeReqRes("GET");

        await logoutRoute(req, res);

        expect(res.status).toHaveBeenCalledWith(405);
        expect(res.json).toHaveBeenCalledWith({
            message: "Only post requests are allowed",
        });
        expect(session.destroy).not.toHaveBeenCalled();
    });

    test("destroys the session and reports the user as logged out", async () => {
        const { req, res, session } = makeReqRes("POST");

        await logoutRoute(req, res);

        expect(session.destroy).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            isLoggedIn: false,
            login: "",
            passwordNeedsReset: false,
        });
    });
});
