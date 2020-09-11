export const sectionStyle = (props) => {

    const containerHeight = (props.containerHeight) ? {
        height: `calc(100% - ${props.containerHeight})`
    } : {
        height: "calc(100% - 20px)"
    };
    
    return {
        width: "100%",
        ...containerHeight
    }
}

export const sectionHeaderStyle = (props) => {

    return {
        margin: "0",
        width: "100%",
        fontSize: "12px",
        fontWeight: "500!important",
        lineHeight: "20px",
        color: `${props.theme.color.secondary}`,
        textTransform: "uppercase",
    }
}

export const sectionContentStyle = () => {

    return {
        width: "100%",
        margin: "6px 0",
        display: "flex",
        flexDirection: "column",
        height: "calc(100% - 20px)"
    }
}

export const mediaBtnStyle = () => {

    return {
        borderRadius: "8px",
        backgroundColor: "rgba(20, 20, 20, 0.08)",
        width: "100%",
        padding: "2px",
        margin: "6px 0",
        clear: "both",
    }
}

export const buttonStyle = (state, type) => {

    const activeBtn = (state.messagetype === type) ? {
        backgroundColor : "#fff",
        boxShadow: "rgba(20, 20, 20, 0.04) 0 3px 1px, rgba(20, 20, 20, 0.12) 0 3px 8px",
        borderRadius: "7px",
        "&::before": {
            display: "none",
        }
    } : {};

    return {
        display: "inline-block",
        width: "33.33%",
        float: "left",
        fontSize: "13px",
        fontWeight: "500",
        lineHeight: "18px",
        padding: "5px",
        position: "relative",
        textAlign: "center",
        cursor: "pointer",
        ...activeBtn,
        "&:before": {
            "`content`": "",
            position: "absolute",
            display: "block",
            width: "2px",
            height: "16px",
            backgroundColor: "rgba(20, 20, 20, 0.12)",
            right: "-2px",
            top: "6px",
        },
        "&:last-of-type::before": {
            display: "none",
        }
    }
}

export const mediaItemStyle = () => {

    return {
        height: "calc(100% - 45px)",
        overflowY: "auto",
        overflowX: "hidden",
        display: "flex",
        flexWrap: "wrap",
        fontSize: "14px",
    }
}

export const itemStyle = (state, props, img) => {

    let itemTypeStyle = {};
    let bgColor = `${props.theme.backgroundColor.lightGrey}`;

    if (state.messagetype === "image") {

        itemTypeStyle = {
            height: "150px",
            lineHeight: "150px",
            "> img": {
                maxWidth: "100%",
                maxHeight: "100%",
                margin: "auto",
                backgroundColor: bgColor,
            }
        }
        
    } else if (state.messagetype === "video") {

        itemTypeStyle = {
            "> video": {
                width: "160px",
                maxHeight: "100%",
                margin: "auto",
            }
        }

    } else if (state.messagetype === "file") {

        itemTypeStyle = {
            backgroundColor: bgColor,
            "> a": {
                maxWidth: "100%",
                maxHeight: "100%",
                margin: "auto",
                backgroundColor: bgColor,
                display: "inline-block",
                padding: "10px",
                paddingLeft: "35px",
                fontSize: "13px",
                color: `${props.theme.color.primary}`,
                background: `url(${img}) no-repeat 10px center`,
                whiteSpace: "pre-wrap",
                wordWrap: "break-word",
                textAlign: "left",
                "&:hover, &:visited": {
                    color: `${props.theme.color.primary}`,
                }

            }
        }

    }

    return {
        margin: "0.5rem",
        textAlign: "center",
        flex: "1 0 auto",
        ...itemTypeStyle,
        "@for $i from 1 through 36": {
            "&:nth-of-type(#{$i})": {
            maxWidth: "100%",
            }
        }
    }
}