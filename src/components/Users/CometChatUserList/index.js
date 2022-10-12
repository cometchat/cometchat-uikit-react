import React from "react";
import PropTypes from "prop-types";
import { CometChat } from "@cometchat-pro/chat";

import { Hooks } from "./hooks";
import { CometChatDataItem, CometChatTheme, CometChatUserEvents } from "../../";
import { DataItemConfiguration, fontHelper } from "../../Shared";

import {
	contactMsgStyle,
	contactMsgTxtStyle,
	contactListStyle,
	contactAlphabetStyle,
	contactMsgImgStyle,
	listItemStyle,
} from "./style";

import reloadIcon from "./resources/spinner.svg";

const UserList = React.forwardRef((props, ref) => {
	/**
	 * Destructuring prop values
	 */
	const {
		limit,
		searchKeyword,
		status,
		friendsOnly,
		hideBlockedUsers,
		style,
		customView,
		roles,
		tags,
		uids,
		errorText,
		emptyText,
		hideError,
		activeUser,
		loadingIconURL,
		dataItemConfiguration,
		theme,
	} = props;

	/**
	 * Internal States
	 */
	const loggedInUser = React.useRef(null);
	const userListManager = React.useRef(null);

	const [userList, setUserList] = React.useState([]);
	const [decoratorMessage, setDecoratorMessage] = React.useState("loading");

	const _theme = new CometChatTheme(theme || {});

	const _dataItemConfiguration =
		dataItemConfiguration || new DataItemConfiguration({});

	/**
	 * Public methods
	 */
	React.useImperativeHandle(ref, () => ({
		addUser: addUser,
		updateUser: updateUser,
	}));

	/**
	 * Emits Error event
	 * @param {*} errorCode
	 */
	const errorHandler = (errorCode) => {
		CometChatUserEvents.emit(CometChatUserEvents.onUserError, errorCode);
	};

	/**
	 * Updates user when an action is performed on it
	 * @param {*} user
	 */
	const updateUser = (user) => {
		let userlist = [...userList];
		let userKey = userlist.findIndex((u) => u.uid === user.uid);

		if (userKey > -1) {
			let newUserObj = { ...userlist[userKey], ...user };
			userlist.splice(userKey, 1, newUserObj);
			setUserList(userlist);
		}
	};

	/**
	 * Adds new User to the list at the top
	 * @param {*} user
	 */
	const addUser = (user) => {
		let userlist = [...userList];
		userlist.unshift(user);
		setUserList(userlist);
	};

	/**
	 * Fetch Userlist
	 * @returns
	 */
	const fetchUsers = () => {
		return new Promise((resolve, reject) => {
			userListManager?.current
				.fetchNextUsers()
				.then((userlist) => resolve(userlist))
				.catch((error) => reject(error));
		});
	};

	/**
	 * Handles fetching of new user when scrolled
	 */
	const handleUsers = () => {
		fetchUsers()
			.then((userlist) => {
				if (userList.length === 0 && userlist.length === 0) {
					setDecoratorMessage("NO_USERS_FOUND");
				} else {
					setDecoratorMessage("");
				}
				setUserList((oldlist) => [...oldlist, ...userlist]);
			})
			.catch((error) => {
				errorHandler(error);
				setDecoratorMessage("SOMETHING_WRONG");
			});
	};

	/**
	 * Performs action on scroll
	 * @param {*} e
	 */
	const handleScroll = (e) => {
		const bottom =
			Math.round(e.currentTarget.scrollHeight - e.currentTarget.scrollTop) ===
			Math.round(e.currentTarget.clientHeight);
		if (bottom) {
			handleUsers();
		}
	};

	/**
	 *
	 * @param {*} customView
	 * @param {*} props
	 * @returns custom Component
	 */
	const getCustomView = (customView, props) =>
		React.createElement(customView, props);

	/**
	 *
	 * @returns Loading/Empty/Error Screens
	 */
	const getMessageContainer = () => {
		if (userList.length === 0 && decoratorMessage.toLowerCase() === "loading") {
			return (
				<div
					style={contactMsgStyle(style)}
					className='userlist__decorator-message'
				>
					{customView.loading ? (
						getCustomView(customView.loading, props)
					) : (
						<div
							style={contactMsgImgStyle(style, loadingIconURL, _theme)}
							className='decorator-message'
						></div>
					)}
				</div>
			);
		} else if (
			userList.length === 0 &&
			decoratorMessage.toLowerCase() === "no_users_found"
		) {
			return (
				<div
					style={contactMsgStyle(style)}
					className='userlist__decorator-message'
				>
					{customView.empty ? (
						getCustomView(customView.empty, props)
					) : (
						<div
							style={contactMsgTxtStyle(
								style,
								_theme,
								decoratorMessage,
								fontHelper
							)}
							className='decorator-message'
						>
							{emptyText}
						</div>
					)}
				</div>
			);
		} else if (
			!hideError &&
			decoratorMessage.toLowerCase() === "something_wrong"
		) {
			return (
				<div
					style={contactMsgStyle(style)}
					className='userlist__decorator-message'
				>
					{customView.error ? (
						getCustomView(customView.error, props)
					) : (
						<p
							style={contactMsgTxtStyle(
								style,
								_theme,
								decoratorMessage,
								fontHelper
							)}
							className='decorator-message'
						>
							{errorText}
						</p>
					)}
				</div>
			);
		}
	};

	/**
	 * Handles click on a user item
	 * @param {*} user
	 */
	const clickHandler = (user) => {
		CometChatUserEvents.emit(CometChatUserEvents.onItemClick, user);
	};

	/**
	 *
	 * @returns Division of Users in an alphabetical order
	 */
	const getUsers = () => {
		let currentLetter = "";
		return userList.map((user) => {
			let isActive = activeUser?.uid === user.uid ? true : false;
			const chr = user.name[0].toUpperCase();
			let firstChar = null;
			if (chr !== currentLetter) {
				currentLetter = chr;
				firstChar = (
					<div
						style={contactAlphabetStyle(_theme)}
						className='userlist__alphabet-filter'
					>
						{currentLetter}
					</div>
				);
			}

			return (
				<React.Fragment key={user.uid}>
					{firstChar}
					<CometChatDataItem
						key={user.uid}
						user={user}
						inputData={_dataItemConfiguration.inputData}
						style={listItemStyle(_theme)}
						theme={_theme}
						isActive={isActive}
						onClick={clickHandler.bind(this, user)}
						avatarConfiguration={_dataItemConfiguration.avatarConfiguration}
						statusIndicatorConfiguration={
							_dataItemConfiguration.statusIndicatorConfiguration
						}
					/>
				</React.Fragment>
			);
		});
	};

	/**
	 * Gets called on Mounting
	 */
	Hooks(
		loggedInUser,
		setUserList,
		userListManager,
		updateUser,
		handleUsers,
		limit,
		searchKeyword,
		status,
		roles,
		friendsOnly,
		hideBlockedUsers,
		tags,
		uids,
		errorHandler
	);

	/**
	 * Component level return
	 */
	return (
		<div
			style={contactListStyle(style, _theme)}
			className='cometchat__userlist'
			onScroll={handleScroll}
		>
			{getMessageContainer()}
			{getUsers()}
		</div>
	);
});

