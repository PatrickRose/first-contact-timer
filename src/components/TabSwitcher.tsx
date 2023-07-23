import { Game } from "../types/types";
import Image from "next/image";
import Icon_Game from "../../public/Icon-VLHG.png";
import Icon_NewsFeed from "../../public/GNNLogo.png";
import Icon_DefCon from "../../public/Icon-DefCon.png";
import Icon_Manage from "../../public/Icon-Manage.png";
import React, { useEffect } from "react";

function DisplayManageTabSwitch({
    activeTab,
    setActiveTab,
    manageTabTitle,
}: {
    activeTab: string;
    setActiveTab: (newActive: string) => void;
    manageTabTitle: string;
}) {
    const activeClass = "bg-zinc-600";
    const baseClass = "flex-1 text-lg transition pt-2";

    if (manageTabTitle == "") return null;

    return (
        <button
            className={`${baseClass} ${
                activeTab == "manage" ? activeClass : ""
            }`}
            onClick={() => setActiveTab("manage")}
        >
            <Image className="mx-auto" src={Icon_Manage} alt="" width={40} />
            <span>{manageTabTitle}</span>
        </button>
    );
}

export default function TabSwitcher({
    activeTab,
    setActiveTab,
    manageTabTitle,
    game,
}: {
    activeTab: string;
    setActiveTab: (newActive: string) => void;
    manageTabTitle: string | null;
    game: Game;
}) {
    const activeClass = "bg-zinc-600";
    const baseClass = "flex-1 text-lg transition pt-2";

    useEffect(() => window.scrollTo({ top: 0 }), [activeTab]);

    return (
        <div className="flex w-full lg:hidden fixed bottom-0 left-0 right-0 h-24 bg-gradient-to-b from-turn-counter-past-light to-turn-counter-past-dark text-white border-black">
            <button
                className={`${baseClass} ${
                    activeTab == "home" ? activeClass : ""
                }`}
                onClick={() => setActiveTab("home")}
            >
                <Image className="mx-auto" src={game.setupInformation.logo ?? Icon_Game} alt="" width={40} height={40} />
                <span>Game</span>
            </button>
            <button
                className={`${baseClass} ${
                    activeTab == "press" ? activeClass : ""
                }`}
                onClick={() => setActiveTab("press")}
            >
                <Image
                    className="mx-auto"
                    src={Icon_NewsFeed}
                    alt=""
                    width={40}
                />
                <span>News</span>
            </button>
            {game.components.map((component, key) => {
                let innerComponent = null;
                switch (component.componentType) {
                    case "Defcon":
                        innerComponent = (
                            <button
                                className={`${baseClass} ${
                                    activeTab == component.componentType
                                        ? activeClass
                                        : ""
                                }`}
                                onClick={() =>
                                    setActiveTab(component.componentType)
                                }
                            >
                                <Image
                                    className="mx-auto"
                                    src={Icon_DefCon}
                                    alt=""
                                    width={40}
                                />
                                <span>Defcon</span>
                            </button>
                        );
                        break;
                    case "Weather":
                        innerComponent = (
                            <button
                                className={`${baseClass} ${
                                    activeTab == component.componentType
                                        ? activeClass
                                        : ""
                                }`}
                                onClick={() =>
                                    setActiveTab(component.componentType)
                                }
                            >
                                <Image
                                    className="mx-auto"
                                    // TODO: Update weather Icon
                                    src={Icon_DefCon}
                                    alt=""
                                    width={40}
                                />
                                <span>Weather</span>
                            </button>
                        );
                        break;
                }

                return (
                    <React.Fragment key={key}>{innerComponent}</React.Fragment>
                );
            })}
            {manageTabTitle !== null ? (
                <DisplayManageTabSwitch
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    manageTabTitle={manageTabTitle}
                />
            ) : null}
        </div>
    );
}
