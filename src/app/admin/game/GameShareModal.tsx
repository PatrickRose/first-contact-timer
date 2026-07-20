"use client";

import { useState } from "react";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import QRCode from "react-qr-code";
import { gameUrls, GameUrls } from "@fc/lib/gameUrls";

const VIEWS: { key: keyof GameUrls; label: string }[] = [
    { key: "control", label: "Control" },
    { key: "press", label: "Press" },
    { key: "player", label: "Player" },
];

function ShareView({
    label,
    url,
}: {
    label: string;
    url: string;
}): React.ReactElement {
    const [copied, setCopied] = useState<boolean>(false);
    const [copyFailed, setCopyFailed] = useState<boolean>(false);

    const copy = async () => {
        setCopied(false);
        setCopyFailed(false);

        // `navigator.clipboard` is undefined outside a secure context (e.g. a
        // venue LAN served over plain HTTP), so guard before using it and fall
        // back to telling the operator to copy the visible URL / scan the QR.
        if (navigator.clipboard?.writeText) {
            try {
                await navigator.clipboard.writeText(url);
                setCopied(true);
                return;
            } catch {
                // fall through to the failure message
            }
        }

        setCopyFailed(true);
    };

    return (
        <div className="flex flex-col items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-950 p-4">
            <h3 className="text-sm font-semibold text-zinc-200">{label}</h3>
            <div className="bg-white p-3">
                <QRCode value={url} size={140} />
            </div>
            <code className="w-full break-all text-center text-xs text-zinc-400">
                {url}
            </code>
            <button
                type="button"
                onClick={copy}
                className="rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-indigo-500"
            >
                {copied ? "Copied!" : "Copy link"}
            </button>
            {copyFailed ? (
                <p className="text-xs text-amber-300">
                    Copy failed — select the URL above or scan the QR code.
                </p>
            ) : null}
        </div>
    );
}

export default function GameShareModal({
    code,
}: {
    code: string;
}): React.ReactElement {
    const [open, setOpen] = useState<boolean>(false);
    const [urls, setUrls] = useState<GameUrls | null>(null);

    const openModal = () => {
        // `window` is only available on the client; reading it here (on click,
        // well after hydration) keeps this SSR-safe.
        if (typeof window !== "undefined") {
            setUrls(gameUrls(window.location.origin, code));
        }
        setOpen(true);
    };

    return (
        <>
            <button
                type="button"
                onClick={openModal}
                className="rounded-md border border-zinc-600 bg-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-200 transition hover:border-indigo-500 hover:text-white"
            >
                Links &amp; QR
            </button>
            <Dialog
                open={open}
                onClose={() => setOpen(false)}
                className="relative z-50"
            >
                <div className="fixed inset-0 bg-black/70" aria-hidden="true" />
                <div className="fixed inset-0 flex items-center justify-center p-4">
                    <DialogPanel className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-zinc-800 bg-zinc-900 p-6 text-zinc-100">
                        <div className="flex items-start justify-between">
                            <DialogTitle className="text-lg font-semibold">
                                Share links for{" "}
                                <span className="font-mono text-indigo-300">
                                    {code}
                                </span>
                            </DialogTitle>
                            <button
                                type="button"
                                onClick={() => setOpen(false)}
                                className="text-zinc-400 transition hover:text-zinc-100"
                                aria-label="Close"
                            >
                                ✕
                            </button>
                        </div>
                        <div className="mt-6 grid gap-4 sm:grid-cols-3">
                            {urls
                                ? VIEWS.map(({ key, label }) => (
                                      <ShareView
                                          key={key}
                                          label={label}
                                          url={urls[key]}
                                      />
                                  ))
                                : null}
                        </div>
                    </DialogPanel>
                </div>
            </Dialog>
        </>
    );
}
