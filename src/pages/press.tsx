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
            <div className="container">
                <div className="flex flex-col">
                    <form onSubmit={(e) => this.submitForm(e)} className="mt-2">
                        <hr />
                        <label id="breaking-news-label" htmlFor="breaking-news">
                            Enter breaking news headline here:
                        </label>
                        <div className="flex">
                            <textarea
                                name="breaking-news"
                                className="form-control flex-1 mx-2"
                                value={breakingNews}
                                onChange={(e) => this.onChange(e)}
                                rows={4}
                                maxLength={150}
                            />
                            <button
                                className="mt-4 text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center mr-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800 disabled:opacity-75 disabled:hover:bg-blue-700"
                                type="submit"
                                disabled={!this.props.active || isSubmitting}
                            >
                                {buttonMsg}
                            </button>
                        </div>
                        <hr />
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
}
