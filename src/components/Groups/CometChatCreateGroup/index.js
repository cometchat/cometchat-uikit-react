import React from "react";
import { CometChat } from "@cometchat-pro/chat";
import { CreateGroupStyles } from "./CreateGroupStyles";
import PropTypes from "prop-types";
import {
	CometChatTheme,
	GroupTypeConstants,
	CometChatListItem,
} from "../../Shared";
import { GroupsConstants } from "../../Shared/Constants/UIKitConstants";
import { localize } from "../../Shared";
import {
	createGroupWrapperStyle,
	createGroupHeader,
	createGroupTitleStyle,
	closeIconStyle,
	createGroupBodyStyle,
	createGroupTabContainerStyle,
	createGroupTabListStyle,
	createGroupTabStyle,
	createGroupInput,
	createGroupInputName,
	createGroupInputPassword,
	nameInputStyle,
	passwordInputStyle,
	errorTextStyle,
	errorIconStyle,
	errorContainerStyle,
	createGroupButton,
	createButtonStyle,
} from "./style";
import { CometChatGroupEvents } from "../CometChatGroupEvents";

import warningIcon from "./resources/warning.svg";

const CometChatCreateGroup = (props) => {
	/**
	 * Destructuring Props
	 */
	const {
		title,
		namePlaceholderText,
		passwordPlaceholderText,
		hideCloseButton,
		closeButtonIconURL,
		createGroupButtonText,
		onClose,
		onCreateGroup,
		style,
		theme,
	} = props;

	/**
	 * Setting Theme
	 */
	const _theme = new CometChatTheme(theme || {});

	/**
	 * Internal States and properties
	 */
	const groupTypes = {
		public: GroupTypeConstants.public,
		private: GroupTypeConstants.private,
		password: GroupTypeConstants.password,
	};
	const [activeTab, setActiveTab] = React.useState(groupTypes.public);
	const [showPasswordInput, setShowPasswordInput] = React.useState(false);
	const [error, setError] = React.useState(null);
	const [groupNameInput, setGroupNameInput] = React.useState(null);
	const [passwordInput, setPasswordInput] = React.useState(null);

	/**
	 * Reset Create Group form
	 */
	const resetGroupData = () => {
		setError(null);
		setShowPasswordInput(false);
		setGroupNameInput(null);
		setPasswordInput(null);
		setActiveTab(null);
	};

	/**
	 *
	 * @param {*} errorCode Emits an error event to handle the error occured
	 */
	const errorHandler = (errorCode) => {
		CometChatGroupEvents.emit(CometChatGroupEvents.onGroupError, errorCode);
	};

	/**
	 *
	 * @param {*} e
	 * set Group Name value
	 */
	const handleGroupNameChange = (e) => {
		setGroupNameInput(e.target.value);
	};

	/**
	 *
	 * @param {*} e
	 * set Group Password value
	 */
	const handlePasswordChange = (e) => {
		setPasswordInput(e.target.value);
	};

	/**
	 * When Tab is selected
	 */
	const onActiveTab = (type) => {
		resetGroupData();
		setActiveTab(type);
		setShowPasswordInput(type === groupTypes.password ? true : false);
	};

	/**
	 * Validates all the group details that were entered before creating the group
	 * @param
	 */
	const validate = () => {
		if (!groupNameInput) {
			setError(localize("GROUP_NAME_BLANK"));
			return false;
		}
		if (!activeTab) {
			setError(localize("GROUP_TYPE_BLANK"));
			return false;
		}
		if (activeTab === groupTypes.password) {
			if (!passwordInput) {
				setError(localize("GROUP_PASSWORD_BLANK"));
				return false;
			}
		}
		return true;
	};

	/**
	 * Close create group screen
	 */
	const closeCreateGroupView = () => {
		if (onClose) {
			resetGroupData();
			onClose();
		}
	};

	/**
	 *
	 * @returns new group created by user
	 */
	const createGroup = () => {
		if (!validate()) {
			return false;
		}
		if (onCreateGroup) {
			onCreateGroup();
			return false;
		}

		let groupType = activeTab.trim();
		let password = passwordInput;
		let guid = GroupsConstants.GROUP_ + new Date().getTime();
		let name = groupNameInput;
		let type;
		switch (groupType) {
			case groupTypes.public:
				type = groupTypes.public;
				break;
			case groupTypes.private:
				type = groupTypes.private;
				break;
			case groupTypes.password:
				type = groupTypes.password;
				break;
			default:
				break;
		}
		let group = new CometChat.Group(guid, name, type, password);
		CometChat.createGroup(group)
			.then((group) => {
				closeCreateGroupView();
				resetGroupData();
				CometChatGroupEvents.emit(CometChatGroupEvents.onGroupCreate, group);
			})
			.catch((error) => {
				errorHandler(error);
			});
	};

	return (
		<div
			className='creategroup__wrapper'
			style={createGroupWrapperStyle(style, _theme)}
		>
			<div className='creategroup__header' style={createGroupHeader()}>
				<p
					className='creategroup__title'
					style={createGroupTitleStyle(style, _theme)}
				>
					{title}
				</p>
				{!hideCloseButton ? (
					<span
						className='creategroup__close'
						style={closeIconStyle(style, closeButtonIconURL, _theme)}
						onClick={onClose}
					/>
				) : null}
			</div>
			<div className='creategroup__body' style={createGroupBodyStyle()}>
				<div
					className='creategroup__tabcontainer'
					style={createGroupTabContainerStyle(style)}
				>
					<div
						className='creategroup__tablist'
						style={createGroupTabListStyle(style)}
					>
						{Object.keys(groupTypes).map((tab) => {
							return (
								<CometChatListItem
									className='creategroup__tab'
									style={createGroupTabStyle(style, _theme, activeTab, tab)}
									text={tab}
									onItemClick={onActiveTab.bind(this, tab)}
								/>
							);
						})}
					</div>
				</div>
				<div className='creategroup__input' style={createGroupInput(style)}>
					<div
						className='creategroup__input--name'
						style={createGroupInputName()}
					>
						<input
							onChange={handleGroupNameChange}
							value={groupNameInput}
							type='text'
							placeholder={namePlaceholderText}
							style={nameInputStyle(style, _theme)}
						/>
					</div>
					{showPasswordInput ? (
						<div
							className='creategroup__input--password'
							style={createGroupInputPassword()}
						>
							<input
								onChange={handlePasswordChange}
								value={passwordInput}
								type='password'
								placeholder={passwordPlaceholderText}
								style={passwordInputStyle(style, _theme)}
							/>
						</div>
					) : null}
				</div>
				{error ? (
					<div>
						<div
							className='decorator__message--error'
							style={errorContainerStyle(style, _theme)}
						>
							{
								<CometChatListItem
									iconURL={warningIcon}
									style={errorIconStyle()}
								/>
							}
							<div style={errorTextStyle(style, _theme)}>{error}</div>
						</div>
					</div>
				) : null}
				<div
					className='creategroup__button--create'
					style={createGroupButton(style)}
				>
					<button
						onClick={createGroup.bind(this)}
						style={createButtonStyle(style, _theme)}
					>
						{createGroupButtonText}
					</button>
				</div>
			</div>
		</div>
	);
};

