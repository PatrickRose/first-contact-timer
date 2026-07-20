// Build the shareable URLs for a game's three views. Game codes are
// unvalidated free strings, so the code must be URL-encoded — otherwise a
// `#`, `/` or space in a code would corrupt the route (and any QR built from
// it).
export type GameUrls = {
    player: string;
    control: string;
    press: string;
};

export function gameUrls(origin: string, code: string): GameUrls {
    const base = `${origin}/game/${encodeURIComponent(code)}`;

    return {
        player: base,
        control: `${base}/control`,
        press: `${base}/press`,
    };
}
