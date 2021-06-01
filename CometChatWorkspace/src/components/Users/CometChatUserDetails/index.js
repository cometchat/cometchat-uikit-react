import React from "react";
import dateFormat from "dateformat";
/** @jsxRuntime classic */
/** @jsx jsx */
import { jsx } from "@emotion/core";
import PropTypes from "prop-types";
import { CometChat } from "@cometchat-pro/chat";

import { CometChatAvatar } from "../../Shared/";
import { CometChatSharedMediaView } from "../../Shared/CometChatSharedMediaView/index.js";

import { UserDetailManager } from "./controller";

import { CometChatContext } from "../../../util/CometChatContext";
import * as enums from "../../../util/enums.js";

import Translator from "../../../resources/localization/translator";

import {
	userDetailStyle,
	headerStyle,
	headerCloseStyle,
	headerTitleStyle,
	sectionStyle,
	actionSectionStyle,
	mediaSectionStyle,
	privacySectionStyle,
	sectionHeaderStyle,
	sectionContentStyle,
	contentItemStyle,
	itemLinkStyle,
	userInfoSectionStyle,
	userThumbnailStyle,
	userNameStyle,
	userStatusStyle,
	userPresenceStyle,
} from "./style";

import navigateIcon from "./resources/navigate.png";

class CometChatUserDetails extends React.Component {
	static contextType = CometChatContext;

	constructor(props) {
		super(props);
		this._isMounted = false;
		this.state = {
			status: null,
			enableSharedMedia: false,
			enableBlockUser: false,
			enableViewProfile: false,
			enableUserPresence: false,
		};
	}

	componentDidMount() {
		this._isMounted = true;

		this.UserDetailManager = new UserDetailManager();
		this.UserDetailManager.attachListeners(this.updateUser);

		this.setStatusForUser();
		this.enableSharedMedia();
		this.enableBlockUser();
		this.enableViewProfile();
		this.enableUserPresence();
	}

	componentDidUpdate() {
		this.enableSharedMedia();
		this.enableBlockUser();
		this.enableViewProfile();
		this.enableUserPresence();
	}

	componentWillUnmount() {
		this._isMounted = false;
		this.UserDetailManager.removeListeners();
		this.UserDetailManager = null;
	}

	enableUserPresence = () => {
		this.context.FeatureRestriction.isUserPresenceEnabled()
			.then(response => {
				if (response !== this.state.enableUserPresence) {
					this.setState({enableUserPresence: response});
				}
			})
			.catch(error => {
				if (this.state.enableUserPresence !== false) {
					this.setState({enableUserPresence: false});
				}
			});
	};

	updateUser = (key, user) => {
		switch (key) {
			case enums.USER_ONLINE:
			case enums.USER_OFFLINE: {
				if (this.context.type === CometChat.ACTION_TYPE.TYPE_USER && this.context.item.uid === user.uid) {
					//if user presence feature is disabled
					if (this.state.enableUserPresence === false) {
						return false;
					}

					let status = "";
					if (user.status === CometChat.USER_STATUS.OFFLINE) {
						status = Translator.translate("OFFLINE", this.props.lang);
					} else if (user.status === CometChat.USER_STATUS.ONLINE) {
						status = Translator.translate("ONLINE", this.props.lang);
					}
					this.setState({status: status});
				}
				break;
			}
			default:
				break;
		}
	};

	setStatusForUser = () => {

		let status = null;
		if (this.context.item.status === CometChat.USER_STATUS.OFFLINE && this.context.item.lastActiveAt) {
			const lastActive = this.context.item.lastActiveAt * 1000;
			const messageDate = dateFormat(lastActive, "dS mmm yyyy, h:MM TT");

			status = `${Translator.translate("LAST_ACTIVE_AT", this.props.lang)}: ${messageDate}`;
		} else if (this.context.item.status === CometChat.USER_STATUS.OFFLINE) {
			status = Translator.translate("OFFLINE", this.props.lang);
		} else if (this.context.item.status === CometChat.USER_STATUS.ONLINE) {
			status = Translator.translate("ONLINE", this.props.lang);
		}
		
		this.setState({status: status});
	};

	enableSharedMedia = () => {
		this.context.FeatureRestriction.isSharedMediaEnabled()
			.then(response => {
				/**
				 * Don't update state if the response has the same value
				 */
				if (response !== this.state.enableSharedMedia && this._isMounted) {
					this.setState({enableSharedMedia: response});
				}
			})
			.catch(error => {
				if (this.state.enableSharedMedia !== false && this._isMounted) {
					this.setState({enableSharedMedia: false});
				}
			});
	};

	enableBlockUser = () => {
		this.context.FeatureRestriction.isBlockUserEnabled()
			.then(response => {
				/**
				 * Don't update state if the response has the same value
				 */
				if (response !== this.state.enableBlockUser) {
					this.setState({enableBlockUser: response});
				}
			})
			.catch(error => {
				if (this.state.enableBlockUser !== false) {
					this.setState({enableBlockUser: false});
				}
			});
	};

	enableViewProfile = () => {
		this.context.FeatureRestriction.isViewProfileEnabled()
			.then(response => {
				if (response !== this.state.enableViewProfile) {
					this.setState({enableViewProfile: response});
				}
			})
			.catch(error => {
				if (this.state.enableViewProfile !== false) {
					this.setState({enableViewProfile: false});
				}
			});
	};

