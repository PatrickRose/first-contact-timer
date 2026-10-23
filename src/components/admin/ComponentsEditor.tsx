"use client";

import { useState } from "react";
import {
    Component,
    ComponentType,
    DefconStatus,
    GangNames,
} from "@fc/types/types";
// Type-only import: `ComponentOfType` is the existing definition of "the
// concrete variant for a discriminant", and duplicating it here would let the
// two drift. `import type` is erased at compile time, so pulling it from a
// server module cannot drag server code into the client bundle.
import type { ComponentOfType } from "@fc/server/components";
import { isUnsafeKey } from "@fc/lib/safe-keys";

type EditorProps<T extends ComponentType> = {
    component: ComponentOfType<T>;
    onChange: (component: ComponentOfType<T>) => void;
};

export const COMPONENT_LABELS: Record<ComponentType, string> = {
    Defcon: "Defcon statuses",
    Weather: "Weather message",
    DoWWolfAttack: "Wolf attack",
    RunningHotCorp: "Running Hot: share prices",
    RunningHotRunners: "Running Hot: runner reputation",
    Trackers: "Trackers",
    LightLevel: "Light level",
};

export const COMPONENT_TYPES = Object.keys(COMPONENT_LABELS) as ComponentType[];

export function defaultComponent(type: ComponentType): Component {
    switch (type) {
        case "Defcon":
            return { componentType: "Defcon", countries: {} };
        case "Weather":
            return { componentType: "Weather", weatherMessage: "" };
        case "DoWWolfAttack":
            return { componentType: "DoWWolfAttack", inProgress: false };
        case "RunningHotCorp":
            return {
                componentType: "RunningHotCorp",
                sharePrice: {
                    GenEq: 10,
                    MCM: 10,
                    Gordon: 10,
                    ANT: 10,
                    DTC: 10,
                },
            };
        case "RunningHotRunners":
            return { componentType: "RunningHotRunners", rep: {} };
        case "Trackers":
            return { componentType: "Trackers", trackers: {} };
        case "LightLevel":
            return { componentType: "LightLevel", value: 10, max: 10 };
    }
}

const INPUT_CLASSES =
    "block w-full rounded-lg border-zinc-700 bg-zinc-950 text-zinc-100 placeholder-zinc-500 focus:border-indigo-500 focus:ring-indigo-500 text-sm";
const FIELD_LABEL_CLASSES = "block text-xs font-medium text-zinc-400";
const ADD_BUTTON_CLASSES =
    "rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-sm font-medium text-zinc-200 transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50";
const REMOVE_BUTTON_CLASSES =
    "text-sm font-medium text-red-300 transition hover:text-red-200";
const KEY_ERROR_CLASSES = "mt-1 text-xs text-red-300";

function toNumber(value: string): number {
    const parsed = Number(value);

    return Number.isNaN(parsed) ? 0 : parsed;
}

/**
 * Why a new entry's name cannot be used, or null if it can.
 *
 * Defcon countries, runners and trackers are all `t.record(t.string, ...)`, so
 * the operator names the key. Two things have to be caught before it becomes an
 * object property:
 *
 *  - prototype-polluting names, via the same `isUnsafeKey` guard the tracker
 *    control route applies server-side;
 *  - names that already exist. `Object.hasOwn` rather than `in`, because `in`
 *    also matches inherited members, so `"toString"` would read as a duplicate
 *    of something that was never added (see the docblock on `isUnsafeKey`).
 *
 * An empty string returns null: nothing has been typed yet, so there is nothing
 * to complain about - the Add button is simply disabled.
 */
export function newKeyError(
    key: string,
    existing: Record<string, unknown>,
    label: string,
): string | null {
    if (key === "") {
        return null;
    }

    if (isUnsafeKey(key)) {
        return `"${key}" is not an allowed ${label} name`;
    }

    if (Object.hasOwn(existing, key)) {
        return `There is already a ${label} called "${key}"`;
    }

    return null;
}

