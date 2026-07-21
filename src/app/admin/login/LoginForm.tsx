"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { LoginFailedDecode, UserDecode } from "@fc/types/io-ts-def";
import useUser from "@fc/lib/useUser";

export default function LoginForm() {
    const [username, setUsername] = useState<string>("");
    const [password, setPassword] = useState<string>("");
    const [error, setError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState<boolean>(false);

    const router = useRouter();

    const { mutateUser } = useUser({
        redirectIfFound: true,
        redirectTo: "/admin/",
    });

    const submit = async (ev: FormEvent<HTMLFormElement>) => {
        ev.preventDefault();

        if (submitting) {
            return;
        }

        setError(null);
        setSubmitting(true);

        try {
            const response = await fetch("/api/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                },
                body: JSON.stringify({ username, password }),
            });

            let data;

            try {
                data = await response.json();
            } catch (e) {
                console.error(e);
                data = false;
            }

            if (!UserDecode.is(data)) {
                if (LoginFailedDecode.is(data)) {
                    setError(data.message);
                } else {
                    setError(
                        "Error sending login request, please wait and try again",
                    );
                }
                return;
            }

            if (!data.isLoggedIn) {
                setError(
                    "Username/password combination was incorrect. Please try again",
                );
                await mutateUser(data, { revalidate: false });
                return;
            }

            // Prime the user cache with the logged-in session, then send the
            // user to the dashboard ourselves. Relying on useUser's effect
            // alone is racy (SWR revalidation can briefly re-report a
            // not-logged-in user), so navigate explicitly on success.
            await mutateUser(data, { revalidate: false });
            router.push("/admin/");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <form onSubmit={submit} className="flex flex-col gap-5">
            {error !== null ? (
                <div
                    role="alert"
                    className="rounded-lg border border-red-500/50 bg-red-950/60 p-4 text-sm text-red-200"
                >
                    {error}
                </div>
            ) : null}
            <div>
                <label
                    className="block text-sm font-medium text-zinc-300"
                    htmlFor="username"
                >
                    Username
                </label>
                <input
                    className="mt-2 block w-full rounded-lg border-zinc-700 bg-zinc-950 text-zinc-100 placeholder-zinc-500 focus:border-indigo-500 focus:ring-indigo-500 disabled:opacity-60"
                    id="username"
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                    disabled={submitting}
                />
            </div>
            <div>
                <label
                    className="block text-sm font-medium text-zinc-300"
                    htmlFor="password"
                >
                    Password
                </label>
                <input
                    className="mt-2 block w-full rounded-lg border-zinc-700 bg-zinc-950 text-zinc-100 placeholder-zinc-500 focus:border-indigo-500 focus:ring-indigo-500 disabled:opacity-60"
                    id="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    type="password"
                    disabled={submitting}
                />
            </div>

            <button
                type="submit"
                disabled={submitting}
                aria-busy={submitting}
                className="mt-2 w-full rounded-lg bg-indigo-600 px-4 py-2.5 font-semibold text-white transition hover:bg-indigo-500 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-zinc-900 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:bg-indigo-600"
            >
                {submitting ? "Signing in…" : "Login"}
            </button>
        </form>
    );
}
