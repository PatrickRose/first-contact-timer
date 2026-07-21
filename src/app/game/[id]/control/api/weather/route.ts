import { SetWeatherStatusDecode } from "@fc/types/io-ts-def";
import { componentAction, makeComponentRoute } from "@fc/server/components";
import { MakeRight } from "@fc/lib/io-ts-helpers";

export const POST = makeComponentRoute("Weather", "weather", [
    componentAction("Weather", SetWeatherStatusDecode, (body, component) => {
        component.weatherMessage = body.newWeatherMessage;

        return MakeRight(undefined);
    }),
]);
