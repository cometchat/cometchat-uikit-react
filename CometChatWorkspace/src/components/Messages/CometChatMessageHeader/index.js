import React from "react";
import PropTypes from "prop-types";
import { CometChat } from "@cometchat-pro/chat";

import { CometChatAvatar, CometChatStatusIndicator, localize } from "../../";
import { CometChatMessageReceiverType } from "../";


import { MessageHeaderManager } from "./controller";
import { Hooks } from "./hooks";

import {
    chatHeaderStyle,
    chatDetailStyle,
    chatThumbnailStyle,
    chatUserStyle,
    chatNameStyle,
    chatStatusStyle
} from "./style";

const CometChatMessageHeader = props => {

    const [setLoggedInUser] = React.useState(null);
    const [chatWith, setChatWith] = React.useState(null);
    const [chatWithType, setChatWithType] = React.useState(null);

    const [messageHeaderManager] = React.useState(new MessageHeaderManager());
    const [callbackData, setCallbackData] = React.useState(null);
    const [messageHeaderStatus, setMessageHeaderStatus] = React.useState("");
    const [userPresence, setUserPresence] = React.useState("offline");
    const [typingText, setTypingText] = React.useState(null);

    const showTooltip = event => {

        const elem = event.target;
		const scrollWidth = elem.scrollWidth;
		const clientWidth = elem.clientWidth;

		if (scrollWidth <= clientWidth) {
			return false;
		}

        elem.setAttribute("title", elem.textContent);
    }

    const hideTooltip = event => {

        const elem = event.target;
		const scrollWidth = elem.scrollWidth;
		const clientWidth = elem.clientWidth;

		if (scrollWidth <= clientWidth) {
			return false;
		}

		elem.removeAttribute("title");
    }

    const messageHeaderCallback = (listenerName, ...args) => {
        setCallbackData({ name: listenerName, args: [...args] });
    };

    /**
	 *
	 * When a user goes online/ offline
	 */
    const handleUsers = user => {

        if (chatWithType === CometChatMessageReceiverType.user && chatWith?.uid === user.uid) {
					
            if (user.status === CometChat.USER_STATUS.OFFLINE) {
                setMessageHeaderStatus(localize("OFFLINE"));
                setUserPresence(user.status);
            } else if (user.status === CometChat.USER_STATUS.ONLINE) {
                setMessageHeaderStatus(localize("ONLINE"));
                setUserPresence(user.status);
            }
        }
    }

    const handleGroups = group => {

        if (chatWithType === CometChatMessageReceiverType.group && chatWith?.guid === group.guid) {

            const membersCount = parseInt(group.membersCount);
            const status = `${membersCount} ${localize("MEMBERS")}`;
            setMessageHeaderStatus(status);
        }
    }

    const handleStartTyping = userOrGroup => {

        if (chatWithType === CometChatMessageReceiverType.group && chatWithType === userOrGroup.receiverType && chatWith?.guid === userOrGroup.receiverId) {
			const typingText = `${userOrGroup.sender.name} ${localize("IS_TYPING")}`;
			setTypingText(typingText);
		} else if (chatWithType === CometChatMessageReceiverType.user && chatWithType === userOrGroup.receiverType && chatWith?.uid === userOrGroup.sender.uid) {
			const typingText = localize("TYPING");
			setTypingText(typingText);
		}
    };

    const handleEndTyping = userOrGroup => {

        if (chatWithType === CometChatMessageReceiverType.group && chatWithType === userOrGroup.receiverType && chatWith?.guid === userOrGroup.receiverId) {

		    const status = `${chatWith?.membersCount} ${localize("MEMBERS")}`;
		    setMessageHeaderStatus(status);
            setTypingText(null);

        } else if (chatWithType === CometChatMessageReceiverType.user && chatWithType === userOrGroup.receiverType && chatWith?.uid === userOrGroup.sender.uid) {

            if (userPresence === CometChat.USER_STATUS.ONLINE) {
                setMessageHeaderStatus(localize("ONLINE"));
                setUserPresence(CometChat.USER_STATUS.ONLINE);
                setTypingText(null);
            } else {
                setMessageHeaderStatus(localize("OFFLINE"));
                setUserPresence(CometChat.USER_STATUS.OFFLINE);
                setTypingText(null);
            }
        }
    }
    
    const handlers = {
		onUserOnline: handleUsers,
		onUserOffline: handleUsers,
		onMemberAddedToGroup: handleGroups,
		onGroupMemberJoined: handleGroups,
		onGroupMemberKicked: handleGroups,
		onGroupMemberLeft: handleGroups,
		onGroupMemberBanned: handleGroups,
		onTypingStarted: handleStartTyping,
		onTypingEnded: handleEndTyping,
	};

    Hooks(
        props, 
        setLoggedInUser, 
        setChatWith, 
        setChatWithType, 
        setMessageHeaderStatus,
        setUserPresence,
        messageHeaderManager, 
        messageHeaderCallback, 
        handlers, 
        callbackData
    );

    let chatStatusClassName = chatWithType === CometChatMessageReceiverType.user ? "user__status" : "group__members";
    let chatWithClassName = chatWithType === CometChatMessageReceiverType.user ? "chat__user" : "chat__group";
	let chatNameClassName = chatWithType === CometChatMessageReceiverType.user ? "user__name" : "group__name";
        
    const avatar = chatWithType === CometChatMessageReceiverType.user ? <CometChatAvatar user={chatWith} /> : <CometChatAvatar group={chatWith} />;
    const presence = chatWithType === CometChatMessageReceiverType.user ? <CometChatStatusIndicator status={userPresence} /> : null;
    const status = (
        <span style={chatStatusStyle(userPresence, chatWithType, typingText)} className={chatStatusClassName}>
            {messageHeaderStatus}
        </span>
    );
    
    const typing = (typingText) ? (
        <span style={chatStatusStyle(userPresence, chatWithType, typingText)} className={chatStatusClassName}>
            {typingText}
        </span>
    ) : null;

    return (
        <div style={chatHeaderStyle(props)} className="chat__header">
            <div style={chatDetailStyle()} className="chat__details">
                <div style={chatThumbnailStyle()} className="chat__thumbnail">
                    {avatar}
                    {presence}
                </div>
                <div style={chatUserStyle()} className={chatWithClassName}>
                    <h6 style={chatNameStyle()} className={chatNameClassName} onMouseEnter={showTooltip} onMouseLeave={hideTooltip}>
                        {chatWith?.name}
                    </h6>
                    {typing ? typing : status}
                </div>
            </div>
        </div>
    );
}

CometChatMessageHeader.defaultProps = {
	user: null,
	group: null,
    background: "white",
	border: "1px solid rgb(234, 234, 234)",
};

CometChatMessageHeader.propTypes = {
	user: PropTypes.object,
	group: PropTypes.object,
    background: PropTypes.string,
	border: PropTypes.string,
};

export { CometChatMessageHeader };