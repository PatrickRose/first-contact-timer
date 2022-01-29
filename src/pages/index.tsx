import React from 'react';
import BaseApp from "../components/BasePage";
import {ApiResponse} from "../types/types";
import Roles from "../components/Roles";

class PlayerApp extends BaseApp {
  // eslint-disable-next-line class-methods-use-this
  protected childComponents(apiResponse: ApiResponse): JSX.Element {
    const {
      phase
    } = apiResponse;

    return (
        <Roles phaseNumber={phase} />
    );
  }

  protected title(): string {
    return "Player";
  }
}


export default PlayerApp;
