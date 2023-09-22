import {
    afterEach,
    beforeEach,
    describe,
    expect,
    jest,
    test,
} from "@jest/globals";
import { isLeft } from "fp-ts/Either";
import { createGame } from "@fc/server/turn";
import { setupInformation } from "./helpers";
import { Game, SetupInformation } from "@fc/types/types";

describe("createGame", () => {
    const mockedDate = new Date(2023, 1, 2, 3, 4, 5, 6);

    beforeEach(() => {
        jest.useFakeTimers();
        jest.setSystemTime(mockedDate);
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    test("No phases triggers an error", () => {
        expect(
            isLeft(createGame("test", { ...setupInformation, phases: [] }, [])),
        ).toBe(true);
    });

    test("Creates a game", () => {
        const information: SetupInformation = {
            ...setupInformation,
            phases: [{ length: 1, hidden: false, title: "test" }],
        };

        const result = createGame("TEST", information, []);

        expect(isLeft(result)).toBe(false);

        if (isLeft(result)) {
            return;
        }

        const expectedDate = new Date(mockedDate.getTime() + 60000);

        const expected: Game = {
            _id: "TEST",
            turnInformation: {
                turnNumber: 1,
                currentPhase: 1,
                phaseEnd: expectedDate.toString(),
            },
            setupInformation: information,
            components: [],
            breakingNews: [],
            active: false,
            frozenTurn: {
                turnNumber: 1,
                active: false,
                components: [],
                breakingNews: [],
                phaseEnd: 60,
                phase: 1,
            },
        };

        expect(result.right).toEqual(expected);
    });

    test("Should create components", () => {
        const information: SetupInformation = {
            ...setupInformation,
            phases: [{ length: 1, hidden: false, title: "test" }],
        };

        const result = createGame("TEST", information, [
            {
                componentType: "Weather",
                weatherMessage: "",
            },
        ]);

        expect(isLeft(result)).toBe(false);

        if (isLeft(result)) {
            return;
        }

        const expectedDate = new Date(mockedDate.getTime() + 60000);

        const expected: Game = {
            _id: "TEST",
            turnInformation: {
                turnNumber: 1,
                currentPhase: 1,
                phaseEnd: expectedDate.toString(),
            },
            setupInformation: information,
            components: [
                {
                    componentType: "Weather",
                    weatherMessage: "",
                },
            ],
            breakingNews: [],
            active: false,
            frozenTurn: {
                turnNumber: 1,
                active: false,
                components: [
                    {
                        componentType: "Weather",
                        weatherMessage: "",
                    },
                ],
                breakingNews: [],
                phaseEnd: 60,
                phase: 1,
            },
        };

        expect(result.right).toEqual(expected);
    });
});