CometChatCreateGroup.defaultProps = {
	title: localize("NEW__GROUP"),
	namePlaceholderText: localize("ENTER_GROUP_NAME"),
	passwordPlaceholderText: localize("ENTER_GROUP_PASSWORD"),
	hideCloseButton: false,
	closeButtonIconURL: "",
	createGroupButtonText: localize("CREATE_GROUP"),
	onClose: "",
	onCreateGroup: "",
	style: {
		width: "",
		height: "",
		background: "",
		border: "",
		borderRadius: "",
		boxShadow: "",
		closeIconTint: "",
		titleTextFont: "",
		titleTextColor: "",
		errorTextFont: "",
		errorTextBackground: "",
		errorTextBorderRadius: "",
		errorTextBorder: "",
		errorTextColor: "",
		groupTypeTextFont: "",
		groupTypeTextColor: "",
		groupTypeTextBackground: "",
		groupTypeTextActiveBackground: "",
		namePlaceholderTextFont: "",
		namePlaceholderTextColor: "",
		nameInputBackground: "",
		nameInputBorder: "",
		nameInputBorderRadius: "",
		nameInputBoxShadow: "",
		passwordPlaceholderTextFont: "",
		passwordPlaceholderTextColor: "",
		passwordInputBackground: "",
		passwordInputBorder: "",
		passwordInputBorderRadius: "",
		passwordInputBoxShadow: "",
		createGroupButtonTextFont: "",
		createGroupButtonTextColor: "",
		createGroupButtonBackground: "",
		createGroupButtonBorderRadius: "",
	},
};

CometChatCreateGroup.propTypes = {
	title: PropTypes.string,
	namePlaceholderText: PropTypes.string,
	passwordPlaceholderText: PropTypes.string,
	hideCloseButton: PropTypes.bool,
	closeButtonIconURL: PropTypes.string,
	createGroupButtonText: PropTypes.string,
	onClose: PropTypes.func,
	onCreateGroup: PropTypes.func,
	style: PropTypes.object,
};

export { CometChatCreateGroup };
