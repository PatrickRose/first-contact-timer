import { DefconAPIBodyDecode } from "@fc/types/io-ts-def";
import { componentAction, makeComponentRoute } from "@fc/server/components";
import { MakeLeft, MakeRight } from "@fc/lib/io-ts-helpers";

export const POST = makeComponentRoute("Defcon", "defcon", [
    componentAction("Defcon", DefconAPIBodyDecode, (body, component) => {
        if (!Object.hasOwn(component.countries, body.stateName)) {
            return MakeLeft(
                `Defcon component does not include ${body.stateName}`,
            );
        }

        component.countries[body.stateName].status = body.newStatus;

        return MakeRight(undefined);
    }),
]);
