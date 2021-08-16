import React from "react";
/** @jsxRuntime classic */
/** @jsx jsx */
import { jsx } from "@emotion/core";
import { CometChat } from "@cometchat-pro/chat";

import { CometChatTransferOwnershipMemberListItem } from "../";
import { CometChatBackdrop } from "../../Shared";

import * as enums from "../../../util/enums.js";
import { CometChatContext } from "../../../util/CometChatContext";

import Translator from "../../../resources/localization/translator";

import {
    modalWrapperStyle,
    modalCloseStyle,
    modalBodyStyle,
    modalCaptionStyle,
    modalListStyle,
    listHeaderStyle,
    listStyle,
    nameColumnStyle,
    scopeColumnStyle,
	modalFootStyle,
	modalErrorStyle
} from "./style";

import clearIcon from "./resources/close.svg";
import transferIcon from "./resources/transferring.svg";

class CometChatTransferOwnershipMemberList extends React.Component {
	static contextType = CometChatContext;

	constructor(props, context) {
		super(props, context);

		this._isMounted = false;
		const chatWindow = context.UIKitSettings.chatWindow;
		this.mq = chatWindow.matchMedia(context.theme.breakPoints[1]);

		let userColumnTitle = Translator.translate("NAME", context.language);
		if (this.mq.matches) {
			userColumnTitle = Translator.translate("AVATAR", context.language);
		}

		this.state = {
			userColumnTitle: userColumnTitle,
			newGroupOwner: null,
			transferringOwnership: false,
			errorMessage: "",
		};
	}

	componentWillUnmount() {
		this._isMounted = false;
	}

	handleScroll = e => {
		const bottom = Math.round(e.currentTarget.scrollHeight - e.currentTarget.scrollTop) === Math.round(e.currentTarget.clientHeight);
		if (bottom) {
			this.props.actionGenerated(enums.ACTIONS["FETCH_GROUP_MEMBERS"]);
		}
	};

	updateMembers = (action, member, scope) => {
		switch (action) {
			case enums.ACTIONS["CHANGE_OWNERSHIP_GROUP_MEMBER"]:
				this.changeOwnership(member, scope);
				break;
			default:
				break;
		}
	};

	updateGroupOwner = member => {
		this.setState({ newGroupOwner: member?.uid });
	};

	transferOwnership = () => {

		const guid = this.context?.item?.guid;
		const uid = this.state.newGroupOwner;

		if (!guid || !uid) {
			return false;
		}

		this.setState({ transferringOwnership: true });
		CometChat.transferGroupOwnership(guid, uid).then(response => {
			this.setState({ transferringOwnership: false });
			this.props.actionGenerated(enums.ACTIONS["OWNERSHIP_TRANSFERRED"], uid);

		}).catch(error => {
			this.setState({ transferringOwnership: false, errorMessage: Translator.translate("SOMETHING_WRONG", this.context.language) });
		});
	};

	changeOwnership = () => {};

	setUserColumnTitle = editAccess => {
		if (this._isMounted) {
			if (editAccess !== null && this.mq.matches) {
				this.setState({ userColumnTitle: Translator.translate("AVATAR", this.context.language) });
			} else {
				this.setState({ userColumnTitle: Translator.translate("NAME", this.context.language) });
			}
		}
	};

	render() {

		const memberList = [...this.context.groupMembers];
		const groupMembers = memberList
			.filter(member => member?.uid !== this.props?.loggedinuser?.uid)
			.map(member => {
				return <CometChatTransferOwnershipMemberListItem loggedinuser={this.props.loggedinuser} key={member?.uid} checked={this.updateGroupOwner} member={member} actionGenerated={this.updateMembers} />;
			});

		let transferBtn = null;
		if(memberList.length) {

			const transferText = this.state.transferringOwnership ? Translator.translate("TRANSFERRING", this.context.language) : Translator.translate("TRANSFER", this.context.language);
			transferBtn = (
				<div css={modalFootStyle(this.state, this.context, transferIcon)} className="modal__transferownership">
					<button type="button" onClick={this.transferOwnership}>
						<span>{transferText}</span>
					</button>
				</div>
			);
		}

		return (
			<React.Fragment>
				<CometChatBackdrop show={true} clicked={this.props.close} />
				<div css={modalWrapperStyle(this.props, this.context)} className="modal__groupmembers">
					<span css={modalCloseStyle(clearIcon, this.context)} className="modal__close" onClick={this.props.close} title={Translator.translate("CLOSE", this.context.language)}></span>
					<div css={modalBodyStyle()} className="modal__body">
						<div css={modalCaptionStyle(Translator.getDirection(this.context.language))} className="modal__title">{Translator.translate("GROUP_MEMBERS", this.context.language)}</div>
						<div css={modalErrorStyle(this.context)} className="modal__error">{this.state.errorMessage}</div>
						<div css={modalListStyle(this.context)} className="modal__content">
							<div css={listHeaderStyle(this.context)} className="content__header">
								<div css={nameColumnStyle(this.props, this.context)} className="name">
									{this.state.userColumnTitle}
								</div>
								<div css={scopeColumnStyle(this.context)} className="scope">
									{Translator.translate("SCOPE", this.context.language)}
								</div>
							</div>
							<div css={listStyle()} className="content__list" onScroll={this.handleScroll}>
								{groupMembers}
							</div>
						</div>
						{transferBtn}
					</div>
				</div>
			</React.Fragment>
		);
	}
}

export { CometChatTransferOwnershipMemberList };
