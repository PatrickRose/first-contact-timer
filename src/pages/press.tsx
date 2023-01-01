import React, {ChangeEvent, FormEvent, ReactNode} from 'react';
import {ApiResponse, BreakingNews, BreakingNewsKey, SetBreakingNews} from "../types/types";
import BaseApp from "../components/BasePage";


type FormState = {
    [key in `breakingNews.${BreakingNewsKey}`]: string
} & {
    isSubmitting: boolean
}

type FormProps = {
    currentBreakingNews: BreakingNews,
    triggerFetch: () => void,
    active: boolean
}

class PressForm extends React.Component<FormProps, FormState> {
    constructor(props: FormProps) {
        super(props);

        this.state = {
            "breakingNews.1": '',
            "breakingNews.2": '',
            "breakingNews.3": '',
            isSubmitting: false
        };
    }

    private onChange(event: ChangeEvent<HTMLTextAreaElement>, key: BreakingNewsKey) {
        const newState: { [key in `breakingNews.${BreakingNewsKey}`]?: string } = {};
        newState[`breakingNews.${key}`] = event.target.value;

        this.setState(newState as FormState);
    }

    private submitForm(event: FormEvent<HTMLFormElement>, key: BreakingNewsKey) {
        // We handle posting to the api
        event.preventDefault();
        this.setState({isSubmitting: true});

        const breakingNews = this.state[`breakingNews.${key}`];

        const toSend: SetBreakingNews = {
            breakingNews,
            number: key
        };

        const fetchPromise = fetch(
            '/api/breakingNews',
            {
                method: 'POST',
                body: JSON.stringify(toSend),
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        );
        fetchPromise.finally(
            () => {
                this.setState({isSubmitting: false});
            }
        );
        fetchPromise.then(
            (response) => {
                if (response.ok) {
                    const {triggerFetch} = this.props;
                    const newState: { [key in `breakingNews.${BreakingNewsKey}`]?: '' } = {};
                    newState[`breakingNews.${key}`] = '';

                    this.setState(newState as FormState);
                    triggerFetch();
                } else {
                    response.text().then(
                        text => console.log(text)
                    );
                }
            }
        );
    }

    render() {
        const {isSubmitting} = this.state;
        const {currentBreakingNews} = this.props;

        const buttonMsg = isSubmitting
            ? 'Submitting, please wait...'
            : 'Submit breaking news';

        const keys: BreakingNewsKey[] = [1, 2, 3]

        const outputKey = (key: BreakingNewsKey): ReactNode => {
            if (currentBreakingNews[key] === null) {
                return null;
            }

            return <div className="flex my-2" key={key}>
                <hr/>
                <div className="flex-1 [word-break:break-word] text-left">
                    {currentBreakingNews[key]?.replace('\n\n', '\n')
                        .split('\n').map((i, key) => {
                            return <p key={key}>{i}</p>;
                        })}
                </div>
                <button
                    className="text-white bg-red-700 hover:bg-red-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800 disabled:opacity-75 disabled:hover:bg-red-700"
                    type="button"
                    onClick={() => this.clearBreakingNews(key)}
                    disabled={(!this.props.active) || isSubmitting}
                >
                    Clear breaking news {key}
                </button>
                <hr/>
            </div>
        }

        const outputForm = (key: BreakingNewsKey): ReactNode => {
            const id = `breaking-news${key}`;

            const breakingNews = this.state[`breakingNews.${key}`];

            return <form onSubmit={e => this.submitForm(e, key)} className="mt-2" key={key}>
                <hr/>
                <label id="breaking-news" htmlFor={id}>
                    Enter breaking news headline {key} here:
                </label>
                <div className="flex">
                    <textarea
                        name={id}
                        className="form-control flex-1 mx-2"
                        value={breakingNews}
                        onChange={e => this.onChange(e, key)}
                        rows={4}
                        maxLength={150}
                    />
                    <button
                        className="mt-4 text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center mr-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800 disabled:opacity-75 disabled:hover:bg-blue-700"
                        type="submit"
                        disabled={(!this.props.active) || isSubmitting}
                    >
                        {buttonMsg}
                    </button>
                </div>
                <hr/>
            </form>
        }

        return (
            <div className="container">
                <div className="flex flex-col">
                    {keys.map(key => outputKey(key))}
                </div>
                <div className="flex flex-col">
                    {keys.map(key => outputForm(key))}
                </div>
            </div>
        );
    }

    private clearBreakingNews(key: BreakingNewsKey) {
        this.setState({isSubmitting: true});

        const toSend: SetBreakingNews = {
            breakingNews: "",
            number: key
        };

        fetch(
            '/api/breakingNews',
            {
                method: 'POST',
                body: JSON.stringify(toSend),
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        ).then(
            (response) => {
                if (response.ok) {
                    const {triggerFetch} = this.props;

                    const newState: { [key in `breakingNews.${BreakingNewsKey}`]?: '' } = {};
                    newState[`breakingNews.${key}`] = '';

                    this.setState(newState as FormState);
                    triggerFetch();
                } else {
                    response.text().then(
                        text => console.log(text)
                    );
                }
            }
        ).finally(
            () => {
                this.setState({isSubmitting: false});
            }
        );
    }
}


export default class PressApp extends BaseApp {
    // eslint-disable-next-line class-methods-use-this
    protected mainComponents(apiResponse: ApiResponse): JSX.Element {
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
