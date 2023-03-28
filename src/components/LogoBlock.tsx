import * as React from "react";
import { useState } from "react";
import { Transition } from "@headlessui/react";
import Image from "next/image";
import VLHGLogo from "../../public/vlhg-logo.svg";



export default function LogoBlock( ) {

    return (
        <div className="p-8 block w-full bg-gradient-to-r from-turn-counter-past-light to-turn-counter-past-dark text-white flex flex-row">
            <h2 className="text-3xl uppercase text-left m-0 opacity-50 w-2/3">First<br />Contact:<br />2035</h2>
            <div className="h-24 w-1/3 opacity-50 pt-2">
                <Image className="h-full w-auto float-right" src={VLHGLogo} alt="" width={54} />
            </div>
        </div>
    );
}
