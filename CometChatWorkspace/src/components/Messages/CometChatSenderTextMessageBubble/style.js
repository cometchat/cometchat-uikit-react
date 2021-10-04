export const messageContainerStyle = () => {

    return {
        alignSelf: "flex-end",
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
        alignSelf: "flex-end",
        display: "flex",
        flex: "1 1"
    }
}

export const messageTxtWrapperStyle = context => {

	return {
		display: "inline-block",
		borderRadius: "12px",
		backgroundColor: `${context.theme.primaryColor}`,
		color: `${context.theme.color.white}`,
		padding: "8px 16px",
		width: "auto",
	};
};

export const messageTxtStyle = (props, parsedMessage, emojiMessage, showVariation) => {

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
    let heightProp = {};

    if (parsedMessage.length === emojiMessage.length && emojiMessage.length === 1) {
        emojiProp = {
           "> img": {
                width: "48px",
                height: "48px",
           }
        };
        heightProp = {
            height: "48px",
        };
    } else if (parsedMessage.length === emojiMessage.length && emojiMessage.length === 2) {
        emojiProp = {
            "> img": {
                width: "36px",
                height: "36px",
            }
        };
        heightProp = {
            height: "36px",
        };
    } else if (parsedMessage.length === emojiMessage.length && emojiMessage.length > 2) {
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
        fontSize: "14px",
        whiteSpace: "pre-wrap",
        wordBreak: "break-word",
        textAlign: "left",
        width: "auto",
        ...heightProp,
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
        alignSelf: "flex-end",
        display: "flex",
        justifyContent: "flex-end",
        alignItems: "center",
        height: "25px",
        padding: "4px 8px",
    }
}

export const messageReactionsWrapperStyle = () => {

    return {
        display: "flex",
        alignSelf: "flex-end",
        width: "100%",
        flexWrap: "wrap",
        justifyContent: "flex-end",
        minHeight: "36px"
    }
}
