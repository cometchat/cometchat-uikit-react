import React, { useContext, useState, useEffect } from "react";
import dateFormat from "dateformat";
/** @jsxRuntime classic */
/** @jsx jsx */
import { jsx } from "@emotion/core";
import PropTypes from "prop-types";
import { CometChat } from "@cometchat-pro/chat";

import { CometChatAvatar } from "../../Shared";

import { CometChatContext } from "../../../util/CometChatContext";

import { theme } from "../../../resources/theme";
import Translator from "../../../resources/localization/translator";

import {
    messageContainerStyle,
    messageWrapperStyle,
    messageTxtWrapperStyle,
    messageTxtStyle,
    messageInfoWrapperStyle,
    messageTimeStampStyle,
    messageThumbnailStyle,
    messageDetailStyle,
    nameWrapperStyle,
    nameStyle
} from "./style";

const CometChatDeleteMessageBubble = (props) => {

    const context = useContext(CometChatContext);

	const [loggedInUser, setLoggedInUser] = useState(null);

	useEffect(() => {
		context.getLoggedinUser().then(user => {
			setLoggedInUser({ ...user });
		});
	}, [context]);

    let message = null;
    const messageDate = (props.message.sentAt * 1000);
    if (props.message?.sender?.uid === loggedInUser?.uid) {

			message = (
				<React.Fragment>
					<div css={messageTxtWrapperStyle(props, context, loggedInUser)} className="message__txt__wrapper">
						<p css={messageTxtStyle(context)} className="message__txt">
							{Translator.translate("YOU_DELETED_THIS_MESSAGE", context.language)}
						</p>
					</div>
					<div css={messageInfoWrapperStyle(props, loggedInUser)} className="message__info__wrapper">
						<span css={messageTimeStampStyle(context)} className="message__timestamp">
							{dateFormat(messageDate, "shortTime")}
						</span>
					</div>
				</React.Fragment>
			);

		} else {

			let avatar = null,
				name = null;
			if (props.message.receiverType === CometChat.RECEIVER_TYPE.GROUP) {
				avatar = (
					<div css={messageThumbnailStyle()} className="message__thumbnail">
						<CometChatAvatar user={props.message.sender} />
					</div>
				);
				name = (
					<div css={nameWrapperStyle(props, loggedInUser)} className="message__name__wrapper">
						<span css={nameStyle(context)} className="message__name">
							{props.message.sender.name}
						</span>
					</div>
				);
			}

			message = (
				<React.Fragment>
					{avatar}
					<div css={messageDetailStyle(props, loggedInUser)} className="message__details">
						{name}
						<div css={messageTxtWrapperStyle(props, context, loggedInUser)} className="message__txt__wrapper">
							<p css={messageTxtStyle(context)} className="message__txt">
								{Translator.translate("THIS_MESSAGE_DELETED", context.language)}
							</p>
						</div>
						<div css={messageInfoWrapperStyle(props, loggedInUser)} className="message__info__wrapper">
							<span css={messageTimeStampStyle(context)} className="message__timestamp">
								{dateFormat(messageDate, "shortTime")}
							</span>
						</div>
					</div>
				</React.Fragment>
			);
		}

    return (
        <div css={messageContainerStyle(props, loggedInUser)} className="message__deleted">
            <div css={messageWrapperStyle(props, loggedInUser)} className="message__wrapper">{message}</div>                            
        </div>
    )
}

// Specifies the default values for props:
CometChatDeleteMessageBubble.defaultProps = {
    theme: theme
};

CometChatDeleteMessageBubble.propTypes = {
	theme: PropTypes.object,
	message: PropTypes.object.isRequired,
};

export { CometChatDeleteMessageBubble };