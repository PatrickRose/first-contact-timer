import { SetRunnerRepDecode } from "@fc/types/io-ts-def";
import { componentAction, makeComponentRoute } from "@fc/server/components";
import { MakeLeft, MakeRight } from "@fc/lib/io-ts-helpers";

export const POST = makeComponentRoute(
    "RunningHotRunners",
    "RunningHotRunners component component",
    [
        componentAction(
            "RunningHotRunners",
            SetRunnerRepDecode,
            (body, component, game) => {
                if (!Object.hasOwn(component.rep, body.runnerName)) {
                    return MakeLeft(
                        `No ${body.runnerName} runner found for game ${game._id}`,
                    );
                }

                component.rep[body.runnerName].reputation = Math.max(
                    0,
                    component.rep[body.runnerName].reputation + body.diff,
                );

                return MakeRight(undefined);
            },
        ),
    ],
);
