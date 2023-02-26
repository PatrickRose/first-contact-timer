import React from "react";
import BaseApp from "../components/BasePage";
import { ApiResponse } from "../types/types";
import DefconStatuses from "../components/DefconStatuses";

class PlayerApp extends BaseApp {
    protected title(): string {
        return "Player";
    }
}

export default PlayerApp;
