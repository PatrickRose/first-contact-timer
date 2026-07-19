import { SetLightLevelDecode } from "@fc/types/io-ts-def";
import { componentAction, makeComponentRoute } from "@fc/server/components";
import { MakeRight } from "@fc/lib/io-ts-helpers";

export const POST = makeComponentRoute("LightLevel", "LightLevel component", [
    componentAction("LightLevel", SetLightLevelDecode, (body, component) => {
        component.value = Math.max(0, Math.min(component.max, body.value));

        return MakeRight(undefined);
    }),
]);
