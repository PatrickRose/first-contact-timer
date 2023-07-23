"use client";

import { ApiResponse, Game } from "../../../types/types";
import React, { useEffect, useState } from "react";
import { getCurrentPhase, toApiResponse } from "../../../server/turn";
import useInterval from "../../../lib/useInterval";
import CurrentTurn from "../../../components/CurrentTurn";
import { isLeft } from "fp-ts/Either";
import TurnCounter from "../../../components/TurnCounter";
import LogoBlock from "../../../components/LogoBlock";
import { NewsFeed } from "../../../components/NewsFeed";
import BreakingNews from "../../../components/BreakingNews";
import TabSwitcher from "../../../components/TabSwitcher";
import DefconStatuses from "../../../components/DefconStatuses";
import { ApiResponseDecode } from "../../../types/io-ts-def";
import ControlTools from "../../../components/ControlTools";
import PressForm from "./press/PressForm";
import WeatherStatus from "../../../components/WeatherStatus";

const triggersAudio: (keyof ApiResponse)[] = ["active", "turnNumber", "phase"];

export default function GameWrapper({
    game,
    mode,
}: {
    game: Game;
    mode: "Player" | "Control" | "Press";
}) {
    const [apiResponse, setAPIResponse] = useState<ApiResponse>(
        toApiResponse(game)
    );
    const [activeTab, setActiveTab] = useState<string>("home");

    const [audio, setAudio] = useState<HTMLAudioElement>();

    useEffect(() => setAudio(new Audio("/turn-change.mp3")), []);

    const delay = Math.min(apiResponse.phaseEnd * 1000, 5000);
    useInterval(
        () => {
            fetch(`/game/${game._id}/api`, {
                cache: "no-cache",
                headers: { accept: "application/json" },
            })
                .then((response) => response.json())
                .then((body) => {
                    if (ApiResponseDecode.is(body)) {
                        setAPIResponse(body);

                        if (
                            triggersAudio.some(
                                (val) => body[val] != apiResponse[val]
                            )
                        ) {
                            audio?.play().catch((e) => console.log(e));
                        }
                    } else {
                        throw new Error("Body did not match API");
                    }
                })
                .catch((error) => console.error(error));
        },
        delay == 0 ? 100 : delay
    );

    useInterval(() => {
        if (!apiResponse.active) {
            return;
        }

        const phaseEnd = apiResponse.phaseEnd;

        const newPhaseEnd = Math.max(phaseEnd - 1, 0);
        setAPIResponse({ ...apiResponse, phaseEnd: newPhaseEnd });
    }, 1000);

    const currentPhaseInformation = getCurrentPhase(
        apiResponse.phase,
        game.setupInformation
    );

    if (isLeft(currentPhaseInformation)) {
        throw new Error("Unknown current phase information");
    }

    let child: React.ReactNode = null;
    let manageTabTitle: string | null = null;

    switch (mode) {
        case "Control":
            child = (
                <ControlTools
                    game={game}
                    apiResponse={apiResponse}
                    setApiResponse={setAPIResponse}
                />
            );
            manageTabTitle = "Control Tools";
            break;
        case "Press":
            child = (
                <PressForm
                    game={game}
                    apiResponse={apiResponse}
                    setApiResponse={setAPIResponse}
                />
            );
            manageTabTitle = "Press Tools";
            break;
    }

    return (
        <div>
            <div className="fixed top-0 left-0 right-0">
                <CurrentTurn
                    turn={apiResponse.turnNumber}
                    phase={apiResponse.phase}
                    timestamp={apiResponse.phaseEnd}
                    active={apiResponse.active}
                    phaseInformation={currentPhaseInformation.right}
                />
            </div>
            <div className="flex flex-row flex-1">
                <main
                    role="main"
                    className={`${
                        activeTab != "home" &&
                        activeTab != "manage" &&
                        activeTab != "press"
                            ? "hidden"
                            : ""
                    } lg:flex container flex-1 text-center h-screen 
                                flex-col 
                                justify-between justify-items-stretch items-center
                                `}
                >
                    <div>
                        <div
                            className={`${
                                activeTab != "home" ? "hidden" : ""
                            } lg:block py-4 lg:p-8 flex flex-col items-center flex-1`}
                        >
                            <TurnCounter
                                turn={apiResponse.turnNumber}
                                phase={apiResponse.phase}
                                timestamp={apiResponse.phaseEnd}
                                active={apiResponse.active}
                                setupInformation={game.setupInformation}
                            />
                        </div>
                        <div
                            className={`${
                                activeTab != "home" ? "hidden" : "block"
                            } lg:hidden pb-24 `}
                        >
                            <LogoBlock
                                setupInformation={game.setupInformation}
                            />
                        </div>
                        {child ? (
                            <div
                                className={`${
                                    activeTab != "manage" ? "hidden" : ""
                                } lg:block`}
                            >
                                {child}
                            </div>
                        ) : null}
                        <div
                            className={`${
                                activeTab != "press" ? "hidden" : ""
                            } lg:hidden`}
                        >
                            <NewsFeed newsItems={apiResponse.breakingNews} />
                        </div>
                    </div>
                    {game.setupInformation.breakingNewsBanner ? (
                        <BreakingNews newsItem={apiResponse.breakingNews[0]} />
                    ) : null}
                </main>
                {apiResponse.components.map((component, key) => {
                    let innerComponent: React.ReactNode = null;

                    switch (component.componentType) {
                        case "Defcon":
                            innerComponent = (
                                <DefconStatuses defcon={component.countries} />
                            );
                            break;
                        case "Weather":
                            innerComponent = (
                                <WeatherStatus
                                    message={component.weatherMessage}
                                />
                            );
                            break;
                    }

                    if (innerComponent === null) {
                        return null;
                    }

                    return (
                        <div
                            key={key}
                            className={`${
                                activeTab != component.componentType
                                    ? "hidden"
                                    : ""
                            } lg:flex flex-col justify-between border-l-4 border-turn-counter-past-light w-full lg:w-auto`}
                        >
                            <div
                                className={`${
                                    activeTab != component.componentType
                                        ? "hidden"
                                        : ""
                                } lg:block`}
                            >
                                {innerComponent}
                            </div>
                            <div className="hidden lg:block">
                                <LogoBlock
                                    setupInformation={game.setupInformation}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>
            <TabSwitcher
                activeTab={activeTab}
                setActiveTab={(newActive: string) => setActiveTab(newActive)}
                manageTabTitle={manageTabTitle}
                game={game}
            />
        </div>
    );
}
