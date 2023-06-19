import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Megadmin Timer",
};

export default function Page() {
    return (
        <div className="p-4">
            <h1 className="text-2xl">Megadmin Timer</h1>

            <div className="py-2">
                <p>
                    This is a holding page for the Megadmin Timer application.
                </p>

                <p>
                    You should have been given a game specific link to use for
                    your game - if not, please contact the organisers for your
                    event
                </p>
            </div>
        </div>
    );
}
