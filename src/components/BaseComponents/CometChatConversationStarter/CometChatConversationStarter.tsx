import  {useEffect, useState } from 'react';
import { States } from '../../../Enums/Enums';
import {getLocalizedString} from '../../../resources/CometChatLocalize/cometchat-localize';
import { JSX } from 'react';
interface CometChatConversationStarterProps {
    getConversationStarters?: () => Promise<string[]>
    onSuggestionClicked?: (reply: string) => void
};

const defaultProps: CometChatConversationStarterProps = {
    getConversationStarters: undefined,
    onSuggestionClicked: undefined
}

const CometChatConversationStarter = (props: CometChatConversationStarterProps) => {
    const {
        getConversationStarters,
        onSuggestionClicked    } = { ...defaultProps, ...props };

    const [state, seState] = useState<States>(States.loading);
    const [activeView, setActiveView] = useState<JSX.Element | null>(null);
    const errorStateText: string = getLocalizedString("ai_conversation_starter_error")
    useEffect(() => {
        fetchContent();
    }, []);

    function fetchContent() {
        seState(States.loading);
        if (getConversationStarters) {
            getConversationStarters().then(async (response) => {
                if (response) {
                    seState(States.loaded);
                    setActiveView(await getLoadedView(response));
                } else {
                    seState(States.empty);
                }
            })
                .catch((err) => {
                    seState(States.error);
                })
        }
    }

    /**
     * Create a view based on the value of the `state` prop.
     */
    function getStateView(): JSX.Element | null {
        let res: JSX.Element | null = null;
        switch (state) {
            case States.loading:
                res = getLoadingView();
                break;
            case States.error:
                res = getErrorView();
                break;
            case States.empty:
                res = getEmptyView();
                break;
            case States.loaded:
                break;
            default:
                const x: never = state;
        }
        return res;
    }

    /**
     * Creates the loading view
     */
    function getLoadingView(): JSX.Element {
        const shimmerView = (
            <div className="cometchat-conversation-starter__shimmer-container">
                <div className="cometchat-conversation-starter__shimmer-item"></div>
                <div className="cometchat-conversation-starter__shimmer-item"></div>
                <div className="cometchat-conversation-starter__shimmer-item"></div>
            </div>
        );
        return shimmerView
    }

   /**
   * Creates the error view
   */
    function getErrorView(): JSX.Element | null {
        return (
            <div className="cometchat-conversation-starter__error-view">
                {errorStateText}
            </div>
        );
    }

    /**
     * Creates the empty view
     */
    function getEmptyView(): JSX.Element {

        return <></>
    }

    /**
     * Creates the loaded view
     */
    async function getLoadedView(suggestions: string[]): Promise<JSX.Element> {
        return new Promise((resolve, reject) => {
            try {
                let suggestionView = (<>
                    {suggestions && suggestions.map((reply, index) => (
                        <div key={reply} className="cometchat-conversation-starter__item">
                            <button
                                className="cometchat-conversation-starter__item-button"
                                onClick={() => onSuggestionClicked && onSuggestionClicked(reply)} >{reply}</button>
                        </div>
                    ))}
                </>)
                return resolve(suggestionView);
            } catch (e) {
                reject(e);
            }
        })
    }

    return (
        <div className="cometchat" style={{ width: "100%", height: "100%" }}>
            <div className="cometchat-conversation-starter">
                {state === States.loaded ? activeView : getStateView()}
            </div>
        </div>
    );
};

export { CometChatConversationStarter };
