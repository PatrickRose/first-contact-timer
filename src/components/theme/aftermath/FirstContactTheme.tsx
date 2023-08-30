import { ThemeProps } from "../theme";
import { useState } from "react";
import TabSwitcher from "../../TabSwitcher";
import SideComponents from "./SideComponentsAftermath";
import { SideComponentMapper } from "../../../lib/ComponentMapper";
import BreakingNews from "./BreakingNews";
import { NewsFeed } from "./NewsFeed";
import LogoBlock from "./LogoBlock";
import TurnCounter from "./TurnCounter";
import PhaseList from "./PhaseList";
import CurrentTurn from "./CurrentTurn";
import AlertSystemFooter from "./AlertSystemFooter";
import { getCurrentPhase } from "../../../server/turn";
import { isLeft } from "fp-ts/Either";

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
            className={`flex flex-col min-h-screen text-white flex-1 pt-24 lg:pt-0 font-medium ${pageBG}`}
        >
            <div className="fixed top-0 left-0 right-0">
                <CurrentTurn
                    turn={apiResponse.turnNumber}
                    phase={apiResponse.phase}
                    timestamp={apiResponse.phaseEnd}
                    active={apiResponse.active}
                    phaseInformation={currentPhaseInformation.right}
                />
            </div>
            <div className="flex flex-col lg:h-screen content-between">
                <div className="flex flex-row flex-1 ">
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
                        } lg:flex first-contact-container flex-1 text-center  flex-row justify-between justify-items-stretch items-center`}
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
                                } lg:hidden pb-24 `}
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
                    } lg:block`}
                >
                    <AlertSystemFooter />
                </div>
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
