import { beforeAll, describe, expect, jest, test } from "@jest/globals";
import { render } from "@testing-library/react";
import { Game } from "@fc/types/types";

// Each child component is replaced by a stub so that the tests only assert
// that the mapper picks the right component for each component type.
jest.mock("@fc/components/control/ControlDefconStatus", () => ({
    ControlDefconStatus: () => <div data-testid="ControlDefconStatus" />,
}));

jest.mock("@fc/components/control/ControlWeather", () => ({
    ControlWeather: () => <div data-testid="ControlWeather" />,
}));

jest.mock("@fc/components/control/ControlWolfAttack", () => ({
    ControlWolfAttack: () => <div data-testid="ControlWolfAttack" />,
}));

jest.mock("@fc/components/control/ControlRunningHotCorps", () => ({
    ControlRunningHotCorps: () => <div data-testid="ControlRunningHotCorps" />,
}));

jest.mock("@fc/components/control/ControlRunningHotRunners", () => ({
    ControlRunningHotRunners: () => (
        <div data-testid="ControlRunningHotRunners" />
    ),
}));

jest.mock("@fc/components/control/ControlTrackers", () => ({
    __esModule: true,
    default: () => <div data-testid="ControlTrackers" />,
}));

jest.mock("@fc/components/control/ControlLightLevel", () => ({
    __esModule: true,
    default: () => <div data-testid="ControlLightLevel" />,
}));

jest.mock("@fc/components/WeatherStatus", () => ({
    __esModule: true,
    default: () => <div data-testid="WeatherStatus" />,
}));

jest.mock("@fc/components/DefconStatuses", () => ({
    __esModule: true,
    default: () => <div data-testid="DefconStatuses" />,
}));

jest.mock("@fc/components/DoWWolfAttack", () => ({
    DoWWolfAttack: () => <div data-testid="DoWWolfAttack" />,
}));

jest.mock("@fc/components/RunningHotCorps", () => ({
    RunningHotCorps: () => <div data-testid="RunningHotCorps" />,
}));

jest.mock("@fc/components/RunningHotRunners", () => ({
    RunningHotRunners: () => <div data-testid="RunningHotRunners" />,
}));

jest.mock("@fc/components/Trackers", () => ({
    __esModule: true,
    default: () => <div data-testid="Trackers" />,
}));

jest.mock("@fc/components/LightLevel", () => ({
    __esModule: true,
    default: () => <div data-testid="LightLevel" />,
}));

type MapperModule = typeof import("@fc/lib/ComponentMapper");

let ControlComponentMapper: MapperModule["ControlComponentMapper"];
let TurnComponentMapper: MapperModule["TurnComponentMapper"];
let SideComponentMapper: MapperModule["SideComponentMapper"];

beforeAll(async () => {
    ({ ControlComponentMapper, TurnComponentMapper, SideComponentMapper } =
        await import("@fc/lib/ComponentMapper"));
});

const COMPONENTS: Record<
    Game["components"][0]["componentType"],
    Game["components"][0]
> = {
    Defcon: {
        componentType: "Defcon",
        countries: {},
    },
    Weather: {
        componentType: "Weather",
        weatherMessage: "Sunny",
    },
    DoWWolfAttack: {
        componentType: "DoWWolfAttack",
        inProgress: false,
    },
    RunningHotCorp: {
        componentType: "RunningHotCorp",
        sharePrice: {
            GenEq: 10,
            MCM: 12,
            Gordon: 13,
            ANT: 5,
            DTC: 13,
        },
    },
    RunningHotRunners: {
        componentType: "RunningHotRunners",
        rep: {},
    },
    Trackers: {
        componentType: "Trackers",
        trackers: {},
    },
    LightLevel: {
        componentType: "LightLevel",
        value: 5,
        max: 10,
    },
};

describe("ControlComponentMapper", () => {
    const expected: Record<Game["components"][0]["componentType"], string> = {
        Defcon: "ControlDefconStatus",
        Weather: "ControlWeather",
        DoWWolfAttack: "ControlWolfAttack",
        RunningHotCorp: "ControlRunningHotCorps",
        RunningHotRunners: "ControlRunningHotRunners",
        Trackers: "ControlTrackers",
        LightLevel: "ControlLightLevel",
    };

    Object.entries(expected).forEach(([componentType, testId]) => {
        test(`maps ${componentType} to ${testId}`, () => {
            const { getByTestId } = render(
                <ControlComponentMapper
                    component={
                        COMPONENTS[componentType as keyof typeof COMPONENTS]
                    }
                    id="test-game"
                    setAPIResponse={() => undefined}
                    setError={() => undefined}
                />,
            );

            expect(getByTestId(testId)).toBeInTheDocument();
        });
    });
});

describe("TurnComponentMapper", () => {
    test("maps DoWWolfAttack to the wolf attack banner", () => {
        const { getByTestId } = render(
            <TurnComponentMapper component={COMPONENTS.DoWWolfAttack} />,
        );

        expect(getByTestId("DoWWolfAttack")).toBeInTheDocument();
    });

    (
        [
            "Defcon",
            "Weather",
            "RunningHotCorp",
            "RunningHotRunners",
            "Trackers",
            "LightLevel",
        ] as const
    ).forEach((componentType) => {
        test(`renders nothing for ${componentType}`, () => {
            const { container } = render(
                <TurnComponentMapper component={COMPONENTS[componentType]} />,
            );

            expect(container).toBeEmptyDOMElement();
        });
    });
});

describe("SideComponentMapper", () => {
    const expected: Record<string, string> = {
        Defcon: "DefconStatuses",
        Weather: "WeatherStatus",
        RunningHotCorp: "RunningHotCorps",
        RunningHotRunners: "RunningHotRunners",
        Trackers: "Trackers",
        LightLevel: "LightLevel",
    };

    Object.entries(expected).forEach(([componentType, testId]) => {
        test(`maps ${componentType} to ${testId}`, () => {
            const { getByTestId } = render(
                <SideComponentMapper
                    component={
                        COMPONENTS[componentType as keyof typeof COMPONENTS]
                    }
                />,
            );

            expect(getByTestId(testId)).toBeInTheDocument();
        });
    });

    test("renders nothing for DoWWolfAttack", () => {
        const { container } = render(
            <SideComponentMapper component={COMPONENTS.DoWWolfAttack} />,
        );

        expect(container).toBeEmptyDOMElement();
    });
});
