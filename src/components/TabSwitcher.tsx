import { ActiveTabs } from "../types/types";
import Image from "next/image";
import VLHGLogo from "../../public/vlhg-logo.svg";
import Icon_Game from "../../public/Icon-VLHG.png";
import Icon_NewsFeed from "../../public/GNNLogo.png";
import Icon_DefCon from "../../public/Icon-DefCon.png";
import Icon_Manage from "../../public/Icon-Manage.png";
import { useEffect } from "react";

function DisplayManageTabSwitch({
    activeTab,
    setActiveTab,
    manageTabTitle,
}: {
    activeTab: string;
    setActiveTab: (newActive: string) => void;
    manageTabTitle: string;
}) {
    const activeClass = "bg-zinc-600";
    const baseClass = "flex-1 text-lg transition pt-2";

    if (manageTabTitle == "") return null;

    return (
        <button
            className={`${baseClass} ${
                activeTab == "manage" ? activeClass : ""
            }`}
            onClick={() => setActiveTab("manage")}
        >
            <Image className="mx-auto" src={Icon_Manage} alt="" width={40} />
            <span>{manageTabTitle}</span>
        </button>
    );
}

export default function TabSwitcher({
    activeTab,
    setActiveTab,
    manageTabTitle,
}: {
    activeTab: string;
    setActiveTab: (newActive: string) => void;
    manageTabTitle: string;
}) {
    const activeClass = "bg-zinc-600";
    const baseClass = "flex-1 text-lg transition pt-2";

    useEffect(() => window.scrollTo({ top: 0 }), [activeTab]);

    return (
        <div className="flex w-full lg:hidden fixed bottom-0 left-0 right-0 h-24 bg-gradient-to-b from-turn-counter-past-light to-turn-counter-past-dark text-white border-black">
            <button
                className={`${baseClass} ${
                    activeTab == "home" ? activeClass : ""
                }`}
                onClick={() => setActiveTab("home")}
            >
                <Image className="mx-auto" src={Icon_Game} alt="" width={40} />
                <span>Game</span>
            </button>
            <button
                className={`${baseClass} ${
                    activeTab == "press" ? activeClass : ""
                }`}
                onClick={() => setActiveTab("press")}
            >
                <Image
                    className="mx-auto"
                    src={Icon_NewsFeed}
                    alt=""
                    width={40}
                />
                <span>News</span>
            </button>
            <button
                className={`${baseClass} ${
                    activeTab == "defcon" ? activeClass : ""
                }`}
                onClick={() => setActiveTab("defcon")}
            >
                <Image
                    className="mx-auto"
                    src={Icon_DefCon}
                    alt=""
                    width={40}
                />
                <span>Defcon</span>
            </button>
            <DisplayManageTabSwitch
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                manageTabTitle={manageTabTitle}
            />
        </div>
    );
}
