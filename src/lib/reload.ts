/**
 * Reload the current document.
 *
 * A full document load, not a router navigation: the point is to throw away the
 * server-rendered `game` prop - and with it the whole of `setupInformation` -
 * and re-render from the database. `router.refresh()` is not enough, because
 * Next's Router Cache can serve a stale copy; this is the same reasoning behind
 * `LogoutButton` and `LoginForm` using `window.location.assign`.
 *
 * It lives in its own module purely so tests can mock it. `Location`'s members
 * are `[LegacyUnforgeable]`, so in jsdom `window.location.reload` can be neither
 * reassigned nor spied on - `jest.spyOn` and
 * `Object.defineProperty(window, "location", ...)` both throw.
 *
 * If a reload stampede ever becomes a problem, this is where a jitter delay
 * would go. It should not be needed: callers reload from inside the poll
 * callback, and the poll is already spread across 5-6.25s per device by
 * `GameWrapper`'s jitter factor, so reloads inherit that spread.
 */
export function hardReload(): void {
    window.location.reload();
}
