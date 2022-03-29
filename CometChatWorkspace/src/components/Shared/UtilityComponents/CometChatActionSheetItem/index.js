import * as React from "react";
import PropTypes from "prop-types";

//import { actionSheetItemWrapperStyle, actionSheetItemIconStyle, actionsheetItemTitleStyle } from "./style";

import {
    actionSheetItemWrapperStyle,
	IconBackgroundStyle,
    IconStyle,
    actionSheetItemTitleStyle
} from "./style";

const CometChatActionSheetItem = props => {
	const clickHandler = event => {
		props.onActionItemClick(props);
	};

	return (
		<div className="sheet__item" style={actionSheetItemWrapperStyle(props)} onClick={clickHandler}>
			<div className="item__iconbackground" style={IconBackgroundStyle(props)}>
				<span className="item__icon" style={IconStyle(props)} title={props.title}></span>
			</div>
			<div className="item__title" style={actionSheetItemTitleStyle(props)}>
				{props.title}
			</div>
		</div>
	);
};

CometChatActionSheetItem.defaultProps = {
	id: "uploadphoto",
	width: "50px",
	height: "70px",
	cornerRadius: "10px",
	background: "#eee",
	border: "0 none",
	title: "Upload photo",
	titleFont: "13px 400 Inter",
	titleColor: "#141414",
	iconURL: "",
	iconTint: "white",
	iconBackground: "rgb(105, 41, 202)",
	iconCornerRadius: "10px",
	onActionItemClick: () => {},
};

CometChatActionSheetItem.propTypes = {
	id: PropTypes.string,
	background: PropTypes.string,
	cornerRadius: PropTypes.string,
	border: PropTypes.string,
	width: PropTypes.string,
	height: PropTypes.string,
	title: PropTypes.string,
	titleFont: PropTypes.string,
	titleColor: PropTypes.string,
	iconURL: PropTypes.string,
	iconTint: PropTypes.string,
	iconBackground: PropTypes.string,
	iconCornerRadius: PropTypes.string,
	onActionItemClick: PropTypes.func,
};

export { CometChatActionSheetItem };
