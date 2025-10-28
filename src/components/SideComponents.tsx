import {
    ApiResponse,
    Game,
    LivePress,
    SetupInformation,
} from "@fc/types/types";
import Icon_Game from "@fc/public/Icon-VLHG.png";
import LogoBlock from "./theme/first-contact/LogoBlock";
import React, { useRef, useState } from "react";
import { SideComponentMapper } from "@fc/lib/ComponentMapper";
import { CSSTransition, SwitchTransition } from "react-transition-group";
import useInterval from "@fc/lib/useInterval";
import { NewsFeed } from "@fc/components/theme/first-contact/NewsFeed";
import TabSwitcher, { TabInfo } from "@fc/components/TabSwitcher";
import { calculatePressTabIcon } from "@fc/lib/press";

type SideComponentsToShow = {
    componentType: ApiResponse["components"][0]["componentType"];
    component: ReturnType<typeof SideComponentMapper>;
}[];

function SideComponents({ components }: { components: SideComponentsToShow }) {
    const [activeTabNumber, setActiveTabNumber] = useState(0);
    const nodeRef = useRef(null);

    useInterval(() => {
        if (components.length == 0) {
            return;
        }

        setActiveTabNumber((prev) => (prev + 1) % components.length);
    }, 10000);

    if (components.length == 0) {
        return null;
    }

    return (
        <SwitchTransition mode="out-in">
            <CSSTransition
                key={activeTabNumber}
                nodeRef={nodeRef}
                addEndListener={(node, done) =>
                    node.addEventListener("transitionend", done, false)
                }
                classNames={{
                    appear: "opacity-0",
                    appearActive: "transition-opacity duration-500 opacity-100",
                    enter: "opacity-0",
                    enterActive: "transition-opacity duration-500 opacity-100",
                    // exit: "opacity-100",  // this breaks the exit transition
                    exitActive: "transition-opacity duration-500 opacity-0",
                }}
            >
                {components[activeTabNumber].component}
            </CSSTransition>
        </SwitchTransition>
    );
}

function SideComponentsWithPress({
    components,
    breakingNews,
    press,
    gameIcon,
}: {
    components: SideComponentsToShow;
    breakingNews: ApiResponse["breakingNews"];
    press: LivePress;
    gameIcon: SetupInformation["logo"];
}) {
    type SideComponentsTabTitles = "components" | "press";

    const [activeTab, setActiveTab] =
        useState<SideComponentsTabTitles>("components");

    const tabs: Record<SideComponentsTabTitles, TabInfo> = {
        components: {
            title: "Game Information",
            image: gameIcon ?? Icon_Game,
        },
        press: {
            title: "Press Feed",
            image: calculatePressTabIcon(press),
        },
    };

    return (
        <React.Fragment>
            <div className="flex-1">
                {activeTab == "components" ? (
                    <SideComponents components={components} />
                ) : (
                    <NewsFeed
                        showPressFilter={false}
                        newsItems={breakingNews}
                        press={press}
                    />
                )}
            </div>
            <div className="sticky bottom-0">
                <TabSwitcher
                    activeTab={activeTab}
                    tabs={tabs}
                    setActiveTab={setActiveTab}
                    triggerScroll={false}
                />
            </div>
        </React.Fragment>
    );
}

export default function SideComponentWrapper({
    breakingNews,
    components,
    setupInformation,
}: {
    breakingNews: ApiResponse["breakingNews"];
    components: ApiResponse["components"];
    setupInformation: Game["setupInformation"];
}) {
    const toShow = components
        .filter((component) => SideComponentMapper({ component }) !== null)
        .map((component) => {
            return {
                componentType: component.componentType,
                component: <SideComponentMapper component={component} />,
            };
        });

    return (
        <div className="hidden lg:flex flex-col justify-between border-l-4 border-turn-counter-past-light w-full lg:w-1/3 xl:w-1/4 max-h-screen">
            <div className="flex flex-1 flex-col overflow-auto">
                {setupInformation.press === false ||
                setupInformation.hidePressInSidebar ? (
                    <SideComponents components={toShow} />
                ) : toShow.length > 0 ? (
                    <SideComponentsWithPress
                        components={toShow}
                        breakingNews={breakingNews}
                        press={setupInformation.press}
                        gameIcon={setupInformation.logo}
                    />
                ) : (
                    <NewsFeed
                        showPressFilter={false}
                        newsItems={breakingNews}
                        press={setupInformation.press}
                    />
                )}
            </div>
            <div className="lg:sticky bottom-0">
                <LogoBlock setupInformation={setupInformation} />
            </div>
        </div>
    );
}
