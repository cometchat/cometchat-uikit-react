import React from "react";
import PropTypes from "prop-types";

import {
    hoverItemStyle,
    hoverItemButtonStyle
} from "./style";

const CometChatMessageHoverItem = props => {

    const showToolTip = event => event.target.setAttribute("title", props.title);
    const hideToolTip = event => event.target.removeAttribute("title");

    const handleClick = () => {
        props.onHoverItemClick(props);
    }

    return (
        <li style={hoverItemStyle(props)} className="action__group">
            <button
                type="button"
                onMouseEnter={showToolTip}
                onMouseLeave={hideToolTip}
                style={hoverItemButtonStyle(props)}
                className={`group__button button__${props.id}`}
                onClick={handleClick}></button>
        </li>
    );
}

CometChatMessageHoverItem.propTypes = {
	id: PropTypes.string,
	iconURL: PropTypes.string,
	iconTint: PropTypes.string,
	title: PropTypes.string,
	width: PropTypes.string,
	height: PropTypes.string,
	onHoverItemClick: PropTypes.func,
};

CometChatMessageHoverItem.defaultProps = {
	id: "",
	iconURL: "",
	iconTint: "#808080",
	title: "Hover me",
	width: "24px",
	height: "24px",
	onHoverItemClick: () => {},
};


export { CometChatMessageHoverItem };