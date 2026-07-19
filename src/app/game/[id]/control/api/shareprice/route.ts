import { SetSharePriceDecode } from "@fc/types/io-ts-def";
import { componentAction, makeComponentRoute } from "@fc/server/components";
import { MakeRight } from "@fc/lib/io-ts-helpers";

export const POST = makeComponentRoute(
    "RunningHotCorp",
    "RunningHotCorp component component",
    [
        componentAction(
            "RunningHotCorp",
            SetSharePriceDecode,
            (body, component) => {
                component.sharePrice[body.corpName] += body.diff;

                return MakeRight(undefined);
            },
        ),
    ],
);
