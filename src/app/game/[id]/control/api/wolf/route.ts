import { SetWolfAttackDecode } from "@fc/types/io-ts-def";
import { componentAction, makeComponentRoute } from "@fc/server/components";
import { MakeRight } from "@fc/lib/io-ts-helpers";

export const POST = makeComponentRoute("DoWWolfAttack", "wolf", [
    componentAction("DoWWolfAttack", SetWolfAttackDecode, (body, component) => {
        component.inProgress = body.newStatus;

        return MakeRight(undefined);
    }),
]);
