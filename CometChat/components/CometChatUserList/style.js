export const contactWrapperStyle = () => {
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

export const contactHeaderStyle = (theme) => {

    return {
        padding: "19px 16px",
        position: "relative",
        display: "flex",
        alignItems: "center",
        borderBottom: `1px solid ${theme.color.darkSecondary}`
    }
}

export const contactHeaderCloseStyle = (img) => {

    const mq = [`@media (min-width : 320px) and (max-width: 767px)`];

    return {
        cursor: "pointer",
        display: "none",
        background: `url(${img}) left center no-repeat`,
        height: "24px",
        width: "33%",
        [mq[0]]: {
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
        width: "66%",
        textAlign: "left",
        fontSize: "20px",
        ...alignment
    }
}

export const contactSearchStyle = () => {
    
    return {
        padding: "16px 16px",
        position: "relative"
    }
}

export const contactSearchInputStyle = (theme, img) => {

    return {
        display: "block",
        width: "100%",
        border: "0",
        boxShadow: "rgba(20, 20, 20, 0.04) 0 0 0 1px inset",
        borderRadius: "8px",
        padding: "6px 8px 6px 35px",
        fontSize: "15px",
        outline: "none",
        color: `${theme.color.primary}`,
        background: `url(${img}) 10px center no-repeat ${theme.backgroundColor.grey}`,
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

export const contactMsgTxtStyle = (theme) => {

    return {
        margin: "0",
        height: "30px",
        color: `${theme.color.secondary}`,
        fontSize: "24px!important",
        fontWeight: "600"
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
        padding: "0 15px",
        margin: "5px 0",
        width: "100%",
        fontSize: "14px"
    }
}