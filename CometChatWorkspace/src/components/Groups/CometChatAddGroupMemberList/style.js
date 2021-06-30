export const modalWrapperStyle = (context) => {

    const mq = context.theme.breakPoints.map(x => `@media ${x}`);

    return {
        minWidth: "350px",
        minHeight: "450px",
        width: "40%",
        height: "40%",
        overflow: "hidden",
        backgroundColor: `${context.theme.backgroundColor.white}`,
        position: "fixed",
        left: "50%",
        top: "50%",
        transform: "translate(-50%, -50%)",
        zIndex: "1002",
        margin: "0 auto",
        boxShadow: "rgba(20, 20, 20, 0.2) 0 16px 32px, rgba(20, 20, 20, 0.04) 0 0 0 1px",
        borderRadius: "12px",
        display: "block",
        [mq[0]]: {
            width: "100%",
            height: "100%"
        },
        [mq[1]]: {
            width: "100%",
            height: "100%"
        },
        [mq[2]]: {
            width: "100%",
            height: "100%"
        }
    }
}

export const modalCloseStyle = (img, context) => {

    return {
        position: "absolute",
        width: "32px",
        height: "32px",
        borderRadius: "50%",
        top: "16px",
        right: "16px",
        mask: `url(${img}) center center no-repeat`,
        backgroundColor: `${context.theme.primaryColor}`,
        cursor: "pointer",
    }
}

export const modalBodyStyle = () => {

    return {
        padding: "24px",
        height: "100%",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "flex-start",
    }
}

export const modalCaptionStyle = (dir) => {

    const textAlignStyle = (dir === "rtl") ? {
        textAlign: "right",
        paddingRight: "32px",
    } : { 
        textAlign: "left", 
    };

    return {
        fontSize: "20px",
        marginBottom: "16px",
        fontWeight: "bold",
        ...textAlignStyle,
        width: "100%",
    }
}

export const modalErrorStyle = (context) => {

    return {
        fontSize: "12px",
        color: `${context.theme.color.red}`,
        textAlign: "center",
        margin: "8px 0",
        width: "100%",
    };
}

export const modalSearchStyle = () => {
	return {
		fontWeight: "normal",
		marginBottom: "16px",
		width: "100%",
        height: "35px",
		borderRadius: "8px",
		boxShadow: "rgba(20, 20, 20, 0.04) 0 0 0 1px inset",
		backgroundColor: "rgba(20, 20, 20, 0.04)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
	};
};

export const searchButtonStyle = (img, context) => {

    return {
        width: "30px",
        height: "100%",
        padding: "8px",
        cursor: "default",
        mask: `url(${img}) 10px center no-repeat`,
        backgroundColor: `${context.theme.secondaryTextColor}!important`,
    }
}

export const searchInputStyle = () => {

    return {
        width: "calc(100% - 30px)",
        height: "100%",
        padding: "8px",
        fontSize: "15px",
        outline: "none",
        border: "none",
        backgroundColor: "transparent",
    };
}

export const modalListStyle = (context) => {

    const mq = [...context.theme.breakPoints];

    return {
        height: "calc(100% - 125px)",
        overflowY: "auto",
        display: "flex",
        width: "100%",
        flexDirection: "column",
        justifyContent: "flex-start",
        alignItems: "flex-start",
        [`@media ${mq[1]}, ${mq[2]}`]: {
            height: "100%"
        }
    }
}

export const modalFootStyle = (props, state, img, context) => {

    const loadingState = (state.addingMembers) ? {
        disabled: "true",
        pointerEvents: "none",
        background: `url(${img}) ${context.theme.primaryColor} no-repeat right 10px center`,
    } : {};

    const textMargin = state.addingMembers ? { marginRight: "24px" } : {};
    
    return {
        margin: "24px auto 0 auto",
        "button": {
            cursor: "pointer",
            padding: "8px 16px",
            backgroundColor: `${context.theme.primaryColor}`,
            borderRadius: "5px",
            color: "white",
            fontSize: "14px",
            outline: "0",
            border: "0",
            ...loadingState,
            "span": {
                ...textMargin
            }
        },
    }
}

export const contactMsgStyle = () => {

    return {
        overflow: "hidden",
        width: "100%",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "55%",
    }
}

export const contactMsgTxtStyle = context => {
	return {
		margin: "0",
		height: "30px",
		color: `${context.theme.color.secondary}`,
		fontSize: "20px!important",
		fontWeight: "600",
	};
};