import type { LightLevel } from "@fc/types/types";

export default function LightLevel({ value, max }: LightLevel) {
    const clamped = Math.max(0, Math.min(max, value));
    const pips = Array.from({ length: max }, (_, i) => i < clamped);
    const ratio = max === 0 ? 0 : clamped / max;

    return (
        <div className="py-4 px-4">
            <div
                className="border-2 border-yellow-200 bg-black p-6 mx-auto w-full max-w-md"
                style={{
                    boxShadow: `inset 0 0 ${Math.round(60 * ratio)}px ${Math.round(10 * ratio)}px rgba(253,224,71,${0.15 * ratio})`,
                }}
            >
                <h3 className="text-2xl uppercase text-center text-yellow-100 mb-6 tracking-widest">
                    Light Level
                </h3>
                <div className="flex flex-nowrap gap-1 justify-center">
                    {pips.map((lit, i) => (
                        <span
                            key={i}
                            className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold leading-none ${
                                lit
                                    ? "bg-yellow-300 text-black shadow-[0_0_8px_2px_rgba(253,224,71,0.7)]"
                                    : "bg-gray-900 border border-gray-700 text-white"
                            }`}
                        >
                            {i + 1}
                        </span>
                    ))}
                </div>
            </div>
        </div>
    );
}
