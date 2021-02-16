export const modalWrapperStyle = (props) => {

    const show = (props.open) ? {
        display: "block",
    } : {};

    const mq = [`@media (min-width : 320px) and (max-width: 767px)`];

    return {
        minWidth: "350px",
        minHeight: "450px",
        width: "40%",
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

export const modalTableStyle = (props) => {

    return {
        borderCollapse: "collapse",
        margin: "0",
        padding: "0",
        width: "100%",
        height: "90%",
        "tr": {
            border: `1px solid ${props.theme.borderColor.primary}`,
            display: "table",
            width: "100%",
            tableLayout: "fixed",
        },
        "th": {
            padding: "8px",
            fontSize: "12px",
            textAlign: "left"
        }
    }
}

export const tableCaptionStyle = (dir) => {

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
        ...textAlignStyle
    }
}

export const tableBodyStyle = () => {

    return {
        height: "340px",
        overflowY: "auto",
        display: "block"
    }
}

export const roleColumnStyle = () => {

    const mq = [`@media (min-width : 320px) and (max-width: 767px)`];

    return {
        width: "150px",
        [mq[0]]: {
            width: "115px"
        }
    }
}

export const actionColumnStyle = () => {

    return {
        width: "70px"
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

export const contactMsgTxtStyle = (props) => {

    return {
        margin: "0",
        height: "30px",
        color: `${props.theme.color.secondary}`,
        fontSize: "24px!important",
        fontWeight: "600"
    }
}