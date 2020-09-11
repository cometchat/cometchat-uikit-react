export const chatHeaderStyle = (props) => {

    return {
        padding: "14px 16px",
        width: "100%",
        backgroundColor: `${props.theme.backgroundColor.white}`,
        zIndex: "1",
        borderBottom: `1px solid ${props.theme.borderColor.primary}`,
        display: "flex",
        flexDirection: "row",
        justifyContent: "space-between",
    }
}

export const chatDetailStyle = () => {

    return {
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        width: "calc(100% - 100px)",
    }
}

export const chatSideBarBtnStyle = (img, props) => {

    const displayValue = (props.hasOwnProperty("sidebar") && props.sidebar === 0) ? { display: "none!important"} : {};

    const mq = [`@media (min-width : 320px) and (max-width: 767px)`];

    return {
        cursor: "pointer",
        display: "none",
        background: `url(${img}) center center no-repeat`,
        padding: "20px",
        width: "24px",
        height: "24px",
        float: "left",
        [mq[0]]: {
            display: "block"
        },
        ...displayValue
    }
}

export const chatThumbnailStyle = () => {

    return {
        display: "inline-block",
        width: "36px",
        height: "36px",
        flexShrink: "0",
    }
}

export const chatUserStyle = () => {

    const mq = [`@media (min-width : 320px) and (max-width: 767px)`];

    return {
        width: "calc(100% - 50px)",
        padding: "0 14px",
        flexGrow: "1",
        display: "flex",
        flexDirection: "column",
        [mq[0]]: {
            width: "calc(100% - 80px)!important"
        }
    }
}

export const chatNameStyle = () => {

    return {
        margin: "0",
        fontSize: "15px",
        fontWeight: "600",
        width: "100%",
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
    }
}

export const chatStatusStyle = (props, state) => {

    let status = {};
    if (props.type === "user") {
        status = {
            color: `${props.theme.color.blue}`,
            textTransform: "capitalize",
        };

        if (state.presence === "offline") {
            status = {
                color: `${props.theme.color.helpText}`,
                textTransform: "capitalize",
            }
        }
    } else if (props.type === "group") {

        status = {
            color: `${props.theme.color.helpText}`,
        }
    }

    return {
        fontSize: "13px",
        lineHeight: "20px",
        width: "100%",
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
        ...status
    }
}

export const chatOptionWrapStyle = () => {

    return {
        display: "flex",
        flexDirection: "row",
        justifyContent: "flex-end",
        alignItems: "center",
        width: "100px",
    }
}

export const chatOptionStyle = (img) => {

    return {
        display: "inline-block",
        width: "20px",
        height: "20px",
        margin: "0 10px",
        cursor: "pointer",
        background: `url(${img}) center center no-repeat`,
        '&:first-of-type': {
            marginLeft: 0,
        },
        '&:last-of-type': {
            marginRight: 0,
        }
    }
}