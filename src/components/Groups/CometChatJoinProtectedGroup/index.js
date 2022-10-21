import React from "react";
import { CometChat } from "@cometchat-pro/chat";
import PropTypes from "prop-types";
import { CometChatTheme, localize } from "../../Shared";
import { JoinProtectedGroupStyles } from "./JoinProtectedGroupsStyles";

import warningIcon from "../CometChatCreateGroup/resources/warning.svg";

import { CometChatListItem } from "../../Shared";

import {
	joinGroupContainerStyle,
	joinGroupTitleStyle,
	joinGroupPasswordInputStyle,
	joinGroupButtonStyle,
	errorContainerStyle,
	errorIconStyle,
	errorTextStyle,
} from "./style";
import { CometChatGroupEvents } from "../CometChatGroupEvents";

const CometChatJoinProtectedGroup = (props) => {
	/**
	 * Destructuring Props
	 */
	const {
		title,
		group,
		passwordPlaceholderText,
		joinGroupButtonText,
		style,
		theme,
	} = props;

	/**
	 * Internal states
	 */
	const [passwordInput, setPasswordInput] = React.useState(null);
	const [isError, setError] = React.useState(false);
	const [errorText, setErrorText] = React.useState(null);
	const _theme = new CometChatTheme(theme || {});

	/**
	 * handle password input change
	 */
	const handleChange = (e) => {
		setPasswordInput(e.target.value);
	};

	/**
	 *
	 * @returns Performs join group on click
	 */
	const joinGroup = () => {
		if (!passwordInput) {
			setError(true);
			setErrorText(localize("GROUP_PASSWORD_BLANK"));
			return false;
		}

		let guid = group?.guid;
		let type = group?.type;
		let password = passwordInput;

		CometChat.joinGroup(guid, type, password)
			.then((response) => {
				setError(false);

				CometChatGroupEvents.emit(
					CometChatGroupEvents.onGroupMemberJoin,
					response
				);
			})
			.catch((error) => {
				CometChatGroupEvents.emit(CometChatGroupEvents.onGroupError, error);
				setError(true);
				setErrorText(error.message);
			});
	};

	return (
		<div className='joingroup__container' style={joinGroupContainerStyle(style, _theme)}>
			<div
				className='joingroup__title'
				style={joinGroupTitleStyle(style, _theme)}
			>
				{title}
			</div>

			<div className='joingroup__input--password'>
				<input
					type='password'
					placeholder={passwordPlaceholderText}
					value={passwordInput}
					onChange={handleChange}
					style={joinGroupPasswordInputStyle(style, _theme)}
				/>
			</div>
			{isError && errorText ? (
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
						<div style={errorTextStyle(_theme)}>{errorText}</div>
					</div>
				</div>
			) : null}
			<button
				className='joingroup__button--join'
				style={joinGroupButtonStyle(style, _theme)}
				onClick={joinGroup}
			>
				{joinGroupButtonText}
			</button>
		</div>
	);
};

CometChatJoinProtectedGroup.defaultProps = {
	title: localize("ENTER_GROUP_PASSWORD"),
	group: null,
	passwordPlaceholderText: localize("GROUP_PASSWORD"),
	joinGroupButtonText: localize("CONTINUE"),
	style: {
		width: "",
		height: "",
		boxShadow: "",
		background: "",
		border: "",
		borderRadius: "",
		titleTextFont: "",
		titleTextColor: "",
		errorTextFont: "",
		errorTextColor: "",
		passwordTextFont: "",
		passwordTextColor: "",
		passwordPlaceholderTextFont: "",
		passwordPlaceholderTextColor: "",
		passwordInputBackground: "",
		passwordInputBorder: "",
		passwordInputBorderRadius: "",
		passwordInputBoxShadow: "",
		joinButtonTextFont: "",
		joinButtonTextColor: "",
		joinButtonBackground: "",
		joinButtonBorderRadius: "",
	},
};

CometChatJoinProtectedGroup.propTypes = {
	title: PropTypes.string,
	group: PropTypes.object,
	passwordPlaceholderText: PropTypes.string,
	joinGroupButtonText: PropTypes.string,
	style: PropTypes.object,
};

export { CometChatJoinProtectedGroup };
