import { ApiResponse, Game } from "../types/types";
import WeatherStatus from "../components/WeatherStatus";
import DefconStatuses from "../components/DefconStatuses";
import { DoWWolfAttack } from "../components/DoWWolfAttack";
import { ControlButtonRootProps } from "../components/ControlTools";
import { ControlWeather } from "../components/control/ControlWeather";
import { ControlDefconStatus } from "../components/control/ControlDefconStatus";
import { ControlWolfAttack } from "../components/control/ControlWolfAttack";
import { RunningHotCorps } from "../components/RunningHotCorps";
import { ControlRunningHotCorps } from "../components/control/ControlRunningHotCorps";
import { RunningHotRunners } from "../components/RunningHotRunners";
import { ControlRunningHotRunners } from "../components/control/ControlRunningHotRunners";

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
    }

    return null;
}
