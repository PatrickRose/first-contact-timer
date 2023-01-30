import React from "react";
import BaseApp from "../components/BasePage";
import { ApiResponse } from "../types/types";
import DefconStatuses from "../components/DefconStatuses";

class PlayerApp extends BaseApp {
    // eslint-disable-next-line class-methods-use-this
    protected childComponents({ defcon }: ApiResponse): JSX.Element {
        return <DefconStatuses defcon={defcon} />;
    }

    protected title(): string {
        return "Player";
    }
}

export default PlayerApp;
