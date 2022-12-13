import React from "react";
/** @jsxRuntime classic */
/** @jsx jsx */
import { jsx } from "@emotion/react";

import { CometChatContext } from "../../../util/CometChatContext";
import { CometChatAvatar, CometChatUserPresence } from "../../Shared";

import {
	modalRowStyle,
	modalColumnStyle,
	avatarStyle,
	nameStyle,
	selectionColumnStyle,
	selectionBoxStyle,
} from "./style";

import inactiveIcon from "./resources/group-member-unselect.svg";
import activeIcon from "./resources/group-member-select.svg";

class CometChatTransferOwnershipMemberListItem extends React.Component {
	static contextType = CometChatContext;
	constructor(props, context) {
		super(props, context);

		this.state = {
			isSelected: false,
		};
	}

	handleCheck = (e) => {
		this.setState(this.toggleSelectedState);
		this.props.checked(this.props.member);
	};

	toggleSelectedState = (state) => {
		return {
			isSelected: !state.isSelected,
		};
	};

	toggleTooltip = (event, flag) => {
		const elem = event.currentTarget;
		const nameContainer = elem.lastChild;

		const scrollWidth = nameContainer.scrollWidth;
		const clientWidth = nameContainer.clientWidth;

		if (scrollWidth <= clientWidth) {
			return false;
		}

		if (flag) {
			nameContainer.setAttribute("title", nameContainer.textContent);
		} else {
			nameContainer.removeAttribute("title");
		}
	};

	render() {
		return (
			<div css={modalRowStyle(this.props, this.context)}>
				<div
					css={modalColumnStyle(this.context)}
					className='memberinfo'
					onMouseEnter={(event) => this.toggleTooltip(event, true)}
					onMouseLeave={(event) => this.toggleTooltip(event, false)}
				>
					<div css={avatarStyle()} className='avatar'>
						<CometChatAvatar user={this.props.member} />
						<CometChatUserPresence status={this.props.member.status} />
					</div>
					<div css={nameStyle()} className='name'>
						{this.props.member.name}
					</div>
				</div>
				<div css={selectionColumnStyle(this.context)} className='selection'>
					<span>{this.context.roles[this.props.member.scope]}</span>
					<input
						css={selectionBoxStyle(inactiveIcon, activeIcon, this.context)}
						type='radio'
						name='transferOwnership'
						checked={this.state.checked}
						id={this.props.member.uid + "sel"}
						onChange={this.handleCheck}
					/>
					<label htmlFor={this.props.member.uid + "sel"}>&nbsp;</label>
				</div>
			</div>
		);
	}
}

export { CometChatTransferOwnershipMemberListItem };
