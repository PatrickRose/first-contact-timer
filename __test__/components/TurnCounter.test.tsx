import { describe, expect, test } from "@jest/globals";
import { render, screen } from "@testing-library/react";
import TurnCounter, {
    PhaseCount,
} from "@fc/components/theme/first-contact/TurnCounter";
import { SetupInformation } from "@fc/types/types";
import { setupInformation } from "../fixtures/game";

function makeProps(overrides: Partial<Parameters<typeof TurnCounter>[0]> = {}) {
    return {
        turn: 1,
        phase: 1,
        timestamp: 65,
        active: true,
        setupInformation,
        components: [],
        ...overrides,
    };
}

describe("TurnCounter", () => {
    test("shows the turn number and phase title", () => {
        render(<TurnCounter {...makeProps({ turn: 3, phase: 2 })} />);

        expect(
            screen.getByRole("heading", { name: "Turn 3: Phase 2" }),
        ).toBeInTheDocument();
    });

    test("formats the remaining time as minutes and seconds", () => {
        render(<TurnCounter {...makeProps({ timestamp: 125 })} />);

        // Rendered twice: once for mobile, once for desktop
        expect(screen.getAllByText("02:05")).toHaveLength(2);
    });

    test("pads the remaining time", () => {
        render(<TurnCounter {...makeProps({ timestamp: 9 })} />);

        expect(screen.getAllByText("00:09")).toHaveLength(2);
    });

    test("shows that the game is paused", () => {
        render(<TurnCounter {...makeProps({ active: false })} />);

        expect(screen.getAllByText("GAME PAUSED")).toHaveLength(2);
    });

    test("does not show a pause banner while the game is running", () => {
        render(<TurnCounter {...makeProps()} />);

        expect(screen.queryByText("GAME PAUSED")).toBeNull();
    });

    test("shows the length of each phase", () => {
        render(<TurnCounter {...makeProps()} />);

        expect(screen.getByText("1 minutes")).toBeInTheDocument();
        expect(screen.getByText("2 minutes")).toBeInTheDocument();
        expect(screen.getByText("3 minutes")).toBeInTheDocument();
    });

    test("includes any extra time for the current turn in the phase length", () => {
        const setup: SetupInformation = {
            ...setupInformation,
            phases: [
                {
                    title: "Phase with extra time",
                    length: 5,
                    hidden: false,
                    extraTime: {
                        2: 10,
                    },
                },
            ],
        };

        render(
            <TurnCounter
                {...makeProps({ turn: 2, setupInformation: setup })}
            />,
        );

        expect(screen.getByText("15 minutes")).toBeInTheDocument();
    });

    test("does not render hidden phases", () => {
        const setup: SetupInformation = {
            ...setupInformation,
            phases: [
                {
                    title: "Visible phase",
                    length: 5,
                    hidden: false,
                },
                {
                    title: "Hidden phase",
                    length: 2,
                    hidden: true,
                },
            ],
        };

        render(<TurnCounter {...makeProps({ setupInformation: setup })} />);

        expect(screen.getByText("Visible phase")).toBeInTheDocument();
        expect(screen.queryByText("Hidden phase")).toBeNull();
    });
});

describe("PhaseCount", () => {
    const timerStyles: SetupInformation["timerStyles"] = {
        activePhase: {
            background: "bg-active",
            text: "text-active",
            border: "border-active",
        },
        pastPhase: {
            background: "bg-past",
            text: "text-past",
            border: "border-past",
        },
        futurePhase: {
            background: "bg-future",
            text: "text-future",
            border: "border-future",
        },
    };

    function renderPhase(thisPhase: number, activePhase: number) {
        render(
            <PhaseCount
                thisPhase={thisPhase}
                phaseLength={5}
                activePhase={activePhase}
                phaseInformation={{
                    title: "Test phase",
                    length: 5,
                    hidden: false,
                }}
                timerStyles={timerStyles}
            />,
        );

        return screen.getByText("Test phase").closest("div")!;
    }

    test("uses the active style for the current phase", () => {
        const phase = renderPhase(2, 2);

        expect(phase).toHaveClass("bg-active", "text-active", "border-active");
        expect(phase).toHaveClass("delay-500");
    });

    test("uses the past style for phases that have already run", () => {
        const phase = renderPhase(1, 2);

        expect(phase).toHaveClass("bg-past", "text-past", "border-past");
        expect(phase).not.toHaveClass("delay-500");
    });

    test("uses the future style for phases still to come", () => {
        const phase = renderPhase(3, 2);

        expect(phase).toHaveClass("bg-future", "text-future", "border-future");
    });

    test("renders nothing for a hidden phase", () => {
        const { container } = render(
            <PhaseCount
                thisPhase={1}
                phaseLength={5}
                activePhase={1}
                phaseInformation={{
                    title: "Hidden phase",
                    length: 5,
                    hidden: true,
                }}
                timerStyles={undefined}
            />,
        );

        expect(container).toBeEmptyDOMElement();
    });
});