/**
 * Default Props
 */
UserList.defaultProps = {
	limit: 30,
	searchKeyword: "",
	status: "",
	roles: null,
	friendsOnly: false,
	hideBlockedUsers: true,
	tags: null,
	uids: null,
	style: {
		width: "100%",
		height: "100%",
		background: "",
		border: "",
		borderRadius: "0",
		loadingIconTint: "",
		emptyTextFont: "",
		emptyTextColor: "",
		errorTextFont: "",
		errorTextColor: "",
	},
	customView: {
		loading: "",
		empty: "",
		error: "",
	},
	loadingIconURL: reloadIcon,
	emptyText: "No users",
	errorText: "Something went wrong",
	hideError: false,
	activeUser: {},
	dataItemConfiguration: {},
};

/**
 * Types of Props
 */
UserList.propTypes = {
  limit: PropTypes.number,
  searchKeyword: PropTypes.string,
  status: PropTypes.string,
  friendsOnly: PropTypes.bool,
  hideBlockedUsers: PropTypes.bool,
  loadingIconURL: PropTypes.string,
  style: PropTypes.object,
  customView: PropTypes.object,
  roles: PropTypes.array,
  tags: PropTypes.array,
  uids: PropTypes.array,
  errorText: PropTypes.string,
  emptyText: PropTypes.string,
  hideError: PropTypes.bool,
  activeUser: PropTypes.object,
  dataItemConfiguration: PropTypes.object,
};

export const CometChatUserList = React.memo(UserList);
