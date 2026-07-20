"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";

function targetHref(search: string | undefined, page: number): string {
    const params = new URLSearchParams();
    const trimmed = search?.trim();
    if (trimmed) {
        params.set("search", trimmed);
    }
    params.set("page", String(page));
    return `/admin/game?${params.toString()}`;
}

export default function GamesPagination({
    page,
    totalPages,
    count,
    total,
    search,
}: {
    page: number;
    totalPages: number;
    count: number;
    total: number;
    search?: string;
}): React.ReactElement {
    const router = useRouter();
    // Navigate inside a transition so the current list stays visible (rather
    // than flashing the skeleton) while `isPending` drives a clear indicator
    // that a new query is running.
    const [isPending, startTransition] = useTransition();

    const go = (targetPage: number) => {
        startTransition(() => {
            router.push(targetHref(search, targetPage));
        });
    };

    const buttonClass = (disabled: boolean) =>
        disabled
            ? "cursor-not-allowed rounded-lg border border-zinc-800 px-4 py-2 text-zinc-600"
            : "rounded-lg border border-zinc-700 px-4 py-2 text-zinc-200 transition hover:border-indigo-500 hover:text-white";

    return (
        <div
            className="mt-6 flex items-center justify-between text-sm"
            aria-busy={isPending}
        >
            <button
                type="button"
                onClick={() => go(page - 1)}
                disabled={page <= 1 || isPending}
                className={buttonClass(page <= 1 || isPending)}
            >
                ← Previous
            </button>
            <span className="flex items-center gap-2 text-zinc-400">
                {isPending ? (
                    <>
                        <span
                            className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-600 border-t-indigo-400"
                            aria-hidden="true"
                        />
                        <span role="status">Loading…</span>
                    </>
                ) : (
                    <>
                        Page {page} of {totalPages}
                        {total > 0
                            ? ` · ${count} of ${total} game${total === 1 ? "" : "s"}`
                            : ""}
                    </>
                )}
            </span>
            <button
                type="button"
                onClick={() => go(page + 1)}
                disabled={page >= totalPages || isPending}
                className={buttonClass(page >= totalPages || isPending)}
            >
                Next →
            </button>
        </div>
    );
}
