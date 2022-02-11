import { CometChatLocalize } from "../../";

export const listItemStyle = props => {
	return {
		display: "flex",
		flexDirection: "row",
		justifyContent: "left",
		alignItems: "flex-start",
		cursor: "pointer",
		width: "100%",
		padding: "8px 0",
		position: "relative",
		background: props.background,
	};
};

export const itemThumbnailStyle = () => {
	return {
		display: "inline-block",
		width: "auto",
		height: "auto",
		flexShrink: "0",
		position: "relative",
	};
};

export const itemDetailStyle = props => {

	const padding = CometChatLocalize.isRTL() ? { paddingRight: "16px" } : { paddingLeft: "16px" };

	return {
		width: "calc(100% - 55px)",
		flexGrow: "1",
		borderBottom: props.border,
		paddingBottom: "4px",
		...padding,
	};
};

export const itemTitleStyle = () => {
	return {
		display: "flex",
		justifyContent: "flex-start",
		alignItems: "flex-start",
	};
};

export const itemSubTitleStyle = () => {
	return {
		display: "flex",
		justifyContent: "space-between",
		alignItems: "center",
	};
};

export const titleStyle = props => {
	return {
		font: props.titleFont,
		color: props.titleColor,
		display: "block",
		width: "calc(100% - 70px)",
		overflow: "hidden",
		textOverflow: "ellipsis",
		whiteSpace: "nowrap",
		lineHeight: "22px",
	};
};

export const subTitleStyle = props => {
	return {
		font: props.subTitleFont,
		color: props.subTitleColor,
		width: "calc(100% - 24px)",
		overflow: "hidden",
		textOverflow: "ellipsis",
		whiteSpace: "nowrap",
		lineHeight: "24px",
		margin: "0",
	};
};

export const itemTimeStyle = props => {
	return {
		font: props.timeFont,
		color: props.timeColor,
		width: "70px",
		textAlign: "right",
	};
};

export const typingTextStyle = props => {
	return {
		font: props.typingIndicatorTextFont,
		color: props.typingIndicatorTextColor,
		width: "calc(100% - 24px)",
		overflow: "hidden",
		textOverflow: "ellipsis",
		whiteSpace: "nowrap",
		lineHeight: "24px",
		margin: "0",
	};
};

export const itemThreadIndicatorStyle = props => {
	return {
		font: props.subTitleFont,
		color: props.subTitleColor,
		width: "100%",
		lineHeight: "20px",
	};
};
