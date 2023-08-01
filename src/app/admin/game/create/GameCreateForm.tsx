"use client";

import { FormEvent, useState } from "react";
import { GameType } from "../../../../types/types";
import { CreateGameResponseDecode } from "../../../../types/io-ts-def";
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
            const errors = ["Server responded with bad data?"];

            try {
                errors.push(await response.text());
            } catch (e) {
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
        "dev-test-game": "Dev Test Game",
    };

    return (
        <form onSubmit={submit}>
            {success !== null ? (
                <div className="p-4 bg-green-300 rounded-2xl text-black">
                    Game with ID {success} created! You can access it at{" "}
                    <Link href={`/game/${success}`}>/game/{success}</Link>
                </div>
            ) : null}
            {error !== null ? (
                <div className="p-4 bg-red-300 rounded-2xl text-black">
                    <ul>
                        {error.map((val, key) => (
                            <li key={key}>{val}</li>
                        ))}
                    </ul>
                </div>
            ) : null}

            <div className="flex py-2">
                <label className="pr-2 w-1/6" htmlFor="game-id">
                    Game ID:{" "}
                </label>
                <input
                    className="flex-1"
                    id="game-id"
                    value={gameID}
                    onChange={(event) => setID(event.target.value)}
                />
            </div>

            <fieldset>
                <legend className="text-sm font-semibold leading-6">
                    Game Type
                </legend>
                <div className="mt-6 space-y-6">
                    {Object.entries(gameTypes).map(([key, label]) => (
                        <div key={key} className="flex items-center gap-x-3">
                            <input
                                id={key}
                                name="gameType"
                                type="radio"
                                className="h-4 w-4 border-gray-300 text-indigo-600 focus:ring-indigo-600"
                                checked={key == type}
                                value={key}
                                onChange={() => setType(key as GameType)}
                            />
                            <label
                                htmlFor={key}
                                className="block text-sm font-medium leading-6"
                            >
                                {label}
                            </label>
                        </div>
                    ))}
                </div>
            </fieldset>

            <div className="py-2">
                <button className="p-4 border border-white hover:bg-white hover:text-black">
                    Create Game
                </button>
            </div>
        </form>
    );
}
