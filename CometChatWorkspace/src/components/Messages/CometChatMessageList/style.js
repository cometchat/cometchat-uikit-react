import { messageAlignment } from "../";

export const chatListStyle = props => {
	return {
		background: props.background,
		zIndex: "1",
		width: props.width,
		height: props.height,
		flex: "1 1 0",
		order: "2",
		position: "relative",
	};
};

export const listWrapperStyle = () => {
	
	return {
		boxSizing: "border-box",
		display: "flex",
		flexDirection: "column",
		height: "100%",
		overflowX: "hidden",
		overflowY: "scroll",
		position: "absolute",
		top: "0",
		transition: "background .3s ease-out .1s",
		width: "100%",
		zIndex: "100",
		paddingTop: "16px",
	};
};

export const messageDateContainerStyle = () => {
	return {
		margin: "16px 0",
		display: "flex",
		alignItems: "center",
		justifyContent: "center",
	};
};

export const messageDateStyle = context => {
	return {
		padding: "8px 12px",
		backgroundColor: `rgb(246, 246, 246)`,
		color: `rgb(20, 20, 20)`,
		borderRadius: "10px",
	};
};

export const decoratorMessageStyle = () => {
	return {
		overflow: "hidden",
		width: "100%",
		display: "flex",
		justifyContent: "center",
		alignItems: "center",
		position: "absolute",
		top: "50%",
	};
};

export const decoratorMessageTxtStyle = props => {
    
	return {
		margin: "0",
		height: "36px",
		color: `rgba(20,20,20, 60%)`,
		font: "400 20px Inter, sans-serif",
		lineHeight: "30px",
		wordWrap: "break-word",
		padding: "0 16px",
	};
};

export const messageBubbleStyle = (props, loggedInUser, messageObject) => {

	let flexAlignment = { alignSelf: "flex-start" };
	let userNameAlignment = { textAlign: "left" };
	let justifyContent = { justifyContent: "flex-start" };

	if (props.messageAlignment === messageAlignment.standard && loggedInUser?.uid === messageObject?.sender?.uid) {
		flexAlignment = { alignSelf: "flex-end" };
		userNameAlignment = { textAlign: "right" };
		justifyContent = { justifyContent: "flex-end" };
	}

	return {
		maxWidth: "65%",
		height: "auto",
		userSelect: "text",
		marginBottom: "8px",
		...flexAlignment,
		".message_kit__sender": {
			...userNameAlignment,
		},
		".message_kit__username_bar": {
			...justifyContent,
		},
	};
}