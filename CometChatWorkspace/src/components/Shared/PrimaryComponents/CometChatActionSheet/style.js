import { layoutType } from "./layoutType";

export const actionSheetWrapperStyle = (props, mode) => {

	return {
		background: props.background,
		borderRadius: props.cornerRadius,
		border: props.border,
		width: props.width,
		maxHeight: props.height,
		transform: "scale(1)",
		transformOrigin: "left bottom",
		overflowY: "auto",
		overflowX: "hidden",
		display: "flex",
		padding: "16px",
		boxShadow: "0 16px 32px RGBA(20, 20, 20, 0.2)",
		flexDirection: "row",
		justifyContent: "center",
		alignItems: "center",
		flexWrap: "wrap",
		...props.style,
		"::after": {
			content: "",
			width: "20px",
			height: "20px",
			transform: "rotate(-45deg)",
			background: "#fff",
			position: "absolute",
			boxShadow: "1px 4px 8px rgba(0, 0, 0, 0.5)",
			zIndex: "-1",
			bottom: "-10px",
			left: "calc(50% - 10px)",
		},
	};
};

export const actionSheetHeaderStyle = props => {

	return {
		display: "flex",
		flexDirection: "row",
		width: "100%",
	};
}

export const actionSheetTitleStyle = props => {

	return {
		font: props.titleFont,
		color: props.titleColor,
		lineHeight: "22px",
		width: "calc(100% - 24px)",
	};
}

export const actionSheetLayoutIconStyle = props => {

	return {
		webkitMask: `url(${props.layoutModeIconURL}) no-repeat center center`,
		backgroundColor: `${props.layoutModeIconTint}`,
		height: "24px",
		width: "24px",
		cursor: "pointer"
	};
}

export const sheetItemListStyle = (mode) =>{

	let flexDirection = { flexDirection: "row" },
		flexWrap = { flexWrap: "wrap" };

	if (mode === layoutType.list) {
		flexDirection = { flexDirection: "column" };
		flexWrap = { flexWrap: "nowrap" };
	}

	return {
		width: "100%",
		display: "flex",
		justifyContent: "flex-start",
		alignItems: "center",
		...flexDirection,
		...flexWrap,
	};
}