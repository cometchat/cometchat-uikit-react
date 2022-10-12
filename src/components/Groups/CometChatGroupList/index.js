import React from "react";
import PropTypes from "prop-types";
import { CometChat } from "@cometchat-pro/chat";

import {
	CometChatDataItem,
	CometChatTheme,
	CometChatGroupEvents,
} from "../../";

import { Hooks } from "./hooks";

import {
	groupMsgStyle,
	groupMsgImgStyle,
	groupMsgTxtStyle,
	groupListStyle,
	listItemStyle,
} from "./style";

import loadingIcon from "./resources/spinner.svg";
import { DataItemConfiguration } from "../../Shared";

/**
 *
 * CometChatGroupList component retrieves the latest list of groups that a CometChat logged-in user has been a part of.
 * The state of the component is communicated via 3 states i.e empty, loading and error
 *
 * @version 1.0.0
 * @author CometChatTeam
 * @copyright © 2022 CometChat Inc.
 *
 */

const GroupList = React.forwardRef((props, ref) => {
	/**
	 * Destructuring props
	 */
	const {
		limit,
		searchKeyword,
		joinedOnly,
		tags,
		style,
		customView,
		emptyText,
		errorText,
		hideError,
		activeGroup,
		loadingIconURL,
		theme,
		dataItemConfiguration,
	} = props;

	/**
	 * Internal States
	 */
	const loggedInUser = React.useRef(null);
	const groupListManager = React.useRef(null);
	const callbackData = React.useRef(null);

	const [groupList, setGroupList] = React.useState([]);
	const [decoratorMessage, setDecoratorMessage] = React.useState("loading");

	const _theme = new CometChatTheme(theme || {});
	const _dataItemConfiguration =
		dataItemConfiguration || new DataItemConfiguration({});

	React.useImperativeHandle(ref, () => ({
		updateGroup: updateGroup,
		addGroup: addGroup,
		removeGroup: removeGroup,
	}));

	// Callback received when user updates the group
	const groupCallback = (listenerName, ...args) => {
		callbackData.current = { name: listenerName, args: [...args] };
	};

	/**
	 *
	 * Listener callback when a member is kicked from / has left the group
	 */
	const handleGroupMemberRemoval = (...options) => {
		const removedUser = options[1];
		const group = options[3];

		let grouplist = [...groupList];

		//search for group
		let groupKey = grouplist.findIndex((g) => g.guid === group.guid);

		if (groupKey > -1) {
			if (loggedInUser?.uid === removedUser.uid) {
				let groupObject = { ...grouplist[groupKey] };
				let newGroupObject = Object.assign({}, groupObject, {
					hasJoined: false,
				});

				grouplist.splice(groupKey, 1, newGroupObject);
				setGroupList(grouplist);
			} else {
				let newGroupObject = Object.assign({}, group);
				grouplist.splice(groupKey, 1, newGroupObject);
				setGroupList(grouplist);
			}
		}
	};

	/**
	 *
	 * Listener callback when a member is banned from the group
	 */
	const handleGroupMemberBan = (...options) => {
		const removedUser = options[1];
		const group = options[3];
		let grouplist = [...groupList];
		let groupKey = grouplist.findIndex((g) => g.guid === group.guid);

		if (groupKey > -1) {
			/**
			 * If the loggedin user is banned from the group, remove the group from the group list
			 */
			if (loggedInUser?.uid === removedUser.uid) {
				let groupObject = { ...grouplist[groupKey] };
				let newGroupObject = Object.assign({}, groupObject);

				grouplist.splice(groupKey, 1, newGroupObject);
				setGroupList(grouplist);
			} else {
				let newGroupObject = Object.assign({}, group);
				grouplist.splice(groupKey, 1, newGroupObject);
				setGroupList(grouplist);
			}
		}
	};

	/**
	 *
	 * Listener callback when a user joins/added to the group
	 */
	const handleGroupMemberAddition = (...options) => {
		const newUser = options[1];
		const group = options[3];
		let grouplist = [...groupList];

		//search for group
		let groupKey = grouplist.findIndex((g) => g.guid === group.guid);
		if (groupKey > -1) {
			if (loggedInUser?.uid === newUser.uid) {
				let groupObject = { ...grouplist[groupKey] };
				let newgroupObject = Object.assign({}, groupObject, {
					hasJoined: true,
				});

				grouplist.splice(groupKey, 1, newgroupObject);
				setGroupList(grouplist);
			} else {
				grouplist.splice(groupKey, 1, group);
				setGroupList(grouplist);
			}
		} else {
			grouplist.unshift(group);
			setGroupList(grouplist);
		}
	};

	/**
	 *
	 * Listener callback when a group member scope is updated
	 */
	const handleGroupMemberScopeChange = (...options) => {
		let grouplist = [...groupList];

		const user = options[1];
		const newScope = options[2];
		const group = options[4];

		//search for group
		let groupKey = grouplist.findIndex((g) => g.guid === group.guid);

		if (groupKey > -1) {
			let groupObject = { ...grouplist[groupKey] };
			if (loggedInUser?.uid === user.uid) {
				let newgroupObject = Object.assign({}, groupObject, {
					scope: newScope,
				});

				grouplist.splice(groupKey, 1, newgroupObject);

				setGroupList(grouplist);
			} else {
				let groupObject = { ...grouplist[groupKey] };
				let newgroupObject = Object.assign({}, groupObject);
				grouplist.splice(groupKey, 1, newgroupObject);
				setGroupList(grouplist);
			}
		}
	};

	/**
	 * Group Listener Handlers
	 */
	const handlers = {
		onMemberAddedToGroup: handleGroupMemberAddition,
		onGroupMemberJoined: handleGroupMemberAddition,
		onGroupMemberKicked: handleGroupMemberRemoval,
		onGroupMemberLeft: handleGroupMemberRemoval,
		onGroupMemberBanned: handleGroupMemberBan,
		onGroupMemberScopeChanged: handleGroupMemberScopeChange,
	};

	/**
	 * Remove a group from grouplist
	 * @param {*} group
	 */
	const removeGroup = (group) => {
		let grouplist = [...groupList];
		//search for group
		let groupKey = grouplist.findIndex((g, k) => g.guid === group.guid);
		if (groupKey > -1) {
			grouplist.splice(groupKey, 1);
			setGroupList(grouplist);
		}
	};

	/**
	 * Add new group in groupList
	 * @param {*} group
	 */
	const addGroup = (group) => {
		let grouplist = [...groupList];
		grouplist.unshift(group);
		setGroupList(grouplist);
	};

	/**
	 * Update Group
	 * @param {*} group
	 */
	const updateGroup = (group) => {
		let grouplist = [...groupList];
		//search for group
		let groupKey = grouplist.findIndex((g, k) => g.guid === group.guid);
		if (groupKey > -1) {
			let newGroupObj = { ...grouplist[groupKey], ...group };
			grouplist.splice(groupKey, 1, newGroupObj);
			setGroupList(grouplist);
		}
	};

	/**
	 *
	 * @returns GroupList
	 */
	const fetchGroups = () => {
		return new Promise((resolve, reject) => {
			groupListManager?.current
				.fetchNextGroups()
				.then((grouplist) => resolve(grouplist))
				.catch((error) => reject(error));
		});
	};

	/**
	 * Fetches new Groups on scroll
	 */
	const handleGroups = () => {
		fetchGroups()
			.then((grouplist) => {
				if (groupList.length === 0 && grouplist.length === 0) {
					setDecoratorMessage("NO_GROUPS_FOUND");
				} else {
					setDecoratorMessage("");
				}
				//setGroupList([...groupList, ...grouplist]);
				setGroupList((oldlist) => [...oldlist, ...grouplist]);
			})
			.catch((error) => {
				setDecoratorMessage("SOMETHING_WRONG");
				errorHandler(error);
			});
	};

	/**
	 * Handles scroll
	 * @param {*} e
	 */
	const handleScroll = (e) => {
		const bottom =
			Math.round(e.currentTarget.scrollHeight - e.currentTarget.scrollTop) ===
			Math.round(e.currentTarget.clientHeight);
		if (bottom) {
			handleGroups();
		}
	};

	/**
	 *
	 * @param {*} customView
	 * @returns custom Component
	 */
	const getCustomView = (customView) => React.createElement(customView, props);

	/**
	 *
	 * @returns Loading/Empty/Error states
	 */
	const getMessageContainer = () => {
		if (
			groupList.length === 0 &&
			decoratorMessage?.toLowerCase() === "loading"
		) {
			return (
				<div
					style={groupMsgStyle(style)}
					className='grouplist__decorator-message'
				>
					{customView?.loading ? (
						getCustomView(customView.loading)
					) : (
						<div
							style={groupMsgImgStyle(style, _theme, loadingIconURL)}
							className='decorator-message'
						></div>
					)}
				</div>
			);
		} else if (
			groupList.length === 0 &&
			decoratorMessage.toLowerCase() === "no_groups_found"
		) {
			return (
				<div
					style={groupMsgStyle(style)}
					className='grouplist__decorator-message'
				>
					{customView?.empty ? (
						getCustomView(customView.empty)
					) : (
						<div
							style={groupMsgTxtStyle(style, _theme, decoratorMessage)}
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
					style={groupMsgStyle(style)}
					className='grouplist__decorator-message'
				>
					{customView?.error ? (
						getCustomView(customView.error, props)
					) : (
						<p
							style={groupMsgTxtStyle(style, _theme, decoratorMessage)}
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
	 * Invoked when a group item is clicked
	 * @param {*} group
	 */
	const clickHandler = (group) => {
		CometChatGroupEvents.emit(CometChatGroupEvents.onItemClick, group);
	};

	/**
	 *
	 * @param {} errorCode
	 * emits error Event
	 */
	const errorHandler = (errorCode) => {
		CometChatGroupEvents.emit(CometChatGroupEvents.onGroupError, errorCode);
	};

	/**
	 * Gets called on mount
	 */
	Hooks(
		loggedInUser,
		handlers,
		setGroupList,
		groupListManager,
		groupCallback,
		callbackData,
		handleGroups,
		limit,
		searchKeyword,
		joinedOnly,
		tags,
		errorHandler
	);

	/**
	 *
	 * @returns GroupList View
	 */
	const getGroups = () => {
		// Group Mapping
		return groupList.map((group) => {
			let isActive = activeGroup?.guid === group.guid ? true : false;

			return (
				<CometChatDataItem
					key={group.guid}
					group={group}
					inputData={_dataItemConfiguration.inputData}
					style={listItemStyle(_theme)}
					theme={_theme}
					isActive={isActive}
					onClick={clickHandler.bind(this, group)}
					avatarConfiguration={_dataItemConfiguration.avatarConfiguration}
					statusIndicatorConfiguration={
						_dataItemConfiguration.statusIndicatorConfiguration
					}
				/>
			);
		});
	};

	/**
	 * Component level return
	 */
	return (
		<div
			style={groupListStyle(style, _theme)}
			className='cometchat__grouplist'
			onScroll={handleScroll}
		>
			{getMessageContainer()}
			{getGroups()}
		</div>
	);
});

/**
 * Default Props
 */
GroupList.defaultProps = {
	limit: 30,
	searchKeyword: "",
	joinedOnly: false,
	tags: null,
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
	loadingIconURL: loadingIcon,
	emptyText: "No groups",
	errorText: "Something went wrong",
	hideError: false,
	activeGroup: {},
	dataItemConfiguration: {},
};

/**
 * prop types
 */
GroupList.propTypes = {
	limit: PropTypes.number,
	searchKeyword: PropTypes.string,
	joinedOnly: PropTypes.bool,
	tags: PropTypes.array,
	loadingIconURL: PropTypes.string,
	customView: PropTypes.object,
	style: PropTypes.object,
	errorText: PropTypes.string,
	emptyText: PropTypes.string,
	hideError: PropTypes.bool,
	activeGroup: PropTypes.object,
	dataItemConfiguration: PropTypes.object,
};

export const CometChatGroupList = React.memo(GroupList);
