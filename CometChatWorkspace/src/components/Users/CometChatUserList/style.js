export const contactWrapperStyle = () => {
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

export const contactHeaderStyle = (theme) => {

    return {
        padding: "16px",
        position: "relative",
        display: "flex",
        alignItems: "center",
        borderBottom: `1px solid ${theme.borderColor.primary}`,
        height: "70px",
    }
}

export const contactHeaderCloseStyle = (img, props) => {

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

export const contactHeaderTitleStyle = (props) => {

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

export const contactSearchStyle = () => {
    
    return {
        padding: "16px",
        position: "relative"
    }
}

export const contactSearchInputStyle = (props, img) => {

    return {
        display: "block",
        width: "100%",
        border: "0",
        boxShadow: "rgba(20, 20, 20, 0.04) 0 0 0 1px inset",
        borderRadius: "8px",
        padding: "8px 8px 8px 40px",
        fontSize: "15px",
        outline: "none",
        color: `${props.theme.color.primary}`,
        background: `url(${img}) 10px center no-repeat ${props.theme.backgroundColor.grey}`,
    }
}

export const contactMsgStyle = () => {

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

export const contactMsgTxtStyle = (props) => {

    return {
        margin: "0",
        height: "36px",
        color: `${props.theme.color.secondary}`,
        fontSize: "24px!important",
        fontWeight: "600",
        lineHeight: "30px",
    }
}

export const contactListStyle = () => {
    
    return {
        height: "calc(100% - 125px)",
        overflowY: "auto",
        margin: "0",
        padding: "0"
    }
}

export const contactAlphabetStyle = () => {
    
    return {
        padding: "0 16px",
        margin: "5px 0",
        width: "100%",
        fontSize: "14px"
    }
}