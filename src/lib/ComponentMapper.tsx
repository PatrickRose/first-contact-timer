import { ApiResponse, Game } from "../types/types";
import WeatherStatus from "../components/WeatherStatus";
import DefconStatuses from "../components/DefconStatuses";
import { ControlButtonRootProps } from "../components/ControlTools";
import { ControlWeather } from "../components/control/ControlWeather";
import { ControlDefconStatus } from "../components/control/ControlDefconStatus";

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
    }

    return null;
}
