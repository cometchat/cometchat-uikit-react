export const emojiContainerStyle = (props) => {
	return {
		padding: "0px",
		overflowY: "scroll",
		position: "relative",
		width: props.style.width,
		height: props.style.height,
		background: props?.style?.background,
		boxShadow: "0px 0px 10px #ddd",
		zIndex: "9",
	};
};

export const emojiListStyle = () => {
	return {
		display: "flex",
		flexWrap: "wrap",
		justifyContent: "space-evenly",
	};
};

export const emojiCategoryWrapper = () => {
	return {
		justifyContent: "center",
		alignItems: "center",
	};
};

export const emojiCategoryTitle = (props) => {
	return {
		textAlign: "left",
		paddingLeft: "16px",
		paddingTop: "8px",
		font: props.style.sectionHeaderFont,
		color: props.style.sectionHeaderColor,
	};
};

export const emojiTabLsitStyle = (props) => {
	return {
		width: "100%",
		zIndex: "9",
		display: "flex",
		flexWrap: "wrap",
		padding: "15px 8px",
		position: "sticky",
		bottom: "0px",
		alignItems: "center",
		justifyContent: "space-around",
		background: props?.style?.background,
	};
};

/**Child props style */
export const getListStyle = () => {
	return {
		width: "24px",
		height: "24px",
		cursor: "pointer",
		alignItems: "center",
		justifyContent: "center",
		iconTint: "#3399ff",
		iconBackground: "rgba(20, 20, 20, 0.58)",
	};
};

export const listStyle = (props) => {
	return {
		padding: "10px",
		display: "flex",
		cursor: "pointer",
		borderRadius: "3px",
		alignItems: "center",
		justifyContent: "center",
		textFont: "700 22px Inter,sand-serif",
		background: props.style?.background,
	};
};
