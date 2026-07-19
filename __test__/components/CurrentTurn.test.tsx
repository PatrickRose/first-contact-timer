import { describe, expect, test } from "@jest/globals";
import { render, screen } from "@testing-library/react";
import CurrentTurn from "@fc/components/theme/shared/CurrentTurn";

function makeProps(
    overrides: Partial<Parameters<typeof CurrentTurn>[0]> = {},
): Parameters<typeof CurrentTurn>[0] {
    return {
        timestamp: 125,
        header: <div>Header content</div>,
        bannerClass: "bg-turn-counter-current",
        timerSizeClass: "text-4xl",
        ...overrides,
    };
}

describe("CurrentTurn", () => {
    test("formats the remaining time", () => {
        render(<CurrentTurn {...makeProps({ timestamp: 9 })} />);

        expect(screen.getByText("00:09")).toBeInTheDocument();
    });

    test("renders the theme-provided header verbatim", () => {
        render(
            <CurrentTurn
                {...makeProps({ header: <div>Turn 3, current phase:</div> })}
            />,
        );

        expect(screen.getByText("Turn 3, current phase:")).toBeInTheDocument();
    });

    test("applies the theme-provided banner classes", () => {
        render(
            <CurrentTurn
                {...makeProps({
                    bannerClass: "bg-aftermath-alert text-aftermath",
                })}
            />,
        );

        // The timer paragraph lives inside the banner div that carries the
        // accent classes.
        const banner = screen.getByText("02:05").closest("div");
        expect(banner).toHaveClass("bg-aftermath-alert", "text-aftermath");
    });

    test("applies the theme-provided timer size class", () => {
        render(<CurrentTurn {...makeProps({ timerSizeClass: "text-5xl" })} />);

        expect(screen.getByText("02:05")).toHaveClass("text-5xl");
    });
});
