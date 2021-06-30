export const modalWrapperStyle = (context) => {

    const mq = context.theme.breakPoints.map(x => `@media ${x}`);

    return {
        minWidth: "350px",
        minHeight: "450px",
        width: "50%",
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
        [mq[1]]: {
            width: "100%",
            height: "100%"
        },
        [mq[2]]: {
            width: "100%",
            height: "100%"
        },
        [mq[3]]: {
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
        width: "100%"
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

export const modalErrorStyle = context => {
	return {
		fontSize: "12px",
		color: `${context.theme.color.red}`,
		textAlign: "center",
		padding: "8px 0",
		width: "100%",
        height: "31px"
	};
};

export const modalListStyle = () => {

    return {
        width: "100%",
        height: "calc(100% - 70px)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-start",
        alignItems: "flex-start",
    }
}

export const listHeaderStyle = (context) => {

    return {
        display: "flex",
        flexDirection: "row",
        justifyContent: "flex-start",
        alignItems: "center",
        fontWeight: "bold",
        padding: "8px",
        width: "100%",
        border: `1px solid ${context.theme.borderColor.primary}`,
    }
}

export const listStyle = () => {

    return {
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-start",
        alignItems: "flex-start",
        width: "100%",
        height: "calc(100% - 33px)",
        overflowY: "auto",
    }
}

export const nameColumnStyle = (context, editAccess) => {

    const mq = context.theme.breakPoints.map(x => `@media ${x}`);

    const widthProp = (editAccess === null) ? {

        width: "calc(100% - 180px)",
        [mq[1]]: {
            width: "calc(100% - 140px)",
        },
        [mq[2]]: {
            width: "calc(100% - 180px)",
        }

    } : {
        width: "calc(100% - 260px)",
        [mq[1]]: {
            width: "calc(100% - 220px)",
        },
        [mq[2]]: {
            width: "calc(100% - 260px)",
        },
        [mq[3]]: {
            width: "calc(100% - 240px)",
        }
    };

    return {
        ...widthProp
    }
}

export const scopeColumnStyle = (context) => {

    const mq = context.theme.breakPoints.map(x => `@media ${x}`);

    return {
        width: "180px",
        marginRight: "8px",
        [mq[1]]: {
            width: "140px"
        },
        [mq[2]]: {
            width: "180px",
        },
        [mq[3]]: {
            width: "120px",
        }
    }
}

export const actionColumnStyle = (context) => {

    const mq = context.theme.breakPoints.map(x => `@media ${x}`);

    return {
        width: "70px",
        [mq[1]]: {
            width: "40px"
        },
        [mq[2]]: {
            width: "40px"
        }
    }
}