export const footerStyle = () => {
	return {
		width: "100%",
		zIndex: "1",
		height: "64px",
	};
};

export const navbarStyle = () => {
	return {
		display: "flex",
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-around",
		width: "100%",
		height: "100%",
	};
};

export const itemStyle = (props) => {
	return {
		padding: "8px",
		cursor: "pointer",
		display: "flex",
		flexDirection: "column",
		justifyContent: "center",
		alignItems: "center",
		fontSize: "12px",
		color: `${props.theme.color.helpText}`,
	};
};

export const itemLinkStyle = (icon, isActive, context) => {
	let activeStateBg = isActive
		? {
				backgroundColor: `${context.theme.primaryColor}`,
		  }
		: {
				backgroundColor: `${context.theme.secondaryTextColor}`,
		  };

	return {
		height: "24px",
		width: "24px",
		display: "inline-block",
		mask: `url(${icon}) no-repeat center center`,
		...activeStateBg,
	};
};

export const itemLinkTextStyle = (isActive, context) => {
	const colorProp = isActive
		? {
				color: `${context.theme.primaryColor}`,
		  }
		: {
				color: `${context.theme.secondaryTextColor}`,
		  };

	return {
		...colorProp,
		paddingTop: "2px",
	};
};
