import { CometChat } from "@cometchat-pro/chat";
import Translator from "../../../resources/localization/translator";

export const userDetailStyle = (context) => {
	return {
		display: "flex",
		flexDirection: "column",
		height: "100%",
		position: "relative",
		boxSizing: "border-box",
		fontFamily: `${context.theme.fontFamily}`,
		"*": {
			boxSizing: "border-box",
			fontFamily: `${context.theme.fontFamily}`,
		},
	};
};

export const headerStyle = (context) => {
	return {
		padding: "16px",
		position: "relative",
		borderBottom: `1px solid ${context.theme.borderColor.primary}`,
		display: "flex",
		justifyContent: "flex-start",
		alignItems: "center",
		height: "69px",
	};
};

export const headerCloseStyle = (img, context) => {
	const mq = [...context.theme.breakPoints];

	return {
		cursor: "pointer",
		display: "none",
		mask: `url(${img}) center center no-repeat`,
		backgroundColor: `${context.theme.primaryColor}`,
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

export const actionSectionStyle = (context) => {
	return {
		width: "100%",
		"> div": {
			fontWeight: "600",
			cursor: "pointer",
			fontSize: "12px",
		},
		".item__link": {
			color: `${context.theme.color.blue}`,
		},
	};
};

export const privacySectionStyle = (context) => {
	return {
		width: "100%",
		"> div": {
			color: `${context.theme.color.red}`,
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

export const sectionHeaderStyle = (context) => {
	return {
		margin: "0",
		width: "100%",
		fontSize: "12px",
		fontWeight: "500!important",
		lineHeight: "20px",
		color: `${context.theme.color.secondary}`,
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
		width: 100 % "",
		"&:not(:first-of-type):not(:last-of-type)": {
			padding: "6px 0",
		},
	};
};

export const itemLinkStyle = (context) => {
	return {
		fontSize: "15px",
		lineHeight: "20px",
		fontWeight: "600",
		display: "inline-block",
		color: `${context.theme.color.red}`,
	};
};

export const userInfoSectionStyle = () => {
	return {
		display: "flex",
		alignItems: "center",
		justifyContent: "flex-start",
	};
};

export const userThumbnailStyle = () => {
	return {
		width: "35px",
		height: "35px",
		display: "inline-block",
		flexShrink: "0",
		margin: "0 16px 0 0",
	};
};

export const userNameStyle = () => {
	return {
		margin: "0",
		fontSize: "15px",
		fontWeight: "600",
		lineHeight: "22px",
		width: "100%",
		overflow: "hidden",
		textOverflow: "ellipsis",
		whiteSpace: "nowrap",
	};
};

export const userStatusStyle = () => {
	return {
		width: "calc(100% - 50px)",
	};
};

export const userPresenceStyle = (context, state) => {
	let status = state.status ? state.status.toLowerCase() : "";
	let compareTo = Translator.translate(
		CometChat.USER_STATUS.ONLINE.toUpperCase(),
		context.language
	).toLowerCase();
	status =
		status === compareTo
			? { color: `${context.theme.color.blue}` }
			: { color: `${context.theme.color.helpText}` };

	return {
		width: "calc(100% - 50px)",
		textTransform: "capitalize",
		fontSize: "13px",
		fontWeight: "400",
		lineHeight: "20px",
		...status,
	};
};
