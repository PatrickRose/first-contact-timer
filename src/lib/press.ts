import {SetupInformation} from "../types/types";

import Icon_NewsFeed from "../../public/GNNLogo.png";
import Icon_Press from "../../public/newspaper-regular.svg";

export function calculatePressTabIcon(pressInfo: SetupInformation["press"]) {
    if (pressInfo === false) {
        // This shouldn't ever happen
        // but it's a pain to correctly type this
        throw new Error('Should not be trying to calculate press tab icon for no press')
    }

    // Default press icon
    if (pressInfo === undefined) {
        return Icon_NewsFeed;
    }

    if (Array.isArray(pressInfo)) {
        return Icon_Press;
    }

    return pressInfo.logo === undefined
        ? Icon_NewsFeed
        : pressInfo.logo
}