function DefconEditor({ component, onChange }: EditorProps<"Defcon">) {
    const [newCountry, setNewCountry] = useState("");

    const setCountries = (countries: ComponentOfType<"Defcon">["countries"]) =>
        onChange({ ...component, countries });

    const countryKey = newCountry.trim();
    const error = newKeyError(countryKey, component.countries, "country");
    const canAdd = countryKey !== "" && error === null;

    return (
        <div className="flex flex-col gap-3">
            {Object.entries(component.countries).map(([key, country]) => (
                <div
                    key={key}
                    className="grid grid-cols-[4rem_1fr_8rem_auto] items-end gap-2"
                >
                    <div>
                        <label className={FIELD_LABEL_CLASSES}>Flag</label>
                        <input
                            aria-label={`${key} flag`}
                            className={`mt-1 ${INPUT_CLASSES}`}
                            value={country.shortName}
                            onChange={(event) =>
                                setCountries({
                                    ...component.countries,
                                    [key]: {
                                        ...country,
                                        shortName: event.target.value,
                                    },
                                })
                            }
                        />
                    </div>
                    <div>
                        <label className={FIELD_LABEL_CLASSES}>Country</label>
                        <input
                            aria-label={`${key} country name`}
                            className={`mt-1 ${INPUT_CLASSES}`}
                            value={country.countryName}
                            onChange={(event) =>
                                setCountries({
                                    ...component.countries,
                                    [key]: {
                                        ...country,
                                        countryName: event.target.value,
                                    },
                                })
                            }
                        />
                    </div>
                    <div>
                        <label className={FIELD_LABEL_CLASSES}>Status</label>
                        <select
                            aria-label={`${key} defcon status`}
                            className={`mt-1 ${INPUT_CLASSES}`}
                            value={`${country.status}`}
                            onChange={(event) => {
                                const status: DefconStatus =
                                    event.target.value == "hidden"
                                        ? "hidden"
                                        : (toNumber(
                                              event.target.value,
                                          ) as DefconStatus);

                                setCountries({
                                    ...component.countries,
                                    [key]: { ...country, status },
                                });
                            }}
                        >
                            <option value="hidden">Hidden</option>
                            <option value="3">3</option>
                            <option value="2">2</option>
                            <option value="1">1</option>
                        </select>
                    </div>
                    <button
                        type="button"
                        className={`pb-2 ${REMOVE_BUTTON_CLASSES}`}
                        onClick={() => {
                            const countries = { ...component.countries };
                            delete countries[key];
                            setCountries(countries);
                        }}
                    >
                        Remove {key}
                    </button>
                </div>
            ))}
            <div>
                <div className="flex items-end gap-2">
                    <div className="grow">
                        <label
                            className={FIELD_LABEL_CLASSES}
                            htmlFor="new-defcon-country"
                        >
                            New country name
                        </label>
                        <input
                            id="new-defcon-country"
                            className={`mt-1 ${INPUT_CLASSES}`}
                            value={newCountry}
                            onChange={(event) =>
                                setNewCountry(event.target.value)
                            }
                        />
                    </div>
                    <button
                        type="button"
                        className={ADD_BUTTON_CLASSES}
                        disabled={!canAdd}
                        onClick={() => {
                            setCountries({
                                ...component.countries,
                                [countryKey]: {
                                    shortName: "",
                                    countryName: countryKey,
                                    status: 3,
                                },
                            });
                            setNewCountry("");
                        }}
                    >
                        Add country
                    </button>
                </div>
                {error !== null ? (
                    <p role="alert" className={KEY_ERROR_CLASSES}>
                        {error}
                    </p>
                ) : null}
            </div>
        </div>
    );
}

function WeatherEditor({ component, onChange }: EditorProps<"Weather">) {
    return (
        <div>
            <label className={FIELD_LABEL_CLASSES} htmlFor="weather-message">
                Weather message
            </label>
            <input
                id="weather-message"
                className={`mt-1 ${INPUT_CLASSES}`}
                value={component.weatherMessage}
                onChange={(event) =>
                    onChange({
                        ...component,
                        weatherMessage: event.target.value,
                    })
                }
            />
        </div>
    );
}

