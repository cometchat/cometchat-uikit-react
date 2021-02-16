export const groupWrapperStyle = () => {
    
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

export const groupHeaderStyle = (props) => {

    return {
        padding: "16px",
        position: "relative",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        borderBottom: `1px solid ${props.theme.borderColor.primary}`,
        height: "70px",
    }
}

export const groupHeaderCloseStyle = (img, props) => {

    const mq = [...props.theme.breakPoints];

    return {
        cursor: "pointer",
        display: "none",
        background: `url(${ img}) left center no-repeat`,
        height: "24px",
        width: "33%",
        [`@media ${mq[0]}`]: {
            display: "block!important"
        }
    }
}

export const groupHeaderTitleStyle = (props) => {

    const alignment = (props.hasOwnProperty("enableCloseMenu") && props.enableCloseMenu.length > 0) ? {
        width: "33%",
        textAlign: "center"
    } : {};

    return {
        margin: "0",
        fontWeight: "700",
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

export const groupAddStyle = (img) => {
    
    return {
        display: "block",
        height: "24px",
        cursor: "pointer",
    }
}

export const groupSearchStyle = () => {
    
    return {
        padding: "16px 16px",
        position: "relative",
    }
}

export const groupSearchInputStyle = (props, img) => {

    return {
        display: "block",
        width: "100%",
        border: "0",
        boxShadow: "rgba(20, 20, 20, 0.04) 0 0 0 1px inset",
        borderRadius: "8px",
        lineHeight: "20px",
        padding: "8px 8px 8px 40px",
        fontSize: "15px",
        outline: "none",
        color: `${props.theme.color.primary}`,
        background: `url(${img}) 10px center no-repeat ${props.theme.backgroundColor.grey}`,
    }
}

export const groupMsgStyle = () => {
    
    return {
        overflow: "hidden",
        width: "100%",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        position: "absolute",
        top: "50%"
    }
}

export const groupMsgTxtStyle = (props) => {

    return {
        margin: "0",
        height: "36px",
        color: `${props.theme.color.secondary}`,
        fontSize: "24px!important",
        fontWeight: "600",
        lineHeight: "30px",
    }
}

export const groupListStyle = () => {

    return {
        height: "calc(100% - 125px)",
        overflowY: "auto",
        margin: "0",
        padding: "0"
    }
}