export const alertWrapperStyle = props => {
	return {
		width: "calc(100% - 32px)",
		height: "auto",
		backgroundColor: `${props.theme.backgroundColor.white}`,
		position: "absolute",
		top: "50%",
		margin: "0 16px",
		padding: "16px",
		fontSize: "13px",
		borderRadius: "8px",
		border: "1px solid #eee",
		boxShadow: "2px 10px 15px #ddd",
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
			textTransform: "uppercase",
			fontSize: "11px",
			fontWeight: "600",
			border: `1px solid ${props.theme.borderColor.blue}`,
		},
		"> button[value=yes]": {
			backgroundColor: `${props.theme.backgroundColor.blue}`,
			color: `${props.theme.color.white}`
		},
		"> button[value=no]": {
			backgroundColor: `${props.theme.backgroundColor.secondary}`,
		},
	};
}