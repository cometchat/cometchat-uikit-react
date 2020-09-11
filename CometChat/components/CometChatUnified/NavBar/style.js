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
        padding: "13px",
        cursor: "pointer"
    }
}

export const itemLinkStyle = (icon, activeStateIcon, isActive) => {

    let activeStateBg = (isActive) ? { background: `url(${activeStateIcon}) center center / 20px 21px no-repeat`, } : {};

    return {
        width: "20px",
        height: "21px",
        display: "inline-block",
        background: `url(${icon}) center center / 20px 21px no-repeat`,
        ...activeStateBg
    }
}