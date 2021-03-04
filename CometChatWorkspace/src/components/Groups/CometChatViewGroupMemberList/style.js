export const modalWrapperStyle = (props) => {

    const show = (props.open) ? {
        display: "block",
    } : {};

    const mq = [`@media (min-width : 320px) and (max-width: 767px)`];

    return {
        minWidth: "350px",
        minHeight: "450px",
        width: "50%",
        height: "40%",
        overflow: "hidden",
        backgroundColor: `${props.theme.backgroundColor.white}`,
        position: "fixed",
        left: "50%",
        top: "50%",
        transform: "translate(-50%, -50%)",
        zIndex: "1002",
        margin: "0 auto",
        boxShadow: "rgba(20, 20, 20, 0.2) 0 16px 32px, rgba(20, 20, 20, 0.04) 0 0 0 1px",
        borderRadius: "12px",
        display: "none",
        ...show,
        [mq[0]]: {
            width: "100%",
            height: "100%"
        }
    }
}

export const modalCloseStyle = (img) => {

    return {
        position: "absolute",
        width: "32px",
        height: "32px",
        borderRadius: "50%",
        top: "16px",
        right: "16px",
        background: `url(${img}) center center no-repeat`,
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

export const modalListStyle = (props) => {

    return {
        width: "100%",
        height: "calc(100% - 35px)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-start",
        alignItems: "flex-start",
    }
}

export const listHeaderStyle = (props) => {

    return {
        display: "flex",
        flexDirection: "row",
        justifyContent: "flex-start",
        alignItems: "center",
        fontWeight: "bold",
        padding: "8px",
        width: "100%",
        border: `1px solid ${props.theme.borderColor.primary}`,

    }
}

export const listStyle = (props) => {

    return {
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-start",
        alignItems: "flex-start",
        width: "100%",
        height: "calc(100% - 33px)",
        overflowY: "auto",
        border: `1px solid ${props.theme.borderColor.primary}`,
    }
}

export const nameColumnStyle = (props, editAccess) => {

    const mq = props.theme.breakPoints.map(x => `@media ${x}`);

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

export const scopeColumnStyle = (props) => {

    const mq = props.theme.breakPoints.map(x => `@media ${x}`);

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

export const actionColumnStyle = (props) => {

    const mq = props.theme.breakPoints.map(x => `@media ${x}`);

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