import * as React from "react";
import { Game } from "@fc/types/types";

export default function HelpBlock({
    setupInformation,
}: {
    setupInformation: Game["setupInformation"];
}) {
    const { gameName, logo } = setupInformation;

    let textClass = "text-center uppercase text-2xl font-semibold";

    return (
        <div className="flex justify-end mx-1 mt-10 ">
            <div className="w-full w-max-[400px] border-2 border-white text-white p-8 lg:w-[250px]">
                <p className={`${textClass}`}>
                    Need Help? Please speak to any facilitator!
                </p>
            </div>
        </div>
    );
}
