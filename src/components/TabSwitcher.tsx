import { ActiveTabs } from "../types/types";
import Image from "next/image";
import VLHGLogo from "../../public/vlhg-logo.svg";
import GNNLogo from "../../public/GNNLogo.png";

function DisplayManageTabSwitch({
    activeTab,
    setActiveTab,
}: {
    activeTab: ActiveTabs;
    setActiveTab: (newActive: ActiveTabs) => void;
}) {

    const activeClass = "bg-red-700";
    const baseClass = "flex-1 text-lg transition pt-2";

    if (false) return "";
    return (
        <button
            className={`${baseClass} ${
                activeTab == "manage" ? activeClass : ""
            }`}
            onClick={() => setActiveTab("manage")}
        >
            <Image className="mx-auto" src={GNNLogo} alt="" width={40} />
            <span>
                Manage
            </span>
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
    const baseClass = "flex-1 text-lg transition pt-2";

    return (
        <div className="flex w-full lg:hidden fixed bottom-0 left-0 right-0 h-24 bg-gradient-to-b from-turn-counter-past-light to-turn-counter-past-dark text-white border-black">
            <button
                className={`${baseClass} ${
                    activeTab == "home" ? activeClass : ""
                }`}
                onClick={() => setActiveTab("home")}
            >
                <Image className="mx-auto" src={GNNLogo} alt="" width={40} />
                <span>
                    Game
                </span>
            </button>
            <button
                className={`${baseClass} ${
                    activeTab == "press" ? activeClass : ""
                }`}
                onClick={() => setActiveTab("press")}
            >
                <Image className="mx-auto" src={GNNLogo} alt="" width={40} />
                <span>
                    News
                </span>
            </button>
            <button
                className={`${baseClass} ${
                    activeTab == "defcon" ? activeClass : ""
                }`}
                onClick={() => setActiveTab("defcon")}
            >
                <Image className="mx-auto" src={GNNLogo} alt="" width={40} />
                <span>
                    Defcon
                </span>
            </button>
            <DisplayManageTabSwitch 
                activeTab={activeTab}
                setActiveTab={setActiveTab}
            />
        </div>
    );
}
