import * as React from 'react';

import BaseApp from "../components/BasePage";
import {ApiResponse, ControlAPI, Defcon, DefconAPIBody, DefconStatus} from "../types/types";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {IconDefinition} from "@fortawesome/fontawesome-svg-core";
import {faBackward} from "@fortawesome/free-solid-svg-icons/faBackward";
import {faPause} from "@fortawesome/free-solid-svg-icons/faPause";
import {faFastBackward} from "@fortawesome/free-solid-svg-icons/faFastBackward";
import {faPlay} from "@fortawesome/free-solid-svg-icons/faPlay";
import {faForward} from "@fortawesome/free-solid-svg-icons/faForward";
import {faFastForward} from "@fortawesome/free-solid-svg-icons/faFastForward";
import {ApiResponseDecode} from "../types/io-ts-def";
import {PHASE_LISTS} from "../server/turn";
import {BACKGROUNDS, DEFCON_STATE_TO_HUMAN_STATE} from "../components/DefconStatuses";
import {useState} from "react";


type ControlButtonProps = {
    triggerFetch: () => void,
    pauseRefresh: (pause: boolean) => void,
    apiResponse: ApiResponse,
    setResponse: (response: ApiResponse) => void,
    setErrorMessage: (msg: string | undefined) => void
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

    protected abstract fontAwesomeIcon(): IconDefinition;

    public abstract appearForState(apiResponse: ApiResponse): boolean

    protected handleOnClick() {
        const endPoint = '/api/control';
        const {pauseRefresh} = this.props;

        this.setState({buttonPressed: true});

        const apiReqBody = this.getApiBody();
        pauseRefresh(true);

        fetch(endPoint, {
            method: 'post',
            body: JSON.stringify(apiReqBody),
            headers: {
                'Content-Type': 'application/json'
            }
        })
            .then((body) => {
                if (body.ok) {
                    return body.json()
                } else {
                    return Promise.reject(body)
                }
            })
            .then((result) => {
                    const {triggerFetch, setResponse, setErrorMessage} = this.props;
                    pauseRefresh(false);

                    if (ApiResponseDecode.is(result)) {
                        setResponse(result);
                        setErrorMessage(undefined);
                    } else {
                        return Promise.reject(result)
                    }

                    triggerFetch();
                }
            )
            .catch((error) => {
                const {setErrorMessage} = this.props;

                if (error instanceof Response) {
                    error.json().then((body) => {
                        if (body.msg) {
                            setErrorMessage(body.msg);
                        }
                    }).catch((e: Error) => {
                        setErrorMessage(`${e}`);
                    })
                } else if (error.msg) {
                    setErrorMessage(error.msg);
                } else {
                    setErrorMessage("Unknown error");
                }
            })
            .finally(
                () => {
                    this.setState({buttonPressed: false});
                    pauseRefresh(false);
                }
            );
    }

    render() {
        const {buttonPressed} = this.state;
        const {apiResponse} = this.props;

        const title = this.title();

        if (!this.appearForState(apiResponse)) {
            return null;
        }
        return (
            <button
                type="button"
                className="outline rounded p-2 px-4 disabled:opacity-75"
                key={this.constructor.name}
                onClick={() => this.handleOnClick()}
                title={title}
                disabled={buttonPressed}
            >
                <FontAwesomeIcon icon={this.fontAwesomeIcon()} size="lg"/>
                <span className="sr-only">
            {title}
          </span>
            </button>
        );
    }
}

class PauseButton extends ControlButton {
    protected fontAwesomeIcon = (): IconDefinition => faPause;

    protected title = (): string => 'Pause the game';

    public appearForState = (apiResponse: ApiResponse): boolean => apiResponse.active;

    protected getApiBody = (): ControlAPI => ({action: 'pause'});
}

class PlayButton extends ControlButton {
    public appearForState = (apiResponse: ApiResponse): boolean => !apiResponse.active;

    protected fontAwesomeIcon = (): IconDefinition => faPlay;

