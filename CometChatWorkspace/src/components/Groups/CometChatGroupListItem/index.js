import React from "react";
/** @jsxRuntime classic */
/** @jsx jsx */
import { jsx } from "@emotion/react";
import PropTypes from "prop-types";
import { CometChat } from "@cometchat-pro/chat";

import { CometChatAvatar } from "../../Shared";
import { CometChatContext } from "../../../util/CometChatContext";

import { theme } from "../../../resources/theme";
import Translator from "../../../resources/localization/translator";

import {
	listItem,
	listItemIcon,
	itemIconStyle,
	itemThumbnailStyle,
	itemDetailStyle,
	itemNameWrapperStyle,
	itemDescStyle,
	listItemName,
} from "./style";

import shieldIcon from "./resources/password-protected-group.svg";
import lockIcon from "./resources/private-group.svg";

class CometChatGroupListItem extends React.PureComponent {
	static contextType = CometChatContext;

	toggleTooltip = (event, flag) => {
		const elem = event.target;

		const scrollWidth = elem.scrollWidth;
		const clientWidth = elem.clientWidth;

		if (scrollWidth <= clientWidth) {
			return false;
		}

		if (flag) {
			elem.setAttribute("title", elem.textContent);
		} else {
			elem.removeAttribute("title");
		}
	};

	clickHandler = () => {
		this.props.clickHandler(this.props.group);
	};

	render() {
		let groupTypeIcon = null;
		if (this.props.group.type === CometChat.GROUP_TYPE.PRIVATE) {
			groupTypeIcon = (
				<i
					css={itemIconStyle(shieldIcon, this.context)}
					title={Translator.translate("PRIVATE_GROUP", this.context.language)}
				></i>
			);
		} else if (this.props.group.type === CometChat.GROUP_TYPE.PASSWORD) {
			groupTypeIcon = (
				<i
					css={itemIconStyle(lockIcon, this.context)}
					title={Translator.translate("PROTECTED_GROUP", this.context.language)}
				></i>
			);
		}

		return (
			<div
				css={listItem(this.props, this.context)}
				className='list__item'
				onClick={this.clickHandler}
			>
				<div css={itemThumbnailStyle()} className='list__item__thumbnail'>
					<CometChatAvatar group={this.props.group} />
				</div>
				<div
					css={itemDetailStyle()}
					className='list__item__details'
					dir={Translator.getDirection(this.context.language)}
				>
					<div
						css={itemNameWrapperStyle()}
						className='item__details__name'
						onMouseEnter={(event) => this.toggleTooltip(event, true)}
						onMouseLeave={(event) => this.toggleTooltip(event, false)}
					>
						<p css={listItemName(this.context)}>{this.props.group.name}</p>
						<div css={listItemIcon()}>{groupTypeIcon}</div>
					</div>
					<div
						css={itemDescStyle(this.context)}
						className='item__details__desc'
					>{`${this.props.group.membersCount} ${Translator.translate(
						"MEMBERS",
						this.context.language
					)}`}</div>
				</div>
			</div>
		);
	}
}

// Specifies the default values for props:
CometChatGroupListItem.defaultProps = {
	theme: theme,
	group: {},
	selectedGroup: {},
	clickHandler: () => {},
};

CometChatGroupListItem.propTypes = {
	theme: PropTypes.object,
	selectedGroup: PropTypes.oneOfType([
		PropTypes.object,
		PropTypes.shape(CometChat.Group),
	]),
	group: PropTypes.oneOfType([
		PropTypes.object,
		PropTypes.shape(CometChat.Group),
	]),
	clickHandler: PropTypes.func,
};

export { CometChatGroupListItem };
