"use client";

import { ApiResponse, Game, SetBreakingNews } from "../../../../types/types";
import { FormEvent, useState } from "react";
import { ApiResponseDecode } from "../../../../types/io-ts-def";

export default function PressForm({
    game,
    apiResponse,
    setApiResponse,
    pressAccount,
}: {
    game: Game;
    apiResponse: ApiResponse;
    setApiResponse: (apiResponse: ApiResponse) => void;
    pressAccount: number;
}) {
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [breakingNews, setBreakingNews] = useState<string>("");

    const buttonMsg = isSubmitting
        ? "Submitting, please wait..."
        : "Submit breaking news";

    const submit = async (ev: FormEvent<HTMLFormElement>) => {
        ev.preventDefault();
        setIsSubmitting(false);

        const toSend: SetBreakingNews = {
            breakingNews,
            pressAccount,
        };

        return fetch(`/game/${game._id}/press/api/`, {
            method: "POST",
            body: JSON.stringify(toSend),
            headers: {
                "Content-Type": "application/json",
            },
        })
            .then((response) => {
                if (!response.ok) {
                    response.text().then((text) => console.error(text));
                }

                return response.json();
            })
            .then((body) => {
                if (!ApiResponseDecode.is(body)) {
                    console.error(JSON.stringify(body));
                    return;
                }

                setBreakingNews("");
                setApiResponse(body);
            })
            .finally(() => {
                setIsSubmitting(false);
            });
    };

    return (
        <div className="first-contact-container lg:p-4 pb-24 lg:pb-4 lg:bg-gradient-to-b from-turn-counter-past-light to-turn-counter-past-dark">
            <h2 className="text-3xl mt-2 mb-6 uppercase text-center">
                Press Tools
                {Array.isArray(game.setupInformation.press) ? (
                    <span className="block text-lg normal-case">
                        Posting as{" "}
                        {game.setupInformation.press[pressAccount - 1]?.name}
                    </span>
                ) : null}
            </h2>
            <div className="flex flex-col">
                <form onSubmit={submit} className="mt-2">
                    <label
                        id="breaking-news-label"
                        className="pb-4 pt-0 block text-xl text-center"
                        htmlFor="breaking-news"
                    >
                        Enter breaking news headline here:
                    </label>
                    <div className="block">
                        <textarea
                            name="breaking-news"
                            className="form-control w-full ml-0 mr-4 bg-black text-white text-xl"
                            value={breakingNews}
                            onChange={(e) => setBreakingNews(e.target.value)}
                            rows={4}
                            maxLength={150}
                        />
                        <button
                            className="mt-4 text-xl text-white bg-blue-600 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg px-5 py-2.5 text-center mr-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800 disabled:opacity-75 disabled:hover:bg-blue-70"
                            type="submit"
                            disabled={!apiResponse.active || isSubmitting}
                        >
                            {buttonMsg}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
