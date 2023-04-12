import React, { ChangeEvent, FormEvent } from "react";
import { ApiResponse, BreakingNews, SetBreakingNews } from "../types/types";
import BaseApp from "../components/BasePage";

type FormState = {
    breakingNews: string;
    isSubmitting: boolean;
};

type FormProps = {
    currentBreakingNews: BreakingNews;
    triggerFetch: () => void;
    active: boolean;
};

class PressForm extends React.Component<FormProps, FormState> {
    constructor(props: FormProps) {
        super(props);

        this.state = {
            breakingNews: "",
            isSubmitting: false,
        };
    }

    private onChange(event: ChangeEvent<HTMLTextAreaElement>) {
        this.setState({ breakingNews: event.target.value });
    }

    private submitForm(event: FormEvent<HTMLFormElement>) {
        // We handle posting to the api
        event.preventDefault();
        this.setState({ isSubmitting: true });

        const breakingNews = this.state.breakingNews;

        const toSend: SetBreakingNews = {
            breakingNews,
        };

        const fetchPromise = fetch("/api/breakingNews", {
            method: "POST",
            body: JSON.stringify(toSend),
            headers: {
                "Content-Type": "application/json",
            },
        });
        fetchPromise.finally(() => {
            this.setState({ isSubmitting: false });
        });
        fetchPromise.then((response) => {
            if (response.ok) {
                const { triggerFetch } = this.props;
                this.setState({ breakingNews: "" });
                triggerFetch();
            } else {
                response.text().then((text) => console.log(text));
            }
        });
    }

    render() {
        const { isSubmitting, breakingNews } = this.state;

        const buttonMsg = isSubmitting
            ? "Submitting, please wait..."
            : "Submit breaking news";

        return (
            <div className="container lg:p-4 pb-24 lg:pb-4 lg:bg-gradient-to-b from-turn-counter-past-light to-turn-counter-past-dark">
                <h2 className="text-3xl mt-2 mb-6 uppercase text-center">
                    Press Tools
                </h2>
                <div className="flex flex-col">
                    <form onSubmit={(e) => this.submitForm(e)} className="mt-2">
                        <label
                            id="breaking-news-label"
                            className="pb-4 pt-0 block text-xl text-center"
                            htmlFor="breaking-news"
                        >
                            Enter breaking news headline here:
                        </label>
                        <div className="block">
                            <textarea
                                name="breaking-news"
                                className="form-control w-full ml-0 mr-4 bg-black text-white text-xl"
                                value={breakingNews}
                                onChange={(e) => this.onChange(e)}
                                rows={4}
                                maxLength={150}
                            />
                            <button
                                className="mt-4 text-xl text-white bg-blue-600 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg px-5 py-2.5 text-center mr-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800 disabled:opacity-75 disabled:hover:bg-blue-70"
                                type="submit"
                                disabled={!this.props.active || isSubmitting}
                            >
                                {buttonMsg}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        );
    }
}

export default class PressApp extends BaseApp {
    // eslint-disable-next-line class-methods-use-this
    protected childComponents(apiResponse: ApiResponse): JSX.Element {
        return (
            <PressForm
                currentBreakingNews={apiResponse.breakingNews}
                triggerFetch={() => this.fetchFromAPI()}
                active={apiResponse.active}
            />
        );
    }

    protected title(): string {
        return "Press";
    }

    protected tabTitle(): string {
        return "Press";
    }
}
