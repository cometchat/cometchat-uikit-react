import React from "react";
/** @jsxRuntime classic */
/** @jsx jsx */
import {jsx} from "@emotion/core";

import {CometChatContext} from "../../../util/CometChatContext";
import * as enums from "../../../util/enums.js";

import Translator from "../../../resources/localization/translator";

import {conversationActionStyle, groupButtonStyle} from "./style.js";

import loadingIcon from "./resources/progress.svg";
import deleteIcon from "./resources/delete.svg";

class CometChatConversationListActions extends React.PureComponent {
	static contextType = CometChatContext;

	constructor(props) {
		super(props);
		this._isMounted = false;
		this.state = {
			deleteInProgress: false,
		};
	}

	componentDidMount() {
		this._isMounted = true;
	}

	componentWillUnmount() {
		this._isMounted = false;
	}

	toggleTooltip = (event, flag) => {
		const elem = event.target;

		if (flag) {
			elem.setAttribute("title", elem.dataset.title);
		} else {
			elem.removeAttribute("title");
		}
	};

	deleteConversation = event => {

		this.props.actionGenerated(enums.ACTIONS["DELETE_CONVERSATION"], this.props.conversation);
		event.stopPropagation();
	};

	render() {
		const deleteConversation = (
			<li>
				<button
				type="button"
				css={groupButtonStyle(this.state.deleteInProgress, loadingIcon, deleteIcon)}
				className="group__button button__delete"
				data-title={Translator.translate("DELETE", this.context.language)}
				onMouseEnter={event => this.toggleTooltip(event, true)}
				onMouseLeave={event => this.toggleTooltip(event, false)}
				onClick={this.deleteConversation} />
			</li>
		);

		return (
			<ul css={conversationActionStyle(this.context)} className="list__item__actions">
				{deleteConversation}
			</ul>
		);
	}
}

export {CometChatConversationListActions};