function WolfAttackEditor({
    component,
    onChange,
}: EditorProps<"DoWWolfAttack">) {
    return (
        <div className="flex flex-col gap-3">
            <label className="flex items-center gap-x-2 text-sm text-zinc-300">
                <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-zinc-600 bg-zinc-900 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-zinc-900"
                    checked={component.inProgress}
                    onChange={(event) =>
                        onChange({
                            ...component,
                            inProgress: event.target.checked,
                        })
                    }
                />
                Attack in progress
            </label>
            <label className="flex items-center gap-x-2 text-sm text-zinc-300">
                <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-zinc-600 bg-zinc-900 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-zinc-900"
                    checked={component.alert !== undefined}
                    onChange={(event) => {
                        if (event.target.checked) {
                            onChange({
                                ...component,
                                alert: {
                                    text: "Wolf attack in progress",
                                    label: "Wolf attack",
                                    emoji: "🐺",
                                },
                            });
                        } else {
                            // Rebuild without `alert` rather than setting it to
                            // undefined: the field is optional in the codec, and
                            // an explicit undefined would be persisted as a null.
                            onChange({
                                componentType: component.componentType,
                                inProgress: component.inProgress,
                            });
                        }
                    }}
                />
                Customise the alert text
            </label>
            {component.alert !== undefined ? (
                <div className="grid gap-2 sm:grid-cols-3">
                    {(["text", "label", "emoji"] as const).map((field) => (
                        <div key={field}>
                            <label
                                className={`capitalize ${FIELD_LABEL_CLASSES}`}
                                htmlFor={`wolf-alert-${field}`}
                            >
                                {field}
                            </label>
                            <input
                                id={`wolf-alert-${field}`}
                                className={`mt-1 ${INPUT_CLASSES}`}
                                value={component.alert?.[field] ?? ""}
                                onChange={(event) =>
                                    onChange({
                                        ...component,
                                        alert: {
                                            text: "",
                                            label: "",
                                            emoji: "",
                                            ...component.alert,
                                            [field]: event.target.value,
                                        },
                                    })
                                }
                            />
                        </div>
                    ))}
                </div>
            ) : null}
        </div>
    );
}

function RunningHotCorpEditor({
    component,
    onChange,
}: EditorProps<"RunningHotCorp">) {
    return (
        <div className="grid gap-2 sm:grid-cols-5">
            {Object.entries(component.sharePrice).map(([corp, price]) => (
                <div key={corp}>
                    <label
                        className={FIELD_LABEL_CLASSES}
                        htmlFor={`share-price-${corp}`}
                    >
                        {corp}
                    </label>
                    <input
                        id={`share-price-${corp}`}
                        type="number"
                        className={`mt-1 ${INPUT_CLASSES}`}
                        value={price}
                        onChange={(event) =>
                            onChange({
                                ...component,
                                sharePrice: {
                                    ...component.sharePrice,
                                    [corp]: toNumber(event.target.value),
                                },
                            })
                        }
                    />
                </div>
            ))}
        </div>
    );
}

const GANGS: GangNames[] = ["Dancers", "G33ks", "Facers", "Gruffsters"];

