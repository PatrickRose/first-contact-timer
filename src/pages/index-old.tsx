import React from "react";
import BaseApp from "../components/BasePage";

class PlayerApp extends BaseApp {
    protected title(): string {
        return "Player";
    }

    protected tabTitle(): string {
        return "";
    }
}

export default PlayerApp;
