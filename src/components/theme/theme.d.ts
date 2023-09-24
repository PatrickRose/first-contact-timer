import { ApiResponse, Game } from "@fc/types/types";
import React from "react";

export type ThemeProps = {
    game: Game;
    apiResponse: ApiResponse;
    childComponent: React.ReactNode;
    manageTabTitle: string | null;
};
