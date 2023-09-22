import { ApiResponse, Game } from "@fc/types/types";
import LogoBlock from "./LogoBlock";
import HelpBlock from "./HelpBlock";
import React, { useState } from "react";
import { SideComponentMapper } from "../../../lib/ComponentMapper";
import { CSSTransition, SwitchTransition } from "react-transition-group";
import useInterval from "../../../lib/useInterval";

export default function SideComponentsAftermath({
    components,
    setupInformation,
}: {
    components: ApiResponse["components"];
    setupInformation: Game["setupInformation"];
}) {
    const [activeTabNumber, setActiveTabNumber] = useState(0);

    const toShow = components
        .filter((component) => SideComponentMapper({ component }) !== null)
        .map((component) => {
            return {
                componentType: component.componentType,
                component: <SideComponentMapper component={component} />,
            };
        });

    useInterval(() => {
        if (toShow.length == 0) {
            return;
        }

        setActiveTabNumber((prev) => (prev + 1) % toShow.length);
    }, 10000);

    return (
        <div className="hidden lg:flex flex-col justify-center w-full max-w-[25%] p-6">
            <div className="lg:block">
                {toShow.length == 0 ? null : (
                    <SwitchTransition mode="out-in">
                        <CSSTransition
                            key={activeTabNumber}
                            addEndListener={(node, done) =>
                                node.addEventListener(
                                    "transitionend",
                                    done,
                                    false,
                                )
                            }
                            classNames={{
                                appear: "opacity-0",
                                appearActive:
                                    "transition-opacity duration-500 opacity-100",
                                enter: "opacity-0",
                                enterActive:
                                    "transition-opacity duration-500 opacity-100",
                                // exit: "opacity-100",  // this breaks the exit transition
                                exitActive:
                                    "transition-opacity duration-500 opacity-0",
                            }}
                        >
                            {toShow[activeTabNumber].component}
                        </CSSTransition>
                    </SwitchTransition>
                )}
            </div>
            <div className="lg:block">
                <HelpBlock setupInformation={setupInformation} />
            </div>
        </div>
    );
}
