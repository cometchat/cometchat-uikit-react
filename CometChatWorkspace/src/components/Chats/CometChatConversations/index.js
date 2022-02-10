import React from "react";
import { CometChat } from "@cometchat-pro/chat";
import PropTypes from "prop-types";

import { CometChatListBase } from "../../";
import { CometChatConversationList, CometChatConversationEvents } from "../";

import { Hooks } from "./hooks";
import { containerStyle, startConversationBtnStyle } from "./style";

import backIcon from "./resources/back.svg";
import startConversationIcon from "./resources/create.svg";

/**
 *
 * CometChatConversations is a container component that wraps and 
 * formats CometChatListBase and CometChatConversationList component, with no behavior of its own.
 *
 * @version 1.0.0
 * @author CometChatTeam
 * @copyright © 2022 CometChat Inc.
 *
 */

const CometChatConversations = props => {
	
	const [user, setUser] = React.useState(null);

	const getStartConversationButtonElem = () => {
		
		if (!props.hideStartConversation) {
			return <div style={startConversationBtnStyle(props)}></div>;
		}
		return null;
	};

	const searchHandler = (searchText) => {
		//search is not implemented
		return false;
	}

	CometChatConversationEvents.addListener("onItemClick", "clicklistener1", () => {
		console.log("onItemClick called");
	});

	//alternative usage
	// CometChatConversationEvents.addListener({"event": "onItemClick", "id": "clicklistener2", "callback": () => {
	// 	console.log("onItemClick called");
	// }});

	Hooks(setUser);

	const listBackground = (props.configurations?.background) || "transparent";

	return (
		<div style={containerStyle(props)} className="cometchat__conversations">
			{getStartConversationButtonElem()}
			<CometChatListBase
				width="100%"
				height="100%"
				background={props.background}
				border={props.border}
				cornerRadius={props.cornerRadius}
				title={props.title}
				titleFont={props.titleFont}
				titleColor={props.titleColor}
				hideSearch={props.hideSearch}
				searchBorder={props.searchBorder}
				searchBackground={props.searchBackground}
				searchCornerRadius={props.searchCornerRadius}
				searchPlaceholder={props.searchPlaceholder}
				searchTextFont={props.searchTextFont}
				searchTextColor={props.searchTextColor}
				showBackButton={props.showBackButton}
				backIcon={props.backIcon}
				backIconTint={props.backIconTint}
				onSearch={searchHandler}>
				<CometChatConversationList
					width="100%"
					height="100%"
					loggedInUser={user}
					conversationType={props.conversationType}
					activeConversation={props.activeConversation}
					background={listBackground}
					configurations={props.configurations?.ConversationListConfiguration}
				/>
			</CometChatListBase>
		</div>
	);
};

CometChatConversations.propTypes = {
	/**  Width of the component  */
	width: PropTypes.string,
	/**  Height of the component  */
	height: PropTypes.string,
	/** Background of the listbase component, sets all background style properties at once, such as color, image, origin and size, or repeat method  */
	background: PropTypes.string,
	/** This property sets the listbase component's border. It sets the values of border-width, border-style, and border-color. */
	border: PropTypes.string,
	/** This property rounds the corners of the listbase component's outer border edge. You can set a single radius to make circular corners, or two radii to make elliptical corners. */
	cornerRadius: PropTypes.string,
	/** Title of the listbase component */
	title: PropTypes.string,
	/** This property sets all the different properties of the listbase component's font */
	titleFont: PropTypes.string,
	/** This property sets the foreground color value of the listbase component's title text  */
	titleColor: PropTypes.string,
	/** Disable search in the listbase component */
	hideSearch: PropTypes.bool,
	/** This property sets the border of the search element. It sets the values of border-width, border-style, and border-color. */
	searchBorder: PropTypes.string,
	/** This property sets the background color of the search element in the listbase component  */
	searchBackground: PropTypes.string,
	/** This property rounds the corners of the search element's outer border edge in the listbase component. You can set a single radius to make circular corners, or two radii to make elliptical corners. */
	searchCornerRadius: PropTypes.string,
	/** This property sets the placeholder text of the search element in the listbase component. The placeholder is text shown when the input is empty  */
	searchPlaceholder: PropTypes.string,
	/** This property sets all the different properties of the search element's font in the listbase component */
	searchTextFont: PropTypes.string,
	/** This property sets the foreground color value of the search text in the listbase component  */
	searchTextColor: PropTypes.string,
	/** Enable back button in the listbase component */
	showBackButton: PropTypes.bool,
	/** URL for the back button icon in the listbase component */
	backIcon: PropTypes.string,
	/** Color of the back button icon in the listbase component */
	backIconTint: PropTypes.string,
	/** Enable start conversation button */
	startConversation: PropTypes.bool,
	/** URL for the start conversation button icon */
	startConversationIcon: PropTypes.string,
	/** Color of the start conversation button icon */
	startConversationIconTint: PropTypes.string,
	/** Filter conversation list, fetch only user/group conversations */
	conversationType: PropTypes.oneOf(["users", "groups", "both"]).isRequired,
	/** Active conversation */
	activeConversation: PropTypes.objectOf(CometChat.Conversation),
	/** Configurable options of child component */
	configurations: PropTypes.object,
};

CometChatConversations.defaultProps = {
	width: "100%",
	height: "100vh",
	background: "white",
	border: "1px solid #808080",
	cornerRadius: "0",
	title: "Chats",
	titleFont: "700 22px Inter, sans-serif",
	titleColor: "#141414",
	hideSearch: true,
	searchBorder: "none",
	searchBackground: "rgba(20, 20, 20, 4%)",
	searchCornerRadius: "8px",
	searchPlaceholder: "Search",
	searchTextFont: "400 15px Inter, sans-serif",
	searchTextColor: "rgba(20, 20, 20, 40%)",
	showBackButton: false,
	backIcon: backIcon,
	backIconTint: "#3399FF",
	hideStartConversation: true,
	startConversationIcon: startConversationIcon,
	startConversationIconTint: "#3399ff",
	conversationType: "both",
	activeConversation: null,
	configurations: null,
};

export { CometChatConversations };