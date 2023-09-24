import { ApiResponse, Game, SetWeatherStatus } from "@fc/types/types";
import { FormEvent, useState } from "react";
import { ApiResponseDecode } from "@fc/types/io-ts-def";
import WeatherStatus from "../WeatherStatus";

export function ControlWeather({
    setAPIResponse,
    weatherMessage,
    id,
}: {
    setAPIResponse: (apiResponse: ApiResponse) => void;
    setError: (value: string | undefined) => void;
    weatherMessage: string;
    id: Game["_id"];
}) {
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [newWeatherMessage, setNewWeatherMessage] = useState<string>("");

    const buttonMsg = isSubmitting
        ? "Submitting, please wait..."
        : "Submit weather update";

    const submit = async (ev: FormEvent<HTMLFormElement>) => {
        ev.preventDefault();
        setIsSubmitting(false);

        const toSend: SetWeatherStatus = {
            newWeatherMessage,
        };

        return fetch(`/game/${id}/control/api/weather`, {
            method: "POST",
            body: JSON.stringify(toSend),
            headers: {
                "Content-Type": "application/json",
            },
        })
            .then((response) => {
                if (!response.ok) {
                    response.text().then((text) => console.error(text));
                    return;
                }

                return response.json();
            })
            .then((body) => {
                if (!ApiResponseDecode.is(body)) {
                    console.error(JSON.stringify(body));
                    return;
                }

                setNewWeatherMessage("");
                setAPIResponse(body);
            })
            .finally(() => {
                setIsSubmitting(false);
            });
    };

    return (
        <div className="first-contact-container lg:p-4 pb-24 lg:pb-4 lg:bg-gradient-to-b from-turn-counter-past-light to-turn-counter-past-dark">
            <h2 className="text-3xl mt-2 mb-6 uppercase text-center">
                Weather Alerts
            </h2>
            <h3 className="text-2xl hidden">Current Weather Status</h3>
            <div className="flex flex-col hidden">
                <WeatherStatus
                    message={
                        weatherMessage === ""
                            ? "No Weather Report"
                            : weatherMessage
                    }
                />
            </div>
            <h3 className="text-2xl hidden">New Weather Alerts</h3>
            <div className="flex flex-col">
                <form onSubmit={submit} className="mt-2">
                    <label
                        id="breaking-news-label"
                        className="pb-4 pt-0 block text-xl text-center"
                        htmlFor="breaking-news"
                    >
                        Enter new weather alerts here (leave blank to clear the
                        status):
                    </label>
                    <div className="block">
                        <textarea
                            name="breaking-news"
                            className="form-control w-full ml-0 mr-4 bg-black text-white text-xl"
                            value={newWeatherMessage}
                            onChange={(e) =>
                                setNewWeatherMessage(e.target.value)
                            }
                            rows={4}
                            maxLength={150}
                        />
                        <button
                            className="mt-4 text-xl text-white bg-blue-600 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg px-5 py-2.5 text-center mr-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800 disabled:opacity-75 disabled:hover:bg-blue-70"
                            type="submit"
                            disabled={isSubmitting}
                        >
                            {buttonMsg}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
