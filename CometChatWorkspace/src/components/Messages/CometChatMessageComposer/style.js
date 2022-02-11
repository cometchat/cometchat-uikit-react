export const chatComposerStyle = props => {
	return {
		padding: "16px",
		background: props.background,
		zIndex: "1",
		order: "3",
		position: "relative",
		flex: "none",
		minHeight: "85px",
		borderRadius: props.cornerRadius,
		width: "100%",
	};
};



export const composerInputStyle = props => {
	return {
		display: "flex",
		width: props.width,
		flexDirection: "row",
		alignItems: "flex-end",
		position: "relative",
		zIndex: "2",
		padding: "0",
		borderRadius: props.inputCornerRadius,
		minHeight: "85px",
	};
};

export const inputInnerStyle = (props) => {
    
	//const borderRadiusVal = state.emojiViewer || state.stickerViewer ? { borderRadius: "0 0 8px 8px", } : { borderRadius: "8px", };

	return {
		flex: "1 1 auto",
		position: "relative",
		outline: "none",
		border: props.border,
		background: "#fff",
		display: "flex",
		flexDirection: "column",
		width: "100%",
		minHeight: "85px",
		//...borderRadiusVal,
		borderRadius: "inherit",
		
	};
};

export const messageInputStyle = (props, disabled) => {
	const disabledState = disabled
		? {
				pointerEvents: "none",
				opacity: "0.4",
		  }
		: {};

	return {
		width: "100%",
		minHeight: "50px",
		height: props.height,
		font: props.placeholderFont,
		color: props.placeholderColor,
		lineHeight: "20px",
		padding: "16px",
		outline: "none",
		overflowX: "hidden",
		overflowY: "auto",
		position: "relative",
		whiteSpace: "pre-wrap",
		wordWrap: "break-word",
		zIndex: "1",
		userSelect: "text",
		background: "#fff",
		...disabledState,
		"::before": {
			content: "attr(placeholder)",
			color: props.placeholderColor,
			pointerEvents: "none",
			display: "block" /* For Firefox */,
		},
	};
};

export const inputStickyStyle = (disabled, attachments, props) => {
	const disabledState = disabled
		? { pointerEvents: "none", }
		: {};

	const flexDirectionProp =
		attachments === null
			? { flexDirection: "row-reverse",  }
			: {};

	return {
		padding: "8px 16px",
		// height: "40px",
		//borderTop: `1px solid ${context.theme.borderColor.primary}`,
		backgroundColor: "rgba(20, 20, 20, 0.04)",
		display: "flex",
		justifyContent: "space-between",
		...flexDirectionProp,
		...disabledState,
		"&:empty:before": {
			pointerEvents: "none",
		},
	};
};

export const stickyAttachmentStyle = () => {
	return {
		display: "flex",
		width: "auto",
	};
};

export const attachmentIconStyle = () => {
	return {
		margin: "auto 0",
		width: "24px",
		height: "20px",
		cursor: "pointer",
	};
};

export const filePickerStyle = state => {
	const active = state.showFilePicker
		? { width: "calc(100% - 20px)", opacity: "1", }
		: {};

	return {
		width: "0",
		borderRadius: "8px",
		overflow: "hidden",
		zIndex: "1",
		opacity: "0",
		transition: "width 0.5s linear",
		...active,
	};
};

export const fileListStyle = () => {
	return {
		width: "100%",
		display: "flex",
		alignItems: "center",
		justifyContent: "center",
		padding: "0 0 0 16px",
	};
};

export const fileItemStyle = (img, context) => {
	return {
		height: "24px",
		cursor: "pointer",
		display: "flex",
		justifyContent: "center",
		alignItems: "center",
		margin: "0 16px 0 0",
		" > input": {
			display: "none",
		},
	};
};

export const stickyAttachButtonStyle = props => {
	return {
		display: "flex",
		alignItems: "center",
		justifyContent: "center",
		cursor: "pointer",
		width: "24px",
	};
};

export const attchButtonIconStyle = props => {
	return {
		width: "24px",
		height: "24px",
		display: "inline-block",
		WebkitMask: `url(${props.attachmentIconURL}) center center no-repeat`,
		backgroundColor: props.attachmentIconTint,
	};
}

export const stickyButtonStyle = props => {

	return {
		display: "flex",
		alignItems: "center",
		justifyContent: "center",
		cursor: "pointer",
		width: "auto",
	};
};

export const emojiButtonStyle = props => {
	return {
		height: "24px",
		cursor: "pointer",
		display: "flex",
		alignItems: "center",
		justifyContent: "center",
		margin: "0 0 0 16px",
	};
};

export const emojiBtnIconStyle = props => {

	return {
		width: "24px",
		height: "24px",
		display: "inline-block",
		WebkitMask: `url(${props.emojiIconURL}) center center no-repeat`,
		backgroundColor: props.emojiIconTint,
	};
}

export const sendButtonStyle = props => {
	return {
		height: "24px",
		cursor: "pointer",
		display: "flex",
		alignItems: "center",
		justifyContent: "center",
		margin: "0 0 0 16px",
	};
};

export const sendBtnIconStyle = props => {
	return {
		width: "24px",
		height: "24px",
		display: "inline-block",
		WebkitMask: `url(${props.sendButtonIconURL}) center center no-repeat`,
		backgroundColor: props.sendButtonIconTint,
	};
}

export const reactionBtnStyle = props => {
	return {
		cursor: "pointer",
		height: "24px",
		display: "flex",
		alignItems: "center",
		justifyContent: "center",
		margin: "0 0 0 16px",
	};
};

export const reactionBtnIconStyle = props => {
	return {
		font: props.liveReactionFont,
		color: props.liveReactionColor,
	};
}

export const stickerBtnStyle = props => {
	return {
		cursor: "pointer",
		height: "24px",
		display: "flex",
		alignItems: "center",
		justifyContent: "center",
		margin: "0 0 0 16px",
	};
};

export const stickerBtnIconStyle = (props, stickerTemplate) => {
	return {
		width: "24px",
		height: "24px",
		display: "inline-block",
		WebkitMask: `url(${stickerTemplate.icon}) center center no-repeat`,
		backgroundColor: props.emojiIconTint,
	};
};

export const fileInputStyle = props => {

	return {
		visibility: "hidden",
		position: "absolute",
		width: "0"
	}
}
