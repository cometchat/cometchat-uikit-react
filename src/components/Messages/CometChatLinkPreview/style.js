export const messagePreviewContainerStyle = () => {

	return {
		display: "inline-block",
		borderRadius: "12px",
		backgroundColor: `#fff`,
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

export const previewDataStyle = () => {

	return {
		borderTop: `1px solid #eaeaea`,
		borderBottom: `1px solid #eaeaea`,
		padding: "16px",
	};
};

export const previewTitleStyle = () => {

	return {
		whiteSpace: "pre-wrap",
		wordBreak: "break-word",
		textAlign: "left",
		width: "auto",
		color: `rgba(20, 20, 20, 0.6)`,
		fontWeight: "700",
		marginBottom: "8px",
	};
};

export const previewDescStyle = () => {

	return {
		whiteSpace: "pre-wrap",
		wordBreak: "break-word",
		textAlign: "left",
		width: "auto",
		color: `rgba(20, 20, 20, 0.6)`,
		fontStyle: "italic",
		fontSize: "13px",
	};
};

export const previewTextStyle = () => {

	return {
		whiteSpace: "pre-wrap",
		wordBreak: "break-word",
		textAlign: "left",
		width: "auto",
		".message__txt__wrapper": {
			backgroundColor: "transparent",
			color: `rgba(20, 20, 20, 0.6)`,
			fontStyle: "normal",
			padding: "8px 0",
		},
	};
};

export const previewLinkStyle = () => {

	return {
		display: "flex",
		alignItems: "center",
		justifyContent: "center",
		padding: "12px",
		"> a": {
			display: "inline-block",
			color: `#39f`,
			fontWeight: "700",
		},
	};
};
