/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-expressions */
import React, { useContext, useEffect, useState } from 'react';
import {getLocalizedString} from '../../../resources/CometChatLocalize/cometchat-localize';
import { States } from '../../../Enums/Enums';
import { JSX } from 'react';
interface CometChatConversationSummaryProps {
    getConversationSummary?: () => Promise<string>
    closeCallback?: () => void
};

const defaultProps: CometChatConversationSummaryProps = {
    getConversationSummary: undefined,
    closeCallback: undefined,
}


const CometChatConversationSummary = (props: CometChatConversationSummaryProps) => {
    const {
        getConversationSummary,
        closeCallback,
    } = { ...defaultProps, ...props };

    const [messageListState, setMessageListState] = useState<States>(States.loading);
    const [activeView, setActiveView] = useState<JSX.Element | null>(null);


    const errorStateText: string = getLocalizedString("ai_conversation_summary_error");
    const emptyStateText: string = getLocalizedString("ai_conversation_summary_empty");
    const titleText: string = getLocalizedString("ai_conversation_summary_title");

    useEffect(() => {
        fetchButtonContent();
    }, []);

    function fetchButtonContent() {
        setMessageListState(States.loading);
        if (getConversationSummary) {
            getConversationSummary().then(async (response) => {
                if (response) {
                    setMessageListState(States.loaded);
                    setActiveView(await getLoadedView(response));
                } else {
                    setMessageListState(States.empty);
                }
            })
                .catch((err) => {
                    setMessageListState(States.error);
                })
        }
    }

    /**
     * Create a view based on the value of the `state` prop.
     */
    function getStateView(): JSX.Element | null {
        let res: JSX.Element | null = null;
        switch (messageListState) {
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
                const x: never = messageListState;
        }
        return res;
    }

    /**
     * Creates the loading view
     */
    function getLoadingView(): JSX.Element {
        const shimmerView = (
            <div className="cometchat-conversation-summary__shimmer">
                <div className="cometchat-conversation-summary__shimmer-item"></div>
                <div className="cometchat-conversation-summary__shimmer-item"></div>
                <div className="cometchat-conversation-summary__shimmer-item"></div>
            </div>
        )
        return shimmerView
    }

    /**
     * Creates the error view
     */
    function getErrorView(): JSX.Element | null {
        return (
            <div className="cometchat-conversation-summary__error-view">
                {errorStateText}
            </div>
        );
    }

    /**
     * Creates the empty view
     */
    function getEmptyView(): JSX.Element {
        return (
            <div className="cometchat-conversation-summary__empty-view">
                {emptyStateText}
            </div>
        );
    }

    /**
     * Creates the loaded view
     */
    async function getLoadedView(conversationSummary: string): Promise<JSX.Element> {
        return new Promise((resolve, reject) => {
            try {
                let conversationSummaryView = <React.Fragment>{conversationSummary}</React.Fragment>
                return resolve(conversationSummaryView);
            } catch (e) {
                reject(e);
            }
        })
    }

    return (
        <div className="cometchat" style={{ width: "100%", height: "100%" }}>
            <div className="cometchat-conversation-summary__wrapper">
                <div className="cometchat-conversation-summary" >
                    <div className="cometchat-conversation-summary__header">
                        <div className="cometchat-conversation-summary__header-title" >
                            {titleText}
                        </div>
                        <button
                            className="cometchat-conversation-summary__header-close-button"
                            onClick={() => closeCallback!()}
                        />
                    </div>
                    <div className="cometchat-conversation-summary__body">
                        {messageListState === States.loaded ? activeView : getStateView()}
                    </div>
                </div>
            </div>
        </div>
    );
};

export { CometChatConversationSummary };
