import {CometChat} from "@cometchat-pro/chat";

export const userDetailStyle = props => {
	return {
		display: "flex",
		flexDirection: "column",
		height: "100%",
		position: "relative",
		boxSizing: "border-box",
		fontFamily: `${props.theme.fontFamily}`,
		"*": {
			boxSizing: "border-box",
			fontFamily: `${props.theme.fontFamily}`,
		},
	};
};

export const headerStyle = props => {
	return {
		padding: "16px",
		position: "relative",
		borderBottom: `1px solid ${props.theme.borderColor.primary}`,
		display: "flex",
		justifyContent: "flex-start",
		alignItems: "center",
		height: "69px",
	};
};

export const headerCloseStyle = (img, props) => {
	const mq = [...props.theme.breakPoints];

	return {
		cursor: "pointer",
		display: "none",
		background: `url(${img}) center center no-repeat`,
		width: "24px",
		height: "24px",
		[`@media ${mq[1]}, ${mq[2]}, ${mq[3]}, ${mq[4]}`]: {
			display: "block",
		},
	};
};

export const headerTitleStyle = () => {
	return {
		margin: "0",
		fontWeight: "700",
		fontSize: "20px",
	};
};

export const sectionStyle = () => {
	return {
		margin: "0",
		padding: "16px 16px 0 16px",
		display: "flex",
		flexDirection: "column",
		justifyContent: "space-between",
		alignItems: "flex-start",
	};
};

export const actionSectionStyle = props => {
	return {
		"width": "100%",
		"> div": {
			fontWeight: "600",
			cursor: "pointer",
			fontSize: "12px",
		},
		".item__link": {
			color: `${props.theme.color.blue}`,
		},
	};
};

export const privacySectionStyle = props => {
	return {
		"width": "100%",
		"> div": {
			color: `${props.theme.color.red}`,
			fontWeight: "600",
			cursor: "pointer",
			fontSize: "12px",
		},
	};
};

export const mediaSectionStyle = () => {
	return {
		height: "calc(100% - 255px)",
		width: "100%",
		margin: "0",
		padding: "16px 16px 0 16px",
		display: "flex",
		flexDirection: "column",
		justifyContent: "space-between",
		alignItems: "flex-start",
	};
};

export const sectionHeaderStyle = props => {
	return {
		margin: "0",
		width: "100%",
		fontSize: "12px",
		fontWeight: "500!important",
		lineHeight: "20px",
		color: `${props.theme.color.secondary}`,
		textTransform: "uppercase",
	};
};

export const sectionContentStyle = () => {
	return {
		width: "100%",
		margin: "6px 0",
	};
};

export const contentItemStyle = () => {
	return {
		"width": 100 % "",
		"&:not(:first-of-type):not(:last-of-type)": {
			padding: "6px 0",
		},
	};
};

export const itemLinkStyle = props => {
	return {
		fontSize: "15px",
		lineHeight: "20px",
		fontWeight: "600",
		display: "inline-block",
		color: `${props.theme.color.red}`,
	};
};

export const userInfoSectionStyle = props => {
	return {
		display: "flex",
		alignItems: "center",
		justifyContent: "flex-start",
	};
};

export const userThumbnailStyle = props => {
	return {
		width: "35px",
		height: "35px",
		display: "inline-block",
		flexShrink: "0",
		margin: "0 16px 0 0",
	};
};

export const userNameStyle = props => {
	return {
		margin: "0",
		fontSize: "15px",
		fontWeight: "600",
		width: "100%",
		overflow: "hidden",
		textOverflow: "ellipsis",
		whiteSpace: "nowrap",
	};
};

export const userStatusStyle = props => {
	return {
		width: "calc(100% - 50px)",
	};
};

export const userPresenceStyle = (props, state) => {

	let status = (state.status) ? state.status.toLowerCase() : "";
	status = status === CometChat.USER_STATUS.ONLINE ? {color: `${props.theme.color.blue}`} : {color: `${props.theme.color.helpText}`};

	return {
		width: "calc(100% - 50px)",
		textTransform: "capitalize",
		fontSize: "13px",
		...status,
	};
};
