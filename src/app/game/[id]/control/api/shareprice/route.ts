import { SetSharePriceDecode } from "@fc/types/io-ts-def";
import { componentAction, makeComponentRoute } from "@fc/server/components";
import { MakeLeft, MakeRight } from "@fc/lib/io-ts-helpers";

export const POST = makeComponentRoute("RunningHotCorp", "RunningHotCorp", [
    componentAction(
        "RunningHotCorp",
        SetSharePriceDecode,
        (body, component, game) => {
            if (!Object.hasOwn(component.sharePrice, body.corpName)) {
                return MakeLeft(
                    `No ${body.corpName} corp found for game ${game._id}`,
                );
            }

            component.sharePrice[body.corpName] += body.diff;

            return MakeRight(undefined);
        },
    ),
]);
