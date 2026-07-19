import { describe, expect, test } from "@jest/globals";
import { render, screen } from "@testing-library/react";
import BreakingNews from "@fc/components/theme/shared/BreakingNews";
import { LivePress, NewsItem } from "@fc/types/types";

const press: LivePress = [{ name: "Press One" }];

function makeItem(overrides: Partial<NewsItem> = {}): NewsItem {
    return {
        newsText: "The aliens have landed",
        date: new Date(2023, 1, 2, 3, 4, 5).toString(),
        turn: 1,
        phase: 1,
        pressAccount: 1,
        ...overrides,
    };
}

describe("BreakingNews", () => {
    test("renders the banner with the news text", () => {
        render(<BreakingNews newsItem={makeItem()} press={press} />);

        expect(
            screen.getByRole("heading", { name: /breaking news/i }),
        ).toBeInTheDocument();
        expect(screen.getByText("The aliens have landed")).toBeInTheDocument();
    });

    test("renders nothing when there is no news item", () => {
        const { container } = render(
            <BreakingNews newsItem={undefined} press={press} />,
        );

        expect(container).toBeEmptyDOMElement();
    });

    test("renders nothing when press is disabled", () => {
        const { container } = render(
            <BreakingNews newsItem={makeItem()} press={false} />,
        );

        expect(container).toBeEmptyDOMElement();
    });

    test("first-contact variant pins the banner to the bottom", () => {
        render(
            <BreakingNews
                newsItem={makeItem()}
                press={press}
                variant="first-contact"
            />,
        );

        const footer = screen.getByRole("contentinfo");
        expect(footer).toHaveClass("sticky", "bottom-0");
        expect(footer).not.toHaveClass("overflow-hidden");
    });

    test("aftermath variant lets the banner flow and clips overflow", () => {
        render(
            <BreakingNews
                newsItem={makeItem()}
                press={press}
                variant="aftermath"
            />,
        );

        const footer = screen.getByRole("contentinfo");
        expect(footer).toHaveClass("overflow-hidden");
        expect(footer).not.toHaveClass("sticky");
    });
});
