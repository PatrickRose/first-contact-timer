import { GameCreateForm } from "./GameCreateForm";

export default function Page() {
    return (
        <div>
            <h1 className="text-3xl font-bold">Create game</h1>
            <p className="mt-2 text-zinc-400">
                Choose an ID and a rule set for the new game.
            </p>

            <div className="mt-8 rounded-xl border border-zinc-800 bg-zinc-900 p-6">
                <GameCreateForm />
            </div>
        </div>
    );
}
