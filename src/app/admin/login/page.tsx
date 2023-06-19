import LoginForm from "./LoginForm";

export default function Page() {
    return (
        <div className="p-4">
            <h1 className="text-2xl">Login</h1>

            <div className="p-4">
                <LoginForm />
            </div>
        </div>
    );
}
