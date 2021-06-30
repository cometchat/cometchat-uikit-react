export const alertWrapperStyle = props => {
	return {
		width: "calc(100% - 32px)",
		height: "auto",
		backgroundColor: `${props.theme.backgroundColor.white}`,
		position: "absolute",
		margin: "0 auto",
		padding: "16px",
		fontSize: "13px",
		borderRadius: "8px",
		border: "1px solid #eee",
		zIndex: "4",
		top: "50%",
		left: "0",
		right: "0",
		transform: "translateY(-50%)",
	};
};

export const alertMessageStyle = () => {
	return {
		textAlign: "center"
	}
}

export const alertButtonStyle = (props) => {
	return {
		display: "flex",
		flexDirection: "row",
		justifyContent: "center",
		alignItems: "center",
		margin: "24px 0 0 0",
		"> button": {
			padding: "5px 24px",
			margin: "0 8px",
			borderRadius: "4px",
			fontSize: "12px",
			fontWeight: "600",
			border: `1px solid ${props.theme.primaryColor}`,
		},
		"> button[value=yes]": {
			backgroundColor: `${props.theme.primaryColor}`,
			color: `${props.theme.color.white}`,
		},
		"> button[value=no]": {
			backgroundColor: `${props.theme.backgroundColor.secondary}`,
		},
	};
}