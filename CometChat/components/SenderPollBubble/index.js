import React from "react";

/** @jsx jsx */
import { jsx } from '@emotion/core';

import ToolTip from "../ToolTip";
import ReplyCount from "../ReplyCount";
import ReadReciept from "../ReadReciept";

import {
    messageContainerStyle,
    messageWrapperStyle,
    messageTxtWrapperStyle,
    pollQuestionStyle,
    pollAnswerStyle,
    pollTotalStyle,
    pollPercentStyle,
    answerWrapperStyle,
    messageInfoWrapperStyle
} from "./style";

class SenderPollBubble extends React.Component {
    pollId;
    requestInProgress = null;

    constructor(props) {
        
        super(props);
        this.message = Object.assign({}, props.message, { messageFrom: "sender" });
    }

    componentDidMount() {

        this.message = Object.assign({}, this.props.message, { messageFrom: "sender" });
    }

    componentDidUpdate() {
        this.message = Object.assign({}, this.props.message, { messageFrom: "sender" });
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

        return (
            <div css={messageContainerStyle()} className="sender__message__container message__poll">
                <ToolTip {...this.props} message={this.message} />    
                <div css={messageWrapperStyle()} className="message__wrapper">
                    <div css={messageTxtWrapperStyle(this.props)} className="message__poll__wrapper">
                        <p css={pollQuestionStyle()} className="poll__question">{pollExtensionData.question}</p>
                        <ul css={pollAnswerStyle(this.props)} className="poll__options">
                            {pollOptions}
                        </ul>
                        <p css={pollTotalStyle()} className="poll__votes">{totalText}</p>
                    </div>
                </div>
                <div css={messageInfoWrapperStyle()} className="message__info__wrapper">
                    <ReplyCount theme={this.props.theme} {...this.props} message={this.message} />
                    <ReadReciept theme={this.props.theme} {...this.props} />
                </div>
            </div>
        );
    }
}

export default SenderPollBubble;