function RunningHotRunnersEditor({
    component,
    onChange,
}: EditorProps<"RunningHotRunners">) {
    const [newRunner, setNewRunner] = useState("");
    const [newGang, setNewGang] = useState<GangNames>("Dancers");

    const setRep = (rep: ComponentOfType<"RunningHotRunners">["rep"]) =>
        onChange({ ...component, rep });

    const runnerKey = newRunner.trim();
    const error = newKeyError(runnerKey, component.rep, "runner");
    const canAdd = runnerKey !== "" && error === null;

    return (
        <div className="flex flex-col gap-3">
            {Object.entries(component.rep).map(([runner, details]) => (
                <div
                    key={runner}
                    className="grid grid-cols-[1fr_10rem_6rem_auto] items-end gap-2"
                >
                    <span className="pb-2 text-sm text-zinc-300">{runner}</span>
                    <div>
                        <label className={FIELD_LABEL_CLASSES}>Gang</label>
                        <select
                            aria-label={`${runner} gang`}
                            className={`mt-1 ${INPUT_CLASSES}`}
                            value={details.gang}
                            onChange={(event) =>
                                setRep({
                                    ...component.rep,
                                    [runner]: {
                                        ...details,
                                        gang: event.target.value as GangNames,
                                    },
                                })
                            }
                        >
                            {GANGS.map((gang) => (
                                <option key={gang} value={gang}>
                                    {gang}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className={FIELD_LABEL_CLASSES}>Rep</label>
                        <input
                            aria-label={`${runner} reputation`}
                            type="number"
                            className={`mt-1 ${INPUT_CLASSES}`}
                            value={details.reputation}
                            onChange={(event) =>
                                setRep({
                                    ...component.rep,
                                    [runner]: {
                                        ...details,
                                        reputation: toNumber(
                                            event.target.value,
                                        ),
                                    },
                                })
                            }
                        />
                    </div>
                    <button
                        type="button"
                        className={`pb-2 ${REMOVE_BUTTON_CLASSES}`}
                        onClick={() => {
                            const rep = { ...component.rep };
                            delete rep[runner];
                            setRep(rep);
                        }}
                    >
                        Remove {runner}
                    </button>
                </div>
            ))}
            <div>
                <div className="flex items-end gap-2">
                    <div className="grow">
                        <label
                            className={FIELD_LABEL_CLASSES}
                            htmlFor="new-runner-name"
                        >
                            New runner name
                        </label>
                        <input
                            id="new-runner-name"
                            className={`mt-1 ${INPUT_CLASSES}`}
                            value={newRunner}
                            onChange={(event) =>
                                setNewRunner(event.target.value)
                            }
                        />
                    </div>
                    <div>
                        <label
                            className={FIELD_LABEL_CLASSES}
                            htmlFor="new-runner-gang"
                        >
                            Gang
                        </label>
                        <select
                            id="new-runner-gang"
                            className={`mt-1 ${INPUT_CLASSES}`}
                            value={newGang}
                            onChange={(event) =>
                                setNewGang(event.target.value as GangNames)
                            }
                        >
                            {GANGS.map((gang) => (
                                <option key={gang} value={gang}>
                                    {gang}
                                </option>
                            ))}
                        </select>
                    </div>
                    <button
                        type="button"
                        className={ADD_BUTTON_CLASSES}
                        disabled={!canAdd}
                        onClick={() => {
                            setRep({
                                ...component.rep,
                                [runnerKey]: { gang: newGang, reputation: 1 },
                            });
                            setNewRunner("");
                        }}
                    >
                        Add runner
                    </button>
                </div>
                {error !== null ? (
                    <p role="alert" className={KEY_ERROR_CLASSES}>
                        {error}
                    </p>
                ) : null}
            </div>
        </div>
    );
}

function TrackersEditor({ component, onChange }: EditorProps<"Trackers">) {
    const [newTracker, setNewTracker] = useState("");

    const setTrackers = (trackers: ComponentOfType<"Trackers">["trackers"]) =>
        onChange({ ...component, trackers });

    const trackerKey = newTracker.trim();
    const error = newKeyError(trackerKey, component.trackers, "tracker");
    const canAdd = trackerKey !== "" && error === null;

    return (
        <div className="flex flex-col gap-3">
            {Object.entries(component.trackers).map(([name, tracker]) => (
                <div
                    key={name}
                    className="grid grid-cols-[1fr_8rem_6rem_6rem_auto] items-end gap-2"
                >
                    <span className="pb-2 text-sm text-zinc-300">{name}</span>
                    <div>
                        <label className={FIELD_LABEL_CLASSES}>Style</label>
                        <select
                            aria-label={`${name} style`}
                            className={`mt-1 ${INPUT_CLASSES}`}
                            value={tracker.type}
                            onChange={(event) =>
                                setTrackers({
                                    ...component.trackers,
                                    [name]: {
                                        ...tracker,
                                        type:
                                            event.target.value == "circle"
                                                ? "circle"
                                                : "bar",
                                    },
                                })
                            }
                        >
                            <option value="bar">Bar</option>
                            <option value="circle">Circle</option>
                        </select>
                    </div>
                    <div>
                        <label className={FIELD_LABEL_CLASSES}>Value</label>
                        <input
                            aria-label={`${name} value`}
                            type="number"
                            className={`mt-1 ${INPUT_CLASSES}`}
                            value={tracker.value}
                            onChange={(event) =>
                                setTrackers({
                                    ...component.trackers,
                                    [name]: {
                                        ...tracker,
                                        value: toNumber(event.target.value),
                                    },
                                })
                            }
                        />
                    </div>
                    <div>
                        <label className={FIELD_LABEL_CLASSES}>Max</label>
                        <input
                            aria-label={`${name} maximum`}
                            type="number"
                            className={`mt-1 ${INPUT_CLASSES}`}
                            value={tracker.max}
                            onChange={(event) =>
                                setTrackers({
                                    ...component.trackers,
                                    [name]: {
                                        ...tracker,
                                        max: toNumber(event.target.value),
                                    },
                                })
                            }
                        />
                    </div>
                    <button
                        type="button"
                        className={`pb-2 ${REMOVE_BUTTON_CLASSES}`}
                        onClick={() => {
                            const trackers = { ...component.trackers };
                            delete trackers[name];
                            setTrackers(trackers);
                        }}
                    >
                        Remove {name}
                    </button>
                </div>
            ))}
            <div>
                <div className="flex items-end gap-2">
                    <div className="grow">
                        <label
                            className={FIELD_LABEL_CLASSES}
                            htmlFor="new-tracker-name"
                        >
                            New tracker name
                        </label>
                        <input
                            id="new-tracker-name"
                            className={`mt-1 ${INPUT_CLASSES}`}
                            value={newTracker}
                            onChange={(event) =>
                                setNewTracker(event.target.value)
                            }
                        />
                    </div>
                    <button
                        type="button"
                        className={ADD_BUTTON_CLASSES}
                        disabled={!canAdd}
                        onClick={() => {
                            setTrackers({
                                ...component.trackers,
                                [trackerKey]: {
                                    value: 0,
                                    type: "bar",
                                    max: 10,
                                },
                            });
                            setNewTracker("");
                        }}
                    >
                        Add tracker
                    </button>
                </div>
                {error !== null ? (
                    <p role="alert" className={KEY_ERROR_CLASSES}>
                        {error}
                    </p>
                ) : null}
            </div>
        </div>
    );
}

function LightLevelEditor({ component, onChange }: EditorProps<"LightLevel">) {
    return (
        <div className="grid gap-2 sm:grid-cols-2">
            <div>
                <label
                    className={FIELD_LABEL_CLASSES}
                    htmlFor="light-level-value"
                >
                    Value
                </label>
                <input
                    id="light-level-value"
                    type="number"
                    className={`mt-1 ${INPUT_CLASSES}`}
                    value={component.value}
                    onChange={(event) =>
                        onChange({
                            ...component,
                            value: toNumber(event.target.value),
                        })
                    }
                />
            </div>
            <div>
                <label
                    className={FIELD_LABEL_CLASSES}
                    htmlFor="light-level-max"
                >
                    Maximum
                </label>
                <input
                    id="light-level-max"
                    type="number"
                    className={`mt-1 ${INPUT_CLASSES}`}
                    value={component.max}
                    onChange={(event) =>
                        onChange({
                            ...component,
                            max: toNumber(event.target.value),
                        })
                    }
                />
            </div>
        </div>
    );
}

function ComponentEditor({
    component,
    onChange,
}: {
    component: Component;
    onChange: (component: Component) => void;
}) {
    switch (component.componentType) {
        case "Defcon":
            return <DefconEditor component={component} onChange={onChange} />;
        case "Weather":
            return <WeatherEditor component={component} onChange={onChange} />;
        case "DoWWolfAttack":
            return (
                <WolfAttackEditor component={component} onChange={onChange} />
            );
        case "RunningHotCorp":
            return (
                <RunningHotCorpEditor
                    component={component}
                    onChange={onChange}
                />
            );
        case "RunningHotRunners":
            return (
                <RunningHotRunnersEditor
                    component={component}
                    onChange={onChange}
                />
            );
        case "Trackers":
            return <TrackersEditor component={component} onChange={onChange} />;
        case "LightLevel":
            return (
                <LightLevelEditor component={component} onChange={onChange} />
            );
    }
}

/**
 * Structural editor for a game's components: which ones exist, and the parts of
 * them that no other screen can change.
 *
 * Deliberately not a value-setting UI. Live values - defcon statuses, tracker
 * values, share prices, the weather message, the light level - all have
 * dedicated endpoints and controls under `/game/[id]/control`, and the control
 * desk is where an operator changes them mid-game. What is *only* reachable
 * here is structure: adding or removing a component, tracker names and maxima,
 * the defcon country roster, the runner roster, and the wolf-attack alert text.
 */
export function ComponentsEditor({
    components,
    onChange,
}: {
    components: Component[];
    onChange: (components: Component[]) => void;
}) {
    const present = new Set(components.map((val) => val.componentType));

    // The app assumes at most one component of each type: `findComponent` in
    // src/server/components.ts takes the *first* match, so a second of the same
    // type would be invisible to every control route. Don't offer it.
    const available = COMPONENT_TYPES.filter((type) => !present.has(type));

    const [newType, setNewType] = useState<ComponentType>("Defcon");

    // Typed as possibly-undefined so that "nothing left to add" is the same
    // condition as "no type to select", narrowed by one branch below rather than
    // relying on a separate length check to keep `available[0]` honest.
    const fallback: ComponentType | undefined = available[0];
    const selectedType: ComponentType | undefined = available.includes(newType)
        ? newType
        : fallback;

    return (
        <div className="flex flex-col gap-4">
            {components.length == 0 ? (
                <p className="text-sm text-zinc-500">
                    This game has no components. Add one below if you need any.
                </p>
            ) : null}
            {components.map((component, index) => (
                <div
                    key={component.componentType}
                    className="rounded-lg border border-zinc-700 bg-zinc-900/60 p-4"
                >
                    <div className="mb-3 flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-zinc-200">
                            {COMPONENT_LABELS[component.componentType]}
                        </h3>
                        <button
                            type="button"
                            className={REMOVE_BUTTON_CLASSES}
                            onClick={() =>
                                onChange(
                                    components.filter((_, i) => i !== index),
                                )
                            }
                        >
                            Remove {COMPONENT_LABELS[component.componentType]}
                        </button>
                    </div>
                    <ComponentEditor
                        component={component}
                        onChange={(updated) =>
                            onChange(
                                components.map((existing, i) =>
                                    i === index ? updated : existing,
                                ),
                            )
                        }
                    />
                </div>
            ))}
            {selectedType === undefined ? (
                <p className="text-sm text-zinc-500">
                    Every component type is already on this game.
                </p>
            ) : (
                <div className="flex items-end gap-2">
                    <div className="grow">
                        <label
                            className={FIELD_LABEL_CLASSES}
                            htmlFor="new-component-type"
                        >
                            Component type
                        </label>
                        <select
                            id="new-component-type"
                            className={`mt-1 ${INPUT_CLASSES}`}
                            value={selectedType}
                            onChange={(event) =>
                                setNewType(event.target.value as ComponentType)
                            }
                        >
                            {available.map((type) => (
                                <option key={type} value={type}>
                                    {COMPONENT_LABELS[type]}
                                </option>
                            ))}
                        </select>
                    </div>
                    <button
                        type="button"
                        className={ADD_BUTTON_CLASSES}
                        onClick={() =>
                            onChange([
                                ...components,
                                defaultComponent(selectedType),
                            ])
                        }
                    >
                        Add component
                    </button>
                </div>
            )}
        </div>
    );
}
