import { Game } from "@fc/types/types";
import Image, { ImageProps } from "next/image";
import Icon_Game from "@fc/public/Icon-VLHG.png";
import Icon_DefCon from "@fc/public/Icon-DefCon.png";
import Icon_Manage from "@fc/public/Icon-Manage.png";
import React, { useEffect } from "react";
import { calculatePressTabIcon } from "@fc/lib/press";

export function GameTabSwitcher({
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
    useEffect(() => window.scrollTo({ top: 0 }), [activeTab]);

    const tabs: Record<string, TabInfo> = {
        home: {
            title: "Game",
            image: game.setupInformation.logo ?? Icon_Game,
        },
    };

    if (game.setupInformation.press !== false) {
        tabs["press"] = {
            title: "Press",
            image: calculatePressTabIcon(game.setupInformation.press),
        };
    }

    game.components.forEach((component) => {
        switch (component.componentType) {
            case "Defcon":
                tabs[component.componentType] = {
                    title: "Defcon",
                    image: Icon_DefCon,
                };
                break;
            case "Weather":
                tabs[component.componentType] = {
                    title: "Weather",
                    // TODO: Update weather Icon
                    image: Icon_DefCon,
                };
                break;
            case "RunningHotCorp":
                tabs[component.componentType] = {
                    title: "Share Prices",
                    // TODO: Update weather Icon
                    image: Icon_DefCon,
                };
                break;
            case "RunningHotRunners":
                tabs[component.componentType] = {
                    title: "Runner Rep",
                    // TODO: Update weather Icon
                    image: Icon_DefCon,
                };
                break;
        }
    });

    if (manageTabTitle !== null) {
        tabs["manage"] = {
            title: manageTabTitle,
            image: Icon_Manage,
        };
    }

    return (
        <div className="lg:hidden sticky bottom-0">
            <TabSwitcher
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                tabs={tabs}
                triggerScroll={true}
            />
        </div>
    );
}

export type TabInfo = {
    title: string;
    image: ImageProps["src"];
};
export default function TabSwitcher<
    TabNames extends string,
    Tabs extends Record<TabNames, TabInfo>,
>({
    activeTab,
    tabs,
    setActiveTab,
    triggerScroll,
}: {
    activeTab: TabNames;
    tabs: Tabs;
    setActiveTab: (newActive: TabNames) => void;
    triggerScroll: boolean;
}) {
    const activeClass = "bg-zinc-600";
    const baseClass = "flex-1 text-lg transition pt-2";

    useEffect(() => {
        if (triggerScroll) {
            window.scrollTo({ top: 0 });
        }
    }, [triggerScroll, activeTab]);

    return (
        <div className="h-24 flex w-full bg-gradient-to-b from-turn-counter-past-light to-turn-counter-past-dark text-white border-black">
            {Object.entries(tabs).map(([key, value]) => {
                // Cast to the type
                const tabName = key as TabNames;
                const tabInfo = value as Tabs[typeof tabName];

                return (
                    <button
                        className={`${baseClass} ${
                            activeTab == key ? activeClass : ""
                        }`}
                        onClick={() => setActiveTab(tabName)}
                        key={key}
                    >
                        <Image
                            className="mx-auto"
                            src={tabInfo.image}
                            alt=""
                            width={40}
                            height={40}
                        />
                        <span>{tabInfo.title}</span>
                    </button>
                );
            })}
        </div>
    );
}
