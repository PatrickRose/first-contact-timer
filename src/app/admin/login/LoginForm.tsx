"use client";

import { FormEvent, useState } from "react";
import { LoginFailedDecode, UserDecode } from "../../../types/io-ts-def";
import useUser from "../../../lib/useUser";

export default function LoginForm() {
    const [username, setUsername] = useState<string>("");
    const [password, setPassword] = useState<string>("");
    const [error, setError] = useState<string | null>(null);

    const { mutateUser } = useUser({
        redirectIfFound: true,
        redirectTo: "/admin/",
    });

    const submit = async (ev: FormEvent<HTMLFormElement>) => {
        ev.preventDefault();
        setError(null);

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
            data = false;
        }

        if (!UserDecode.is(data)) {
            if (LoginFailedDecode.is(data)) {
                setError(data.message);
            } else {
                setError(
                    "Error sending login request, please wait and try again"
                );
            }
            return;
        }

        if (!data.isLoggedIn) {
            setError(
                "Username/password combination was incorrect. Please try again"
            );
        }

        await mutateUser(data);
    };

    return (
        <form onSubmit={submit} className="flex-col">
            {error !== null ? (
                <div className="p-4 bg-red-300 rounded-2xl text-black">
                    {error}
                </div>
            ) : null}
            <div className="flex py-2">
                <label className="pr-2 w-1/6" htmlFor="username">
                    Username:{" "}
                </label>
                <input
                    className="flex-1"
                    id="username"
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                />
            </div>
            <div className="flex py-2">
                <label className="pr-2 w-1/6" htmlFor="password">
                    Password:{" "}
                </label>
                <input
                    className="flex-1"
                    id="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    type="password"
                />
            </div>

            <div className="py-2">
                <button className="p-4 border border-white hover:bg-white hover:text-black">
                    Login
                </button>
            </div>
        </form>
    );
}
