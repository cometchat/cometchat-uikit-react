/** @jsxRuntime classic */
/** @jsx jsx */
import { jsx } from "@emotion/core";
import PropTypes from "prop-types";

import { theme } from "../../../resources/theme";
import { badgeStyle } from "./style";

const CometChatBadgeCount = (props) => {

	let count = "";

	if(props.count) {
		count = (
			<span css={badgeStyle(props)} className="unread-count">{props.count}</span>
		);
	}
	
	return count;
}

// Specifies the default values for props:
CometChatBadgeCount.defaultProps = {
	count: 0,
	theme: theme
};

CometChatBadgeCount.propTypes = {
	count: PropTypes.number,
	theme: PropTypes.object
}

export { CometChatBadgeCount };