export const messageHoverStyle = props => {
	return {
		width: "100%",
		height: "auto",
	};
};

export const messageActionsStyle = () => {
	return {
		position: "relative",
	};
};

export const messageGutterStyle = props => {

	const position = (props.messageListAlignment === "standard" && props.messageAlignment === "right") ? {
		justifyContent: "flex-end",
	} : {
		justifyContent: "flex-start"
	}

	return {
		padding: "8px 20px",
		display: "flex",
		width: "100%",
		// ".message_kit__reaction_bar": {
		// 	...position,
		// },
	};
};

export const messageLeftGutterStyle = props => {
	return {
		flexShrink: "0",
		marginRight: "8px",
		display: "flex",
		flexDirection: "column",
	};
};

export const messageRightGutterStyle = () => {
	return {
		flex: "1 1 0",
		minWidth: "0",
		padding: "8px",
		paddingLeft: "16px",
		margin: "-8px -8px -16px -16px",
	};
};

export const messageKitBlockStyle = props => {
	return {
		borderRadius: props.cornerRadius,
		padding: "16px",
		background: props.backgroundColor,
		display: "flex",
		flexDirection: "column",
		alignItems: "center",
		justifyContent: "center",
		width: "100%",
		border: props.border,
	};
};

export const messageBlockStyle = props => {
	return {
		width: "100%",
		display: "flex",
		alignItems: "center",
		justifyContent: "center",
	};
};

export const messageAvatarStyle = () => {
	return {
		flexShrink: "0",
		position: "relative",
	};
};

export const messageSenderStyle = props => {
	return {
		color: props.usernameColor,
		font: props.usernameFont,
	};
};

export const messageKitReceiptStyle = props => {
	return {
		display: "flex",
		alignItems: "center",
		height: "100%",
	};
};

export const messageTimestampStyle = props => {
	return {
		display: "flex",
		alignItems: "center",
		height: "24px",
	};
};

export const pollQuestionStyle = props => {
	return {
		margin: "0",
		whiteSpace: "pre-wrap",
		wordWrap: "break-word",
		textAlign: "left",
		width: "100%",
		font: props.pollQuestionFont,
		color: props.pollQuestionColor,
	};
};

export const pollAnswerStyle = () => {
	return {
		listStyleType: "none",
		padding: "0",
		margin: "0",
	};
};

export const voteCountStyle = props => {

    return {
		width: "100%",
		"p": {
			margin: "0",
			whiteSpace: "pre-wrap",
			wordWrap: "break-word",
			textAlign: "left",
			width: "100%",
			font: props.voteCountFont,
			color: props.voteCountColor,
		}
    }
}

export const voteCountTextStyle = props => {
	return {
		margin: "0",
		whiteSpace: "pre-wrap",
		wordWrap: "break-word",
		textAlign: "left",
		width: "100%",
		font: props.voteCountFont,
		color: props.voteCountColor,
	};
}

export const messageReplyReceiptStyle = props => {

	const position = (props.messageAlignment === "standard" && props.messageAlignment === "right") ? {
		justifyContent: "flex-end",
	} : {
		justifyContent: "flex-start"
	}

	return {
		width: "100%",
		height: "24px",
		display: "flex",
		alignItems: "center",
		...position,
	};
}