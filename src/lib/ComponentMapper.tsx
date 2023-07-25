import { Game } from "../types/types";
import WeatherStatus from "../components/WeatherStatus";
import DefconStatuses from "../components/DefconStatuses";

export function ComponentMapper({
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
