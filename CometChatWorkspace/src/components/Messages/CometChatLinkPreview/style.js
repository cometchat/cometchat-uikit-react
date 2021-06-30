export const messagePreviewContainerStyle = context => {

	return {
		display: "inline-block",
		borderRadius: "12px",
		backgroundColor: `${context.theme.backgroundColor.white}`,
		boxShadow: "0px 1px 2px 1px rgba(0,0,0,0.18)",
		alignSelf: "flex-start",
		width: "auto",
	};
};

export const messagePreviewWrapperStyle = () => {

    return {
        display: "flex",
        flexDirection: "column"
    }
}

export const previewImageStyle = (img) => {

    return {
        background: `url(${img}) no-repeat center center`,
        backgroundSize: "contain",
        height: "150px",
        margin: "12px 0",
    }
}

export const previewDataStyle = context => {

	return {
		borderTop: `1px solid  ${context.theme.borderColor.primary}`,
		borderBottom: `1px solid  ${context.theme.borderColor.primary}`,
		padding: "16px",
	};
};

export const previewTitleStyle = context => {

	return {
		whiteSpace: "pre-wrap",
		wordBreak: "break-word",
		textAlign: "left",
		width: "auto",
		color: `${context.theme.color.helpText}`,
		fontWeight: "700",
		marginBottom: "8px",
	};
};

export const previewDescStyle = context => {

	return {
		whiteSpace: "pre-wrap",
		wordBreak: "break-word",
		textAlign: "left",
		width: "auto",
		color: `${context.theme.color.helpText}`,
		fontStyle: "italic",
		fontSize: "13px",
	};
};

export const previewTextStyle = context => {

	return {
		whiteSpace: "pre-wrap",
		wordBreak: "break-word",
		textAlign: "left",
		width: "auto",
		".message__txt__wrapper": {
			backgroundColor: "transparent",
			color: `${context.theme.color.helpText}`,
			fontStyle: "normal",
			padding: "8px 0",
		},
	};
};

export const previewLinkStyle = context => {

	return {
		display: "flex",
		alignItems: "center",
		justifyContent: "center",
		padding: "12px",
		"> a": {
			display: "inline-block",
			color: `${context.theme.color.blue}`,
			fontWeight: "700",
		},
	};
};
