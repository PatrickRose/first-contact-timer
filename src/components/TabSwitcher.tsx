import { ActiveTabs } from "../types/types";


function DisplayManageTabSwitch({
    activeTab,
    setActiveTab,
}: {
    activeTab: ActiveTabs;
    setActiveTab: (newActive: ActiveTabs) => void;
}) {

    const activeClass = "bg-red-700";
    const baseClass = "flex-1 border-2 text-lg transition";

    if (false) return "";
    return (
        <button
            className={`${baseClass} ${
                activeTab == "manage" ? activeClass : ""
            }`}
            onClick={() => setActiveTab("manage")}
        >
            Manage
        </button>   
    );
}


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
        <div className="flex w-full lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-gradient-to-b from-turn-counter-past-light to-turn-counter-past-dark text-white border-black">
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
                News
            </button>
            <button
                className={`${baseClass} ${
                    activeTab == "defcon" ? activeClass : ""
                }`}
                onClick={() => setActiveTab("defcon")}
            >
                Defcon
            </button>
            <DisplayManageTabSwitch 
                activeTab={activeTab}
                setActiveTab={setActiveTab}
            />
        </div>
    );
}
