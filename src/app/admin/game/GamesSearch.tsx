"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function GamesSearch(): React.ReactElement {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [value, setValue] = useState<string>(
        () => searchParams?.get("search") ?? "",
    );
    const [isPending, startTransition] = useTransition();

    // Debounce navigation so we don't push (and re-query) on every keystroke.
    // A new search drops the `page` param, resetting to page 1.
    useEffect(() => {
        const handle = setTimeout(() => {
            const current = searchParams?.get("search") ?? "";
            const next = value.trim();

            if (next === current) {
                return;
            }

            const params = new URLSearchParams();
            if (next) {
                params.set("search", next);
            }
            const query = params.toString();

            startTransition(() => {
                router.push(`/admin/game${query ? `?${query}` : ""}`);
            });
        }, 300);

        return () => clearTimeout(handle);
    }, [value, searchParams, router]);

    return (
        <div className="relative">
            <label htmlFor="game-search" className="sr-only">
                Search by code
            </label>
            <input
                id="game-search"
                type="search"
                value={value}
                onChange={(event) => setValue(event.target.value)}
                placeholder="Search by code…"
                className="block w-full rounded-lg border-zinc-700 bg-zinc-950 text-zinc-100 placeholder-zinc-500 focus:border-indigo-500 focus:ring-indigo-500"
            />
            {isPending ? (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-500">
                    Searching…
                </span>
            ) : null}
        </div>
    );
}
