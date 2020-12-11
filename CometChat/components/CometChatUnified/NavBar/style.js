export const footerStyle = () => {

    return {
        width: "100%",
        zIndex: "1",
    }
}

export const navbarStyle = () => {

    return {
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-around",
    }
}

export const itemStyle = () => {

    return {
        display: "inline-block",
        padding: "8px",
        cursor: "pointer"
    }
}

export const itemLinkStyle = (icon, activeStateIcon, isActive, key) => {

    let activeStateBg = (isActive) ? { background: `url(${activeStateIcon}) center center no-repeat`, } : {};

    let widthProp = {};

    if(key === "groups") {
        widthProp = { width: "31px" }
    } else if (key === "chats") {
        widthProp = { width: "22px" }
    } else {
        widthProp = { width: "20px" }
    }

    return {
        height: "20px",
        ...widthProp,
        display: "inline-block",
        background: `url(${icon}) center center no-repeat`,
        ...activeStateBg
    }
}