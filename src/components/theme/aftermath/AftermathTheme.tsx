import { ThemeProps } from "../theme";
import { useState } from "react";
import { GameTabSwitcher } from "../../TabSwitcher";
import SideComponents from "./SideComponentsAftermath";
import { SideComponentMapper } from "@fc/lib/ComponentMapper";
import BreakingNews from "./BreakingNews";
import { NewsFeed } from "./NewsFeed";
import LogoBlock from "./LogoBlock";
import TurnCounter from "./TurnCounter";
import PhaseList from "./PhaseList";
import CurrentTurn from "./CurrentTurn";
import AlertSystemFooter from "./AlertSystemFooter";
import { getCurrentPhase } from "@fc/server/turn";
import { isLeft } from "fp-ts/Either";
import PhaseInformation from "@fc/components/PhaseInformation";

export function AftermathTheme({
    apiResponse,
    game,
    childComponent,
    manageTabTitle,
}: ThemeProps) {
    const [activeTab, setActiveTab] = useState<string>("home");

    const currentPhaseInformation = getCurrentPhase(
        apiResponse.phase,
        game.setupInformation,
    );

    if (isLeft(currentPhaseInformation)) {
        throw new Error("Unknown current phase information");
    }

    let pageBG = apiResponse.active ? "bg-aftermath" : "bg-zinc-600";

    return (
        <div
            className={`flex flex-col h-screen overflow-y-auto text-white flex-1 font-medium ${pageBG}`}
        >
            <div className="sticky top-0">
                <CurrentTurn
                    turn={apiResponse.turnNumber}
                    phase={apiResponse.phase}
                    timestamp={apiResponse.phaseEnd}
                    active={apiResponse.active}
                    phaseInformation={currentPhaseInformation.right}
                />
            </div>
            <div className="flex flex-col content-between h-screen overflow-y-auto">
                <div className="flex flex-row flex-1">
                    <div className="hidden lg:flex flex-row items-center w-full max-w-[25%] p-6">
                        <div className="">
                            <PhaseList
                                turn={apiResponse.turnNumber}
                                phase={apiResponse.phase}
                                timestamp={apiResponse.phaseEnd}
                                active={apiResponse.active}
                                setupInformation={game.setupInformation}
                                components={apiResponse.components}
                            />
                        </div>
                    </div>
                    <main
                        role="main"
                        className={`${
                            activeTab != "home" &&
                            activeTab != "manage" &&
                            activeTab != "press"
                                ? "hidden"
                                : ""
                        } lg:flex first-contact-container flex-1 text-center  flex-row justify-between justify-items-stretch items-center py-8`}
                    >
                        <div className="w-full">
                            <div
                                className={`${
                                    activeTab != "home" ? "hidden" : ""
                                } lg:block py-4 lg:p-8 flex flex-col items-center flex-1 w-full`}
                            >
                                <TurnCounter
                                    turn={apiResponse.turnNumber}
                                    phase={apiResponse.phase}
                                    timestamp={apiResponse.phaseEnd}
                                    active={apiResponse.active}
                                    setupInformation={game.setupInformation}
                                    components={apiResponse.components}
                                />
                                <div className="py-2 flex flex-1 justify-center items-center text-left lg:text-4xl">
                                    <PhaseInformation
                                        game={game}
                                        apiResponse={apiResponse}
                                    />
                                </div>
                            </div>
                            <div
                                className={`${
                                    activeTab != "home" ? "hidden" : ""
                                } lg:hidden py-4 lg:p-8 flex flex-col items-center flex-1 w-full`}
                            >
                                <PhaseList
                                    turn={apiResponse.turnNumber}
                                    phase={apiResponse.phase}
                                    timestamp={apiResponse.phaseEnd}
                                    active={apiResponse.active}
                                    setupInformation={game.setupInformation}
                                    components={apiResponse.components}
                                />
                            </div>
                            <div
                                className={`${
                                    activeTab != "home" ? "hidden" : "block"
                                } lg:hidden`}
                            >
                                <LogoBlock
                                    setupInformation={game.setupInformation}
                                />
                            </div>
                            {childComponent ? (
                                <div
                                    className={`${
                                        activeTab != "manage" ? "hidden" : ""
                                    } lg:block`}
                                >
                                    {childComponent}
                                </div>
                            ) : null}
                            {game.setupInformation.press === false ? null : (
                                <div
                                    className={`${
                                        activeTab != "press" ? "hidden" : ""
                                    } lg:hidden`}
                                >
                                    <NewsFeed
                                        newsItems={apiResponse.breakingNews}
                                        press={game.setupInformation.press}
                                    />
                                </div>
                            )}
                        </div>
                        {game.setupInformation.breakingNewsBanner ? (
                            <BreakingNews
                                newsItem={apiResponse.breakingNews[0]}
                                press={game.setupInformation.press}
                            />
                        ) : null}
                    </main>
                    {apiResponse.components.map((component, key) => {
                        return (
                            <div
                                key={key}
                                className={`${
                                    activeTab != component.componentType
                                        ? "hidden"
                                        : ""
                                } lg:hidden flex-col justify-between w-full lg:w-auto`}
                            >
                                <div
                                    className={`${
                                        activeTab != component.componentType
                                            ? "hidden"
                                            : ""
                                    } lg:block`}
                                >
                                    <SideComponentMapper
                                        component={component}
                                    />
                                </div>
                            </div>
                        );
                    })}
                    <SideComponents
                        components={apiResponse.components}
                        setupInformation={game.setupInformation}
                    />
                </div>
                <div
                    className={`${
                        activeTab != "home" ? "hidden" : ""
                    } lg:block lg:sticky lg:bottom-0`}
                >
                    <AlertSystemFooter />
                </div>
            </div>
            <GameTabSwitcher
                activeTab={activeTab}
                setActiveTab={(newActive: string) => setActiveTab(newActive)}
                manageTabTitle={manageTabTitle}
                game={game}
            />
        </div>
    );
}