	blockUser = () => {
		let uid = this.context.item.uid;
		let usersList = [uid];
		CometChat.blockUsers(usersList)
			.then(response => {
				//uid = Number(uid);

				if (response && response.hasOwnProperty(uid) && response[uid].hasOwnProperty("success") && response[uid]["success"] === true) {
					this.context.setToastMessage("success", "BLOCK_USER_SUCCESS");
					this.context.setItem(Object.assign({}, this.context.item, {blockedByMe: true}));
					this.context.setType(CometChat.ACTION_TYPE.TYPE_USER);
				} else {
					const errorCode = "BLOCK_USER_FAIL";
					this.context.setToastMessage("error", errorCode);
				}
			})
			.catch(error => {
				const errorCode = error && error.hasOwnProperty("code") ? error.code : "ERROR";
				this.context.setToastMessage("error", errorCode);
			});
	};

	unblockUser = () => {
		let uid = this.context.item.uid;
		let usersList = [uid];
		CometChat.unblockUsers(usersList)
			.then(response => {
				if (response && response.hasOwnProperty(uid) && response[uid].hasOwnProperty("success") && response[uid]["success"] === true) {
					this.context.setToastMessage("success", "UNBLOCK_USER_SUCCESS");
					this.context.setItem(Object.assign({}, this.context.item, {blockedByMe: false}));
					this.context.setType(CometChat.ACTION_TYPE.TYPE_USER);
				} else {
					const errorCode = "UNBLOCK_USER_FAIL";
					this.context.setToastMessage("error", errorCode);
				}
			})
			.catch(error => {
				const errorCode = error && error.hasOwnProperty("code") ? error.code : "ERROR";
				this.context.setToastMessage("error", errorCode);
			});
	};

	viewProfile = () => {
		const profileLink = this.context.item.link;
		window.open(profileLink, "", "fullscreen=yes, scrollbars=auto");
	};

	render() {
		let viewProfile = null;
		if (this.state.enableViewProfile === true && this.context.item.hasOwnProperty("link") && this.context.item.link && this.context.item.link.trim().length) {
			viewProfile = (
				<div css={sectionStyle()} className="detailpane__section">
					<div css={actionSectionStyle(this.props)} className="section section__viewprofile">
						<h6 css={sectionHeaderStyle(this.props)} className="section__header">
							{Translator.translate("ACTIONS", this.props.lang)}
						</h6>
						<div css={sectionContentStyle()} className="section__content">
							<div css={contentItemStyle()} className="content__item">
								<div css={itemLinkStyle(this.props)} className="item__link" onClick={this.viewProfile}>
									{Translator.translate("VIEW_PROFILE", this.props.lang)}
								</div>
							</div>
						</div>
					</div>
				</div>
			);
		}

		let blockUserText;
		if (this.context.item.blockedByMe) {
			blockUserText = (
				<div css={itemLinkStyle(this.props)} className="item__link" onClick={this.unblockUser}>
					{Translator.translate("UNBLOCK_USER", this.props.lang)}
				</div>
			);
		} else {
			blockUserText = (
				<div css={itemLinkStyle(this.props)} className="item__link" onClick={this.blockUser}>
					{Translator.translate("BLOCK_USER", this.props.lang)}
				</div>
			);
		}

		let blockUserView = (
			<div css={sectionStyle()} className="detailpane__section">
				<div css={privacySectionStyle(this.props)} className="section section__privacy">
					<h6 css={sectionHeaderStyle(this.props)} className="section__header">
						{Translator.translate("OPTIONS", this.props.lang)}
					</h6>
					<div css={sectionContentStyle()} className="section__content">
						<div css={contentItemStyle()} className="content__item">
							{blockUserText}
						</div>
					</div>
				</div>
			</div>
		);

		//if block/unblock user feature is disabled
		if (this.state.enableBlockUser === false) {
			blockUserView = null;
		}

		let sharedmediaView = (
			<div css={mediaSectionStyle()} className="detailpane__section">
				<CometChatSharedMediaView theme={this.props.theme} lang={this.props.lang} widgetsettings={this.props.widgetsettings} />
			</div>
		);

		//if shared media feature is disabled
		if (this.state.enableSharedMedia === false) {
			sharedmediaView = null;
		}

		return (
			<div css={userDetailStyle(this.props)} className="detailpane detailpane--user">
				<div css={headerStyle(this.props)} className="detailpane__header">
					<div css={headerCloseStyle(navigateIcon, this.props)} className="header__close" onClick={() => this.props.actionGenerated(enums.ACTIONS["CLOSE_USER_DETAIL"])}></div>
					<h4 css={headerTitleStyle()} className="header__title">
						{Translator.translate("DETAILS", this.props.lang)}
					</h4>
				</div>
				<div css={sectionStyle()} className="detailpane__section">
					<div css={userInfoSectionStyle(this.props)} className="section section__userinfo">
						<div css={userThumbnailStyle(this.props)} className="user__thumbnail">
							<CometChatAvatar user={this.context.item} />
						</div>
						<div css={userStatusStyle(this.props)} className="user__status">
							<h6 css={userNameStyle()}>{this.context.item.name}</h6>
							<span css={userPresenceStyle(this.props, this.state)}>{this.state.status}</span>
						</div>
					</div>
				</div>
				{viewProfile}
				{blockUserView}
				{sharedmediaView}
			</div>
		);
	}
}

// Specifies the default values for props:
CometChatUserDetails.defaultProps = {
    lang: Translator.getDefaultLanguage(),
};

CometChatUserDetails.propTypes = {
    lang: PropTypes.string
}

export { CometChatUserDetails };