export const footerStyle = () => {

    return {
        width: "100%",
        zIndex: "1",
    }
}

export const navbarStyle = () => {

    return {
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-around",
    }
}

export const itemStyle = props => {
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

export const itemLinkStyle = (icon, activeStateIcon, isActive, key) => {

    let activeStateBg = (isActive) ? { background: `url(${activeStateIcon}) center center no-repeat`, } : {};

    let widthProp = {};

    if (key === "SIDEBAR_GROUPS") {
			widthProp = {width: "31px"};
		} else if (key === "SIDEBAR_CHATS") {
			widthProp = {width: "22px"};
		} else {
			widthProp = {width: "20px"};
		}

    return {
        height: "20px",
        ...widthProp,
        display: "inline-block",
        background: `url(${icon}) center center no-repeat`,
        ...activeStateBg
    }
}