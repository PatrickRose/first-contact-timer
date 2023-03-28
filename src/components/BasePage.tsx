import { isRight } from "fp-ts/lib/Either";
import { PathReporter } from "io-ts/PathReporter";
import React from "react";
import TurnCounter from "./TurnCounter";
import BreakingNews from "./BreakingNews";
import { ActiveTabs, ApiResponse } from "../types/types";
import { ApiResponseDecode } from "../types/io-ts-def";
import Head from "next/head";
import { NewsFeed } from "./NewsFeed";
import DefconStatuses from "./DefconStatuses";
import TabSwitcher from "./TabSwitcher";
import LogoBlock from "./LogoBlock";

type BaseAppState = {
    fetchFailed: boolean;
    apiResponse?: ApiResponse;
    activeTab: ActiveTabs;
    secondsUntilFetch: number;
    pauseRefresh: boolean;
    errorMessage?: string;
};

const waitForFetch = (
    <div className="container">
        <p className="lead">Fetching app state, please wait...</p>
    </div>
);
const refreshRate = 5;

function tickTimer(apiResponse: ApiResponse): ApiResponse {
    const toReturn = apiResponse;

    toReturn.phaseEnd = Math.max(toReturn.phaseEnd - 1, 0);

    return toReturn;
}

const getNextRefresh = function getNextRefresh(
    body: ApiResponse | undefined,
    maxRefresh = refreshRate
) {
    if (body === undefined) {
        return maxRefresh;
    }

    return Math.min(maxRefresh, body.phaseEnd);
};

export default abstract class BaseApp extends React.Component<
    {},
    BaseAppState
> {
    private timeout: ReturnType<typeof setTimeout> | undefined;
    private audio?: HTMLAudioElement;

    constructor(props: {}) {
        super(props);

        this.state = {
            pauseRefresh: false,
            fetchFailed: false,
            apiResponse: undefined,
            secondsUntilFetch: 0,
            errorMessage: undefined,
            activeTab: "home",
        };

        if (typeof window !== "undefined") {
            this.audio = new Audio("/turn-change.mp3");
        }
    }

    componentDidMount() {
        this.fetchFromAPI();
    }

    componentWillUnmount() {
        if (this.timeout) {
            clearInterval(this.timeout);
        }
    }

    protected pauseRefresh(pause: boolean) {
        this.setState({
            pauseRefresh: pause,
        });
    }

    protected fetchFromAPI() {
        const { pauseRefresh } = this.state;

        if (pauseRefresh) {
            return;
        }

        this.setState({ pauseRefresh: true });
        fetch("/api/status", { cache: "no-store" })
            .then((res: Response): void => {
                res.json()
                    .then((body) => {
                        const result = ApiResponseDecode.decode(body);

                        if (isRight(result)) {
                            const currentResponse = this.state.apiResponse;
                            const newResponse = result.right;
                            if (
                                currentResponse !== undefined &&
                                (currentResponse.phase != newResponse.phase ||
                                    currentResponse.active !=
                                        newResponse.active)
                            ) {
                                this.audio?.play().catch((e) => console.log(e));
                            }

                            this.setState({
                                apiResponse: body,
                                secondsUntilFetch: getNextRefresh(body),
                            });

                            if (this.timeout === undefined) {
                                this.timeout = setInterval(
                                    () => this.refresh(),
                                    1000
                                );
                            }
                        } else {
                            console.error(PathReporter.report(result));
                            this.setState({
                                fetchFailed: true,
                            });
                        }
                    })
                    .catch(() => {
                        const { apiResponse } = this.state;

                        this.setState({
                            secondsUntilFetch: getNextRefresh(apiResponse),
                        });

                        if (this.timeout === undefined) {
                            this.timeout = setInterval(
                                () => this.refresh(),
                                1000
                            );
                        }
                    });
            })
            .finally(() => this.setState({ pauseRefresh: false }));
    }

    private refresh(): void {
        let { secondsUntilFetch, apiResponse } = this.state;
        const { pauseRefresh } = this.state;

        if (apiResponse !== undefined && !pauseRefresh) {
            if (apiResponse.active) {
                apiResponse = tickTimer(apiResponse);
            }
        }

        secondsUntilFetch = getNextRefresh(apiResponse, secondsUntilFetch - 1);

        if (secondsUntilFetch < 0 && !pauseRefresh) {
            this.fetchFromAPI();
        }

        this.setState({
            secondsUntilFetch,
            apiResponse,
        });
    }

    protected childComponents(apiResponse: ApiResponse): JSX.Element {
        return <React.Fragment />;
    }

    protected mainComponents(apiResponse: ApiResponse): JSX.Element {
        return <React.Fragment />;
    }

    render() {
        const { fetchFailed, apiResponse, activeTab } = this.state;

        if (fetchFailed) {
            return <div>Failed to get state, try reloading?</div>;
        }

        if (apiResponse === undefined) {
            return waitForFetch;
        }
        const { phase, turnNumber, phaseEnd, active, breakingNews } =
            apiResponse;

        breakingNews.sort((a, b) => {
            const aDate = a.date;
            const bDate = b.date;

            if (aDate < bDate) {
                return 1;
            }

            if (aDate > bDate) {
                return -1;
            }

            return 0;
        });

        const child = this.childComponents(apiResponse);
        const main = this.mainComponents(apiResponse);

        return (
            <React.Fragment>
                <Head>
                    <title>First Contact - {this.title()}</title>
                </Head>
                <div className="flex flex-row flex-1">
                    <main
                        role="main"
                        className={`${
                                    activeTab != "home" && activeTab != "manage" && activeTab != "press" ? "hidden" : ""
                                } lg:flex container flex-1 text-center h-screen 
                                flex-col 
                                justify-between justify-items-stretch items-center
                                `}
                    >
                        <div>
                            <div 
                                className={`${
                                    activeTab != "home" ? "hidden" : ""
                                } lg:block py-4 lg:p-8 flex flex-col items-center flex-1`}
                            >
                                <TurnCounter
                                    turn={turnNumber}
                                    phase={phase}
                                    timestamp={phaseEnd}
                                    active={active}
                                />
                                {main}
                            </div>
                            <div
                                className={`${
                                    activeTab != "manage" ? "hidden" : ""
                                } lg:block`}
                            >
                                {child}
                            </div>
                            <div
                                className={`${
                                    activeTab != "press" ? "hidden" : ""
                                } lg:hidden`}
                            >
                               <NewsFeed newsItems={apiResponse.breakingNews} />
                            </div>
                        </div>
                        <BreakingNews newsItem={breakingNews[0]} />
                    </main>
                    <div
                        className={`${
                                activeTab != "defcon" ? "hidden" : ""
                            } lg:flex flex-col justify-between border-l-4 border-turn-counter-past-light w-full lg:w-auto`}
                    >
                        <div
                            className={`${
                                activeTab != "defcon" ? "hidden" : ""
                            } lg:block`}
                        >
                            <DefconStatuses defcon={apiResponse.defcon} />
                        </div>

                        <div
                            className="hidden lg:block"
                        >
                            <LogoBlock />
                        </div>
                    </div>
                </div>
                <TabSwitcher
                    activeTab={activeTab}
                    setActiveTab={(newActive: ActiveTabs) =>
                        this.setState({ activeTab: newActive })
                    }
                />

            </React.Fragment>
        );
    }

    protected abstract title(): string;
}
