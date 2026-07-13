import type { NextRequest } from "next/server";

/**
 * The route handlers only ever read the JSON body from the request, so a
 * simple stub is enough.
 */
export function makeRequest(body: unknown = undefined): NextRequest {
    return { json: async () => body } as unknown as NextRequest;
}

export function makeProps(id: string = "test-game") {
    return { params: Promise.resolve({ id }) };
}
