import { ApiResponse, Game } from "@fc/types/types";
import WeatherStatus from "@fc/components/WeatherStatus";
import DefconStatuses from "@fc/components/DefconStatuses";
import { DoWWolfAttack } from "@fc/components/DoWWolfAttack";
import { ControlButtonRootProps } from "@fc/components/ControlTools";
import { ControlWeather } from "@fc/components/control/ControlWeather";
import { ControlDefconStatus } from "@fc/components/control/ControlDefconStatus";
import { ControlWolfAttack } from "@fc/components/control/ControlWolfAttack";
import { RunningHotCorps } from "@fc/components/RunningHotCorps";
import { ControlRunningHotCorps } from "@fc/components/control/ControlRunningHotCorps";
import { RunningHotRunners } from "@fc/components/RunningHotRunners";
import { ControlRunningHotRunners } from "@fc/components/control/ControlRunningHotRunners";
import Trackers from "@fc/components/Trackers";
import ControlTrackers from "@fc/components/control/ControlTrackers";

export function ControlComponentMapper({
    component,
    setAPIResponse,
    setError,
    id,
}: {
    component: Game["components"][0];
} & ControlButtonRootProps) {
    switch (component.componentType) {
        case "Defcon":
            return (
                <ControlDefconStatus
                    defcon={component}
                    id={id}
                    setAPIResponse={setAPIResponse}
                    setError={setError}
                />
            );
        case "Weather":
            return (
                <ControlWeather
                    weatherMessage={component.weatherMessage}
                    id={id}
                    setAPIResponse={setAPIResponse}
                    setError={setError}
                />
            );
        case "DoWWolfAttack":
            return (
                <ControlWolfAttack
                    inProgress={component.inProgress}
                    id={id}
                    setAPIResponse={setAPIResponse}
                    setError={setError}
                />
            );
        case "RunningHotCorp":
            return (
                <ControlRunningHotCorps
                    sharePrice={component.sharePrice}
                    id={id}
                    setAPIResponse={setAPIResponse}
                    setError={setError}
                    componentType={component.componentType}
                />
            );
        case "RunningHotRunners":
            return (
                <ControlRunningHotRunners
                    rep={component.rep}
                    id={id}
                    setAPIResponse={setAPIResponse}
                    setError={setError}
                    componentType={component.componentType}
                />
            );
        case "Trackers":
            return (
                <ControlTrackers
                    {...component}
                    id={id}
                    setAPIResponse={setAPIResponse}
                    setError={setError}
                    componentType={component.componentType}
                />
            );
    }

    return null;
}

export function TurnComponentMapper({
    component,
}: {
    component: Game["components"][0];
}) {
    switch (component.componentType) {
        case "DoWWolfAttack":
            return <DoWWolfAttack {...component} />;
        default:
        // fall through
    }

    return null;
}

export function SideComponentMapper({
    component,
}: {
    component: Game["components"][0];
}) {
    switch (component.componentType) {
        case "Defcon":
            return <DefconStatuses defcon={component.countries} />;
        case "Weather":
            return <WeatherStatus message={component.weatherMessage} />;
        case "DoWWolfAttack":
            // No mapped component for WolfAttack here
            return null;
        case "RunningHotCorp":
            return (
                <RunningHotCorps
                    componentType={"RunningHotCorp"}
                    sharePrice={component.sharePrice}
                />
            );
        case "RunningHotRunners":
            return (
                <RunningHotRunners
                    componentType={component.componentType}
                    rep={component.rep}
                />
            );
        case "Trackers":
            return <Trackers {...component} />;
    }

    return null;
}
