import React from "react";

/** @jsx jsx */
import { jsx } from '@emotion/core';

import { checkMessageForExtensionsData } from "../../util/common";

import ToolTip from "../ToolTip";
import ReplyCount from "../ReplyCount";
import ReadReciept from "../ReadReciept";
import RegularReactionView from "../RegularReactionView";

import {
    messageContainerStyle,
    messageWrapperStyle,
    messageTxtWrapperStyle,
    pollQuestionStyle,
    pollAnswerStyle,
    pollTotalStyle,
    pollPercentStyle,
    answerWrapperStyle,
    messageInfoWrapperStyle,
    messageReactionsWrapperStyle,
} from "./style";

class SenderPollBubble extends React.Component {
    pollId;
    requestInProgress = null;
    messageFrom = "sender";

    constructor(props) {
        
        super(props);
        const message = Object.assign({}, props.message, { messageFrom: this.messageFrom });

        this.state = {
            message: message
        }
    }

    componentDidUpdate(prevProps) {

        const previousMessageStr = JSON.stringify(prevProps.message);
        const currentMessageStr = JSON.stringify(this.props.message);

        if (previousMessageStr !== currentMessageStr) {

            const message = Object.assign({}, this.props.message, { messageFrom: this.messageFrom });
            this.setState({ message: message })
        }
    }

    render() {

        if (!this.props.message.hasOwnProperty("metadata")) {
            return null;
        }
        
        if (!this.props.message.metadata.hasOwnProperty("@injected")) {
            return null;
        }

        if (!this.props.message.metadata["@injected"].hasOwnProperty("extensions")) {
            return null;
        }

        if (!this.props.message.metadata["@injected"]["extensions"].hasOwnProperty("polls")) {
            return null;
        }

        const pollOptions = [];
        const pollExtensionData = this.props.message.metadata["@injected"]["extensions"]["polls"]; 

        this.pollId = pollExtensionData.id;
        const total = pollExtensionData.results.total;
        const totalText = (total === 1) ? `${total} vote` : `${total} votes`;

        for (const option in pollExtensionData.results.options) {

            const optionData = pollExtensionData.results.options[option];
            const vote = optionData["count"];

            let width = "0%";
            if(total) {

                const fraction = (vote / total);
                width = fraction.toLocaleString("en", { style: 'percent' }); 
            }

            const template = (
                <li key={option}>
                    <div css={pollPercentStyle(this.props, width)}> </div>
                    <div css={answerWrapperStyle(this.props, width)}>
                        <span>{width}</span>
                        <p>{optionData.text}</p>
                    </div>
                </li>
            );
            pollOptions.push(template);
        }

        let messageReactions = null;
        const reactionsData = checkMessageForExtensionsData(this.state.message, "reactions");
        if (reactionsData) {

            if (Object.keys(reactionsData).length) {
                messageReactions = (
                    <div css={messageReactionsWrapperStyle()} className="message__reaction__wrapper">
                        <RegularReactionView
                        theme={this.props.theme}
                        message={this.state.message}
                        reaction={reactionsData}
                        loggedInUser={this.props.loggedInUser}
                        widgetsettings={this.props.widgetsettings}
                        actionGenerated={this.props.actionGenerated} />
                    </div>
                );
            }
        }

        return (
            <div css={messageContainerStyle()} className="sender__message__container message__poll">
                
                <ToolTip {...this.props} message={this.state.message} />
                    
                <div css={messageWrapperStyle()} className="message__wrapper">
                    <div css={messageTxtWrapperStyle(this.props)} className="message__poll__wrapper">
                        <p css={pollQuestionStyle()} className="poll__question">{pollExtensionData.question}</p>
                        <ul css={pollAnswerStyle(this.props)} className="poll__options">
                            {pollOptions}
                        </ul>
                        <p css={pollTotalStyle()} className="poll__votes">{totalText}</p>
                    </div>
                </div>

                {messageReactions}

                <div css={messageInfoWrapperStyle()} className="message__info__wrapper">
                    <ReplyCount {...this.props} message={this.state.message} />
                    <ReadReciept {...this.props} message={this.state.message} />
                </div>
            </div>
        );
    }
}

export default SenderPollBubble;