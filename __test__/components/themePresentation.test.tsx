import { describe, expect, test } from "@jest/globals";
import { render, screen } from "@testing-library/react";
import { SetupInformation } from "@fc/types/types";
import { firstContactCurrentTurn } from "@fc/components/theme/first-contact/presentation";
import { aftermathCurrentTurn } from "@fc/components/theme/aftermath/presentation";

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

describe("firstContactCurrentTurn", () => {
    test("shows the current turn and phase title for a visible phase", () => {
        const { header } = firstContactCurrentTurn(3, visiblePhase);
        render(<>{header}</>);

        expect(screen.getByText("Turn 3, current phase:")).toBeInTheDocument();
        expect(screen.getByText("Opening Moves")).toBeInTheDocument();
    });

    test("labels a hidden phase as the next phase", () => {
        const { header } = firstContactCurrentTurn(3, hiddenPhase);
        render(<>{header}</>);

        expect(screen.getByText("Turn 3, next phase:")).toBeInTheDocument();
    });

    test("dims the banner for a hidden phase", () => {
        expect(firstContactCurrentTurn(1, visiblePhase).bannerClass).toContain(
            "bg-turn-counter-current",
        );
        expect(firstContactCurrentTurn(1, hiddenPhase).bannerClass).toContain(
            "opacity-50",
        );
    });
});

describe("aftermathCurrentTurn", () => {
    test("shows only the phase title, without a turn line", () => {
        const { header } = aftermathCurrentTurn(visiblePhase);
        render(<>{header}</>);

        expect(screen.getByText("Opening Moves")).toBeInTheDocument();
        expect(screen.queryByText(/current phase:/i)).toBeNull();
        expect(screen.queryByText(/next phase:/i)).toBeNull();
    });

    test("shrinks the title text for a hidden phase", () => {
        const { header } = aftermathCurrentTurn(hiddenPhase);
        render(<>{header}</>);

        expect(screen.getByText("Secret Phase")).toHaveClass("text-xl");
    });
});
