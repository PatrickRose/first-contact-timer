import * as React from "react";
import Image from "next/image";
import VLHGLogo from "@fc/public/vlhg-logo.svg";
import { Game } from "@fc/types/types";

// Whether a theme renders a logo block is now decided by the theme shell: a
// theme that wants no logo simply does not render this component (see the
// aftermath shell), rather than passing a variant for this component to
// no-op on.
export default function LogoBlock({
    setupInformation,
}: {
    setupInformation: Game["setupInformation"];
}) {
    const { gameName, logo } = setupInformation;

    return (
        <div className="p-8 w-full bg-linear-to-r from-turn-counter-past-light to-turn-counter-past-dark text-white flex flex-row">
            <h2 className="text-3xl uppercase text-left m-0 opacity-50 w-2/3">
                {gameName}
            </h2>
            <div className="h-24 w-1/3 opacity-50 pt-2">
                <Image
                    className="h-full w-auto float-right"
                    src={logo ?? VLHGLogo}
                    alt=""
                    width={54}
                    height={54}
                />
            </div>
        </div>
    );
}
