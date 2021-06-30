import React from "react";
/** @jsxRuntime classic */
/** @jsx jsx */
import { jsx } from "@emotion/core";
import PropTypes from "prop-types";
import { CometChat } from "@cometchat-pro/chat";

import { CometChatMessageActions, CometChatThreadedMessageReplyCount, CometChatReadReceipt } from "../../";
import { CometChatMessageReactions } from "../";
import { CometChatAvatar } from "../../../Shared";

import { CometChatContext } from "../../../../util/CometChatContext";
import { checkMessageForExtensionsData } from "../../../../util/common";
import * as enums from "../../../../util/enums.js";

import { theme } from "../../../../resources/theme";
import Translator from "../../../../resources/localization/translator";

import {
    messageContainerStyle,
    messageWrapperStyle,
    messageThumbnailStyle,
    messageDetailStyle,
    nameWrapperStyle,
    nameStyle,
    messageTxtContainerStyle,
    messageTxtWrapperStyle,
    pollQuestionStyle,
    pollAnswerStyle,
    pollPercentStyle,
    answerWrapperStyle,
    checkIconStyle,
    pollTotalStyle,
    messageInfoWrapperStyle,
    messageReactionsWrapperStyle
} from "./style";


import checkImg from "./resources/checkmark.svg";

class CometChatReceiverPollMessageBubble extends React.Component {

    pollId;
    requestInProgress = null;
    messageFrom = "receiver";
    static contextType = CometChatContext;

    constructor(props) {
        super(props);

        const message = Object.assign({}, props.message, { messageFrom: this.messageFrom });
        this.state = {
            message: message,
            isHovering: false
        }
    }

    componentDidUpdate(prevProps) {

        const previousMessageStr = JSON.stringify(prevProps.message);
        const currentMessageStr = JSON.stringify(this.props.message);

        if (previousMessageStr !== currentMessageStr) {

            const message = Object.assign({}, this.props.message, { messageFrom: this.messageFrom });
            this.setState({ message: message });
        }
    }

    answerPollQuestion = (event, selectedOption) => {

        CometChat.callExtension('polls', 'POST', 'v2/vote', {
            vote: selectedOption,
            id: this.pollId,
        })
        .then(response => {

            if (response.hasOwnProperty("success") === false || (response.hasOwnProperty("success") && response["success"] === false)) {
                this.props.actionGenerated(enums.ACTIONS["ERROR"], [], "SOMETHING_WRONG");
            }
        })
        .catch(error => this.props.actionGenerated(enums.ACTIONS["ERROR"], [], "SOMETHING_WRONG"));
    }

    handleMouseHover = () => {
        this.setState(this.toggleHoverState);
    }

    toggleHoverState = (state) => {

        return {
            isHovering: !state.isHovering,
        };
    }

    render() {

        if (!this.state.message.hasOwnProperty("metadata")) {
            return null;
        }
        
        if (!this.state.message.metadata.hasOwnProperty("@injected")) {
            return null;
        }

        if (!this.state.message.metadata["@injected"].hasOwnProperty("extensions")) {
            return null;
        }

        if (!this.state.message.metadata["@injected"]["extensions"].hasOwnProperty("polls")) {
            return null;
        }

        let avatar = null, name = null;
        if (this.state.message.receiverType === CometChat.RECEIVER_TYPE.GROUP) {

            avatar = (
                <div css={messageThumbnailStyle} className="message__thumbnail">
                    <CometChatAvatar user={this.state.message.sender} />
                </div>
            );

            name = (<div css={nameWrapperStyle(avatar)} className="message__name__wrapper">
                <span css={nameStyle(this.context)} className="message__name">{this.state.message.sender.name}</span>
            </div>);
        }

        const pollOptions = [];
        const pollExtensionData = this.state.message.metadata["@injected"]["extensions"]["polls"];
        
        this.pollId = pollExtensionData.id;
        const total = pollExtensionData.results.total;
        let totalText = Translator.translate("NO_VOTE", this.props.lang);
        
        if(total === 1) {
            
            totalText = `${total} ${Translator.translate("VOTE", this.props.lang)}`;

        } else if (total > 1) {

            totalText = `${total} ${Translator.translate("VOTES", this.props.lang)}`;
        }
                
        for (const option in pollExtensionData.options) {

            const optionData = pollExtensionData.results.options[option];
            const vote = optionData["count"];

            let width = "0%";
            if (total) {

                const fraction = (vote / total);
                width = fraction.toLocaleString("en", { style: 'percent' });
            }

            let checkIcon = null;
            if (optionData.hasOwnProperty("voters") && optionData.voters.hasOwnProperty(this.props.loggedInUser.uid)) {
                checkIcon = <i css={checkIconStyle(checkImg, this.context)}></i>; 
            }

            const template = (
                <li key={option} onClick={(event) => this.answerPollQuestion(event, option)}>
                    <div css={pollPercentStyle(this.context, width)}> </div>
                    <div css={answerWrapperStyle(this.props, optionData, this.context)}>
                        {checkIcon}
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
                        <CometChatMessageReactions {...this.props} message={this.state.message} reaction={reactionsData} />
                    </div>
                );
            }
        }

        let toolTipView = null;
        if (this.state.isHovering) {
            toolTipView = (<CometChatMessageActions {...this.props} message={this.state.message} name={name} />);
        }

        return (
            <div 
            css={messageContainerStyle()} 
            className="receiver__message__container message__poll"
            onMouseEnter={this.handleMouseHover}
            onMouseLeave={this.handleMouseHover}>

                <div css={messageWrapperStyle()} className="message__wrapper">
                    {avatar}
                    <div css={messageDetailStyle()} className="message__details">
                        {name}
                        {toolTipView}
                        <div css={messageTxtContainerStyle()} className="message__poll__container">
                            <div css={messageTxtWrapperStyle(this.context)} className="message__poll__wrapper">
                                <p css={pollQuestionStyle()} className="poll__question">{pollExtensionData.question}</p>
                                <ul css={pollAnswerStyle(this.context)} className="poll__options">
                                    {pollOptions}
                                </ul>
                                <p css={pollTotalStyle()} className="poll__votes">{totalText}</p>
                            </div>
                        </div>

                        {messageReactions}

                        <div css={messageInfoWrapperStyle()} className="message__info__wrapper">
                            <CometChatReadReceipt {...this.props} message={this.state.message} />
                            <CometChatThreadedMessageReplyCount {...this.props} message={this.state.message} />
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}

// Specifies the default values for props:
CometChatReceiverPollMessageBubble.defaultProps = {
    lang: Translator.getDefaultLanguage(),
    theme: theme
};

CometChatReceiverPollMessageBubble.propTypes = {
    lang: PropTypes.string,
    theme: PropTypes.object
}

export { CometChatReceiverPollMessageBubble };