import React from "react";
/** @jsxRuntime classic */
/** @jsx jsx */
import { jsx } from "@emotion/react";
import PropTypes from "prop-types";

import { CometChatUserList } from "../";
import { CometChatMessages } from "../../Messages";
import { CometChatIncomingCall } from "../../Calls";

import { CometChatContextProvider } from "../../../util/CometChatContext";
import * as enums from "../../../util/enums.js";

import { theme } from "../../../resources/theme";
import Translator from "../../../resources/localization/translator";

import {
	userScreenStyle,
	userScreenSidebarStyle,
	userScreenMainStyle,
} from "./style";

class CometChatUserListWithMessages extends React.Component {
	loggedInUser = null;

	constructor(props) {
		super(props);

		this.state = {
			sidebarview: false,
		};

		this.contextProviderRef = React.createRef();
	}

	componentDidMount() {
		if (this.props.chatWithUser.length === 0) {
			this.toggleSideBar();
		}
	}

	itemClicked = (user, type) => {
		this.contextProviderRef.setTypeAndItem(type, user);
		this.toggleSideBar();
	};

	actionHandler = (action) => {
		switch (action) {
			case enums.ACTIONS["TOGGLE_SIDEBAR"]:
				this.toggleSideBar();
				break;
			default:
				break;
		}
	};

	toggleSideBar = () => {
		const sidebarview = this.state.sidebarview;
		this.setState({ sidebarview: !sidebarview });
	};

	render() {
		let messageScreen = (
			<CometChatMessages
				_parent='userscreen'
				actionGenerated={this.actionHandler}
			/>
		);

		return (
			<CometChatContextProvider
				ref={(el) => (this.contextProviderRef = el)}
				user={this.props.chatWithUser}
				language={this.props.lang}
			>
				<div
					css={userScreenStyle(this.props)}
					className='cometchat cometchat--contacts'
					dir={Translator.getDirection(this.props.lang)}
				>
					<div
						css={userScreenSidebarStyle(this.state, this.props)}
						className='contacts__sidebar'
					>
						<CometChatUserList
							_parent='ulwm'
							theme={this.props.theme}
							lang={this.props.lang}
							onItemClick={this.itemClicked}
							actionGenerated={this.actionHandler}
						/>
					</div>
					<div
						css={userScreenMainStyle(this.state, this.props)}
						className='contacts__main'
					>
						{messageScreen}
					</div>
					<CometChatIncomingCall
						theme={this.props.theme}
						lang={this.props.lang}
						actionGenerated={this.actionHandler}
					/>
				</div>
			</CometChatContextProvider>
		);
	}
}

// Specifies the default values for props:
CometChatUserListWithMessages.defaultProps = {
	lang: Translator.getDefaultLanguage(),
	theme: theme,
	chatWithUser: "",
};

CometChatUserListWithMessages.propTypes = {
	lang: PropTypes.string,
	theme: PropTypes.object,
	chatWithUser: PropTypes.string,
};

export { CometChatUserListWithMessages };
