import Link from "next/link";

export default function Page() {
    return (
        <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="mt-2 text-zinc-400">
                Manage games for the Megadmin Timer.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
                <Link
                    href="/admin/game"
                    className="group rounded-xl border border-zinc-800 bg-zinc-900 p-6 transition hover:border-indigo-500/60 hover:bg-zinc-900/60"
                >
                    <h2 className="text-lg font-semibold transition group-hover:text-indigo-300">
                        View games{" "}
                        <span aria-hidden="true" className="inline-block">
                            →
                        </span>
                    </h2>
                    <p className="mt-1 text-sm text-zinc-400">
                        Browse existing games and get share links &amp; QR
                        codes.
                    </p>
                </Link>
                <Link
                    href="/admin/game/create"
                    className="group rounded-xl border border-zinc-800 bg-zinc-900 p-6 transition hover:border-indigo-500/60 hover:bg-zinc-900/60"
                >
                    <h2 className="text-lg font-semibold transition group-hover:text-indigo-300">
                        Create game{" "}
                        <span aria-hidden="true" className="inline-block">
                            →
                        </span>
                    </h2>
                    <p className="mt-1 text-sm text-zinc-400">
                        Set up a new game using one of the supported rule sets.
                    </p>
                </Link>
            </div>
        </div>
    );
}
