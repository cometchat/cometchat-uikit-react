/** @jsxRuntime classic */
/** @jsx jsx */
import { jsx } from "@emotion/react";
import PropTypes from "prop-types";
import { CometChat } from "@cometchat-pro/chat";

import { CometChatAvatar, CometChatUserPresence } from "../../Shared";

import { CometChatContext } from "../../../util/CometChatContext";
import { theme } from "../../../resources/theme";
import Translator from "../../../resources/localization/translator";

import {
	listItem,
	itemThumbnailStyle,
	itemDetailStyle,
	itemNameStyle,
	itemDescStyle,
} from "./style";
import { useContext } from "react";

const CometChatUserListItem = (props) => {
	const context = useContext(CometChatContext);

	let userPresence = <CometChatUserPresence status={props.user.status} />;

	const toggleTooltip = (event, flag) => {
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

	return (
		<div
			css={listItem(props, context)}
			onClick={() => props.clickHandler(props.user)}
			className='list__item'
		>
			<div css={itemThumbnailStyle()} className='list__item__thumbnail'>
				<CometChatAvatar user={props.user} />
				{userPresence}
			</div>
			<div
				css={itemDetailStyle()}
				className='list__item__details'
				dir={Translator.getDirection(context.language)}
			>
				<div
					css={itemNameStyle(context)}
					className='item__details__name'
					onMouseEnter={(event) => toggleTooltip(event, true)}
					onMouseLeave={(event) => toggleTooltip(event, false)}
				>
					{props.user.name}
				</div>
				<div css={itemDescStyle(context)} className='item__details__desc'></div>
			</div>
		</div>
	);
};

// Specifies the default values for props:
CometChatUserListItem.defaultProps = {
	theme: theme,
	user: {},
};

CometChatUserListItem.propTypes = {
	theme: PropTypes.object,
	user: PropTypes.shape(CometChat.User),
};

export { CometChatUserListItem };
