import React from "react";
import PropTypes from "prop-types";
import { CometChat } from "@cometchat-pro/chat";

import { CometChatToastNotification } from "../components/Shared";
import { UIKitSettings } from "./UIKitSettings";
import * as enums from "./enums.js";

import Translator from "../resources/localization/translator";
import { FeatureRestriction } from "./FeatureRestriction";
import { theme } from "../resources/theme";

export const CometChatContext = React.createContext({});

export class CometChatContextProvider extends React.Component {
	loggedInUser;

	constructor(props) {
		super(props);

		const settings = new UIKitSettings();
		const featureRestriction = new FeatureRestriction(settings);

		this.state = {
			item: {},
			type: "",
			toastMessage: props.toastMessage,
			groupMembers: props.groupMembers,
			bannedGroupMembers: props.bannedGroupMembers,
			groupAdmins: props.groupAdmins,
			groupModerators: props.groupModerators,
			callInProgress: props.callInProgress,
			callType: "",
			deletedGroupId: "",
			leftGroupId: "",
			lastMessage: {},
			unreadMessages: [],
			clearedUnreadMessages: false,
			directCallCustomMessage: {},
			directCallCustomMessageAction: "",
			UIKitSettings: settings,
			FeatureRestriction: featureRestriction,
			theme: theme,
			language: props.language,
			roles: {
				[CometChat.GROUP_MEMBER_SCOPE.ADMIN]: Translator.translate(
					"ADMINISTRATOR",
					props.language
				),
				[CometChat.GROUP_MEMBER_SCOPE.MODERATOR]: Translator.translate(
					"MODERATOR",
					props.language
				),
				[CometChat.GROUP_MEMBER_SCOPE.PARTICIPANT]: Translator.translate(
					"PARTICIPANT",
					props.language
				),
			},
			getLoggedinUser: this.getLoggedinUser,
			setGroupMembers: this.setGroupMembers,
			updateGroupMembers: this.updateGroupMembers,
			setAllGroupMembers: this.setAllGroupMembers,
			setGroupAdmins: this.setGroupAdmins,
			setGroupModerators: this.setGroupModerators,
			setBannedGroupMembers: this.setBannedGroupMembers,
			updateBannedGroupMembers: this.updateBannedGroupMembers,
			clearGroupMembers: this.clearGroupMembers,
			setToastMessage: this.setToastMessage,
			setCallInProgress: this.setCallInProgress,
			setItem: this.setItem,
			setType: this.setType,
			setTypeAndItem: this.setTypeAndItem,
			setDeletedGroupId: this.setDeletedGroupId,
			setLeftGroupId: this.setLeftGroupId,
			setLastMessage: this.setLastMessage,
			setClearedUnreadMessages: this.setClearedUnreadMessages,
			setDirectCallCustomMessage: this.setDirectCallCustomMessage,
			checkIfDirectCallIsOngoing: this.checkIfDirectCallIsOngoing,
			checkIfCallIsOngoing: this.checkIfCallIsOngoing,
			getActiveCallSessionID: this.getActiveCallSessionID,
			hasKeyValue: this.hasKeyValue,
			setRoles: this.setRoles,
		};

		this.toastRef = React.createRef();
	}

	componentDidMount() {
		this.getLoggedinUser();

		if (this.props.user.trim().length) {
			this.getUser(this.props.user.trim())
				.then((user) => {
					this.setType(CometChat.ACTION_TYPE.TYPE_USER);
					this.setItem(user);
				})
				.catch((error) => {
					const errorCode =
						error && error.hasOwnProperty("code")
							? error.code
							: "uid not available";
					this.toastRef.setError(errorCode);
				});
		} else if (this.props.group.trim().length) {
			this.getGroup(this.props.group.trim())
				.then((group) => {
					this.setType(CometChat.ACTION_TYPE.TYPE_GROUP);
					this.setItem(group);
				})
				.catch((error) => {
					const errorCode =
						error && error.hasOwnProperty("code")
							? error.code
							: "guid not available";
					this.toastRef.setError(errorCode);
				});
		} else if (
			this.props.user.trim().length === 0 &&
			this.props.group.trim().length === 0 &&
			this.props._component === enums.CONSTANTS["MESSAGES_COMPONENT"]
		) {
			const errorCode = "UID_OR_GUID_NOT_AVAILABLE";
			this.toastRef.setError(errorCode);
		}
	}

