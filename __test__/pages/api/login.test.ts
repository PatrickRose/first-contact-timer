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
import { MakeLeft, MakeRight } from "@fc/lib/io-ts-helpers";
import { DEFAULT_PASSWORD } from "@fc/server/repository/user/consts";
import { DBUser, User } from "@fc/types/types";
import type UserRepository from "@fc/server/repository/user";
import type { SessionType } from "@fc/lib/session";

jest.mock("iron-session", () => ({
    getIronSession: jest.fn(),
}));

jest.mock("argon2", () => ({
    verify: jest.fn(),
}));

jest.mock("@fc/server/repository/user", () => ({
    __esModule: true,
    getUserRepo: jest.fn(),
}));

jest.mock("@fc/server/repository/user/argon", () => ({
    hashPassword: jest.fn(() => Promise.resolve("FALLBACK HASH")),
}));

let loginRoute: (req: NextApiRequest, res: NextApiResponse) => Promise<unknown>;
let getUserRepo: Mock<() => ReturnType<typeof MakeRight<UserRepository>>>;
let getIronSession: Mock<() => Promise<SessionType & { save: () => void }>>;
let verify: Mock<(hash: string, password: string) => Promise<boolean>>;
let hashPassword: Mock<(password: string) => Promise<string>>;

beforeAll(async () => {
    loginRoute = (await import("@fc/pages/api/login")).default;
    ({ getUserRepo } = (await import("@fc/server/repository/user")) as never);
    ({ getIronSession } = (await import("iron-session")) as never);
    ({ verify } = (await import("argon2")) as never);
    ({ hashPassword } =
        (await import("@fc/server/repository/user/argon")) as never);
});

const testUser: DBUser = {
    _id: "test-user",
    password: "STORED HASH",
    passwordNeedsReset: false,
};

function makeUserRepo(user: DBUser | null) {
    return {
        get: jest.fn<UserRepository["get"]>(async () =>
            user === null ? MakeLeft(false) : MakeRight(user),
        ),
        insert: jest.fn<UserRepository["insert"]>(),
        update: jest.fn<UserRepository["update"]>(),
    };
}

function makeReqRes(method: string, body: unknown) {
    const res = {
        status: jest.fn(),
        json: jest.fn(),
    };
    res.status.mockReturnValue(res);

    const session = {
        user: undefined as User | undefined,
        save: jest.fn(async () => undefined),
    };

    getIronSession.mockResolvedValue(session);

    return {
        req: { method, body } as NextApiRequest,
        res: res as unknown as NextApiResponse & typeof res,
        session,
    };
}

beforeEach(() => {
    verify.mockReset();
    getUserRepo.mockReset();
});

