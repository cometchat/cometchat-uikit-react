export const userInfoScreenStyle = (theme) =>{

    return {
        display: "flex",
        flexDirection: "column!important",
        height: "calc(100% - 50px)",
        fontFamily: `${theme.fontFamily}`,
        "*": {
            boxSizing: "border-box",
            fontFamily: `${theme.fontFamily}`,
        }
    }
}

export const headerStyle = (theme) => {

    return {
        padding: "19px 16px",
        position: "relative",
        borderBottom: `1px solid ${theme.borderColor.primary}`
    }
}

export const headerTitleStyle = () => {

    return {
        margin: "0",
        fontWeight: "700",
        fontSize: "22px"
    }
}

export const detailStyle = () => {

    return {
        padding: "19px 16px",
        display: "flex",
        flexDirection: "row",
        justifyContent: "left",
        alignItems: "center",
    }
}

export const thumbnailStyle = () => {

    return {
        display: "inline-block",
        width: "36px",
        height: "36px",
        flexShrink: "0",
    }
}

export const userDetailStyle = () => {
    
    return {
        width: "calc(100% - 45px)",
        flexGrow: "1",
        paddingLeft: "15px",
    }
}

export const userNameStyle = () => {

    return {
        margin: "0",
        fontSize: "15px",
        fontWeight: "600",
        display: "block",
        maxWidth: "100%",
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
    }
}

export const userStatusStyle = (theme) => {

    return {
        fontSize: "13px",
        margin: "0",
        color: `${theme.color.blue}`,
    }
}

export const optionsStyle = () => {

    return {
        height: "calc(100% - 196px)",
        overflowY: "auto",
        padding: "0 16px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "left",
        alignItems: "flex-start",
    }
}

export const optionTitleStyle = (theme) => {

    return {
        margin: "5px 0",
        width: "100%",
        fontSize: "12px",
        color: `${theme.color.secondary}`,
        textTransform: "uppercase",
    }
}

export const optionListStyle = () => {

    return {
        padding: "10px 0",
        width: "100%",
        fontSize: "15px"
    }
}

export const optionStyle = (img) => {

    return {
        width: "100%",
        padding: "15px 15px 15px 48px",
        fontWeight: 600,
        background: `url(${img}) 16px center no-repeat`,
    }
}

export const optionNameStyle = () => {

    return {
        width: "100%",
    }
}