	componentDidUpdate(prevProps) {
		if (this.props.user.trim().length && prevProps.user !== this.props.user) {
			this.getUser(this.props.user)
				.then((user) => {
					//this.setType(CometChat.ACTION_TYPE.TYPE_USER);
					//this.setItem(user);
					this.setTypeAndItem(CometChat.ACTION_TYPE.TYPE_USER, user);
					//this.setClearedUnreadMessages(false);
				})
				.catch((error) => {
					const errorCode =
						error && error.hasOwnProperty("code")
							? error.code
							: "uid not available";
					this.toastRef.setError(errorCode);
				});
		} else if (
			this.props.group.trim().length &&
			prevProps.group !== this.props.group
		) {
			this.getGroup(this.props.group)
				.then((group) => {
					//this.setType(CometChat.ACTION_TYPE.TYPE_GROUP);
					//this.setItem(group);
					this.setTypeAndItem(CometChat.ACTION_TYPE.TYPE_GROUP, group);
					//this.setClearedUnreadMessages(false);
				})
				.catch((error) => {
					const errorCode =
						error && error.hasOwnProperty("code")
							? error.code
							: "guid not available";
					this.toastRef.setError(errorCode);
				});
		}

		//when the active group is deleted, close the chat window.
		if (
			this.state.type === CometChat.ACTION_TYPE.TYPE_GROUP &&
			this.state.item.guid === this.state.deletedGroupId
		) {
			//this.setItem({});
			//this.setType("");
			this.setTypeAndItem({}, "");
			this.setDeletedGroupId("");
		}

		//when the active group is left, close the chat window.
		if (
			this.state.type === CometChat.ACTION_TYPE.TYPE_GROUP &&
			this.state.item.guid === this.state.leftGroupId
		) {
			this.setTypeAndItem({}, "");
			this.setLeftGroupId("");
		}

		if (prevProps.language !== this.props.language) {
			this.setState({ language: this.props.language });
			this.setRoles();
		}
	}

	setRoles = () => {
		const roles = {
			[CometChat.GROUP_MEMBER_SCOPE.ADMIN]: Translator.translate(
				"ADMINISTRATOR",
				this.props.language
			),
			[CometChat.GROUP_MEMBER_SCOPE.MODERATOR]: Translator.translate(
				"MODERATOR",
				this.props.language
			),
			[CometChat.GROUP_MEMBER_SCOPE.PARTICIPANT]: Translator.translate(
				"PARTICIPANT",
				this.props.language
			),
		};
		this.setState({ roles: roles });
	};

	getUser = (uid) => {
		const promise = new Promise((resolve, reject) => {
			if (!uid) {
				const error = { code: "uid not available" };
				reject(error);
			}

			CometChat.getUser(uid)
				.then((user) => resolve(user))
				.catch((error) => reject(error));
		});

		return promise;
	};

	getGroup = (guid) => {
		const promise = new Promise((resolve, reject) => {
			if (!guid) {
				const error = { code: "guid not available" };
				reject(error);
			}

			CometChat.getGroup(guid)
				.then((group) => {
					if (group.hasJoined === false) {
						const guid = group.guid;
						const groupType = group.type;
						let password = "";
						if (groupType === CometChat.GROUP_TYPE.PASSWORD) {
							const promptMessage = Translator.translate(
								"Enter password",
								this.props.lang
							);
							password = prompt(promptMessage);
						}

						CometChat.joinGroup(guid, groupType, password)
							.then((group) => resolve(group))
							.catch((error) => reject(error));
					} else {
						resolve(group);
					}
				})
				.catch((error) => reject(error));
		});

		return promise;
	};

	setToastMessage = (type, message) => {
		// switch(type) {

		//     case "error":
		//         this.toastRef.setError(message);
		//     break;
		//     case "success":
		//         this.toastRef.setSuccess(message);
		//         break;
		//     case "info":
		//         this.toastRef.setInfo(message);
		//         break;
		//     case "warning":
		//         this.toastRef.setWarning(message);
		//         break;
		//     default:
		//     break;
		// }

		return null;
	};

	getLoggedinUser = () => {
		let timerCounter = 10000;
		let timer = 0;

		return new Promise((resolve, reject) => {
			if (timerCounter === timer) {
				return reject(`timer reached ${timerCounter}`);
			}

			if (this.loggedInUser) {
				return resolve(this.loggedInUser);
			}

			if (!CometChat.isInitialized()) {
				return reject("CometChat not initialized");
			}

			this.isUserLoggedIn = setInterval(() => {
				CometChat.getLoggedinUser()
					.then((user) => {
						this.loggedInUser = user;
						clearInterval(this.isUserLoggedIn);
						return resolve(user);
					})
					.catch((error) => reject(error));

				timer += 100;
			}, 100);
		});

		// return new Promise((resolve, reject) => {
		// 	CometChat.getLoggedinUser()
		// 		.then(user => resolve(user))
		// 		.catch(error => reject(error));
		// });
	};

	clearGroupMembers = () => {
		this.setState({
			groupMembers: [],
			groupAdmins: [],
			groupModerators: [],
			bannedGroupMembers: [],
		});
	};

