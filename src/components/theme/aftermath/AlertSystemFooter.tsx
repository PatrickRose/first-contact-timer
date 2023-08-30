import * as React from "react";
import Image from "next/image";
import VLHGLogo from "../../../../public/aftermath-logo-vlhg.svg";
import BBCLogo from "../../../../public/aftermath-logo-bbc.svg";
import GovLogo from "../../../../public/aftermath-logo-hm-gov.svg";
import { Game } from "../../../types/types";

export default function AlertSystemFooter({}: {}) {
    let textClass = "text-center uppercase text-2xl font-semibold";

    return (
        <div className="block lg:flex flex-row justify-between bg-white text-aftermath font-semibold text-center pt-12 lg:py-4 pb-24 lg:pb-4 px-6 ">
            <div className="w-2/3 mx-auto py-0 lg:mx-0 lg:h-24 lg:w-1/3 lg:py-3">
                <Image
                    className="h-auto w-full max-w-[250px] mx-auto lg:mx-0 lg:h-full lg:w-auto lg:float-left"
                    src={GovLogo}
                    alt=""
                />
            </div>
            <div className="w-2/3 mx-auto py-16 lg:mx-0 lg:h-20 lg:w-1/3 lg:py-3">
                <Image
                    className="h-8 w-auto mx-auto block"
                    src={BBCLogo}
                    alt=""
                />
                <p className="uppercase text-2xl font-medium pt-2">
                    Emergency Alert System
                </p>
            </div>
            <div className="w-1/2 mx-auto pb-10 lg:mx-0 lg:h-24 lg:w-1/3 lg:py-1">
                <Image
                    className="h-full w-auto max-w-[100px] lg:max-w-auto mx-auto lg:mx-0 lg:float-right "
                    src={VLHGLogo}
                    alt=""
                />
            </div>
        </div>
    );
}
