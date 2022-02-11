import React from "react";
import PropTypes from "prop-types";

import { backdropStyle, dialogStyle } from "./style";

const CometChatBackdrop = props =>
	props.isOpen ? (
		<div style={backdropStyle(props)} className="modal__backdrop" onClick={props.onClick}>
			<div style={dialogStyle(props)} className="modal__dialog">
				{props.children}
			</div>
		</div>
	) : null;

// Specifies the default values for props:
CometChatBackdrop.defaultProps = {
	isOpen: false,
	style: {},
	onClick: () => {},
};

CometChatBackdrop.propTypes = {
	isOpen: PropTypes.bool,
	style: PropTypes.object,
	onClick: PropTypes.func,
};

export { CometChatBackdrop };