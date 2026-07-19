import { describe, expect, test } from "@jest/globals";
import { fireEvent, render, screen } from "@testing-library/react";
import { NewsFeed } from "@fc/components/theme/shared/NewsFeed";
import { LivePress, NewsItem } from "@fc/types/types";

const press: LivePress = [{ name: "Press One" }, { name: "Press Two" }];

function makeItem(overrides: Partial<NewsItem> = {}): NewsItem {
    return {
        newsText: "Something happened",
        date: new Date(2023, 1, 2, 3, 4, 5).toString(),
        turn: 1,
        phase: 1,
        pressAccount: 1,
        ...overrides,
    };
}

describe("NewsFeed", () => {
    test("renders the press feed title and every news item", () => {
        render(
            <NewsFeed
                newsItems={[
                    makeItem({ newsText: "First story", pressAccount: 1 }),
                    makeItem({ newsText: "Second story", pressAccount: 2 }),
                ]}
                press={press}
                showPressFilter
            />,
        );

        expect(
            screen.getByRole("heading", { name: /press feed/i }),
        ).toBeInTheDocument();
        expect(screen.getByText("First story")).toBeInTheDocument();
        expect(screen.getByText("Second story")).toBeInTheDocument();
    });

    test("drives the filter through the select value, not option selected", () => {
        render(
            <NewsFeed newsItems={[makeItem()]} press={press} showPressFilter />,
        );

        const select = screen.getByRole("combobox") as HTMLSelectElement;

        // The controlled value lives on the <select>...
        expect(select).toHaveValue("NONE");
        // ...and NOT via a `selected` attribute on any <option> (the drift bug
        // this refactor fixes - React warns about that pattern at runtime).
        screen
            .getAllByRole("option")
            .forEach((option) =>
                expect(option).not.toHaveAttribute("selected"),
            );
    });

    test("filters the news items to the selected press account", () => {
        render(
            <NewsFeed
                newsItems={[
                    makeItem({ newsText: "From one", pressAccount: 1 }),
                    makeItem({ newsText: "From two", pressAccount: 2 }),
                ]}
                press={press}
                showPressFilter
            />,
        );

        fireEvent.change(screen.getByRole("combobox"), {
            target: { value: "2" },
        });

        expect(screen.queryByText("From one")).toBeNull();
        expect(screen.getByText("From two")).toBeInTheDocument();
    });

    test("hides the filter when showPressFilter is false", () => {
        render(
            <NewsFeed
                newsItems={[makeItem()]}
                press={press}
                showPressFilter={false}
            />,
        );

        expect(screen.queryByRole("combobox")).toBeNull();
    });

    test("shows the filter by default (aftermath never opted out)", () => {
        render(<NewsFeed newsItems={[makeItem()]} press={press} />);

        expect(screen.getByRole("combobox")).toBeInTheDocument();
    });

    test("first-contact variant adds its spacing classes", () => {
        const { container } = render(
            <NewsFeed newsItems={[]} press={press} variant="first-contact" />,
        );

        expect(container.firstChild).toHaveClass("py-4");
        expect(
            screen.getByRole("heading", { name: /press feed/i }),
        ).toHaveClass("mb-6");
    });

    test("aftermath variant omits those spacing classes", () => {
        const { container } = render(
            <NewsFeed newsItems={[]} press={press} variant="aftermath" />,
        );

        expect(container.firstChild).not.toHaveClass("py-4");
        expect(
            screen.getByRole("heading", { name: /press feed/i }),
        ).not.toHaveClass("mb-6");
    });
});
