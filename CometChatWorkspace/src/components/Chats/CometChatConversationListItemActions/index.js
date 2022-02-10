import React from "react";
import PropTypes from "prop-types";
import { CometChat } from "@cometchat-pro/chat";

import { localize } from "../../";
import { CometChatConversationEvents } from "../";

import { actionWrapperStyle, deleteActionStyle } from "./style.js";
import deleteIcon from "./resources/delete.svg";

/**
 *
 * CometChatConversationListItemActions is a container for actions available for each conversation.
 *
 * @version 1.0.0
 * @author CometChatTeam
 * @copyright © 2022 CometChat Inc.
 *
 */
const CometChatConversationListItemActions = props => {
	const showToolTip = event => {
		const title = event.target.dataset.title;
		event.target.setAttribute("title", title);
	};

	const hideToolTip = event => {
		event.target.removeAttribute("title");
	};

	const deleteConversation = event => {
		CometChatConversationEvents.emit("onDeleteConversation", props.conversation);
		event.stopPropagation();
	};

	const getOptions = () => {
		let optionToDelete = null;

		if (props.isOpen) {
			optionToDelete = (
				<li>
					<button type="button" style={deleteActionStyle(deleteIcon)} className="action__button button__delete" data-title={localize("DELETE")} onMouseEnter={showToolTip} onMouseLeave={hideToolTip} onClick={deleteConversation} />
				</li>
			);
		}

		return optionToDelete;
	};

	return getOptions() ? (
		<ul style={actionWrapperStyle(props)} className="list__item__actions">
			{getOptions()}
		</ul>
	) : null;
};

CometChatConversationListItemActions.propTypes = {
	/** Conversation object of CometChat SDK */
	conversation: PropTypes.objectOf(CometChat.Conversation),
	/** Enable to hide the delete conversation button */
	isOpen: PropTypes.bool,
	style: PropTypes.object,
};

CometChatConversationListItemActions.defaultProps = {
	conversation: {},
	isOpen: false,
	style: {},
};

export { CometChatConversationListItemActions };
