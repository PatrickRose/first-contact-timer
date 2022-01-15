import React, { ChangeEvent, FormEvent } from 'react';
import {SetBreakingNews} from "../types/types";
import BaseApp from "../components/BasePage";


type FormState = {
    breakingNews: string,
    isSubmitting: boolean
}

type FormProps = {
    triggerFetch: () => void
}

class PressForm extends React.Component<FormProps, FormState> {
    constructor(props: FormProps) {
        super(props);

        this.state = {
            breakingNews: '',
            isSubmitting: false
        };
    }

    private onChange(event: ChangeEvent<HTMLTextAreaElement>) {
        this.setState({
            breakingNews: event.target.value
        });
    }

    private submitForm(event: FormEvent<HTMLFormElement>) {
        // We handle posting to the api
        event.preventDefault();
        this.setState({ isSubmitting: true });

        const { breakingNews } = this.state;

        const toSend: SetBreakingNews = {
            breakingNews
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
                this.setState({ isSubmitting: false });
            }
        );
        fetchPromise.then(
            (response) => {
                if (response.ok) {
                    const { triggerFetch } = this.props;
                    this.setState({ breakingNews: '' });
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
        const id = 'breaking-news';
        const { breakingNews, isSubmitting } = this.state;

        const buttonMsg = isSubmitting
            ? 'Submitting, please wait...'
            : 'Submit breaking news';

        return (
            <form onSubmit={e => this.submitForm(e)} className="container">
                <div className="form-group">
                    <label id="breaking-news" htmlFor={id}>
                        Enter breaking news here
                    </label>
                    <textarea
                        name={id}
                        className="form-control"
                        value={breakingNews}
                        onChange={e => this.onChange(e)}
                        rows={4}
                        maxLength={150}
                    />
                </div>
                <button
                    className="btn btn-primary"
                    type="submit"
                    disabled={isSubmitting}
                >
                    {buttonMsg}
                </button>
            </form>
        );
    }
}


export default class PressApp extends BaseApp {
    // eslint-disable-next-line class-methods-use-this
    protected mainComponents(): JSX.Element {
        return (
            <PressForm triggerFetch={() => this.fetchFromAPI()} />
        );
    }
}
