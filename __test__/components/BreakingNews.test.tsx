import { describe, expect, test } from "@jest/globals";
import { render, screen } from "@testing-library/react";
import BreakingNews from "@fc/components/theme/shared/BreakingNews";
import { LivePress, NewsItem } from "@fc/types/types";
import { FIRST_CONTACT_BREAKING_NEWS } from "@fc/components/theme/first-contact/presentation";
import { AFTERMATH_BREAKING_NEWS } from "@fc/components/theme/aftermath/presentation";

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
        render(
            <BreakingNews
                newsItem={makeItem()}
                press={press}
                {...FIRST_CONTACT_BREAKING_NEWS}
            />,
        );

        expect(
            screen.getByRole("heading", { name: /breaking news/i }),
        ).toBeInTheDocument();
        expect(screen.getByText("The aliens have landed")).toBeInTheDocument();
    });

    test("renders nothing when there is no news item", () => {
        const { container } = render(
            <BreakingNews
                newsItem={undefined}
                press={press}
                {...FIRST_CONTACT_BREAKING_NEWS}
            />,
        );

        expect(container).toBeEmptyDOMElement();
    });

    test("renders nothing when press is disabled", () => {
        const { container } = render(
            <BreakingNews
                newsItem={makeItem()}
                press={false}
                {...FIRST_CONTACT_BREAKING_NEWS}
            />,
        );

        expect(container).toBeEmptyDOMElement();
    });

    test("applies the supplied footer accent classes", () => {
        render(
            <BreakingNews
                newsItem={makeItem()}
                press={press}
                footerAccentClass="sticky bottom-0"
                imageWrapperClass="p-8 max-w-1/4"
                imageSize={1024}
            />,
        );

        const footer = screen.getByRole("contentinfo");
        expect(footer).toHaveClass("sticky", "bottom-0");
        expect(footer).not.toHaveClass("overflow-hidden");
    });

    test("applies a different theme's footer accent classes", () => {
        render(
            <BreakingNews
                newsItem={makeItem()}
                press={press}
                {...AFTERMATH_BREAKING_NEWS}
            />,
        );

        const footer = screen.getByRole("contentinfo");
        expect(footer).toHaveClass("overflow-hidden");
        expect(footer).not.toHaveClass("sticky");
    });
});
