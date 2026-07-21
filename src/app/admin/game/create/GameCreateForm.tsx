"use client";

import { FormEvent, useState } from "react";
import { GameType } from "@fc/types/types";
import { CreateGameResponseDecode } from "@fc/types/io-ts-def";
import Link from "next/link";

export function GameCreateForm() {
    const [gameID, setID] = useState<string>("");
    const [type, setType] = useState<GameType | null>(null);
    const [error, setError] = useState<string[] | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const submit = async (ev: FormEvent<HTMLFormElement>) => {
        ev.preventDefault();
        setError(null);
        setSuccess(null);

        const response = await fetch("/admin/game/create/api", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
            },
            body: JSON.stringify({ gameID, type }),
        });

        let data: unknown;

        try {
            data = await response.json();
        } catch (e) {
            console.error(e);
            const errors = ["Server responded with bad data?"];

            try {
                errors.push(await response.text());
            } catch (e) {
                console.error(e);
                errors.push("Could not get response result");
            }

            setError(errors);
            return;
        }

        if (!CreateGameResponseDecode.is(data)) {
            setError(["Server did not respond with the Create Game Response"]);
            return;
        }

        if (!data.result) {
            setError(data.errors);
        } else {
            setSuccess(gameID);
            setType(null);
            setID("");
        }
    };

    const gameTypes: Record<GameType, string> = {
        "first-contact": "First Contact: 2035",
        aftermath: "Aftermath",
        "wts-1970": "Watch the Skies: 1970",
        dow: "Den of Wolves",
        "dow-new-eden": "Den of Wolves: New Eden",
        "running-hot": "Running Hot",
        AYNOHYEB: "Are you now...",
        DeedsAndDestiny: "Deeds & Destiny",
        "faes-anatomy": "Fae's Anatomy",
        "dead-britannia": "Dead Britannia",
        "dev-test-game": "Dev Test Game",
        "touched-by-darkness": "Touched By Darkness",
        demo: "Demo (All Components)",
    };

    return (
        <form onSubmit={submit} className="flex flex-col gap-6">
            {success !== null ? (
                <div
                    role="status"
                    className="rounded-lg border border-green-500/50 bg-green-950/60 p-4 text-sm text-green-200"
                >
                    Game with ID {success} created! You can access it at{" "}
                    <Link
                        className="font-semibold text-green-100 underline hover:text-white"
                        href={`/game/${encodeURIComponent(success)}`}
                    >
                        /game/{success}
                    </Link>
                </div>
            ) : null}
            {error !== null ? (
                <div
                    role="alert"
                    className="rounded-lg border border-red-500/50 bg-red-950/60 p-4 text-sm text-red-200"
                >
                    <ul className="list-inside list-disc space-y-1">
                        {error.map((val, key) => (
                            <li key={key}>{val}</li>
                        ))}
                    </ul>
                </div>
            ) : null}

            <div>
                <label
                    className="block text-sm font-medium text-zinc-300"
                    htmlFor="game-id"
                >
                    Game ID
                </label>
                <input
                    className="mt-2 block w-full rounded-lg border-zinc-700 bg-zinc-950 text-zinc-100 placeholder-zinc-500 focus:border-indigo-500 focus:ring-indigo-500"
                    id="game-id"
                    value={gameID}
                    onChange={(event) => setID(event.target.value)}
                />
                <p className="mt-2 text-sm text-zinc-500">
                    This becomes part of the game URL, so keep it short and
                    memorable.
                </p>
            </div>

            <fieldset>
                <legend className="text-sm font-medium text-zinc-300">
                    Game type
                </legend>
                <div className="mt-2 grid gap-3 sm:grid-cols-2">
                    {Object.entries(gameTypes).map(([key, label]) => (
                        <label
                            key={key}
                            htmlFor={key}
                            className={`flex cursor-pointer items-center gap-x-3 rounded-lg border p-3 text-sm font-medium transition ${
                                key == type
                                    ? "border-indigo-500 bg-indigo-950/40 text-indigo-100"
                                    : "border-zinc-700 bg-zinc-950 text-zinc-300 hover:border-zinc-500"
                            }`}
                        >
                            <input
                                id={key}
                                name="gameType"
                                type="radio"
                                className="h-4 w-4 border-zinc-600 bg-zinc-900 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-zinc-900"
                                checked={key == type}
                                value={key}
                                onChange={() => setType(key as GameType)}
                            />
                            {label}
                        </label>
                    ))}
                </div>
            </fieldset>

            <div>
                <button className="w-full rounded-lg bg-indigo-600 px-4 py-2.5 font-semibold text-white transition hover:bg-indigo-500 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-zinc-900 sm:w-auto">
                    Create Game
                </button>
            </div>
        </form>
    );
}
