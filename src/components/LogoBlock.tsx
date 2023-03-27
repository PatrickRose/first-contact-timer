import * as React from "react";
import { useState } from "react";
import { Transition } from "@headlessui/react";



export default function LogoBlock( ) {

    return (
        <div className="p-8 block w-full bg-gradient-to-r from-turn-counter-past-light to-turn-counter-past-dark text-white flex flex-row">
            <h2 className="text-3xl uppercase text-left m-0 opacity-50 w-2/3">First<br />Contact:<br />2035</h2>
            <div className="h-24 w-1/3">
                <img 
                    className="h-full w-auto float-right" 
                    src="/vlhg-logo.svg" 
                />
            </div>
        </div>
    );
}
