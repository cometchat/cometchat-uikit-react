export const userInfoScreenStyle = (props) =>{

    return {
        display: "flex",
        flexDirection: "column!important",
        height: "calc(100% - 50px)",
        fontFamily: `${props.theme.fontFamily}`,
        "*": {
            boxSizing: "border-box",
            fontFamily: `${props.theme.fontFamily}`,
        }
    }
}

export const headerStyle = (props) => {

    return {
        padding: "16px",
        position: "relative",
        borderBottom: `1px solid ${props.theme.borderColor.primary}`,
        height: "70px",
        display: "flex",
        alignItems: "center",
    }
}

export const headerTitleStyle = () => {

    return {
        margin: "0",
        fontSize: "22px",
        fontWeight: "700",
        lineHeight: "26px",
    }
}

export const detailStyle = () => {

    return {
        padding: "16px",
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
        paddingLeft: "16px",
        "&[dir=rtl]": {
            paddingRight: "16px",
            paddingLeft: "0",
        }
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

export const userStatusStyle = (props) => {

    return {
        fontSize: "13px",
        margin: "0",
        color: `${props.theme.color.blue}`,
    }
}

export const optionsStyle = () => {

    return {
        height: "calc(100% - 145px)",
        overflowY: "auto",
        padding: "0 16px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "left",
        alignItems: "flex-start",
    }
}

export const optionTitleStyle = (props) => {

    return {
        margin: "5px 0",
        width: "100%",
        fontSize: "12px",
        color: `${props.theme.color.helpText}`,
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
        padding: "16px 16px 16px 36px",
        fontWeight: 600,
        background: `url(${img}) left center no-repeat`,
    }
}

export const optionNameStyle = () => {

    return {
        width: "100%",
    }
}