    protected title = (): string => 'Continue the game from this state';

    protected getApiBody = (): ControlAPI => ({action: 'play'});
}

class BackATurn extends ControlButton {
    appearForState = (): boolean => true;

    protected fontAwesomeIcon = (): IconDefinition => faFastBackward;

    protected getApiBody = (): ControlAPI => ({action: 'back-turn'});

    protected title = (): string => 'Go back a turn';
}

class BackAPhase extends ControlButton {
    appearForState = (): boolean => true;

    protected fontAwesomeIcon = (): IconDefinition => faBackward;

    protected getApiBody = (): ControlAPI => ({action: 'back-phase'});

    protected title = (): string => 'Go back a phase';
}

class ForwardPhase extends ControlButton {
    appearForState = (): boolean => true;

    protected fontAwesomeIcon = (): IconDefinition => faForward;

    protected getApiBody = (): ControlAPI => ({action: 'forward-phase'});

    protected title = (): string => 'Go forward a phase';
}

class ForwardTurn extends ControlButton {
    appearForState = (apiResponse: ApiResponse): boolean => apiResponse.phase != Math.max(...PHASE_LISTS);

    protected fontAwesomeIcon = (): IconDefinition => faFastForward;

    protected getApiBody = (): ControlAPI => ({action: 'forward-turn'});

    protected title = (): string => 'Go forward a turn';
}

function DefconState({
                         defconNumber,
                         active,
                         onClick
                     }: { defconNumber: DefconStatus, active: boolean, onClick: () => void }) {
    const backgroundDef = BACKGROUNDS[defconNumber];
    const background: string[] = [
        active ? backgroundDef.activeBorder : backgroundDef.inactiveBorder
    ];

    if (active) {
        background.push('delay-250');

        background.push(backgroundDef.background)
    }

    return <button onClick={onClick}
                   className={`p-2 text-center items-center flex flex-col transition duration-500 border-4 ${background.join(' ')}`}>
        <span>Defcon</span>
        <span>{defconNumber}</span>
    </button>
}

type CountryDefconProps = {
    stateName: keyof Defcon,
    status: DefconStatus,
    triggerUpdate: (countryName: CountryDefconProps["stateName"], status: DefconStatus) => Promise<void>
};

function CountryDefcon(
    {stateName, status, triggerUpdate}: CountryDefconProps
) {
    const [updatingTo, setUpdatingTo] = useState<DefconStatus | null>(null)

    const onClick = (newStatus: DefconStatus) => {
        setUpdatingTo(newStatus);
        triggerUpdate(stateName, newStatus)
            .finally(() => setUpdatingTo(null))
    }

    return <div className="flex justify-center items-center content-center">
        <div className="flex-1">
            {DEFCON_STATE_TO_HUMAN_STATE[stateName]}
        </div>
        {
            updatingTo === null
                ? <React.Fragment>
                    <DefconState defconNumber="hidden" active={status == 'hidden'} onClick={() => onClick('hidden')}/>
                    <DefconState defconNumber={3} active={status == 3} onClick={() => onClick(3)}/>
                    <DefconState defconNumber={2} active={status == 2} onClick={() => onClick(2)}/>
                    <DefconState defconNumber={1} active={status == 1} onClick={() => onClick(1)}/>
                </React.Fragment>
                : <div className="flex-1">
                    Updating to defcon level {updatingTo}...
                </div>
        }

    </div>
}

