import Link from "next/link";
import { Metadata } from "next";
import { cookies } from "next/headers";
import { getIronSession } from "iron-session";
import { sessionOptions, SessionType } from "@fc/lib/session";
import LogoutButton from "./LogoutButton";

export const metadata: Metadata = {
    title: "Megadmin Admin",
};

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await getIronSession<SessionType>(
        await cookies(),
        sessionOptions,
    );
    const isLoggedIn = !!session.user;

    return (
        <div className="min-h-screen bg-zinc-950 text-zinc-100">
            <header className="border-b border-zinc-800 bg-zinc-900/80">
                <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
                    <Link
                        href="/admin"
                        className="text-lg font-bold tracking-wide"
                    >
                        Megadmin{" "}
                        <span className="font-normal text-indigo-400">
                            Admin
                        </span>
                    </Link>
                    {isLoggedIn ? (
                        <nav className="flex items-center gap-6 text-sm">
                            <Link
                                href="/admin"
                                className="text-zinc-400 transition hover:text-zinc-100"
                            >
                                Dashboard
                            </Link>
                            <Link
                                href="/admin/game"
                                className="text-zinc-400 transition hover:text-zinc-100"
                            >
                                Games
                            </Link>
                            <Link
                                href="/admin/game/create"
                                className="text-zinc-400 transition hover:text-zinc-100"
                            >
                                Create game
                            </Link>
                            <LogoutButton />
                        </nav>
                    ) : null}
                </div>
            </header>
            <main className="mx-auto max-w-3xl px-6 py-10">{children}</main>
        </div>
    );
}
