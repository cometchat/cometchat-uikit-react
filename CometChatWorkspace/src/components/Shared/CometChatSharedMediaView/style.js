export const sectionStyle = (props) => {
	const containerHeightProp = props.containerHeight
		? {
				height: `calc(100% - ${props.containerHeight})`,
		  }
		: {
				height: "calc(100% - 20px)",
		  };

	return {
		width: "100%",
		...containerHeightProp,
	};
};

export const sectionHeaderStyle = (props) => {
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
		display: "flex",
		flexDirection: "column",
		height: "calc(100% - 20px)",
	};
};

export const mediaBtnStyle = () => {
	return {
		borderRadius: "8px",
		backgroundColor: "rgba(20, 20, 20, 0.08)",
		width: "100%",
		padding: "2px",
		margin: "6px 0",
		clear: "both",
	};
};

export const buttonStyle = (state, type) => {
	const activeBtn =
		state.messagetype === type
			? {
					backgroundColor: "#fff",
					boxShadow:
						"rgba(20, 20, 20, 0.04) 0 3px 1px, rgba(20, 20, 20, 0.12) 0 3px 8px",
					borderRadius: "7px",
					"&::before": {
						display: "none",
					},
			  }
			: {};

	return {
		display: "inline-block",
		width: "33.33%",
		float: "left",
		fontSize: "13px",
		fontWeight: "500",
		lineHeight: "18px",
		padding: "5px",
		position: "relative",
		textAlign: "center",
		cursor: "pointer",
		...activeBtn,
		"&:before": {
			"`content`": "",
			position: "absolute",
			display: "block",
			width: "2px",
			height: "16px",
			backgroundColor: "rgba(20, 20, 20, 0.12)",
			right: "-2px",
			top: "6px",
		},
		"&:last-of-type::before": {
			display: "none",
		},
	};
};

export const mediaItemStyle = () => {
	return {
		height: "calc(100% - 45px)",
		overflowY: "auto",
		overflowX: "hidden",
		display: "flex",
		flexWrap: "wrap",
		fontSize: "14px",
	};
};

export const itemStyle = (state, props, img, context) => {
	let itemTypeStyle = {};
	let bgColor = `${props.theme.backgroundColor.lightGrey}`;

	if (state.messagetype === "image") {
		itemTypeStyle = {
			height: "120px",
			width: "120px",
			backgroundColor: bgColor,
			"> img": {
				display: "block",
				width: "100%",
				height: "100%",
				objectFit: "contain",
			},
		};
	} else if (state.messagetype === "video") {
		itemTypeStyle = {
			"> video": {
				height: "120px",
				width: "120px",
				margin: "auto",
			},
		};
	} else if (state.messagetype === "file") {
		itemTypeStyle = {
			backgroundColor: bgColor,
			"> a": {
				maxWidth: "100%",
				maxHeight: "100%",
				margin: "auto",
				display: "flex",
				padding: "8px",
				"&:hover, &:visited": {
					color: `${props.theme.secondaryTextColor}`,
				},
				"> i": {
					width: "30px",
					height: "24px",
					display: "inline-block",
					mask: `url(${img}) left center no-repeat`,
					backgroundColor: `${context.theme.secondaryTextColor}`,
				},
				"> span": {
					fontSize: "13px",
					color: `${props.theme.secondaryTextColor}`,
					whiteSpace: "pre-wrap",
					wordWrap: "break-word",
					textAlign: "left",
					width: "calc(100% - 30px)",
				},
			},
		};
	}

	return {
		margin: "0.5rem",
		textAlign: "center",
		flex: "1 0 auto",
		...itemTypeStyle,
		"@for $i from 1 through 36": {
			"&:nth-of-type(#{$i})": {
				maxWidth: "100%",
			},
		},
	};
};
