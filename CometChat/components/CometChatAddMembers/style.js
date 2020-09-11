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

export const modalBodyCtyle = () => {

    return {
        padding: "25px",
        height: "100%",
        width: "100%",
    }
}

export const modalTableStyle = () => {

    return {
        borderCollapse: "collapse",
        margin: "0",
        padding: "0",
        width: "100%",
        height: "80%",
    }
}

export const tableCaptionStyle = () => {

    return {
        fontSize: "20px",
        marginBottom: "15px",
        fontWeight: "bold",
        textAlign: "left",
    }
}

export const tableSearchStyle = () => {

    return {
        fontWeight: "normal",
        marginBottom: "15px",
    }
}

export const searchInputStyle = (props, img) => {

    return {
        width: "100%",
        border: "0",
        boxShadow: "rgba(20, 20, 20, 0.04) 0 0 0 1px inset",
        borderRadius: "8px",
        padding: "6px 8px 6px 35px",
        fontSize: "15px",
        outline: "none",
        color: `${props.theme.color.primary}`,
        background: `url(${img}) 10px center no-repeat ${props.theme.backgroundColor.grey}`,
    }
}

export const tableBodyStyle = (props) => {

    const mq = [`@media (min-width : 320px) and (max-width: 767px)`];
    
    return {
        height: "100%",
        overflowY: "auto",
        display: "block",
        "tr": {
            border: `1px solid ${props.theme.borderColor.primary}`,
            display: "table",
            width: "100%",
            tableLayout: "fixed",
        },
        [mq[0]]: {
            height: "100%"
        }
    }
}

export const tableFootStyle = (props) => {

    return {

        "button": {
            cursor: "pointer",
            padding: "10px 20px",
            backgroundColor: `${props.theme.backgroundColor.blue}`,
            borderRadius: "5px",
            color: `${props.theme.color.white}`,
            fontSize: "14px",
            outline: "0",
            border: "0",
        },
        "tr": {
            border: "none",
        },
        "td": {
            textAlign: "center",
        }
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