export const chatsWrapperStyle = () => {

    return {
        display: "flex",
        flexDirection: "column",
        height: "100%",
        boxSizing: "border-box",
        "*": {
            boxSizing: "border-box",
            "::-webkit-scrollbar": {
                width: "8px",
                height: "4px",
            },
            "::-webkit-scrollbar-track": {
                background: "#ffffff00"
            },
            "::-webkit-scrollbar-thumb": {
                background: "#ccc",
                "&:hover": {
                    background: "#aaa"
                }
            }
        }
    }
}

export const chatsHeaderStyle = (props) => {

    return {
        padding: "16px",
        display: "flex",
        alignItems: "center",
        borderBottom: `1px solid ${props.theme.borderColor.primary}`,
        height: "69px",
    }
}

export const chatsHeaderCloseStyle = (img, props) => {

    const mq = [...props.theme.breakPoints];

    return {
        cursor: "pointer",
        display: "none",
        background: `url(${img}) left center no-repeat`,
        height: "24px",
        width: "33%",
        [`@media ${mq[0]}`]: {
            display: "block!important"
        }
    }
}

export const chatsHeaderTitleStyle = (props) => {

    const alignment = (props.hasOwnProperty("enableCloseMenu") && props.enableCloseMenu.length > 0) ? {
        width: "33%",
        textAlign: "center"
    } : {};
    
    return {
        margin: "0",
        display: "inline-block",
        width: "100%",
        textAlign: "left",
        fontSize: "20px",
        ...alignment,
        "&[dir=rtl]": {
            textAlign: "right",
        }
    }
}

export const chatsMsgStyle = () =>{

    return {
        overflow: "hidden",
        width: "100%",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        position: "absolute",
        top: "50%",
    }
}

export const chatsMsgTxtStyle = (props) => {

    return {
        margin: "0",
        height: "36px",
        color: `${props.theme.color.secondary}`,
        fontSize: "24px!important",
        fontWeight: "600",
        lineHeight: "30px",
    }
}

export const chatsListStyle = () => {

    return {
        height: "calc(100% - 75px)",
        width: "100%",
        overflowY: "auto",
        margin: "0",
        padding: "0",
    }
}