function ControlDefconStatus({
                                 defcon,
                                 pauseRefresh,
                                 triggerFetch,
                                 setResponse,
                                 setErrorMessage
                             }: { defcon: Defcon } & ControlButtonProps) {
    const triggerUpdate: CountryDefconProps["triggerUpdate"] = async (countryName: CountryDefconProps["stateName"], status: DefconStatus): Promise<void> => {
        pauseRefresh(true);

        const apiReqBody: DefconAPIBody = {
            newStatus: status,
            stateName: countryName
        }

        return fetch('/api/defcon', {
            method: 'post',
            body: JSON.stringify(apiReqBody),
            headers: {
                'Content-Type': 'application/json'
            }
        })
            .then((body) => {
                if (body.ok) {
                    return body.json()
                } else {
                    return Promise.reject(body)
                }
            })
            .then((result) => {
                    pauseRefresh(false);

                    if (ApiResponseDecode.is(result)) {
                        setResponse(result);
                        setErrorMessage(undefined);
                    } else {
                        return Promise.reject(result)
                    }

                    triggerFetch();
                }
            )
            .catch((error) => {
                if (error instanceof Response) {
                    error.json().then((body) => {
                        if (body.msg) {
                            setErrorMessage(body.msg);
                        }
                    }).catch((e: Error) => {
                        setErrorMessage(`${e}`);
                    })
                } else if (error.msg) {
                    setErrorMessage(error.msg);
                } else {
                    setErrorMessage("Unknown error");
                }
            })
            .finally(
                () => {
                    pauseRefresh(false);
                }
            );
    }

    return <div className="flex justify-center">
        <ul className="grid grid-cols-2 gap-4">
            {
                Object.entries(defcon).map(([country, status]) => {
                    return <CountryDefcon key={country} stateName={country as keyof Defcon} status={status} triggerUpdate={triggerUpdate}/>
                })
            }
        </ul>
    </div>
}


export default class ControlApp extends BaseApp {
    protected mainComponents(apiResponse: ApiResponse): JSX.Element {
        const triggerFetch = () => this.fetchFromAPI();
        const pauseRefresh = (pause: boolean) => this.pauseRefresh(pause);
        const setResponse = (response: ApiResponse) => this.setState({apiResponse: response})
        const setErrorMessage = (msg: string | undefined) => this.setState({errorMessage: msg})

        return (
            <React.Fragment>
                <div className="flex w-full p-4 justify-around">
                    <BackATurn pauseRefresh={pauseRefresh} apiResponse={apiResponse} triggerFetch={triggerFetch}
                               setResponse={setResponse} setErrorMessage={setErrorMessage}/>
                    <BackAPhase pauseRefresh={pauseRefresh} apiResponse={apiResponse} triggerFetch={triggerFetch}
                                setResponse={setResponse} setErrorMessage={setErrorMessage}/>
                    <PlayButton pauseRefresh={pauseRefresh} apiResponse={apiResponse} triggerFetch={triggerFetch}
                                setResponse={setResponse} setErrorMessage={setErrorMessage}/>
                    <PauseButton pauseRefresh={pauseRefresh} apiResponse={apiResponse} triggerFetch={triggerFetch}
                                 setResponse={setResponse} setErrorMessage={setErrorMessage}/>
                    <ForwardPhase pauseRefresh={pauseRefresh} apiResponse={apiResponse} triggerFetch={triggerFetch}
                                  setResponse={setResponse} setErrorMessage={setErrorMessage}/>
                    <ForwardTurn pauseRefresh={pauseRefresh} apiResponse={apiResponse} triggerFetch={triggerFetch}
                                 setResponse={setResponse} setErrorMessage={setErrorMessage}/>
                </div>
                <ControlDefconStatus defcon={apiResponse.defcon} triggerFetch={triggerFetch} pauseRefresh={pauseRefresh}
                                     apiResponse={apiResponse} setResponse={setResponse}
                                     setErrorMessage={setErrorMessage}/>
            </React.Fragment>
        );
    }

    protected title(): string {
        return "Control commands";
    }

    protected childComponents(apiResponse: ApiResponse): JSX.Element {
        if (this.state.errorMessage !== undefined) {
            return <div className="bg-red-600 text-white mt-4 p-4">
                <p>
                    There was an issue running the Control command - wait and try again. If it persists, grab Paddy.
                </p>
                <p>Message was: <code className="bg-black px-2">{this.state.errorMessage}</code></p>
            </div>
        }

        return <React.Fragment/>
    }
}
