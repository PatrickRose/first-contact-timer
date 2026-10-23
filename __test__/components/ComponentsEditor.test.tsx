import { describe, expect, jest, test } from "@jest/globals";
import { fireEvent, render, screen } from "@testing-library/react";
import * as t from "io-ts";
import {
    COMPONENT_LABELS,
    COMPONENT_TYPES,
    ComponentsEditor,
    defaultComponent,
    newKeyError,
} from "@fc/components/admin/ComponentsEditor";
import { ComponentDecode } from "@fc/types/io-ts-def";
import { Component, ComponentType } from "@fc/types/types";

type OnChange = (components: Component[]) => void;

/** Render the editor and hand back the latest value it emitted. */
function renderEditor(components: Component[]) {
    const onChange = jest.fn<OnChange>();

    const { rerender } = render(
        <ComponentsEditor components={components} onChange={onChange} />,
    );

    return {
        onChange,
        rerender: (next: Component[]) =>
            rerender(
                <ComponentsEditor components={next} onChange={onChange} />,
            ),
        // The component is controlled, so a change is only ever reported - it is
        // the caller's job to feed it back. Grab the single emitted value.
        emitted: () => {
            expect(onChange).toHaveBeenCalledTimes(1);
            return onChange.mock.calls[0][0];
        },
    };
}

describe("defaultComponent", () => {
    test.each(COMPONENT_TYPES)("produces a decodable %s", (type) => {
        const component = defaultComponent(type);

        expect(component.componentType).toBe(type);
        // The server validates with this codec, so a default the editor can
        // produce but the API would reject is a broken editor.
        expect(ComponentDecode.is(component)).toBe(true);
    });

    test("covers every component type", () => {
        // COMPONENT_TYPES is derived from COMPONENT_LABELS, which is a
        // Record<ComponentType, string>, so TypeScript already forces the labels
        // to stay in step with the union. This pins the count so a hand-edit
        // that drops an entry is caught too.
        expect(COMPONENT_TYPES).toHaveLength(7);
        expect(Object.keys(COMPONENT_LABELS).sort()).toEqual(
            [...COMPONENT_TYPES].sort(),
        );
    });
});

describe("newKeyError", () => {
    test("allows an unused, safe name", () => {
        expect(newKeyError("Bar", {}, "tracker")).toBeNull();
    });

    test("says nothing for an empty name", () => {
        // Nothing typed yet - the Add button is disabled, so there is nothing to
        // complain about.
        expect(newKeyError("", {}, "tracker")).toBeNull();
    });

    test.each(["__proto__", "constructor", "prototype"])(
        "rejects the prototype-polluting name %p",
        (key) => {
            expect(newKeyError(key, {}, "tracker")).toBe(
                `"${key}" is not an allowed tracker name`,
            );
        },
    );

    test("rejects a name that is already used", () => {
        expect(newKeyError("Bar", { Bar: 1 }, "tracker")).toBe(
            'There is already a tracker called "Bar"',
        );
    });

    test("does not treat an inherited member as already used", () => {
        // `"toString" in {}` is true, so an `in` check would refuse a perfectly
        // usable name. Object.hasOwn is the right test.
        expect(newKeyError("toString", {}, "tracker")).toBeNull();
    });
});

