"use client";

import { useState } from "react";
import { Component, DefconStatus, GangNames } from "@fc/types/types";

type ComponentType = Component["componentType"];
type ComponentOfType<T extends ComponentType> = Extract<
    Component,
    { componentType: T }
>;

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

function toNumber(value: string): number {
    const parsed = Number(value);

    return Number.isNaN(parsed) ? 0 : parsed;
}

function DefconEditor({ component, onChange }: EditorProps<"Defcon">) {
    const [newCountry, setNewCountry] = useState("");

    const setCountries = (countries: ComponentOfType<"Defcon">["countries"]) =>
        onChange({ ...component, countries });

    const countryKey = newCountry.trim();
    const canAdd = countryKey !== "" && !(countryKey in component.countries);

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
                        Remove
                    </button>
                </div>
            ))}
            <div className="flex items-end gap-2">
                <div className="grow">
                    <label className={FIELD_LABEL_CLASSES}>
                        New country name
                    </label>
                    <input
                        className={`mt-1 ${INPUT_CLASSES}`}
                        value={newCountry}
                        onChange={(event) => setNewCountry(event.target.value)}
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
        </div>
    );
}

function WeatherEditor({ component, onChange }: EditorProps<"Weather">) {
    return (
        <div>
            <label className={FIELD_LABEL_CLASSES}>Weather message</label>
            <input
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
                Attack in progress at game start
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
                            >
                                {field}
                            </label>
                            <input
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
                    <label className={FIELD_LABEL_CLASSES}>{corp}</label>
                    <input
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
    const canAdd = runnerKey !== "" && !(runnerKey in component.rep);

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
                        Remove
                    </button>
                </div>
            ))}
            <div className="flex items-end gap-2">
                <div className="grow">
                    <label className={FIELD_LABEL_CLASSES}>
                        New runner name
                    </label>
                    <input
                        className={`mt-1 ${INPUT_CLASSES}`}
                        value={newRunner}
                        onChange={(event) => setNewRunner(event.target.value)}
                    />
                </div>
                <div>
                    <label className={FIELD_LABEL_CLASSES}>Gang</label>
                    <select
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
        </div>
    );
}

function TrackersEditor({ component, onChange }: EditorProps<"Trackers">) {
    const [newTracker, setNewTracker] = useState("");

    const setTrackers = (trackers: ComponentOfType<"Trackers">["trackers"]) =>
        onChange({ ...component, trackers });

    const trackerKey = newTracker.trim();
    const canAdd = trackerKey !== "" && !(trackerKey in component.trackers);

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
                        Remove
                    </button>
                </div>
            ))}
            <div className="flex items-end gap-2">
                <div className="grow">
                    <label className={FIELD_LABEL_CLASSES}>
                        New tracker name
                    </label>
                    <input
                        className={`mt-1 ${INPUT_CLASSES}`}
                        value={newTracker}
                        onChange={(event) => setNewTracker(event.target.value)}
                    />
                </div>
                <button
                    type="button"
                    className={ADD_BUTTON_CLASSES}
                    disabled={!canAdd}
                    onClick={() => {
                        setTrackers({
                            ...component.trackers,
                            [trackerKey]: { value: 0, type: "bar", max: 10 },
                        });
                        setNewTracker("");
                    }}
                >
                    Add tracker
                </button>
            </div>
        </div>
    );
}

function LightLevelEditor({ component, onChange }: EditorProps<"LightLevel">) {
    return (
        <div className="grid gap-2 sm:grid-cols-2">
            <div>
                <label className={FIELD_LABEL_CLASSES}>Starting value</label>
                <input
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
                <label className={FIELD_LABEL_CLASSES}>Maximum</label>
                <input
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

export function ComponentsEditor({
    components,
    onChange,
}: {
    components: Component[];
    onChange: (components: Component[]) => void;
}) {
    const [newType, setNewType] = useState<ComponentType>("Defcon");

    return (
        <div className="flex flex-col gap-4">
            {components.length == 0 ? (
                <p className="text-sm text-zinc-500">
                    This game has no components. Add one below if you need any.
                </p>
            ) : null}
            {components.map((component, index) => (
                <div
                    key={index}
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
                            Remove component
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
                        value={newType}
                        onChange={(event) =>
                            setNewType(event.target.value as ComponentType)
                        }
                    >
                        {Object.entries(COMPONENT_LABELS).map(
                            ([type, label]) => (
                                <option key={type} value={type}>
                                    {label}
                                </option>
                            ),
                        )}
                    </select>
                </div>
                <button
                    type="button"
                    className={ADD_BUTTON_CLASSES}
                    onClick={() =>
                        onChange([...components, defaultComponent(newType)])
                    }
                >
                    Add component
                </button>
            </div>
        </div>
    );
}
