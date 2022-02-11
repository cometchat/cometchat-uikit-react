import React from "react";
import PropTypes from "prop-types";

import { CometChatAvatar, CometChatMessageReceipt, CometChatDate, localize } from "../../../";
import { CometChatMessageHover } from "../../";
import { CometChatPollOptionBubble, CometChatMessageReactions } from "../";

import { 
	CometChatMessageReceiverType,
	messageAlignment, 
	messageTimeAlignment, 
} from "../../";

import { messageHoverStyling } from "../../CometChatMessageConstants";

import { Hooks } from "./hooks";

import {
	messageHoverStyle,
	messageActionsStyle,
	messageGutterStyle,
	messageLeftGutterStyle,
	messageRightGutterStyle,
	messageKitBlockStyle,
	messageBlockStyle,
	messageAvatarStyle,
	messageSenderStyle,
	messageKitReceiptStyle,
	messageTimestampStyle,
	pollQuestionStyle,
	pollAnswerStyle,
	voteCountStyle,
	voteCountTextStyle,
	messageReplyReceiptStyle,
} from "./style";

/**
 * 
 * CometChatPollBubble is UI component for poll message bubble.
 * 
 * @version 1.0.0
 * @author CometChatTeam
 * @copyright © 2022 CometChat Inc.
 * 
 */
