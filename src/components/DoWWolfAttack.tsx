import { WolfAttack } from "@fc/types/types";
import { useEffect, useState } from "react";

export function DoWWolfAttack({ inProgress }: WolfAttack) {
    const [audio, setAudio] = useState<HTMLAudioElement>();

    useEffect(() => {
        const el = new Audio("/wolf-attack.mp3");
        el.volume = 0.5;
        setAudio(el);
    }, []);

    useEffect(() => {
        if (inProgress) {
            audio?.play();
        }
    }, [audio, inProgress]);

    if (!inProgress) {
        return null;
    }

    return (
        <div className="text-4xl font-extrabold bg-red-800 w-full">
            <p className="uppercase my-8 p-4">Wolf attack in progress</p>
        </div>
    );
}
