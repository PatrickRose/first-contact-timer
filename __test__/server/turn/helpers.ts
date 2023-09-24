import { SetupInformation } from "@fc/types/types";

export const setupInformation: SetupInformation = {
    theme: "first-contact",
    components: [],
    breakingNewsBanner: false,
    press: false,
    gameName: "TEST GAME",
    phases: [],
};

export const testPhases: SetupInformation["phases"] = [
    {
        title: "test",
        length: 1,
        hidden: false,
    },
    {
        title: "test",
        length: 2,
        hidden: false,
    },
    {
        title: "test",
        length: 3,
        hidden: false,
    },
];
export const phases: SetupInformation["phases"] = [
    {
        title: "test",
        length: 1,
        hidden: false,
        extraTime: {
            2: 1,
            4: 4,
        },
    },
];
