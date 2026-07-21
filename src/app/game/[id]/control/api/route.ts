import { NextRequest, NextResponse } from "next/server";
import { ApiResponse } from "@fc/types/types";
import { ControlAPIDecode } from "@fc/types/io-ts-def";
import { CONTROL_ACTIONS, isRetrySafeAction } from "@fc/server/turn";
import { runControlActionRoute } from "@fc/server/control-route";

export async function POST(
    request: NextRequest,
    props: { params: Promise<{ id: string }> },
): Promise<NextResponse<ApiResponse | { error: string }>> {
    const params = await props.params;
    const id = params.id;

    const body = await request.json();

    if (!ControlAPIDecode.is(body)) {
        return NextResponse.json(
            { error: "Incorrect request" },
            { status: 400 },
        );
    }

    // Relative turn-navigation actions must not be auto-retried on a CAS
    // conflict (re-applying would double-advance the game); idempotent actions
    // such as pause/play are safe to retry. See #783.
    return runControlActionRoute(
        id,
        CONTROL_ACTIONS[body.action],
        isRetrySafeAction(body.action),
    );
}
