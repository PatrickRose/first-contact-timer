import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { sessionOptions, SessionType } from "./lib/session";
import { getIronSession } from "iron-session";

// This function can be marked `async` if using `await` inside
export async function middleware(request: NextRequest) {
    const path = request.nextUrl.pathname;
    if (path.startsWith("/admin")) {
        const res = NextResponse.next();
        const session = await getIronSession<SessionType>(
            request,
            res,
            sessionOptions,
        );

        const hasSession: boolean = !!session.user;

        if (path == "/admin/login") {
            return hasSession
                ? NextResponse.redirect(new URL("/admin", request.url))
                : res;
        }

        return !hasSession
            ? NextResponse.redirect(new URL("/admin/login", request.url))
            : res;
    }
}
