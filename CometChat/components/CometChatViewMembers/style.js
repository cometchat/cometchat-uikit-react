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

export const modalBodyCtyle = () => {

    return {
        padding: "25px",
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
            "th": {
                padding: "8px",
                fontSize: "12px",
                textAlign: "left"
            }
        },
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

export const tableBodyStyle = (props) => {

    return {
        height: "325px",
        overflowY: "auto",
        display: "block",
    }
}

export const scopeColumnStyle = () => {

    const mq = [`@media (min-width : 320px) and (max-width: 767px)`];

    return {
        [mq[0]]: {
            width: "170px"
        }
    }
}

export const actionColumnStyle = () => {

    const mq = [`@media (min-width : 320px) and (max-width: 767px)`];

    return {
        width: "70px",
        [mq[0]]: {
            width: "55px"
        }
    }
}