/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-expressions */
import React, { useContext, useEffect, useState } from 'react';
import {getLocalizedString} from '../../../resources/CometChatLocalize/cometchat-localize';
import { States } from '../../../Enums/Enums';
import { JSX } from 'react';
interface CometChatSmartRepliesProps {
    getSmartReplies?: () => Promise<string[]>;
    onSuggestionClicked?: (reply: string) => void;
    closeCallback?: () => void;
};

const defaultProps: CometChatSmartRepliesProps = {
    getSmartReplies: undefined,
    onSuggestionClicked: undefined,
    closeCallback: undefined,
};

const CometChatSmartReplies = (props: CometChatSmartRepliesProps) => {
    const {
        getSmartReplies,
        onSuggestionClicked,
        closeCallback,
    } = { ...defaultProps, ...props };

    const [state, setState] = useState<States>(States.loading);
    const [activeView, setActiveView] = useState<JSX.Element | null>(null);

    const errorStateText: string = getLocalizedString("ai_smart_replies_error");
    const titleText: string = getLocalizedString("ai_smart_replies_title");

    useEffect(() => {
        fetchContent();
    }, []);

    function fetchContent() {
        setState(States.loading);
        if (getSmartReplies) {
            getSmartReplies().then(async (response) => {
                if (response && response.length > 0) {
                    setState(States.loaded);
                    setActiveView(await getLoadedView(response));
                } else {
                    setState(States.empty);
                }
            })
            .catch(() => {
                setState(States.error);
            });
        }
    }

    function getStateView(): JSX.Element | null {
        switch (state) {
            case States.loading:
                return getLoadingView();
            case States.error:
                return getErrorView();
            case States.empty:
                return getEmptyView();
            default:
                return null;
        }
    }

    function getLoadingView(): JSX.Element {
        return (
            <div className="cometchat-smart-replies__shimmer-container">
                <div className="cometchat-smart-replies__shimmer-item"></div>
                <div className="cometchat-smart-replies__shimmer-item"></div>
                <div className="cometchat-smart-replies__shimmer-item"></div>
            </div>
        );
    }

    function getErrorView(): JSX.Element {
        return (
            <div className="cometchat-smart-replies__error-view">
                {errorStateText}
            </div>
        );
    }

    function getEmptyView(): JSX.Element {
        return (
            <div className="cometchat-smart-replies__empty-view">
                {getLocalizedString("ai_smart_replies_empty")}
            </div>
        );
    }

    async function getLoadedView(replies: string[]): Promise<JSX.Element> {
        return new Promise((resolve, reject) => {
            try {
                const loadedView = (
                    <div className="cometchat-smart-replies__items-container">
                        {replies.map((reply, index) => (
                            <div key={index} className="cometchat-smart-replies__item" onClick={() => onSuggestionClicked && onSuggestionClicked(reply)}>
                                <button
                                    className="cometchat-smart-replies__item-button"
                                    >
                                    {reply}
                                </button>
                            </div>
                        ))}
                    </div>
                );
                resolve(loadedView);
            } catch (error) {
                reject(error);
            }
        });
    }

    return (
        <div className="cometchat" style={{ width: "100%", height: "100%" }}>
            <div className="cometchat-smart-replies__wrapper">
                <div className="cometchat-smart-replies">
                    <div className="cometchat-smart-replies__header">
                        <div className="cometchat-smart-replies__header-title">
                            {titleText}
                        </div>
                        <button
                            className="cometchat-smart-replies__header-close-button"
                            onClick={() => closeCallback && closeCallback()}
                        />
                    </div>
                    <div className="cometchat-smart-replies__body">
                        {state === States.loaded ? activeView : getStateView()}
                    </div>
                </div>
            </div>
        </div>
    );
};

export { CometChatSmartReplies };