	setAllGroupMembers = (groupMembers, groupAdmins, groupModerators) => {
		this.setState({
			groupMembers: [...this.state.groupMembers, ...groupMembers],
			groupAdmins: [...this.state.groupAdmins, ...groupAdmins],
			groupModerators: [...this.state.groupModerators, ...groupModerators],
		});
	};

	updateGroupMembers = (groupMembers) => {
		this.setState({
			groupMembers: [...groupMembers],
		});
	};

	setGroupMembers = (groupMembers) => {
		this.setState({
			groupMembers: [...this.state.groupMembers, ...groupMembers],
		});
	};

	setGroupAdmins = (groupAdmins) => {
		this.setState({
			groupAdmins: [...this.state.groupAdmins, ...groupAdmins],
		});
	};

	setGroupModerators = (groupModerators) => {
		this.setState({
			groupModerators: [...this.state.groupModerators, ...groupModerators],
		});
	};

	setBannedGroupMembers = (bannedMembers) => {
		this.setState({
			bannedGroupMembers: [...this.state.bannedGroupMembers, ...bannedMembers],
		});
	};

	updateBannedGroupMembers = (bannedMembers) => {
		this.setState({
			bannedGroupMembers: [...bannedMembers],
		});
	};

	setCallInProgress = (call, callType) => {
		this.setState({ callInProgress: { ...call }, callType });
	};

	setItem = (item) => {
		this.setState({ item: { ...item } });
	};

	setType = (type) => {
		this.setState({ type });
	};

	setTypeAndItem = (type, item) => {
		this.setState({ item: { ...item }, type });
	};

	setDeletedGroupId = (guid) => {
		this.setState({ deletedGroupId: guid });
	};

	setLeftGroupId = (guid) => {
		this.setState({ leftGroupId: guid });
	};

	setLastMessage = (message) => {
		this.setState({ lastMessage: message });
	};

	setClearedUnreadMessages = (flag) => {
		this.setState({ clearedUnreadMessages: flag });
	};

	setDirectCallCustomMessage = (message, event) => {
		this.setState({
			directCallCustomMessage: message,
			directCallCustomMessageAction: event,
		});
	};

	checkIfDirectCallIsOngoing = () => {
		let output = null;

		if (
			Object.keys(this.state.callInProgress).length &&
			(this.state.callType === enums.CONSTANTS["INCOMING_DIRECT_CALLING"] ||
				this.state.callType === enums.CONSTANTS["OUTGOING_DIRECT_CALLING"])
		) {
			if (
				this.state.callInProgress.customData.sessionID === this.state.item.guid
			) {
				output = enums.CONSTANTS.CALLS["ONGOING_CALL_SAME_GROUP"];
			} else {
				output = enums.CONSTANTS.CALLS["ONGOING_CALL_DIFF_GROUP"];
			}
		}

		return output;
	};

	checkIfCallIsOngoing = () => {
		if (Object.keys(this.state.callInProgress).length) {
			return true;
		}

		return false;
	};

	getActiveCallSessionID = () => {
		let sessionID;
		if (
			this.state.callType === enums.CONSTANTS["INCOMING_DIRECT_CALLING"] ||
			this.state.callType === enums.CONSTANTS["OUTGOING_DIRECT_CALLING"]
		) {
			sessionID = this.state.callInProgress?.data?.customData?.sessionID;
		} else {
			sessionID = this.state.callInProgress?.sessionId;
		}

		return sessionID;
	};

	hasKeyValue = (data, key) => {
		if (
			data.hasOwnProperty(key) === false ||
			data[key] === null ||
			data[key] === undefined
		) {
			return false;
		}

		return true;
	};

	render() {
		return (
			<CometChatContext.Provider value={this.state}>
				<CometChatToastNotification
					ref={(el) => (this.toastRef = el)}
					lang={this.props.language}
					position={this.props.toastNotificationPos}
				/>
				{this.props.children}
			</CometChatContext.Provider>
		);
	}
}

CometChatContextProvider.defaultProps = {
	toastMessage: {},
	groupMembers: [],
	bannedGroupMembers: [],
	groupAdmins: [],
	groupModerators: [],
	callInProgress: {},
	user: "",
	group: "",
	_component: "",
	language: Translator.getDefaultLanguage(),
};

CometChatContextProvider.propTypes = {
	toastMessage: PropTypes.object,
	groupMembers: PropTypes.array,
	bannedGroupMembers: PropTypes.array,
	groupAdmins: PropTypes.array,
	groupModerators: PropTypes.array,
	callInProgress: PropTypes.object,
	group: PropTypes.string,
	user: PropTypes.string,
	_component: PropTypes.string,
	language: PropTypes.string,
};
