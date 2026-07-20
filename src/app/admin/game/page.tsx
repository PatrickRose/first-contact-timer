import Link from "next/link";
import { isLeft } from "fp-ts/Either";
import { getGameRepo } from "@fc/server/repository/game";
import { GameSummary, toGameSummary } from "@fc/server/turn";
import GamesSearch from "./GamesSearch";
import GameShareModal from "./GameShareModal";

const PAGE_SIZE = 20;

function ErrorBanner({ message }: { message: string }): React.ReactElement {
    return (
        <div
            role="alert"
            className="rounded-lg border border-red-500/50 bg-red-950/60 p-4 text-sm text-red-200"
        >
            Could not load games: {message}
        </div>
    );
}

function statusLine(game: GameSummary): string {
    const phase = `${game.phaseName} (Phase ${game.phaseNumber})`;
    const state = game.paused ? "Paused" : "Running";
    return `Turn ${game.turnNumber} · ${phase} · ${state}`;
}

function pageHref(search: string | undefined, page: number): string {
    const params = new URLSearchParams();
    const trimmed = search?.trim();
    if (trimmed) {
        params.set("search", trimmed);
    }
    params.set("page", String(page));
    return `/admin/game?${params.toString()}`;
}

export default async function GamesPage({
    searchParams,
}: {
    searchParams: Promise<{ search?: string; page?: string }>;
}): Promise<React.ReactElement> {
    const { search, page: pageParam } = await searchParams;
    const requestedPage = Math.max(1, Math.floor(Number(pageParam)) || 1);

    const repo = getGameRepo();

    let content: React.ReactElement;

    if (isLeft(repo)) {
        content = <ErrorBanner message={repo.left} />;
    } else {
        const result = await repo.right.list({
            search,
            page: requestedPage,
            pageSize: PAGE_SIZE,
        });

        if (isLeft(result)) {
            content = <ErrorBanner message={result.left} />;
        } else {
            const { games, total, page } = result.right;
            const summaries = games.map(toGameSummary);
            const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

            content =
                summaries.length === 0 ? (
                    <p className="rounded-lg border border-zinc-800 bg-zinc-900 p-6 text-sm text-zinc-400">
                        No games found.
                    </p>
                ) : (
                    <>
                        <ul className="divide-y divide-zinc-800 rounded-xl border border-zinc-800 bg-zinc-900">
                            {summaries.map((game) => (
                                <li
                                    key={game.code}
                                    className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
                                >
                                    <div>
                                        <p className="font-mono text-base font-semibold text-indigo-300">
                                            {game.code}
                                        </p>
                                        <p className="text-sm text-zinc-300">
                                            {game.gameName}
                                        </p>
                                        <p className="mt-1 text-xs text-zinc-500">
                                            {statusLine(game)}
                                        </p>
                                    </div>
                                    <GameShareModal code={game.code} />
                                </li>
                            ))}
                        </ul>
                        <div className="mt-6 flex items-center justify-between text-sm">
                            <PaginationLink
                                href={pageHref(search, page - 1)}
                                disabled={page <= 1}
                                label="← Previous"
                            />
                            <span className="text-zinc-400">
                                Page {page} of {totalPages}
                                {total > 0
                                    ? ` · ${total} game${total === 1 ? "" : "s"}`
                                    : ""}
                            </span>
                            <PaginationLink
                                href={pageHref(search, page + 1)}
                                disabled={page >= totalPages}
                                label="Next →"
                            />
                        </div>
                    </>
                );
        }
    }

    return (
        <div>
            <h1 className="text-3xl font-bold">Games</h1>
            <p className="mt-2 text-zinc-400">
                Browse existing games and grab share links &amp; QR codes for
                the control, press, and player views.
            </p>

            <div className="mt-6 max-w-md">
                <GamesSearch />
            </div>

            <div className="mt-6">{content}</div>
        </div>
    );
}

function PaginationLink({
    href,
    disabled,
    label,
}: {
    href: string;
    disabled: boolean;
    label: string;
}): React.ReactElement {
    if (disabled) {
        return (
            <span className="cursor-not-allowed rounded-lg border border-zinc-800 px-4 py-2 text-zinc-600">
                {label}
            </span>
        );
    }

    return (
        <Link
            href={href}
            className="rounded-lg border border-zinc-700 px-4 py-2 text-zinc-200 transition hover:border-indigo-500 hover:text-white"
        >
            {label}
        </Link>
    );
}
