import { beforeEach, describe, expect, jest, test } from "@jest/globals";
import { fireEvent, render, screen } from "@testing-library/react";
import TabSwitcher, { GameTabSwitcher } from "@fc/components/TabSwitcher";
import { makeActiveGame, setupInformation } from "../fixtures/game";

beforeEach(() => {
    window.scrollTo = jest.fn<typeof window.scrollTo>();
});

describe("TabSwitcher", () => {
    const tabs = {
        home: {
            title: "Game",
            image: "/game.png",
        },
        press: {
            title: "Press",
            image: "/press.png",
        },
    };

    test("renders a button for each tab", () => {
        render(
            <TabSwitcher
                activeTab="home"
                tabs={tabs}
                setActiveTab={() => undefined}
                triggerScroll={false}
            />,
        );

        expect(
            screen.getByRole("button", { name: "Game" }),
        ).toBeInTheDocument();
        expect(
            screen.getByRole("button", { name: "Press" }),
        ).toBeInTheDocument();
    });

    test("highlights the active tab", () => {
        render(
            <TabSwitcher
                activeTab="home"
                tabs={tabs}
                setActiveTab={() => undefined}
                triggerScroll={false}
            />,
        );

        expect(screen.getByRole("button", { name: "Game" })).toHaveClass(
            "bg-zinc-600",
        );
        expect(screen.getByRole("button", { name: "Press" })).not.toHaveClass(
            "bg-zinc-600",
        );
    });

    test("switches tab when a tab is clicked", () => {
        const setActiveTab = jest.fn();

        render(
            <TabSwitcher
                activeTab="home"
                tabs={tabs}
                setActiveTab={setActiveTab}
                triggerScroll={false}
            />,
        );

        fireEvent.click(screen.getByRole("button", { name: "Press" }));

        expect(setActiveTab).toHaveBeenCalledWith("press");
    });

    test("scrolls to the top when the active tab changes", () => {
        const { rerender } = render(
            <TabSwitcher
                activeTab="home"
                tabs={tabs}
                setActiveTab={() => undefined}
                triggerScroll={true}
            />,
        );

        rerender(
            <TabSwitcher
                activeTab="press"
                tabs={tabs}
                setActiveTab={() => undefined}
                triggerScroll={true}
            />,
        );

        expect(window.scrollTo).toHaveBeenCalledWith({ top: 0 });
    });

    test("does not scroll when the scroll trigger is off", () => {
        render(
            <TabSwitcher
                activeTab="home"
                tabs={tabs}
                setActiveTab={() => undefined}
                triggerScroll={false}
            />,
        );

        expect(window.scrollTo).not.toHaveBeenCalled();
    });
});

describe("GameTabSwitcher", () => {
    test("always renders the game tab", () => {
        render(
            <GameTabSwitcher
                activeTab="home"
                setActiveTab={() => undefined}
                manageTabTitle={null}
                game={makeActiveGame()}
            />,
        );

        expect(
            screen.getByRole("button", { name: "Game" }),
        ).toBeInTheDocument();
        expect(screen.queryByRole("button", { name: "Press" })).toBeNull();
        expect(screen.getAllByRole("button")).toHaveLength(1);
    });

    test("renders a press tab when the game has a press", () => {
        const game = makeActiveGame({
            setupInformation: {
                ...setupInformation,
                press: { name: "INC", logo: "/inc.png" },
            },
        });

        render(
            <GameTabSwitcher
                activeTab="home"
                setActiveTab={() => undefined}
                manageTabTitle={null}
                game={game}
            />,
        );

        expect(
            screen.getByRole("button", { name: "Press" }),
        ).toBeInTheDocument();
    });

    test("renders a manage tab when given a title", () => {
        render(
            <GameTabSwitcher
                activeTab="home"
                setActiveTab={() => undefined}
                manageTabTitle="Manage game"
                game={makeActiveGame()}
            />,
        );

        expect(
            screen.getByRole("button", { name: "Manage game" }),
        ).toBeInTheDocument();
    });

    test("renders a tab per game component", () => {
        const game = makeActiveGame({
            components: [
                {
                    componentType: "Defcon",
                    countries: {},
                },
                {
                    componentType: "LightLevel",
                    value: 5,
                    max: 10,
                },
                {
                    componentType: "Trackers",
                    trackers: {},
                },
            ],
        });

        render(
            <GameTabSwitcher
                activeTab="home"
                setActiveTab={() => undefined}
                manageTabTitle={null}
                game={game}
            />,
        );

        expect(
            screen.getByRole("button", { name: "Defcon" }),
        ).toBeInTheDocument();
        expect(
            screen.getByRole("button", { name: "Light Level" }),
        ).toBeInTheDocument();
        expect(
            screen.getByRole("button", { name: "Trackers" }),
        ).toBeInTheDocument();
    });
});
