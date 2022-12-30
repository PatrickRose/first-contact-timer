import * as React from 'react';
import {Defcon, DefconStatus} from "../types/types";

interface DefconProps {
    defcon: Defcon
}

interface CountryDefconProps {
    stateName: keyof Defcon,
    status: DefconStatus
}

function DefconStateInfo({inner, flex}: { inner: string, flex?: boolean }) {
    return <div className={`px-4 ${flex ? 'flex-1' : ''}`}>
        {inner}
    </div>
}

const DEFCON_STATE_TO_HUMAN_STATE: Record<keyof Defcon, React.ReactNode> = {
    China: <React.Fragment>
        <DefconStateInfo inner="🇨🇳"/>
        <DefconStateInfo inner="China" flex={true}/>
    </React.Fragment>,
    France: <React.Fragment>
        <DefconStateInfo inner="🇫🇷"/>
        <DefconStateInfo inner="France" flex={true}/>
    </React.Fragment>,
    Russia: <React.Fragment>
        <DefconStateInfo inner="🇷🇺"/>
        <DefconStateInfo inner="Russia" flex={true}/>
    </React.Fragment>,
    UnitedStates: <React.Fragment>
        <DefconStateInfo inner="🇺🇸"/>
        <DefconStateInfo inner="United States" flex={true}/>
    </React.Fragment>,
    UnitedKingdom: <React.Fragment>
        <DefconStateInfo inner="🇬🇧"/>
        <DefconStateInfo inner="United Kingdom" flex={true}/>
    </React.Fragment>,
    Pakistan: <React.Fragment>
        <DefconStateInfo inner="🇵🇰"/>
        <DefconStateInfo inner="Pakistan" flex={true}/>
    </React.Fragment>,
    India: <React.Fragment>
        <DefconStateInfo inner="🇮🇳"/>
        <DefconStateInfo inner="India" flex={true}/>
    </React.Fragment>,
    Israel: <React.Fragment>
        <DefconStateInfo inner="🇮🇱"/>
        <DefconStateInfo inner="Israel" flex={true}/>
    </React.Fragment>
}

const BACKGROUNDS: Record<DefconStatus, { background: string, activeBorder: string, inactiveBorder: string }> = {
    hidden: {background: '', activeBorder: '', inactiveBorder: ''},
    1: {background: 'bg-red-500', activeBorder: 'border-red-500', inactiveBorder: 'border-red-300'},
    2: {background: 'bg-orange-300', activeBorder: 'border-orange-300', inactiveBorder: 'border-orange-100'},
    3: {background: 'bg-green-300', activeBorder: 'border-green-300', inactiveBorder: 'border-green-100'},
}

function DefconState({defconNumber, active}: { defconNumber: DefconStatus, active: boolean }) {

    const backgroundDef = BACKGROUNDS[defconNumber];
    const background: string[] = [
        active ? backgroundDef.activeBorder : backgroundDef.inactiveBorder
    ];

    if (active) {
        background.push('delay-250');

        background.push(backgroundDef.background)
    }


    return <div
        className={`p-2 text-center items-center flex flex-col transition duration-500 border-4 ${background.join(' ')}`}>
        <span>Defcon</span>
        <span>{defconNumber}</span>
    </div>
}

function CountryDefcon({stateName, status}: CountryDefconProps) {
    if (status == 'hidden') {
        return null;
    }

    return <div className="flex">
        <div
            className={`flex-1 flex items-center content-center justify-center text-2xl border-4 transition duration-500 ${BACKGROUNDS[status].activeBorder}`}>
            {DEFCON_STATE_TO_HUMAN_STATE[stateName]}
        </div>
        <DefconState defconNumber={3} active={status == 3}/>
        <DefconState defconNumber={2} active={status == 2}/>
        <DefconState defconNumber={1} active={status == 1}/>
    </div>
}

export default function DefconStatuses({defcon}: DefconProps) {
    return (
        <div className="flex justify-center p-10">
            <ul className="w-3/4 grid grid-cols-2 gap-4">
                {
                    Object.entries(defcon).map(([country, status]) => {
                        return <CountryDefcon key={country} stateName={country as keyof Defcon} status={status}/>
                    })
                }
            </ul>
        </div>
    );
}
