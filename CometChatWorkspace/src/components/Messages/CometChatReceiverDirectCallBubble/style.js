export const messageContainerStyle = () => {

    return {
        alignSelf: "flex-start",
        marginBottom: "16px",
        paddingLeft: "16px",
        paddingRight: "16px",
        maxWidth: "305px",
        clear: "both",
        position: "relative",
        display: "flex",
        flexDirection: "column",
        flexShrink: "0",
    }
}

export const messageWrapperStyle = () => {

    return {
        width: "auto",
        flex: "1 1",
        alignSelf: "flex-start",
        display: "flex",
    }
}

export const messageThumbnailStyle = () => {

    return {
        width: "36px",
        height: "36px",
        margin: "10px 5px",
        float: "left",
        flexShrink: "0",
    }
}

export const messageDetailStyle = () => {

    return {
        flex: "1 1",
        display: "flex",
        flexDirection: "column",
    }
}

export const nameWrapperStyle = (avatar) => {

    const paddingValue = (avatar) ? {
        padding: "3px 5px",
    } : {};

    return {
        alignSelf: "flex-start",
        ...paddingValue
    }
}

export const nameStyle = context => {

	return {
		fontSize: "11px",
		color: `${context.theme.color.search}`,
	};
};

export const messageTxtContainerStyle = () => {

    return {
        width: "auto",
        flex: "1 1",
        alignSelf: "flex-start",
        display: "flex",
        "img": {
            width: "35px"
        }
    }
}

export const messageTxtWrapperStyle = context => {

	return {
		display: "flex",
		flexDirection: "column",
		borderRadius: "12px",
		backgroundColor: `${context.theme.backgroundColor.secondary}`,
		padding: "16px",
		alignSelf: "flex-start",
		width: "100%",
		minHeight: "106px",
	};
};

export const messageTxtTitleStyle = context => {

	return {
		display: "flex",
		justifyContent: "center",
		alignItems: "center",
		color: `${context.theme.color.primary}`,
	};
};

export const messageTxtStyle = () => {

    return {
        margin: "0",
        whiteSpace: "pre-wrap",
        wordWrap: "break-word",
        textAlign: "left",
        width: "calc(100% - 30px)",
        fontSize: "14px",
        marginLeft: "8px"
    }
}

export const messageBtnStyle = context => {

	return {
		listStyleType: "none",
		padding: "0",
		margin: "16px 0 0 0",
		li: {
			backgroundColor: `${context.theme.backgroundColor.white}`,
			borderRadius: "8px",
			display: "flex",
			justifyContent: "center",
			alignItems: "center",
			width: "100%",
			cursor: "pointer",
			position: "relative",
			margin: "0",
			padding: "8px",
			"> p": {
				background: "0 0",
				textAlign: "center",
				color: `${context.theme.primaryColor}`,
				width: "100%",
				display: "inline-block",
				fontSize: "14px",
				fontWeight: "600",
				margin: "0",
			},
		},
	};
};


export const messageInfoWrapperStyle = () => {

    return {
        alignSelf: "flex-start",
        padding: "4px 8px",
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-start",
        height: "25px"
    }
}

export const messageReactionsWrapperStyle = () => {

    return {
        display: "flex",
        alignSelf: "flex-start",
        width: "100%",
        flexWrap: "wrap",
        justifyContent: "flex-start",
        minHeight: "36px",
    }
}

export const iconStyle = (img, context) => {
	return {
		width: "30px",
		height: "24px",
		display: "inline-block",
		mask: `url(${img}) center center no-repeat`,
		backgroundColor: `${context.theme.primaryColor}`,
	};
};
