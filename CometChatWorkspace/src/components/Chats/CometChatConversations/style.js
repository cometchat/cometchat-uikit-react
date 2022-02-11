import { CometChatLocalize } from "../../";

export const containerStyle = props => {
	return {
		width: props.width,
		height: props.height,
		display: "flex",
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		position: "relative",
		border: props.border
	};
};

export const startConversationBtnStyle = props => {

    const direction = CometChatLocalize.isRTL() ? { left: "16px" } : { right: "16px" };
	return {
		mask: `url(${props.startConversationIcon}) no-repeat left center`,
		backgroundColor: `${props.startConversationIconTint}`,
		height: "24px",
		width: "24px",
		cursor: "pointer",
		position: "absolute",
		top: "20px",
		...direction,
	};
};
