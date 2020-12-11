export const modalWrapperStyle = (props) => {

    const show = (props.open) ? {
        display: "block",
    } : {};

    const mq = [`@media (min-width : 320px) and (max-width: 767px)`];

    return {
        minWidth: "350px",
        minHeight: "350px",
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
            height: "100%",
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
            display: "table",
            width: "100%",
            tableLayout: "fixed",
        }
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

export const tableBodyStyle = () => {

    return {
        height: "calc(100% - 40px)",
        overflowY: "auto",
        display: "block",
        "tr": {
            "td": {
                padding: "8px 0",
                fontSize: "14px",
                "input": {
                    width: "100%",
                    border: "none",
                    padding: "8px 16px",
                    fontSize: "14px",
                    outline: "none",
                },
                "select": {
                    outline: "none",
                    padding: "8px 16px",
                }
            }
        }
    }
}

export const tableErrorStyle = () => {

    return {
        fontSize: "12px",
        color: "red",
        textAlign: "center",
        display: "block",
    }
}

export const tableFootStyle = (props) => {

    return {
        display: "inline-block",
        "button": {
            cursor: "pointer",
            padding: "8px 16px",
            backgroundColor: `${props.theme.backgroundColor.blue}`,
            borderRadius: "5px",
            color: `${props.theme.color.white}`,
            fontSize: "14px",
            outline: "0",
            border: "0",
        },
        "tr": {
            border: "none",
            "td": {
                textAlign: "center",
            }
        },
    }
}

export const inputStyle = (props) => {

    return {
        display: "block",
        width: "100%",
        border: '0',
        boxShadow: "rgba(20, 20, 20, 0.04) 0 0 0 1px inset",
        borderRadius: "8px",
        backgroundColor: `${props.theme.backgroundColor.grey}`,
        color: `${props.theme.color.helpText}`,
        fontSize: "14px",
    }
}