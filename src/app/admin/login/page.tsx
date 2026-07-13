import LoginForm from "./LoginForm";

export default function Page() {
    return (
        <div className="mx-auto max-w-md">
            <h1 className="text-3xl font-bold">Login</h1>
            <p className="mt-2 text-zinc-400">
                Sign in to manage your games.
            </p>

            <div className="mt-8 rounded-xl border border-zinc-800 bg-zinc-900 p-6">
                <LoginForm />
            </div>
        </div>
    );
}
