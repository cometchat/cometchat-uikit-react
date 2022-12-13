/** @jsxRuntime classic */
/** @jsx jsx */
import { jsx } from "@emotion/react";
import PropTypes from "prop-types";

import { backdropStyle } from "./style";

const CometChatBackdrop = (props) =>
	props.show ? (
		<div
			css={backdropStyle(props)}
			className='modal__backdrop'
			onClick={props.clicked}
		></div>
	) : null;

// Specifies the default values for props:
CometChatBackdrop.defaultProps = {
	show: false,
	style: {},
	clicked: () => {},
};

CometChatBackdrop.propTypes = {
	show: PropTypes.bool,
	style: PropTypes.object,
	clicked: PropTypes.func,
};

export { CometChatBackdrop };
