// this file is a wrapper with defaults to be used in both API routes and `getServerSideProps` functions
import type { SessionOptions } from "iron-session";
import { User } from "@fc/types/types";

export const sessionOptions: SessionOptions = {
    password: process.env.SECRET_COOKIE_PASSWORD as string,
    cookieName: "megadmin-timer",
};

export type SessionType = {
    user?: User;
};
