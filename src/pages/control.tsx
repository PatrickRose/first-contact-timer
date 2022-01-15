import * as React from 'react';

import BaseApp from "../components/BasePage";
import {ApiResponse, ControlAPI} from "../types/types";


type ControlButtonProps = {
    triggerFetch: () => void,
    pauseRefresh: (pause: boolean) => void,
    apiResponse: ApiResponse
}

type ControlButtonState = {
    buttonPressed: boolean
}

abstract class ControlButton extends React.Component<ControlButtonProps, ControlButtonState> {
    constructor(props: ControlButtonProps) {
        super(props);

        this.state = {
            buttonPressed: false
        };
    }

    protected abstract getApiBody(): ControlAPI;

    protected abstract title(): string;

    protected abstract fontAwesomeIcon(): string;

    public abstract appearForState(apiResponse: ApiResponse): boolean

    protected handleOnClick() {
        const endPoint = '/api/control';
        const { pauseRefresh } = this.props;

        this.setState({ buttonPressed: true });

        const apiReqBody = this.getApiBody();
        const fetchPromise = fetch(endPoint, {
            method: 'post',
            body: JSON.stringify(apiReqBody),
            headers: {
                'Content-Type': 'application/json'
            }
        });

        pauseRefresh(true);

        fetchPromise.then(
            () => {
                const { triggerFetch } = this.props;
                triggerFetch();
            }
        );

        fetchPromise.finally(
            () => {
                this.setState({ buttonPressed: false });
                pauseRefresh(false);
            }
        );
    }

    render() {
        const { buttonPressed } = this.state;
        const { apiResponse } = this.props;

        const title = this.title();

        if (!this.appearForState(apiResponse)) {
            return null;
        }
        return (
            <button
                type="button"
                className={`btn btn-outline-dark fa ${this.fontAwesomeIcon()}`}
                key={this.constructor.name}
                onClick={() => this.handleOnClick()}
                title={title}
                disabled={buttonPressed}
            >
          <span className="sr-only">
            {title}
          </span>
            </button>
        );
    }
}

class PauseButton extends ControlButton {
    protected fontAwesomeIcon = (): string => 'fa-pause';

    protected title = (): string => 'Pause the game';

    public appearForState = (apiResponse: ApiResponse): boolean => apiResponse.active;

    protected getApiBody = (): ControlAPI => ({ action: 'pause' });
}

class PlayButton extends ControlButton {
    public appearForState = (apiResponse: ApiResponse): boolean => !apiResponse.active;

    protected fontAwesomeIcon = (): string => 'fa-play';

    protected title = (): string => 'Continue the game from this state';

    protected getApiBody = (): ControlAPI => ({ action: 'play' });
}

class BackATurn extends ControlButton {
    appearForState = (): boolean => true;

    protected fontAwesomeIcon = (): string => 'fa-fast-backward';

    protected getApiBody = (): ControlAPI => ({ action: 'back-turn' });

    protected title = (): string => 'Go back a turn';
}

class BackAPhase extends ControlButton {
    appearForState = (): boolean => true;

    protected fontAwesomeIcon = (): string => 'fa-backward';

    protected getApiBody = (): ControlAPI => ({ action: 'back-phase' });

    protected title = (): string => 'Go back a phase';
}

export default class ControlApp extends BaseApp {
    protected mainComponents(apiResponse: ApiResponse): JSX.Element {
        const triggerFetch = () => this.fetchFromAPI();
        const pauseRefresh = (pause: boolean) => this.pauseRefresh(pause);

        return (
            <div className="btn-group control-buttons">
                <BackATurn pauseRefresh={pauseRefresh} apiResponse={apiResponse} triggerFetch={triggerFetch} />
                <BackAPhase pauseRefresh={pauseRefresh} apiResponse={apiResponse} triggerFetch={triggerFetch} />
                <PlayButton pauseRefresh={pauseRefresh} apiResponse={apiResponse} triggerFetch={triggerFetch} />
                <PauseButton pauseRefresh={pauseRefresh} apiResponse={apiResponse} triggerFetch={triggerFetch} />
            </div>
        );
    }
}
