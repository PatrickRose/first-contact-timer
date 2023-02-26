import { ActiveTabs } from "../types/types";

export default function TabSwitcher({
    activeTab,
    setActiveTab,
}: {
    activeTab: ActiveTabs;
    setActiveTab: (newActive: ActiveTabs) => void;
}) {
    const activeClass = "bg-red-700";
    const baseClass = "flex-1 border-2 text-lg transition";

    return (
        <div className="flex w-full lg:hidden">
            <button
                className={`${baseClass} ${
                    activeTab == "home" ? activeClass : ""
                }`}
                onClick={() => setActiveTab("home")}
            >
                Home
            </button>
            <button
                className={`${baseClass} ${
                    activeTab == "press" ? activeClass : ""
                }`}
                onClick={() => setActiveTab("press")}
            >
                Press
            </button>
            <button
                className={`${baseClass} ${
                    activeTab == "defcon" ? activeClass : ""
                }`}
                onClick={() => setActiveTab("defcon")}
            >
                Defcon
            </button>
        </div>
    );
}
