"use client";

import { useState } from "react";

export default function LogoutButton() {
    const [loggingOut, setLoggingOut] = useState<boolean>(false);

    const logout = async () => {
        if (loggingOut) {
            return;
        }

        setLoggingOut(true);

        try {
            await fetch("/api/logout", { method: "POST" });
        } catch (e) {
            console.error(e);
        }

        // Hard navigation so the middleware re-runs with the cleared session
        // cookie and we don't get served a stale, logged-in view of /admin
        // from Next's Router Cache.
        window.location.assign("/admin/login");
    };

    return (
        <button
            type="button"
            onClick={logout}
            disabled={loggingOut}
            aria-busy={loggingOut}
            className="text-zinc-400 transition hover:text-zinc-100 disabled:cursor-not-allowed disabled:opacity-70"
        >
            {loggingOut ? "Logging out…" : "Log out"}
        </button>
    );
}
