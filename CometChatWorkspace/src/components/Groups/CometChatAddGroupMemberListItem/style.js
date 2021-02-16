export const modalRowStyle = (props) => {

    return {
        border: `1px solid ${props.theme.borderColor.primary}`,
        display: "flex",
        width: "100%",
        fontSize: "14px",
        flexDirection: "row",
        justifyContent: "flex-start",
        alignItems: "center",
    }
}

export const modalColumnStyle = () => {

    return {
        padding: "8px",
        width: "100%",
    }
}

export const avatarStyle = () => {

    return {
        display: "inline-block",
        float: "left",
        width: "36px",
        height: "36px",
        marginRight: "8px",
    }
}

export const nameStyle = () => {

    return {
        margin: "10px",
        width: "calc(100% - 50px)",
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
    }
}

export const selectionColumnStyle = () => {

    return {
        padding: "8px",
        width: "50px",
    }
}

export const selectionBoxStyle = (inactiveStateImg, activeStateImg) => {

    return {
        display: "none",
        " + label": {
            display: "block",
            cursor: "pointer",
            background: `url(${inactiveStateImg}) right center / 16px no-repeat`,
            userSelect: "none",
            float: "right",
            padding: "8px",
        },
        "&:checked + label": {
            background: `url(${activeStateImg}) no-repeat right center`,
            backgroundSize: "16px",
        }
    }
}