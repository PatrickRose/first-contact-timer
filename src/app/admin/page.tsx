import Link from "next/link";

export default function Page() {
    return (
        <div className="p-4">
            <h1>Megadmin Admin Page</h1>

            <p>
                <Link href="/admin/game/create">Create game</Link>
            </p>
        </div>
    );
}
