export const groupWrapperStyle = () => {
    
    return {
        display: "flex",
        flexDirection: "column",
        height: "100%",
        boxSizing: "border-box",
        "*": {
            boxSizing: "border-box",
        }
    }
}

export const groupHeaderStyle = (theme) => {

    return {
        padding: "19px 16px",
        position: "relative",
        display: "flex",
        alignItems: "center",
        borderBottom: `1px solid ${theme.borderColor.primary}`
    }
}

export const groupHeaderCloseStyle = (img) => {

    const mq = [`@media (min-width : 320px) and (max-width: 767px)`];

    return {
        cursor: "pointer",
        display: "none",
        background: `url(${ img}) left center no-repeat`,
        height: "24px",
        width: "33%",
        [mq[0]]: {
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
        width: "66%",
        textAlign: "left",
        fontSize: "20px",
        ...alignment
    }
}

export const groupAddStyle = (img) => {
    
    return {
        display: "block",
        height: "20px",
        background: `url(${img}) right center no-repeat`,
        cursor: "pointer",
        width: "35%"
    }
}

export const groupSearchStyle = () => {
    
    return {
        padding: "16px 16px",
        position: "relative",
    }
}

export const groupSearchInputStyle = (theme, img) => {

    return {
        display: "block",
        width: "100%",
        border: "0",
        boxShadow: "rgba(20, 20, 20, 0.04) 0 0 0 1px inset",
        borderRadius: "8px",
        lineHeight: "20px",
        padding: "6px 8px 6px 30px",
        fontSize: "15px",
        outline: "none",
        color: `${theme.color.primary}`,
        background: `url(${img}) 10px center no-repeat ${theme.backgroundColor.grey}`,
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

export const groupMsgTxtStyle = (theme) => {

    return {
        margin: "0",
        height: "30px",
        color: `${theme.color.secondary}`,
        fontSize: "24px!important",
        fontWeight: "600"
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