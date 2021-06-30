export const modalWrapperStyle = (context) => {

    const mq = context.theme.breakPoints.map(x => `${x}`);

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
        [`@media ${mq[1]}, ${mq[2]}`]: {
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
        marginBottom: "8px",
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
		height: "31px",
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
    };
}

export const nameColumnStyle = (context) => {

    const mq = context.theme.breakPoints.map(x => `@media ${x}`);

    return {
        width: "calc(100% - 220px)",
        [mq[0]]: {
            width: "calc(100% - 185px)",
        },
        [mq[1]]: {
            width: "calc(100% - 185px)",
        },
        [mq[2]]: {
            width: "calc(100% - 185px)",
        },
    };
}

export const roleColumnStyle = context => {

	const mq = context.theme.breakPoints.map(x => `@media ${x}`);

	return {
		width: "150px",
		[mq[0]]: {
			width: "115px",
		},
		[mq[1]]: {
			width: "115px",
		},
		[mq[2]]: {
			width: "115px",
		},
	};
};

export const actionColumnStyle = () => {

    return {
        width: "70px"
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

export const contactMsgTxtStyle = (context) => {

    return {
        margin: "0",
        height: "30px",
        color: `${context.theme.color.secondary}`,
        fontSize: "20px!important",
        fontWeight: "600"
    }
}