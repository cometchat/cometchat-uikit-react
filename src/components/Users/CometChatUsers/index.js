import React, { forwardRef } from "react";
import PropTypes from "prop-types";

import {
	CometChatListBase,
	CometChatUserList,
	CometChatTheme,
	localize,
	UserListConfiguration,
} from "../..";

import { containerStyle, getListStyle, getListBaseStyle } from "./style";
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

const Users = forwardRef((props, ref) => {
	const {
		title,
		searchPlaceholder,
		backButtonIconURL,
		showBackButton,
		searchIconURL,
		hideSearch,
		activeUser,
		theme,
		style,
		userListConfiguration,
	} = props;

	/**
	 * Component internal state
	 */
	const userListRef = React.useRef(null);
	const [searchInput, setSearchInput] = React.useState("");

	const _theme = new CometChatTheme(theme || {});

	const _userListConfiguration =
		userListConfiguration || new UserListConfiguration({});

	React.useImperativeHandle(ref, () => ({
		userListRef: userListRef.current,
	}));

	const searchHandler = (searchText) => {
		setSearchInput(searchText);
	};

	return (
		<div style={containerStyle(style, _theme)} className='cometchat__users'>
			<CometChatListBase
				title={title}
				searchPlaceholder={searchInput ? searchInput : searchPlaceholder}
				onSearch={searchHandler}
				style={getListBaseStyle(style, _theme)}
				backButtonIconURL={backButtonIconURL || backIcon}
				searchIconURL={searchIconURL || searchIcon}
				showBackButton={showBackButton}
				hideSearch={hideSearch}
			>
				<CometChatUserList
					ref={userListRef}
					limit={_userListConfiguration.limit}
					searchKeyword={
						searchInput ? searchInput : _userListConfiguration.searchKeyword
					}
					status={_userListConfiguration.status}
					friendsOnly={_userListConfiguration.friendsOnly}
					hideBlockedUsers={_userListConfiguration.hideBlockedUsers}
					tags={_userListConfiguration.tags}
					uids={_userListConfiguration.uids}
					roles={_userListConfiguration.roles}
					style={getListStyle(_userListConfiguration, _theme)}
					customView={_userListConfiguration.customView}
					loadingIconURL={_userListConfiguration.loadingIconURL}
					hideError={_userListConfiguration.hideError}
					emptyText={localize("NO_USERS_FOUND")}
					errorText={localize("SOMETHING_WRONG")}
					activeUser={activeUser}
					theme={_theme}
					dataItemConfigurations={_userListConfiguration.dataItemConfigurations}
				/>
			</CometChatListBase>
		</div>
	);
});

Users.propTypes = {
	title: PropTypes.string,
	searchPlaceholder: PropTypes.string,
	activeUser: PropTypes.object,
	style: PropTypes.object,
	backButtonIconURL: PropTypes.string,
	searchIconURL: PropTypes.string,
	showBackButton: PropTypes.bool,
	hideSearch: PropTypes.bool,
	userListConfiguration: PropTypes.object,
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
		borderRadius: "8px",
		titleFont: "700 22px Inter, sans-serif",
		titleColor: "",
		backIconTint: "#3399FF",
		searchBorder: "1px solid #141414",
		searchborderRadius: "8px",
		searchBackground: "",
		searchTextFont: "",
		searchTextColor: "",
		searchIconTint: "",
	},
	backButtonIconURL: backIcon,
	searchIconURL: searchIcon,
	showBackButton: false,
	hideSearch: false,
	userListConfiguration: null,
};

export const CometChatUsers = React.memo(Users);
