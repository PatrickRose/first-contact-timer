import { describe, expect, test } from "@jest/globals";
import { render, screen } from "@testing-library/react";
import LogoBlock from "@fc/components/theme/shared/LogoBlock";
import { setupInformation } from "../fixtures/game";

describe("LogoBlock", () => {
    test("renders the game name for the first-contact variant", () => {
        render(
            <LogoBlock
                setupInformation={setupInformation}
                variant="first-contact"
            />,
        );

        expect(
            screen.getByRole("heading", { name: "TEST GAME" }),
        ).toBeInTheDocument();
    });

    test("defaults to the first-contact rendering", () => {
        render(<LogoBlock setupInformation={setupInformation} />);

        expect(
            screen.getByRole("heading", { name: "TEST GAME" }),
        ).toBeInTheDocument();
    });

    test("renders nothing for the aftermath variant", () => {
        const { container } = render(
            <LogoBlock
                setupInformation={setupInformation}
                variant="aftermath"
            />,
        );

        expect(container).toBeEmptyDOMElement();
    });
});