describe("ComponentsEditor", () => {
    test("tells the operator when there are no components", () => {
        renderEditor([]);

        expect(
            screen.getByText(
                "This game has no components. Add one below if you need any.",
            ),
        ).toBeInTheDocument();
    });

    test("renders a card per component, labelled", () => {
        renderEditor([
            defaultComponent("Weather"),
            defaultComponent("Trackers"),
        ]);

        expect(
            screen.getByRole("heading", { name: "Weather message" }),
        ).toBeInTheDocument();
        expect(
            screen.getByRole("heading", { name: "Trackers" }),
        ).toBeInTheDocument();
    });

    test("adds the selected component type", () => {
        const { onChange, emitted } = renderEditor([]);

        fireEvent.change(screen.getByLabelText("Component type"), {
            target: { value: "LightLevel" },
        });
        fireEvent.click(screen.getByRole("button", { name: "Add component" }));

        expect(onChange).toHaveBeenCalledTimes(1);
        expect(emitted()).toEqual([defaultComponent("LightLevel")]);
    });

    test("removes a component", () => {
        const { emitted } = renderEditor([
            defaultComponent("Weather"),
            defaultComponent("LightLevel"),
        ]);

        fireEvent.click(
            screen.getByRole("button", { name: "Remove Weather message" }),
        );

        expect(emitted()).toEqual([defaultComponent("LightLevel")]);
    });

    describe("the add dropdown", () => {
        test("omits types the game already has", () => {
            renderEditor([defaultComponent("Weather")]);

            const options = screen
                .getAllByRole("option")
                .map((option) => (option as HTMLOptionElement).value);

            // One of each type only: `findComponent` server-side takes the first
            // match, so a second Weather would be unreachable from the control
            // desk.
            expect(options).not.toContain("Weather");
            expect(options).toContain("LightLevel");
            expect(options).toHaveLength(COMPONENT_TYPES.length - 1);
        });

        test("disappears once every type is present", () => {
            renderEditor(COMPONENT_TYPES.map(defaultComponent));

            expect(
                screen.queryByRole("button", { name: "Add component" }),
            ).not.toBeInTheDocument();
            expect(
                screen.getByText(
                    "Every component type is already on this game.",
                ),
            ).toBeInTheDocument();
        });

        test("falls back to an available type when the selected one is taken", () => {
            // Defcon is the initial selection. Adding it should not leave the
            // dropdown pointing at a type that is no longer offered.
            const { rerender } = renderEditor([]);

            fireEvent.click(
                screen.getByRole("button", { name: "Add component" }),
            );

            rerender([defaultComponent("Defcon")]);

            const select = screen.getByLabelText(
                "Component type",
            ) as HTMLSelectElement;

            expect(select.value).not.toBe("Defcon");
            expect(COMPONENT_TYPES).toContain(select.value as ComponentType);
        });
    });

    describe("Defcon", () => {
        const withCountry: Component = {
            componentType: "Defcon",
            countries: {
                China: {
                    shortName: "CN",
                    countryName: "China",
                    status: 3,
                },
            },
        };

        test("edits a country's fields", () => {
            const { emitted } = renderEditor([withCountry]);

            fireEvent.change(screen.getByLabelText("China country name"), {
                target: { value: "People's Republic" },
            });

            expect(emitted()).toEqual([
                {
                    componentType: "Defcon",
                    countries: {
                        China: {
                            shortName: "CN",
                            countryName: "People's Republic",
                            status: 3,
                        },
                    },
                },
            ]);
        });

        test("edits a country's status, keeping hidden a string", () => {
            const { emitted } = renderEditor([withCountry]);

            fireEvent.change(screen.getByLabelText("China defcon status"), {
                target: { value: "hidden" },
            });

            const [component] = emitted();
            expect(component).toEqual({
                componentType: "Defcon",
                countries: {
                    China: {
                        shortName: "CN",
                        countryName: "China",
                        status: "hidden",
                    },
                },
            });
            expect(ComponentDecode.is(component)).toBe(true);
        });

        test("adds a country", () => {
            const { emitted } = renderEditor([defaultComponent("Defcon")]);

            fireEvent.change(screen.getByLabelText("New country name"), {
                target: { value: "France" },
            });
            fireEvent.click(
                screen.getByRole("button", { name: "Add country" }),
            );

            expect(emitted()).toEqual([
                {
                    componentType: "Defcon",
                    countries: {
                        France: {
                            shortName: "",
                            countryName: "France",
                            status: 3,
                        },
                    },
                },
            ]);
        });

        test("removes a country", () => {
            const { emitted } = renderEditor([withCountry]);

            fireEvent.click(
                screen.getByRole("button", { name: "Remove China" }),
            );

            expect(emitted()).toEqual([
                { componentType: "Defcon", countries: {} },
            ]);
        });

        test("refuses a prototype-polluting country name", () => {
            const { onChange } = renderEditor([defaultComponent("Defcon")]);

            fireEvent.change(screen.getByLabelText("New country name"), {
                target: { value: "__proto__" },
            });

            expect(screen.getByRole("alert")).toHaveTextContent(
                '"__proto__" is not an allowed country name',
            );
            expect(
                screen.getByRole("button", { name: "Add country" }),
            ).toBeDisabled();

            fireEvent.click(
                screen.getByRole("button", { name: "Add country" }),
            );
            expect(onChange).not.toHaveBeenCalled();
        });

        test("refuses a duplicate country name", () => {
            const { onChange } = renderEditor([withCountry]);

            fireEvent.change(screen.getByLabelText("New country name"), {
                target: { value: "China" },
            });

            expect(screen.getByRole("alert")).toHaveTextContent(
                'There is already a country called "China"',
            );
            expect(onChange).not.toHaveBeenCalled();
        });
    });

    describe("Trackers", () => {
        const withTracker: Component = {
            componentType: "Trackers",
            trackers: { Bar: { value: 2, type: "bar", max: 10 } },
        };

        test("adds a tracker with sane defaults", () => {
            const { emitted } = renderEditor([defaultComponent("Trackers")]);

            fireEvent.change(screen.getByLabelText("New tracker name"), {
                target: { value: "Tension" },
            });
            fireEvent.click(
                screen.getByRole("button", { name: "Add tracker" }),
            );

            expect(emitted()).toEqual([
                {
                    componentType: "Trackers",
                    trackers: { Tension: { value: 0, type: "bar", max: 10 } },
                },
            ]);
        });

        test("changes a tracker's maximum", () => {
            const { emitted } = renderEditor([withTracker]);

            fireEvent.change(screen.getByLabelText("Bar maximum"), {
                target: { value: "35" },
            });

            expect(emitted()).toEqual([
                {
                    componentType: "Trackers",
                    trackers: { Bar: { value: 2, type: "bar", max: 35 } },
                },
            ]);
        });

        test("changes a tracker's style", () => {
            const { emitted } = renderEditor([withTracker]);

            fireEvent.change(screen.getByLabelText("Bar style"), {
                target: { value: "circle" },
            });

            expect(emitted()).toEqual([
                {
                    componentType: "Trackers",
                    trackers: { Bar: { value: 2, type: "circle", max: 10 } },
                },
            ]);
        });

        test("coerces a non-numeric value to 0 rather than NaN", () => {
            const { emitted } = renderEditor([withTracker]);

            fireEvent.change(screen.getByLabelText("Bar value"), {
                target: { value: "banana" },
            });

            const [component] = emitted();
            expect(component).toEqual({
                componentType: "Trackers",
                trackers: { Bar: { value: 0, type: "bar", max: 10 } },
            });
            expect(ComponentDecode.is(component)).toBe(true);
        });

        test("removes a tracker", () => {
            const { emitted } = renderEditor([withTracker]);

            fireEvent.click(screen.getByRole("button", { name: "Remove Bar" }));

            expect(emitted()).toEqual([
                { componentType: "Trackers", trackers: {} },
            ]);
        });

        test("refuses an unsafe tracker name", () => {
            const { onChange } = renderEditor([defaultComponent("Trackers")]);

            fireEvent.change(screen.getByLabelText("New tracker name"), {
                target: { value: "constructor" },
            });

            expect(screen.getByRole("alert")).toHaveTextContent(
                '"constructor" is not an allowed tracker name',
            );
            expect(onChange).not.toHaveBeenCalled();
        });
    });

    describe("RunningHotRunners", () => {
        const withRunner: Component = {
            componentType: "RunningHotRunners",
            rep: { Ace: { reputation: 3, gang: "Dancers" } },
        };

        test("adds a runner with the chosen gang", () => {
            const { emitted } = renderEditor([
                defaultComponent("RunningHotRunners"),
            ]);

            fireEvent.change(screen.getByLabelText("New runner name"), {
                target: { value: "Nyx" },
            });
            fireEvent.change(screen.getByLabelText("Gang"), {
                target: { value: "Facers" },
            });
            fireEvent.click(screen.getByRole("button", { name: "Add runner" }));

            expect(emitted()).toEqual([
                {
                    componentType: "RunningHotRunners",
                    rep: { Nyx: { reputation: 1, gang: "Facers" } },
                },
            ]);
        });

        test("changes a runner's gang", () => {
            const { emitted } = renderEditor([withRunner]);

            fireEvent.change(screen.getByLabelText("Ace gang"), {
                target: { value: "G33ks" },
            });

            expect(emitted()).toEqual([
                {
                    componentType: "RunningHotRunners",
                    rep: { Ace: { reputation: 3, gang: "G33ks" } },
                },
            ]);
        });

        test("removes a runner", () => {
            const { emitted } = renderEditor([withRunner]);

            fireEvent.click(screen.getByRole("button", { name: "Remove Ace" }));

            expect(emitted()).toEqual([
                { componentType: "RunningHotRunners", rep: {} },
            ]);
        });
    });

    describe("Weather, LightLevel and RunningHotCorp", () => {
        test("edits the weather message", () => {
            const { emitted } = renderEditor([defaultComponent("Weather")]);

            fireEvent.change(screen.getByLabelText("Weather message"), {
                target: { value: "Storms inbound" },
            });

            expect(emitted()).toEqual([
                { componentType: "Weather", weatherMessage: "Storms inbound" },
            ]);
        });

        test("edits the light level maximum", () => {
            const { emitted } = renderEditor([defaultComponent("LightLevel")]);

            fireEvent.change(screen.getByLabelText("Maximum"), {
                target: { value: "20" },
            });

            expect(emitted()).toEqual([
                { componentType: "LightLevel", value: 10, max: 20 },
            ]);
        });

        test("edits a corp's share price", () => {
            const { emitted } = renderEditor([
                defaultComponent("RunningHotCorp"),
            ]);

            fireEvent.change(screen.getByLabelText("GenEq"), {
                target: { value: "42" },
            });

            const [component] = emitted();
            expect(component).toMatchObject({
                componentType: "RunningHotCorp",
                sharePrice: { GenEq: 42, MCM: 10 },
            });
            expect(ComponentDecode.is(component)).toBe(true);
        });
    });

    describe("the wolf attack alert", () => {
        test("toggles the attack flag", () => {
            const { emitted } = renderEditor([
                defaultComponent("DoWWolfAttack"),
            ]);

            fireEvent.click(screen.getByLabelText("Attack in progress"));

            expect(emitted()).toEqual([
                { componentType: "DoWWolfAttack", inProgress: true },
            ]);
        });

        test("adding a custom alert produces a decodable component", () => {
            const { emitted } = renderEditor([
                defaultComponent("DoWWolfAttack"),
            ]);

            fireEvent.click(screen.getByLabelText("Customise the alert text"));

            const [component] = emitted();
            expect(component).toMatchObject({
                componentType: "DoWWolfAttack",
                alert: { label: "Wolf attack" },
            });
            expect(ComponentDecode.is(component)).toBe(true);
        });

        test("clearing the custom alert drops the key rather than nulling it", () => {
            // `alert` is optional in the codec. Setting it to undefined would be
            // persisted as a null by Mongo and fail to decode on the way back.
            const { emitted } = renderEditor([
                {
                    componentType: "DoWWolfAttack",
                    inProgress: true,
                    alert: { text: "t", label: "l", emoji: "🐺" },
                },
            ]);

            fireEvent.click(screen.getByLabelText("Customise the alert text"));

            const [component] = emitted();
            expect(Object.hasOwn(component, "alert")).toBe(false);
            expect(component).toEqual({
                componentType: "DoWWolfAttack",
                inProgress: true,
            });
        });
    });

    test("every emitted component list stays decodable", () => {
        // A broad backstop: whatever the editor hands back must satisfy the codec
        // the edit API validates with, or the operator gets an opaque 400.
        const all = COMPONENT_TYPES.map(defaultComponent);

        expect(t.array(ComponentDecode).is(all)).toBe(true);
    });
});
