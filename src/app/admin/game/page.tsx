import { isLeft } from "fp-ts/Either";
import { getGameRepo } from "@fc/server/repository/game";
import { GameSummary, toGameSummary } from "@fc/server/turn";
import GamesSearch from "./GamesSearch";
import GamesPagination from "./GamesPagination";
import GameShareModal from "./GameShareModal";

const PAGE_SIZE = 10;

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
                        <GamesPagination
                            page={page}
                            totalPages={totalPages}
                            count={summaries.length}
                            total={total}
                            search={search}
                        />
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
