export const messageContainerStyle = () => {

    return {
        alignSelf: "flex-start",
        marginBottom: "16px",
        paddingLeft: "16px",
        paddingRight: "16px",
        maxWidth: "65%",
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
        display: "flex",
        alignSelf: "flex-start",
    }
}

export const messageTxtWrapperStyle = context => {

	return {
		display: "inline-block",
		borderRadius: "12px",
		backgroundColor: `${context.theme.backgroundColor.secondary}`,
		padding: "8px 16px",
		width: "auto",
	};
};

export const messageTxtStyle = (showVariation, count, context) => {

    let emojiAlignmentProp = {
        " > img": {
            width: "24px",
            height: "24px",
            display: "inline-block",
            verticalAlign: "top",
            zoom: "1",
            margin: "0 2px"
        }
    };

    let emojiProp = {};

    if (count === 1) {
        emojiProp = {
            "> img": {
                width: "48px",
                height: "48px",
            }
        };
    } else if (count === 2) {
        emojiProp = {
            "> img": {
                width: "36px",
                height: "36px",
            }
        };
    } else if (count > 2) {
        emojiProp = {
            "> img": {
                width: "24px",
                height: "24px",
            }
        };
    }


    if (showVariation === false) {
        emojiProp = {
            "> img": {
                width: "24px",
                height: "24px",
            }
        };
    }

    return {
        margin: "0",
        fontSize: "15px",
        whiteSpace: "pre-wrap",
        wordBreak: "break-word",
        textAlign: "left",
        width: "auto",
        color: `${context.theme.color.primary}`,
        lineHeight: "20px",
        fontWeight: "400",
        " a": {
            color: "#0432FF",
            "&:hover": {
                color: "#04009D"
            }
        },
        " a[href^='mailto:']": {
            color: "#F38C00",
            "&:hover": {
                color: "#F36800"
            }
        },
        " a[href^='tel:']": {
            color: "#3802DA",
            "&:hover": {
                color: "#2D038F"
            }
        },
        ...emojiAlignmentProp,
        ...emojiProp
    }
}

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
