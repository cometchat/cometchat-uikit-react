export const messageReactionsStyle = (props, reactionData, context, loggedInUser) => {

	const uid = loggedInUser?.uid;
	let borderStyle = {};
	let hoveredBorderStyle = {};

	if (reactionData.hasOwnProperty(uid)) {
		borderStyle = {
			border: `1px solid ${context.theme.primaryColor}`,
		};

		hoveredBorderStyle = { ...borderStyle };
	} else {
		borderStyle = {
			border: "1px solid transparent",
		};

		hoveredBorderStyle = {
			border: `1px solid ${context.theme.borderColor.primary}`,
		};
	}

	return {
		fontSize: "11px",
		padding: "2px 6px",
		display: "inline-flex",
		alignItems: "center",
		verticalAlign: "top",
		backgroundColor: `${context.theme.backgroundColor.secondary}`,
		borderRadius: "12px",
		margin: "4px 4px 0 0",
		...borderStyle,
		".emoji-mart-emoji": {
			display: "inline-flex",
			alignItems: "center",
			justifyContent: "center",
			cursor: "pointer",
		},
		"&:hover": {
			...hoveredBorderStyle,
		},
	};
};

export const emojiButtonStyle = (img, context) => {

    return {
        outline: "0",
        border: "0",
        borderRadius: "4px",
        alignItems: "center",
        display: "inline-flex",
        justifyContent: "center",
        position: "relative",
        "i": {
            height: "24px",
            width: "24px",
            mask: `url(${img}) center center no-repeat`,
			backgroundColor: `${context.theme.secondaryTextColor}`,
        }        
    }
}

export const reactionCountStyle = context => {

	return {
		color: `${context.theme.color.primary}`,
		padding: "0 1px 0 3px",
	};
};
