import { describe, expect, test } from "@jest/globals";
import { render, screen } from "@testing-library/react";
import LogoBlock from "@fc/components/theme/shared/LogoBlock";
import { setupInformation } from "../fixtures/game";

describe("LogoBlock", () => {
    test("renders the game name", () => {
        render(<LogoBlock setupInformation={setupInformation} />);

        expect(
            screen.getByRole("heading", { name: "TEST GAME" }),
        ).toBeInTheDocument();
    });
});
