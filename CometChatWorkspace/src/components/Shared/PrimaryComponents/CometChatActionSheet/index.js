import * as React from "react";
import PropTypes from "prop-types";

import { CometChatActionSheetItem } from "../CometChatActionSheetItem";
import { layoutType } from "./layoutType";
import { Hooks } from "./hooks";
import { 
	actionSheetWrapperStyle, 
	actionSheetHeaderStyle, 
	actionSheetTitleStyle, 
	actionSheetLayoutIconStyle,
	sheetItemListStyle
} from "./style";

import toggleLayoutIcon from "./resources/file-upload.svg";

const CometChatActionSheet = props => {

	const [actionList, setActionList] = React.useState([]);
	const [mode, setMode] = React.useState(props.layoutMode);

	let height = "auto",
		width = "100%",
		cornerRadius = "10px",
		borderBottom = {},
		sheetItemStyle = {
			display: "flex",
			flexDirection: "row",
			justifyContent: "flex-start",
			alignItems: "center",
			margin: "0",
		};

	if (mode === layoutType.grid) {
		width = "120px";
		height = "100px";

		sheetItemStyle = {
			display: "flex",
			flexDirection: "column",
			justifyContent: "center",
			alignItems: "center",
			margin: "4px 4px",
			borderRadius: "10px",
		};
	}

	const toggleLayoutMode = event => {
		const newMode = mode === layoutType.list ? layoutType.grid : layoutType.list;
		setMode(newMode);
	};

	Hooks(props, setActionList);

	const actionItemFont = "15px 400 Inter";
	const actionItemColor = "#141414";
	const actionItemIconTint = "#6929CA";

	const renderItems = actionList.map((action, key) => {

		if (mode === layoutType.list) {
			cornerRadius = { borderRadius: "0" };
			borderBottom = { borderBottom: "1px solid rgba(20, 20, 20, 0.08)" };

			if (key === 0) {
				cornerRadius = { borderRadius: "10px 10px 0 0" };
			} else if (key === props.actions.length - 1) {
				cornerRadius = { borderRadius: "0 0 10px 10px" };
				borderBottom = { borderBottom: "0 none" };
			}

			sheetItemStyle = { ...sheetItemStyle, ...cornerRadius, ...borderBottom };
		}

		return (
			<CometChatActionSheetItem
				key={action.id}
				id={action.id}
				iconURL={action.iconURL}
				iconTint={actionItemIconTint}
				iconBackground="transparent"
				title={action.title}
				titleFont={actionItemFont}
				titleColor={actionItemColor}
				width={width}
				height={height}
				style={sheetItemStyle}
				onActionItemClick={action.onActionItemClick}
			/>
		);
	});

	const toggleLayoutButton = !props.hideLayoutMode ? <div className="sheet__layout" style={actionSheetLayoutIconStyle(props)} onClick={toggleLayoutMode}></div> : null;

	return (
		<div className="action__sheet" style={actionSheetWrapperStyle(props, mode)}>
			<div className="sheet__header" style={actionSheetHeaderStyle(props)}>
				<div className="sheet__title" style={actionSheetTitleStyle(props)}>
					{props.title}
				</div>
				{toggleLayoutButton}
			</div>
			<div className="sheet__items" style={sheetItemListStyle(mode)}>
				{renderItems}
			</div>
		</div>
	);
};;

CometChatActionSheet.defaultProps = {
	layoutMode: layoutType["grid"],
	hideLayoutMode: false,
	layoutModeIconURL: toggleLayoutIcon,
	layoutModeIconTint: "rgba(20, 20, 20, 0.04)",
	cornerRadius: "8px",
	background: "white",
	border: "0 none",
	width: "290px",
	height: "408px",
	title: "",
	titleFont: "15px 600 Inter, sans-serif",
	titleColor: "#141414",
	style: {},
	actions: [],
};

CometChatActionSheet.propTypes = {
	layoutMode: PropTypes.oneOf(["list", "grid"]),
	hideLayoutMode: PropTypes.bool,
	layoutModeIconURL: PropTypes.string,
	layoutModeIconTint: PropTypes.string,
	cornerRadius: PropTypes.string,
	background: PropTypes.string,
	border: PropTypes.string,
	width: PropTypes.string,
	height: PropTypes.string,
	title: PropTypes.string,
	titleFont: PropTypes.string,
	titleColor: PropTypes.string,
	style: PropTypes.object,
	actions: PropTypes.array,
};

export { CometChatActionSheet };
