// Shown instantly (via the App Router Suspense boundary) while the async
// server component in page.tsx waits on the games query, so the initial load
// doesn't feel like a blank stall. Mirrors the real page layout.
export default function Loading(): React.ReactElement {
    return (
        <div aria-busy="true">
            <h1 className="text-3xl font-bold">Games</h1>
            <p className="mt-2 text-zinc-400">
                Browse existing games and grab share links &amp; QR codes for
                the control, press, and player views.
            </p>

            <div className="mt-6 max-w-md">
                <div className="h-10 w-full animate-pulse rounded-lg bg-zinc-900" />
            </div>

            <div className="mt-6">
                <span className="sr-only" role="status">
                    Loading games…
                </span>
                <ul className="divide-y divide-zinc-800 rounded-xl border border-zinc-800 bg-zinc-900">
                    {Array.from({ length: 6 }).map((_unused, index) => (
                        <li
                            key={index}
                            className="flex items-center justify-between gap-3 p-4"
                        >
                            <div className="flex-1 space-y-2">
                                <div className="h-4 w-32 animate-pulse rounded bg-zinc-800" />
                                <div className="h-3 w-48 animate-pulse rounded bg-zinc-800" />
                                <div className="h-3 w-64 animate-pulse rounded bg-zinc-800" />
                            </div>
                            <div className="h-8 w-24 animate-pulse rounded-md bg-zinc-800" />
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}
