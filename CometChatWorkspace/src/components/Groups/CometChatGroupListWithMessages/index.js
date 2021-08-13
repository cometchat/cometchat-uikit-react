import React from "react";
/** @jsxRuntime classic */
/** @jsx jsx */
import { jsx } from "@emotion/core";
import PropTypes from "prop-types";
import { CometChat } from "@cometchat-pro/chat";

import { CometChatGroupList } from "../";
import { CometChatMessages } from "../../Messages";
import { CometChatIncomingDirectCall } from "../../Calls";

import { CometChatContextProvider } from "../../../util/CometChatContext";
import * as enums from "../../../util/enums.js";

import { theme } from "../../../resources/theme";
import Translator from "../../../resources/localization/translator";

import {
	groupScreenStyle,
	groupScreenSidebarStyle,
	groupScreenMainStyle,
} from "./style"

class CometChatGroupListWithMessages extends React.Component {

	loggedInUser = null;

	constructor(props) {

		super(props);

		this.state = {
			sidebarview: false,
		}

		this.groupListRef = React.createRef();
	}

	componentDidMount() {

		if (this.props.chatWithGroup.length === 0) {
			this.toggleSideBar();
		}
	}

	itemClicked = (group, type) => {
		
		this.contextProviderRef.setTypeAndItem(type, group);
		this.toggleSideBar()
	}

	actionHandler = (action, item, count, ...otherProps) => {
		
		switch(action) {
			case enums.ACTIONS["TOGGLE_SIDEBAR"]:
				this.toggleSideBar();
			break;
			case enums.GROUP_MEMBER_SCOPE_CHANGED:
			case enums.GROUP_MEMBER_KICKED:
			case enums.GROUP_MEMBER_BANNED:
				this.groupUpdated(action, item, count, ...otherProps);
				break;
			default:
			break;
		}
	}

	toggleSideBar = () => {

		const sidebarview = this.state.sidebarview;
		this.setState({ sidebarview: !sidebarview });
	}

	/**
	 If the logged in user is banned, kicked or scope changed, update the chat window accordingly
	*/
	groupUpdated = (key, message, group, options) => {
		
		switch(key) {
			case enums.GROUP_MEMBER_BANNED:
			case enums.GROUP_MEMBER_KICKED: {

				if (this.contextProviderRef.type === CometChat.ACTION_TYPE.TYPE_GROUP
				&& this.contextProviderRef.item.guid === group.guid
				&& options.user.uid === this.loggedInUser.uid) {

					this.contextProviderRef.setItem({});
					this.contextProviderRef.setType("");
				}
				break;
			}
			case enums.GROUP_MEMBER_SCOPE_CHANGED: {
				
				if (this.contextProviderRef.type === CometChat.ACTION_TYPE.TYPE_GROUP
				&& this.contextProviderRef.item.guid === group.guid
				&& options.user.uid === this.loggedInUser.uid) {

					const newObject = Object.assign({}, this.contextProviderRef.item, {"scope": options["scope"]})
					this.contextProviderRef.setItem(newObject);
					this.contextProviderRef.setType(CometChat.ACTION_TYPE.TYPE_GROUP);

				}
				break;
			}
			default:
			break;
		}
	}

	render() {

		let messageScreen = (
			<CometChatMessages
			theme={this.props.theme}
			lang={this.props.lang}
			_parent="groups"
			actionGenerated={this.actionHandler} />
		);

		return (
			<CometChatContextProvider ref={el => (this.contextProviderRef = el)} group={this.props.chatWithGroup} language={this.props.lang}>
				<div css={groupScreenStyle(this.props)} className="cometchat cometchat--groups">
					<div css={groupScreenSidebarStyle(this.state, this.props)} className="groups__sidebar">
						<CometChatGroupList ref={el => (this.groupListRef = el)} _parent="glwm" theme={this.props.theme} lang={this.props.lang} onItemClick={this.itemClicked} actionGenerated={this.actionHandler} />
					</div>
					<div css={groupScreenMainStyle(this.state, this.props)} className="groups__main">
						{messageScreen}
					</div>
					<CometChatIncomingDirectCall theme={this.props.theme} lang={this.props.lang} actionGenerated={this.actionHandler} />
				</div>
			</CometChatContextProvider>
		);
	}
}

// Specifies the default values for props:
CometChatGroupListWithMessages.defaultProps = {
	lang: Translator.getDefaultLanguage(),
	theme: theme,
	chatWithGroup: "",
};

CometChatGroupListWithMessages.propTypes = {
	lang: PropTypes.string,
	theme: PropTypes.object,
	chatWithGroup: PropTypes.string,
}

export { CometChatGroupListWithMessages };