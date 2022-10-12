import { fontHelper } from "../../Shared";

export const messageReactionListStyle = () => {
	return {
		margin: "5px",
		padding: "0px 8px 8px 8px",
		display: "flex",
		flexDirection: "row",
		alignItems: "center",
	};
};

export const reactionListStyle = () => {
	return {
		display: "flex",
		alignItems: "center",
		justifyContent: "center",
		fontSize: "15px",
		margin: "0",
		padding: "0",
		cursor: "pointer",
	};
};
export const messageAddReactionStyle = (
	messageObject,
	loggedInUser,
	style,
	theme
) => {
	let background = theme?.palette?.accent100[theme?.palette?.mode];
	if (messageObject.sender.uid === loggedInUser.uid) {
		background = "RGBA(255, 255, 255, 0.23)";
	}

	return {
		padding: "1px 4px",
		display: "inline-flex",
		alignItems: "center",
		justifyContent: "center",
		borderRadius: style.borderRadius,
		height: "22px",
		width: "30px",
		cursor: "pointer",
		border: `1px solid ${theme?.palette?.accent100[theme.palette.mode]}`,
		background: background,
	};
};

export const emojiButtonStyle = (
	style,
	loggedInUser,
	messageObject,
	reactionData,
	theme
) => {
	let background = theme?.palette?.accent700[theme?.palette?.mode];
	if (messageObject?.type === "text") {
		if (messageObject?.sender?.uid === loggedInUser?.uid) {
			if (reactionData?.hasOwnProperty(loggedInUser?.uid)) {
				background = theme?.palette?.background[theme?.palette?.mode];
			}
		}
	}
	return {
		iconHeight: "16px",
		iconWidth: "16px",
		iconTint: style.iconTint || background,
		padding: "0",
	};
};

// list item style
export const messageReactionsStyle = (
	messageObject,
	loggedInUser,
	style,
	reactionData,
	theme
) => {
	let background = { background: "transparent" },
		border = {
			border: `1px solid ${theme?.palette?.background[theme?.palette?.mode]}`,
		};
	if (messageObject?.type === "text") {
		if (messageObject?.sender?.uid === loggedInUser?.uid) {
			if (reactionData?.hasOwnProperty(loggedInUser?.uid)) {
				background = {
					background: theme?.palette?.background[theme?.palette?.mode],
				};
			}
		} else {
			if (reactionData?.hasOwnProperty(loggedInUser?.uid)) {
				background = {
					background: theme?.palette?.primary[theme?.palette?.mode],
				};
				border = {
					border: `1 px ${theme?.palette?.primary[theme?.palette?.mode]}`,
				};
			} else {
				background = { background: "transparent" };
				border = {
					border: `1px solid ${
						theme?.palette?.accent100[theme?.palette?.mode]
					}`,
				};
			}
		}
	} else {
		if (reactionData?.hasOwnProperty(loggedInUser?.uid)) {
			background = {
				background: theme?.palette?.primary[theme?.palette?.mode],
			};
			border = {
				border: `1 px ${theme?.palette?.primary[theme?.palette?.mode]}`,
			};
		} else {
			background = {
				background: theme?.palette?.accent100[theme?.palette?.mode],
			};
			border = {
				border: `1px solid ${theme?.palette?.accent100[theme?.palette?.mode]}`,
			};
		}
	}

	return {
		...background,
		display: "flex",
		alignItems: "center",
		justifyContent: "center",
		font: style.textFont,
		padding: "2px 4px",
		margin: "0 0 0 6px",
		borderRadius: "11px",
		cursor: "pointer",
		...border,
	};
};

export const reactionCountStyle = (
	loggedInUser,
	messageObject,
	reactionData,
	theme
) => {
	let color = theme?.palette?.background[theme?.palette?.mode];
	if (messageObject.type === "text") {
		if (messageObject.sender.uid === loggedInUser.uid) {
			if (reactionData?.hasOwnProperty(loggedInUser?.uid)) {
				color = theme?.palette?.primary[theme?.palette?.mode];
			}
		} else {
			if (reactionData?.hasOwnProperty(loggedInUser?.uid)) {
				color = theme?.palette?.background[theme?.palette?.mode];
			} else {
				color = theme?.palette?.accent700[theme?.palette?.mode];
			}
		}
	} else {
		if (reactionData?.hasOwnProperty(loggedInUser?.uid)) {
			color = theme?.palette?.background[theme?.palette?.mode];
		} else {
			color = theme?.palette?.accent700[theme?.palette?.mode];
		}
	}
	return {
		color: color,
		font: fontHelper(theme?.palette?.caption1),
		padding: "0px 2px 0px 4px",
	};
};
