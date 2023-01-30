export const chatWrapperStyle = (props, state) => {
	let borderStyle = {};
	if (props._parent.trim().length === 0) {
		if (state.viewdetailscreen || state.threadmessageview) {
			borderStyle = {
				borderLeft: `1px solid ${props.theme.borderColor.primary}`,
				borderBottom: `1px solid ${props.theme.borderColor.primary}`,
			};
		} else {
			borderStyle = {
				borderLeft: `1px solid ${props.theme.borderColor.primary}`,
				borderRight: `1px solid ${props.theme.borderColor.primary}`,
				borderBottom: `1px solid ${props.theme.borderColor.primary}`,
			};
		}
	}

	const mq = [...props.theme.breakPoints];

	const secondaryViewWidth =
		state.threadmessageview || state.viewdetailscreen
			? {
					width: "calc(100% - 400px)",
					[`@media ${mq[1]}, ${mq[2]}`]: {
						width: "100%",
					},
					[`@media ${mq[3]}, ${mq[4]}`]: {
						width: "0",
						display: "none",
					},
			  }
			: {
					width: "100%",
			  };

	return {
		display: "flex",
		flexDirection: "column",
		height: "100%",
		boxSizing: "border-box",
		position: "relative",
		fontFamily: `${props.theme.fontFamily}`,
		...borderStyle,
		...secondaryViewWidth,
		"*": {
			boxSizing: "border-box",
			fontFamily: `${props.theme.fontFamily}`,
			"::-webkit-scrollbar": {
				width: "8px",
				height: "4px",
			},
			"::-webkit-scrollbar-track": {
				background: "#ffffff00",
			},
			"::-webkit-scrollbar-thumb": {
				background: "#ccc",
				"&:hover": {
					background: "#aaa",
				},
			},
		},
	};
};

export const chatSecondaryStyle = (props) => {
	const borderStyle =
		props._parent.trim().length === 0
			? {
					borderRight: `1px solid ${props.theme.borderColor.primary}`,
					borderBottom: `1px solid ${props.theme.borderColor.primary}`,
			  }
			: {};

	const mq = [...props.theme.breakPoints];

	return {
		float: "right",
		borderLeft: `1px solid ${props.theme.borderColor.primary}`,
		height: "100%",
		width: "400px",
		display: "flex",
		flexDirection: "column",
		order: "3",
		...borderStyle,
		[`@media ${mq[1]}, ${mq[2]}, ${mq[3]}, ${mq[4]}`]: {
			position: "absolute!important",
			right: "0!important",
			top: "0",
			bottom: "0",
			width: "100%!important",
			zIndex: "2",
			backgroundColor: `${props.theme.backgroundColor.white}`,
		},
	};
};

export const reactionsWrapperStyle = () => {
	return {
		position: "absolute",
		width: "100%",
		height: "100%",
		top: "0",
		right: "0",
		zIndex: "2",
		display: "flex",
		justifyContent: "left",
		alignItems: "center",
	};
};

export const messagePaneTopStyle = () => {
	return {
		top: "75px",
		position: "absolute",
		width: "auto",
		right: "auto",
		left: "50%",
		fontWeight: "700",
		zIndex: "200",
		transform: "translateX(-50%)",
	};
};

export const messagePaneBannerStyle = (props) => {
	return {
		marginBottom: "0",
		display: "block",
		fontSize: "13px",
		flex: "1",
		background: `${props.theme.color.blue}`,
		borderRadius: "6px",
		zIndex: 200,
	};
};

export const messagePaneUnreadBannerStyle = () => {
	return {
		height: "28px",
		borderRadius: "14px",
		display: "flex",
		flex: "1",
		alignItems: "center",
	};
};

export const messagePaneUnreadBannerMessageStyle = (props) => {
	return {
		padding: "0 16px",
		flex: "1",
		textAlign: "center",
		textShadow: "0 1px rgba(0, 0, 0, .15)",
		whiteSpace: "nowrap",
		overflow: "hidden",
		textOverflow: "ellipsis",
		color: `${props.theme.color.white}`,
	};
};

export const iconArrowDownStyle = () => {
	return {
		position: "relative",
		display: "inline-flex",
		height: "20px",
		alignItems: "center",
		justifyContent: "center",
		paddingRight: "8px",
	};
};

export const chatContainerStyle = () => {
	return {
		display: "flex",
		width: "100%",
		height: "100%",
	};
};
