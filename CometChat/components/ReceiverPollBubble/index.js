import React from "react";

/** @jsx jsx */
import { jsx } from '@emotion/core';

import { CometChat } from "@cometchat-pro/chat";

import Avatar from "../Avatar";
import { SvgAvatar } from '../../util/svgavatar';

import {
    messageContainerStyle,
    messageWrapperStyle,
    messageThumbnailStyle,
    messageDetailStyle,
    nameWrapperStyle,
    nameStyle,
    messageTxtWrapperStyle,
    pollQuestionStyle,
    pollAnswerStyle,
    pollPercentStyle,
    answerWrapperStyle,
    pollTotalStyle,
    messageInfoWrapperStyle,
    messageTimestampStyle
} from "./style";

import checkIcon from "./resources/check.svg";

class ReceiverPollBubble extends React.Component {

    pollId;
    requestInProgress = null;

    answerPollQuestion = (event, selectedOption) => {

        CometChat.callExtension('polls', 'POST', 'v1/vote', {
            vote: selectedOption,
            id: this.pollId,
        })
        .then(response => {
            this.props.actionGenerated("pollAnswered", response);
        })
        .catch(error => {
            console.log("answerPollQuestion error", error);
        });
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

        let avatar = null, name = null;
        if (this.props.message.receiverType === 'group') {

            if (!this.props.message.sender.avatar) {

                const uid = this.props.message.sender.getUid();
                const char = this.props.message.sender.getName().charAt(0).toUpperCase();

                this.props.message.sender.setAvatar(SvgAvatar.getAvatar(uid, char));
            }

            avatar = (
                <div css={messageThumbnailStyle}>
                    <Avatar
                    cornerRadius="50%"
                    borderColor={this.props.theme.color.secondary}
                    borderWidth="1px"
                    image={this.props.message.sender.avatar} />
                </div>
            );

            name = (<div css={nameWrapperStyle(avatar)}><span css={nameStyle(this.props)}>{this.props.message.sender.name}</span></div>);
        }

        const pollOptions = [];
        const pollExtensionData = this.props.message.metadata["@injected"]["extensions"]["polls"];
        
        this.pollId = pollExtensionData.id;
        const total = pollExtensionData.results.total;
        const totalText = (total === 1) ? `${total} vote` : `${total} votes`;
        
        for (const option in pollExtensionData.options) {

            const optionData = pollExtensionData.results.options[option];
            const vote = optionData["count"];

            let width = "0%";
            if (total) {

                const fraction = (vote / total);
                width = fraction.toLocaleString("en", { style: 'percent' });
            }

            const template = (
                <li key={option} onClick={(event) => this.answerPollQuestion(event, option)}>
                    <div css={pollPercentStyle(this.props, width)}> </div>
                    <div css={answerWrapperStyle(this.props, optionData, checkIcon)}>
                        <span>{width}</span>
                        <p>{optionData.text}</p>
                    </div>
                </li>
            );
            pollOptions.push(template);
        }

        return (
            <div css={messageContainerStyle()}>
                <div css={messageWrapperStyle()}>
                    {avatar}
                    <div css={messageDetailStyle()}>
                        {name}
                        <div css={messageTxtWrapperStyle(this.props)}>
                            <p css={pollQuestionStyle()}>{pollExtensionData.question}</p>
                            <ul css={pollAnswerStyle(this.props)}>
                                {pollOptions}
                            </ul>
                            <p css={pollTotalStyle()}>{totalText}</p>
                        </div>
                        <div css={messageInfoWrapperStyle()}>
                            <span css={messageTimestampStyle(this.props)}>{new Date(this.props.message.sentAt * 1000).toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true })}</span>
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}

export default ReceiverPollBubble;