const CometChatPollBubble = props => {

    const [name, setName] = React.useState(null);
    const [avatar, setAvatar] = React.useState(null);
    const [question, setQuestion] = React.useState(null);
    const [options, setOptions] = React.useState({});
    const [voteCount, setVoteCount] = React.useState(0);
	const [isHovering, setIsHovering] = React.useState(false);

    let senderAvatar,
        senderName,
        leftView,
        rightView,
        usernameStyle,
        receiptStyle,
        messageTime,
        pollsMessage = null;

    const timeFont = "500 11px Inter, sans-serif";
    const timeColor = "rgba(20, 20, 20, 40%)";
    const timeFormat = "MESSAGE_BUBBLE";

    const messageReplies = null;//<CometChatThreadedMessageReplyCount messageObject={props.messageObject} textFont="500 11px Inter, sans-serif" textColor="#39f" />;
    const messageReactions = <CometChatMessageReactions messageObject={props.messageObject} loggedInUser={props.loggedInUser} />;

	const showMessageOptions = () => {
		if (!isHovering) {
			setIsHovering(true);
		}
	};

	const hideMessageOptions = () => {
		if (isHovering) {
			setIsHovering(false);
		}
	};

    const getAvatar = () => {
        if (!avatar) {
            return null;
        }

		const getAvatarTemplate = () => {
			if (props.avatar && props.avatar.length) {
				return <CometChatAvatar image={avatar} />;
			} else if (props.messageObject && props.messageObject.sender) {
				return <CometChatAvatar user={avatar} />;
			}
		};

        return (
            <div style={messageAvatarStyle()} className="message_kit__avatar">
                {getAvatarTemplate()}
            </div>
        );
    };

    const getSenderName = () => {
        if (!name) {
            return null;
        }

        return (
            <span style={messageSenderStyle(props)} className="message_kit__sender">
                {name}
            </span>
        );
    };

    const getPollOptions = () => {

        const optionsTemplate = [];
        Object.entries(options).forEach(([optionKey, option]) => {
            optionsTemplate.push(
                <CometChatPollOptionBubble
                key={option.text}
                pollOption={option}
                voteCount={voteCount}
                pollOptionsFont={props.pollOptionsFont}
                pollOptionsColor={props.pollOptionsColor}
                pollOptionsBackgroundColor={props.pollOptionsBackgroundColor}
                loggedInUser={props.loggedInUser} />
            );
        });

        return optionsTemplate;
    }

    const getPollsMessage = () => {

        let voteCountText = localize("NO_VOTE");
		if (voteCount === 1) {
			voteCountText = `${voteCount} ${localize("VOTE")}`;
		} else if (voteCount > 1) {
			voteCountText = `${voteCount} ${localize("VOTES")}`;
		}

        return (
            <div style={messageKitBlockStyle(props)} className="message_kit__blocks">
                <div style={messageBlockStyle(props)} className="message__message-blocks">
                    <p style={pollQuestionStyle(props)} className="message__message-pollquestion">{question}</p>
                </div>
                <ul style={pollAnswerStyle()} className="message__message-polloptions">
                    {getPollOptions()}
                </ul>
                <div style={voteCountStyle(props)} className="message__message-votecount">
                    <p style={voteCountTextStyle(props)}>{voteCountText}</p>
                </div>
            </div>
        );
    }

    senderAvatar = getAvatar();
    senderName = getSenderName();
    pollsMessage = getPollsMessage();
    messageTime = props.messageObject._composedAt || props.messageObject.sentAt;

    if (props.messageAlignment === messageAlignment.leftAligned) {
			if (props.messageTimeAlignment.toLowerCase() === messageTimeAlignment.top) {
				usernameStyle = (
					<div style={messageTimestampStyle(props)} className="message_kit__username_bar">
						{senderName}&nbsp;
						<CometChatDate timeStamp={messageTime} timeFormat="hh:mm am/pm" />
					</div>
				);

				receiptStyle =
					(props.loggedInUser?.uid === props.messageObject.getSender().getUid()) ? (
						<div style={messageKitReceiptStyle(props)} className="message_kit__receipt_bar">
							<CometChatMessageReceipt messageObject={props.messageObject} loggedInUser={props.loggedInUser} />
						</div>
					) : null;
			} else {
				usernameStyle = (
					<div style={messageTimestampStyle(props)} className="message_kit__username_bar">
						{senderName}
					</div>
				);

				const messageReceipt = (props.loggedInUser?.uid === props.messageObject.getSender().getUid()) ? (
                <CometChatMessageReceipt messageObject={props.messageObject} loggedInUser={props.loggedInUser} />) : null;

				receiptStyle = (
					<div style={messageKitReceiptStyle(props)} className="message_kit__receipt_bar">
						{messageReceipt}
						<CometChatDate timeStamp={messageTime} timeFormat="hh:mm am/pm" />
					</div>
				);
			}

			leftView = senderAvatar ? (
				<div style={messageLeftGutterStyle(props)} className="message_kit__gutter__left">
					{senderAvatar}
				</div>
			) : null;

			rightView = (
				<div style={messageRightGutterStyle()} className="message_kit__gutter__right">
					{usernameStyle}
					{pollsMessage}
					{messageReactions}
					<div style={messageReplyReceiptStyle(props)} className="message_kit__reply__receipt_bar">
						{messageReplies}
						{receiptStyle}
					</div>
				</div>
			);
		} else {

			//if the message sender is not same as logged in user i.e. message receiver
			if (props.loggedInUser?.uid !== props.messageObject.getSender().getUid()) {
				leftView =
					props.messageObject?.receiverType === CometChatMessageReceiverType.group && senderAvatar ? (
						<div style={messageLeftGutterStyle(props)} className="message_kit__gutter__left">
							{senderAvatar}
						</div>
					) : null;

				if (props.messageTimeAlignment.toLowerCase() === messageTimeAlignment.top) {
					/**
					 * Not showing the message sender name in 1-1 conversation
					 */
					if (props.messageObject?.receiverType !== CometChatMessageReceiverType.group) {
						senderName = null;
					}
					usernameStyle = (
						<div style={messageTimestampStyle(props)} className="message_kit__username_bar">
							{senderName}&nbsp;
							<CometChatDate timeStamp={messageTime} timeFormat="hh:mm am/pm" />
						</div>
					);
					receiptStyle = null;
				} else {
					usernameStyle = props.messageObject.receiverType === CometChatMessageReceiverType.group ? (
						<div style={messageTimestampStyle(props)} className="message_kit__username_bar">
							{senderName}
						</div>
					) : null;
					receiptStyle = (
						<div style={messageKitReceiptStyle(props)} className="message_kit__receipt_bar">
							<CometChatDate timeStamp={messageTime} timeFormat="hh:mm am/pm" />
						</div>
					);
				}

				rightView = (
					<div style={messageRightGutterStyle()} className="message_kit__gutter__right">
						{usernameStyle}
						{pollsMessage}
						{messageReactions}
						{/* <div style={messageReplyReceiptStyle(props)} className="message_kit__reply__receipt_bar"> */}
						{receiptStyle}
						{messageReplies}
						{/* </div> */}
					</div>
				);
			} else {
				if (props.messageTimeAlignment.toLowerCase() === messageTimeAlignment.top) {
					usernameStyle = (
						<div style={messageTimestampStyle(props)} className="message_kit__username_bar">
							<CometChatDate timeStamp={messageTime} timeFormat="hh:mm am/pm" />
						</div>
					);

					receiptStyle = (
						<div style={messageKitReceiptStyle(props)} className="message_kit__receipt_bar">
							<CometChatMessageReceipt messageObject={props.messageObject} loggedInUser={props.loggedInUser} />
						</div>
					);
				} else {
					usernameStyle = null;
					receiptStyle = (
						<div style={messageKitReceiptStyle(props)} className="message_kit__receipt_bar">
							<CometChatDate timeStamp={messageTime} timeFormat="hh:mm am/pm" />
							<CometChatMessageReceipt messageObject={props.messageObject} loggedInUser={props.loggedInUser} />
						</div>
					);
				}

				leftView = (
					<div style={messageLeftGutterStyle(props)} className="message_kit__gutter__left">
						{usernameStyle}
						{pollsMessage}
						{messageReactions}
						{/* <div style={messageReplyReceiptStyle(props)} className="message_kit__reply__receipt_bar"> */}
							{messageReplies}
							{receiptStyle}
						{/* </div> */}
					</div>
				);

				rightView = null;
			}
		}

	Hooks(props, setName, setAvatar, setQuestion, setOptions, setVoteCount);

	const messageOptions = isHovering ? <CometChatMessageHover options={props.messageOptions} style={messageHoverStyling(props)} /> : null;

    return (
        <div style={messageHoverStyle(props)} className="message_kit__hover" onMouseEnter={showMessageOptions} onMouseLeave={hideMessageOptions}>
            <div style={messageActionsStyle()} className="message_kit__actions">
				{messageOptions}
                <div style={messageGutterStyle(props)} className="c-message_kit__gutter">
                    {leftView}
                    {rightView}
                </div>
            </div>
        </div>
    )
};

