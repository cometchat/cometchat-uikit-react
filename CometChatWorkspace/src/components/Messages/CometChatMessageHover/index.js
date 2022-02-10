import React from "react";
import PropTypes from "prop-types";

import { CometChatMessageHoverItem } from "../";

import { messageHoverStyle } from "./style";

const CometChatMessageHover = props => {

	const renderItems = () => {

		if(!props.options.length) {
			return null;
		}

		const hoverOptions = props.options.map((option, key) => {
		
			return (
				<CometChatMessageHoverItem
					key={option.id}
					id={option.id}
					iconURL={option.iconURL}
					iconTint={option.iconTint}
					title={option.title}
					width={option.width}
					height={option.height}
					style={option.style}
					onHoverItemClick={option.onHoverItemClick}
				/>
			);
		});

		return (
			<ul style={messageHoverStyle(props)} className="message__actions">
				{hoverOptions}
			</ul>
		);
	}
    
    return renderItems();
}

CometChatMessageHover.defaultProps = {
	options: []
};

CometChatMessageHover.propTypes = {
	options: PropTypes.array,
};

export { CometChatMessageHover };