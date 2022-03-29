import React from "react";
import PropTypes from "prop-types";

import { CometChatListBase, CometChatUserList, CometChatTheme, localize, UserListConfiguration } from "../../";
import { CometChatUserEvents } from "../";

import { fontHelper } from "../CometChatUserHelper";
import { Hooks } from "./hooks";
import { containerStyle } from "./style";

import backIcon from "./resources/back.svg";
import searchIcon from "./resources/search.svg";

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

const Users = (props) => {
	
	const [searchInput, setSearchInput] = React.useState("");
	const [theme, setTheme] = React.useState(new CometChatTheme());
	const searchHandler = (searchText) => {
		setSearchInput(searchText);
	};

  	//alternative usage
  	CometChatUserEvents.addListener({
		event: "onItemClick",
		id: "clicklistener2",
		callback: () => {
			console.log("onItemClick called");
		},
	});

  	Hooks(props, setTheme);

  	const getListBaseStyle = () => {

		return {
			width: "100%",
			height: "100%",
			border: "0px none",
			cornerRadius: props.style?.cornerRadius,
			background: props.style?.background || theme?.palette?.background[theme?.palette?.mode],
			titleColor: props.style?.titleColor || theme?.palette?.accent[theme?.palette?.mode],
			titleFont: props.style?.titleFont || fontHelper(theme?.typography?.heading),
			backIconTint: props.style?.backIconTint || theme?.palette?.primary[theme?.palette?.mode],
			searchBorder: `1px solid ${theme?.palette?.accent50[theme?.palette?.mode]}`,
			searchCornerRadius: "8px",
			searchBackground: props.style?.searchBackground || theme?.palette?.accent50[theme?.palette?.mode],
			searchTextFont: props.style?.searchTextFont || fontHelper(theme?.typography?.subtitle1),
			searchTextColor: props.style?.searchTextColor || theme?.palette?.accent500[theme?.palette?.mode],
			searchIconTint: props.style?.searchIconTint || theme?.palette?.accent500[theme?.palette?.mode],
		};
  	}

	const getListStyle = () => {
		return {
			width: "100%",
			height: "100%",
			border: "0 none",
			loadingIconTint: theme?.palette?.accent600[theme?.palette?.mode],
			cornerRadius: "0px",
			background: "transparent",
			emptyTextFont: fontHelper(theme?.typography?.heading),
			emptyTextColor: theme?.palette?.accent400[theme?.palette?.mode],
			errorTextFont: fontHelper(theme?.typography?.heading),
			errorTextColor: theme?.palette?.accent400[theme?.palette?.mode],
		};
	}

	const userListConfig = new UserListConfiguration();
	const limit = props.configurations?.userListConfiguration?.limit || userListConfig.limit;
	const status = props.configurations?.userListConfiguration?.status || userListConfig.status;
	const searchKeyword = props.configurations?.userListConfiguration?.searchKeyword || userListConfig.searchKeyword;
	const friendsOnly = props.configurations?.userListConfiguration?.friendsOnly || userListConfig.friendsOnly;
	const tags = props.configurations?.userListConfiguration?.tags || userListConfig.tags;
	const uids = props.configurations?.userListConfiguration?.uids || userListConfig.uids;
	const roles = props.configurations?.userListConfiguration?.roles || userListConfig.roles;
	const hideBlockedUsers = props.configurations?.userListConfiguration?.hideBlockedUsers || userListConfig.hideBlockedUsers;
	const hideError = props.configurations?.userListConfiguration?.hideError || userListConfig.hideError;
	const customView = props.configurations?.userListConfiguration?.customView || userListConfig.customView;
	const loadingIconURL = props.configurations?.userListConfiguration?.loadingIconURL || userListConfig.loadingIconURL;
	const onErrorCallback = props.configurations?.userListConfiguration?.onErrorCallback || userListConfig.onErrorCallback;

  	return (
		<div style={containerStyle(props, theme)} className="cometchat__users">
			<CometChatListBase
				title={props.title}
				searchPlaceholder={searchInput ? searchInput : props.searchPlaceholder}
				onSearch={searchHandler}
				style={getListBaseStyle()}
				backButtonIconURL={backIcon}
				searchIconURL={searchIcon}
				showBackButton={props.showBackButton}
				hideSearch={props.hideSearch}>
				<CometChatUserList
					limit={limit}
					searchKeyword={searchInput ? searchInput : searchKeyword}
					status={status}
					friendsOnly={friendsOnly}
					hideBlockedUsers={hideBlockedUsers}
					tags={tags}
					uids={uids}
					roles={roles}
					style={getListStyle()}
					customView={customView}
					loadingIconURL={loadingIconURL}
					hideError={hideError}
					emptyText={localize("NO_USERS_FOUND")}
					errorText={localize("SOMETHING_WRONG")}
					activeUser={{}}
					theme={theme}
					onErrorCallback={onErrorCallback}
					configurations={props.configurations}
				/>
			</CometChatListBase>
		</div>
	);
};

Users.propTypes = {
	title: PropTypes.string,
	searchPlaceholder: PropTypes.string,
	activeUser: PropTypes.object,
	style: PropTypes.object,
	backButtonIconURL: PropTypes.string,
	searchIconURL: PropTypes.string,
	showBackButton: PropTypes.bool,
	hideSearch: PropTypes.bool,
	configurations: PropTypes.object,
};

Users.defaultProps = {
	title: "Users",
	searchPlaceholder: "Search",
	activeUser: {},
	style: {
		width: "100%",
		height: "100%",
		background: "",
		border: "1px solid #808080",
		cornerRadius: "8px",
		titleFont: "700 22px Inter, sans-serif",
		titleColor: "",
		backIconTint: "#3399FF",
		searchBorder: "1px solid #141414",
		searchCornerRadius: "8px",
		searchBackground: "",
		searchTextFont: "",
		searchTextColor: "",
		searchIconTint: "",
	},
	backButtonIconURL: backIcon,
	searchIconURL: searchIcon,
	showBackButton: false,
	hideSearch: false,
	configurations: {},
};

export const CometChatUsers = React.memo(Users);