describe("loginRoute", () => {
    test("rejects non-POST requests without processing them", async () => {
        // Even with a valid body, a non-POST request must stop at the 405
        // and never reach the login flow
        const { req, res } = makeReqRes("PUT", {
            username: "test-user",
            password: "hunter2",
        });

        await loginRoute(req, res);

        expect(res.status).toHaveBeenCalledTimes(1);
        expect(res.status).toHaveBeenCalledWith(405);
        expect(res.json).toHaveBeenCalledTimes(1);
        expect(res.json).toHaveBeenCalledWith({
            message: "Only post requests are allowed",
        });
        expect(getUserRepo).not.toHaveBeenCalled();
    });

    test("rejects a request without a username or password", async () => {
        const { req, res } = makeReqRes("POST", { username: "test-user" });

        await loginRoute(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            message:
                "Invalid request body - missing either username or password",
        });
    });

    test("returns a 500 when the repository is not available", async () => {
        getUserRepo.mockReturnValue(MakeLeft("No database") as never);

        const { req, res } = makeReqRes("POST", {
            username: "test-user",
            password: "hunter2",
        });

        await loginRoute(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
            message:
                "Database was not set up correctly - please contact the webmaster: No database",
        });
    });

    test("logs in a user with the correct password", async () => {
        const userRepo = makeUserRepo(testUser);
        getUserRepo.mockReturnValue(MakeRight(userRepo));
        verify.mockResolvedValue(true);

        const { req, res, session } = makeReqRes("POST", {
            username: "test-user",
            password: "hunter2",
        });

        await loginRoute(req, res);

        const expectedUser: User = {
            isLoggedIn: true,
            login: "test-user",
            passwordNeedsReset: false,
        };

        expect(verify).toHaveBeenCalledWith("STORED HASH", "hunter2");
        expect(session.user).toEqual(expectedUser);
        expect(session.save).toHaveBeenCalled();
        expect(res.status).not.toHaveBeenCalled();
        expect(res.json).toHaveBeenCalledWith(expectedUser);
    });

    test("flags that the password needs resetting when the database says so", async () => {
        const userRepo = makeUserRepo({
            ...testUser,
            passwordNeedsReset: true,
        });
        getUserRepo.mockReturnValue(MakeRight(userRepo));
        verify.mockResolvedValue(true);

        const { req, res } = makeReqRes("POST", {
            username: "test-user",
            password: "hunter2",
        });

        await loginRoute(req, res);

        expect(res.json).toHaveBeenCalledWith({
            isLoggedIn: true,
            login: "test-user",
            passwordNeedsReset: true,
        });
    });

    test("flags that the password needs resetting when logging in with the default password", async () => {
        const userRepo = makeUserRepo(testUser);
        getUserRepo.mockReturnValue(MakeRight(userRepo));
        verify.mockResolvedValue(true);

        const { req, res } = makeReqRes("POST", {
            username: "test-user",
            password: DEFAULT_PASSWORD,
        });

        await loginRoute(req, res);

        expect(res.json).toHaveBeenCalledWith({
            isLoggedIn: true,
            login: "test-user",
            passwordNeedsReset: true,
        });
    });

    test("returns a 401 for an incorrect password", async () => {
        const userRepo = makeUserRepo(testUser);
        getUserRepo.mockReturnValue(MakeRight(userRepo));
        verify.mockResolvedValue(false);

        const { req, res, session } = makeReqRes("POST", {
            username: "test-user",
            password: "wrong",
        });

        await loginRoute(req, res);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(session.save).not.toHaveBeenCalled();
        expect(res.json).toHaveBeenCalledWith({
            isLoggedIn: false,
            login: "",
            passwordNeedsReset: false,
        });
    });

    test("verifies against a freshly generated hash when the user does not exist", async () => {
        const userRepo = makeUserRepo(null);
        getUserRepo.mockReturnValue(MakeRight(userRepo));
        verify.mockResolvedValue(false);

        const { req, res } = makeReqRes("POST", {
            username: "unknown-user",
            password: "hunter2",
        });

        await loginRoute(req, res);

        // The hash is always verified, even for missing users, to reduce the
        // timing difference between the two paths
        expect(hashPassword).toHaveBeenCalledWith("hunter2ALWAYS FAIL");
        expect(verify).toHaveBeenCalledWith("FALLBACK HASH", "hunter2");
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({
            isLoggedIn: false,
            login: "",
            passwordNeedsReset: false,
        });
    });

    test("treats a verification error as a failed login", async () => {
        const userRepo = makeUserRepo(testUser);
        getUserRepo.mockReturnValue(MakeRight(userRepo));
        verify.mockRejectedValue(new Error("Invalid hash"));

        const logSpy = jest
            .spyOn(console, "log")
            .mockImplementation(() => undefined);

        const { req, res } = makeReqRes("POST", {
            username: "test-user",
            password: "hunter2",
        });

        await loginRoute(req, res);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({
            isLoggedIn: false,
            login: "",
            passwordNeedsReset: false,
        });

        logSpy.mockRestore();
    });

    test("returns a 500 when saving the session fails", async () => {
        const userRepo = makeUserRepo(testUser);
        getUserRepo.mockReturnValue(MakeRight(userRepo));
        verify.mockResolvedValue(true);

        const { req, res, session } = makeReqRes("POST", {
            username: "test-user",
            password: "hunter2",
        });

        session.save.mockRejectedValue(new Error("Could not save session"));

        await loginRoute(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
            message: "Could not save session",
        });
    });
});
