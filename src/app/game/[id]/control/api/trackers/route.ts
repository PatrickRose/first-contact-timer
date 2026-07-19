import {
    AddTrackerDecode,
    DeleteTrackerDecode,
    SetTrackerDecode,
} from "@fc/types/io-ts-def";
import { componentAction, makeComponentRoute } from "@fc/server/components";
import { MakeLeft, MakeRight } from "@fc/lib/io-ts-helpers";
import { isUnsafeKey } from "@fc/lib/safe-keys";

export const POST = makeComponentRoute(
    "Trackers",
    "Trackers component component",
    [
        componentAction(
            "Trackers",
            SetTrackerDecode,
            (body, component, game) => {
                if (!Object.hasOwn(component.trackers, body.tracker)) {
                    return MakeLeft(
                        `No ${body.tracker} tracker found for game ${game._id}`,
                    );
                }

                component.trackers[body.tracker].value = body.value;

                return MakeRight(undefined);
            },
        ),
        componentAction(
            "Trackers",
            AddTrackerDecode,
            (body, component, game) => {
                if (isUnsafeKey(body.tracker)) {
                    return MakeLeft(
                        `${body.tracker} is not a valid tracker name for game ${game._id}`,
                    );
                }

                if (Object.hasOwn(component.trackers, body.tracker)) {
                    return MakeLeft(
                        `${body.tracker} tracker already exists for game ${game._id}`,
                    );
                }

                component.trackers = {
                    ...component.trackers,
                    [body.tracker]: body.trackerDefinition,
                };

                return MakeRight(undefined);
            },
        ),
        componentAction(
            "Trackers",
            DeleteTrackerDecode,
            (body, component, game) => {
                if (!Object.hasOwn(component.trackers, body.tracker)) {
                    return MakeLeft(
                        `No ${body.tracker} tracker found for game ${game._id}`,
                    );
                }

                delete component.trackers[body.tracker];

                return MakeRight(undefined);
            },
        ),
    ],
);
