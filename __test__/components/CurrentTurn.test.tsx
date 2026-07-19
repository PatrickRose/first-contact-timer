import { describe, expect, test } from "@jest/globals";
import { render, screen } from "@testing-library/react";
import CurrentTurn from "@fc/components/theme/shared/CurrentTurn";
import { SetupInformation } from "@fc/types/types";

type Phase = SetupInformation["phases"][0];

const visiblePhase: Phase = {
    title: "Opening Moves",
    length: 5,
    hidden: false,
};

const hiddenPhase: Phase = {
    title: "Secret Phase",
    length: 5,
    hidden: true,
};

function makeProps(overrides: Partial<Parameters<typeof CurrentTurn>[0]> = {}) {
    return {
        turn: 3,
        phase: 1,
        timestamp: 125,
        active: true,
        phaseInformation: visiblePhase,
        ...overrides,
    };
}

describe("CurrentTurn", () => {
    test("formats the remaining time", () => {
        render(<CurrentTurn {...makeProps({ timestamp: 9 })} />);

        expect(screen.getByText("00:09")).toBeInTheDocument();
    });

    describe("first-contact variant", () => {
        test("shows the current turn and phase title", () => {
            render(
                <CurrentTurn {...makeProps({ variant: "first-contact" })} />,
            );

            expect(
                screen.getByText("Turn 3, current phase:"),
            ).toBeInTheDocument();
            expect(screen.getByText("Opening Moves")).toBeInTheDocument();
        });

        test("labels a hidden phase as the next phase", () => {
            render(
                <CurrentTurn
                    {...makeProps({
                        variant: "first-contact",
                        phaseInformation: hiddenPhase,
                    })}
                />,
            );

            expect(screen.getByText("Turn 3, next phase:")).toBeInTheDocument();
        });
    });

    describe("aftermath variant", () => {
        test("shows only the phase title, without the turn line", () => {
            render(<CurrentTurn {...makeProps({ variant: "aftermath" })} />);

            expect(screen.getByText("Opening Moves")).toBeInTheDocument();
            expect(screen.queryByText(/current phase:/i)).toBeNull();
            expect(screen.queryByText(/next phase:/i)).toBeNull();
        });
    });
});
