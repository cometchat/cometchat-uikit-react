export const chatHeaderStyle = (props) => {

    return {
        padding: "16px",
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
        width: "calc(100% - 116px)",
    }
}

export const chatSideBarBtnStyle = (img, props) => {

    const displayValue = (props.hasOwnProperty("sidebar") && props.sidebar === 0) ? { display: "none!important"} : {};

    const mq = [`@media (min-width : 320px) and (max-width: 767px)`];

    return {
        cursor: "pointer",
        display: "none",
        background: `url(${img}) center center no-repeat`,
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
        margin: "0 16px",
    }
}

export const chatUserStyle = () => {

    const mq = [`@media (min-width : 320px) and (max-width: 767px)`];

    return {
        width: "calc(100% - 50px)",
        padding: "0",
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

        if (state.status.includes("typing")) {

            status = {
                color: `${props.theme.color.helpText}`,
                textTransform: "none",
                fontStyle: "italic"
            };
        }
        
    } else if (props.type === "group") {

        status = {
            color: `${props.theme.color.helpText}`,
        }

        if (state.status.includes("typing")) {

            status = {
                color: `${props.theme.color.helpText}`,
                fontStyle: "italic"
            };
        }
    }

    return {
        fontSize: "13px",
        width: "100%",

        ...status
    }
}

export const chatOptionWrapStyle = () => {

    return {
        display: "flex",
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        width: "auto",
    }
}

export const chatOptionStyle = (img) => {

    return {
        width: "24px",
        height: "24px",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        margin: "0 0 0 16px",
    }
}