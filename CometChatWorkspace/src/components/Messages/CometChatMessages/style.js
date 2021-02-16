export const chatWrapperStyle = (theme) => {

    return {
        display: "flex",
        flexDirection: "column",
        height: "100%",
        width: "100%",
        boxSizing: "border-box",
        position: "relative", 
        fontFamily: `${theme.fontFamily}`,
        "*": {
            boxSizing: "border-box",
            fontFamily: `${theme.fontFamily}`,
        }
    }
}

export const reactionsWrapperStyle = () => {

    return {
        position: "absolute", 
        width: "100%", 
        height: "100%", 
        top: "0", 
        right: "0",
        zIndex: "2",
        display: "flex",
        justifyContent: "left",
        alignItems: "center"
    }
}


export const messagePaneTopStyle = () => {

    return {
        top: "75px",
        position: "absolute",
        width: "auto",
        right: "auto",
        left: "50%",
        fontWeight: "700",
        zIndex: "200",
        transform: "translateX(-50%)",
    }
}

export const messagePaneBannerStyle = (props) => {

    return {
        marginBottom: "0",
        display: "block",
        fontSize: "13px",
        flex: "1",
        background: `${props.theme.color.blue}`,
        borderRadius: "6px",
        zIndex: 200,
    }
}

export const messagePaneUnreadBannerStyle = () => {

    return {
        height: "28px",
        borderRadius: "14px",
        display: "flex",
        flex: "1",
        alignItems: "center",
    }
}

export const messagePaneUnreadBannerMessageStyle = (props) => {

    return {
        padding: "0 16px",
        flex: "1",
        textAlign: "center",
        textShadow: "0 1px rgba(0, 0, 0, .15)",
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
        color: `${props.theme.color.white}`,
    }
}

export const iconArrowDownStyle = () => {

    return {
        position: "relative",
        display: "inline-flex",
        height: "20px",
        alignItems: "center",
        justifyContent: "center",
        paddingRight: "8px",
    }
}
