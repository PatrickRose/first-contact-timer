import { WolfAttack } from "../types/types";
import { useEffect, useState } from "react";

export function DoWWolfAttack({ inProgress }: WolfAttack) {
    const [audio, setAudio] = useState<HTMLAudioElement>();

    useEffect(() => {
        setAudio(new Audio("/wolf-attack.mp3"));
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
