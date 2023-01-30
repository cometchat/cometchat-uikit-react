import React from "react";
import PropTypes from "prop-types";

import { listItem, listTitle, listItemIconStyle } from "./style";

const CometChatListItem = (props) => {
	let listIcon = null;
	if (props.iconURL) {
		listIcon = (
			<div style={listItemIconStyle(props)} className='list_item_icon'></div>
		);
	}

	return (
		<div
			id={props.id}
			style={listItem(props)}
			className='list__item'
			onClick={props.onItemClick.bind(this)}
		>
			{listIcon}
			<div style={listTitle(props)} className='list_text'>
				{props.text}
			</div>
			{props.tail}
		</div>
	);
};

export { CometChatListItem };

CometChatListItem.defaultProps = {
	id: "",
	text: "",
	tail: "",
	iconURL: "",
	style: {
		width: "",
		height: "",
		iconTint: "red",
		borderRadius: "8px",
		iconBackground: "white",
		textColor: "rgb(51,153,255)",
		border: "1px solid #141414",
		background: "rgba(255,255,255, 0.6)",
		textFont: "600 15px Inter, sans-serif",
	},
	onItemClick: () => {},
};

CometChatListItem.propTypes = {
	id: PropTypes.string,
	text: PropTypes.string,
	tail: PropTypes.string,
	iconURL: PropTypes.string,
	style: PropTypes.object,
	onItemClick: PropTypes.func,
};