CometChatPollBubble.defaultProps = {
	width: "100%",
	height: "auto",
	border: "0 none",
	cornerRadius: "12px",
	backgroundColor: "",
	avatar: null,
	userName: null,
	usernameFont: "600 13px Inter",
	usernameColor: "#39f",
	messageAlignment: "standard",
	messageTimeAlignment: "bottom",
	messageObject: null,
	pollQuestion: "",
	pollQuestionFont: "400 15px Inter,sans-serif",
	pollQuestionColor: "#fff",
	pollOptions: {},
	pollOptionsFont: "400 15px Inter,sans-serif",
	pollOptionsColor: "#39f",
	pollOptionsBackgroundColor: "#fff",
	voteCount: 0,
	voteCountFont: "400 13px Inter,sans-serif",
	voteCountColor: "#fff",
	loggedInUser: null,
	messageOptions: []
};

CometChatPollBubble.propTypes = {
	width: PropTypes.string,
	height: PropTypes.string,
	border: PropTypes.string,
	cornerRadius: PropTypes.string,
	backgroundColor: PropTypes.string,
	pollQuestion: PropTypes.string,
	pollQuestionFont: PropTypes.string,
	pollQuestionColor: PropTypes.string,
	pollOptions: PropTypes.object,
	pollOptionsFont: PropTypes.string,
	pollOptionsColor: PropTypes.string,
	pollOptionsBackgroundColor: PropTypes.string,
	voteCount: PropTypes.number,
	voteCountFont: PropTypes.string,
	voteCountColor: PropTypes.string,
	avatar: PropTypes.string,
	userName: PropTypes.string,
	usernameFont: PropTypes.string,
	usernameColor: PropTypes.string,
	messageAlignment: PropTypes.oneOf(["standard", "leftAligned"]),
	messageTimeAlignment: PropTypes.oneOf(["top", "bottom"]),
	messageObject: PropTypes.object,
	loggedInUser: PropTypes.object,
	language: PropTypes.string,
	messageOptions: PropTypes.array
};

export { CometChatPollBubble };
