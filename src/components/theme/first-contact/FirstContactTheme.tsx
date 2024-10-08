import { ThemeProps } from "../theme";
import { useState } from "react";
import { GameTabSwitcher } from "../../TabSwitcher";
import SideComponentWrapper from "../../SideComponents";
import { SideComponentMapper } from "@fc/lib/ComponentMapper";
import BreakingNews from "./BreakingNews";
import { NewsFeed } from "./NewsFeed";
import LogoBlock from "./LogoBlock";
import TurnCounter from "./TurnCounter";
import CurrentTurn from "./CurrentTurn";
import { getCurrentPhase } from "@fc/server/turn";
import { isLeft } from "fp-ts/Either";
import PhaseInformation from "@fc/components/PhaseInformation";

export function FirstContactTheme({
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

    return (
        <div className="flex flex-col h-screen bg-black text-white flex-1">
            <div className="sticky top-0 left-0 right-0">
                <CurrentTurn
                    turn={apiResponse.turnNumber}
                    phase={apiResponse.phase}
                    timestamp={apiResponse.phaseEnd}
                    active={apiResponse.active}
                    phaseInformation={currentPhaseInformation.right}
                />
            </div>
            <div className="flex flex-row flex-1 max-h-full overflow-y-auto">
                <main
                    role="main"
                    className={`${
                        activeTab != "home" &&
                        activeTab != "manage" &&
                        activeTab != "press"
                            ? "hidden"
                            : ""
                    } flex first-contact-container flex-1 text-center flex-col
                                justify-between justify-items-stretch items-stretch
                                `}
                >
                    <div
                        className={`${
                            activeTab != "home" ? "hidden" : ""
                        } py-4 lg:p-8 flex flex-col items-center flex-1`}
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
                            activeTab != "home" ? "hidden" : "block"
                        } lg:hidden`}
                    >
                        <LogoBlock setupInformation={game.setupInformation} />
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
                                showPressFilter={true}
                            />
                        </div>
                    )}
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
                            } lg:hidden flex-col justify-between border-l-4 border-turn-counter-past-light w-full lg:w-auto`}
                        >
                            <div
                                className={`${
                                    activeTab != component.componentType
                                        ? "hidden"
                                        : ""
                                } lg:block`}
                            >
                                <SideComponentMapper component={component} />
                            </div>
                        </div>
                    );
                })}
                <SideComponentWrapper
                    components={apiResponse.components}
                    setupInformation={game.setupInformation}
                    breakingNews={apiResponse.breakingNews}
                />
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
