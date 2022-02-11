export const editPreviewContainerStyle = props => {
	// const slideAnimation = keyframes`
	// from {
	//     bottom: -60px
	// }
	// to {
	//     bottom: 0px
	// }`;

	return {
		padding: "7px",
		backgroundColor: props.background,
		border: props.border,
		color: `rgba(20, 20, 20, 0.6)`,
		fontSize: "13px",
		//animation: `${slideAnimation} 0.5s ease-out`,
		position: "relative",
	};
};

export const previewHeadingStyle = () => {
	return {
		display: "flex",
		alignItems: "center",
		justifyContent: "space-between",
	};
};

export const previewTextStyle = () => {
	return {
		padding: "5px 0",
	};
};

export const previewCloseStyle = (props) => {
	return {
		width: "24px",
		height: "24px",
		borderRadius: "50%",
		cursor: "pointer",
		WebkitMask: `url(${props.closeIconURL}) center center no-repeat`,
		backgroundColor: props.closeIconTint,
	};
};
