export const chatsWrapperStyle = () => {

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

export const chatsHeaderStyle = (theme) => {

    return {
        padding: "19px 16px",
        display: "flex",
        alignItems: "center",
        borderBottom: `1px solid ${theme.color.darkSecondary}`
    }
}

export const chatsHeaderCloseStyle = (img) => {

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

export const chatsHeaderTitleStyle = (props) => {

    const alignment = (props.hasOwnProperty("enableCloseMenu") && props.enableCloseMenu.length > 0) ? {
        width: "33%",
        textAlign: "center"
    } : {};
    
    return {
        margin: "0",
        display: "inline-block",
        width: "66%",
        textAlign: "left",
        fontSize: "20px",
        ...alignment
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

export const chatsMsgTxtStyle = (theme) => {

    return {
        margin: "0",
        height: "30px",
        color: `${theme.color.secondary}`,
        fontSize: "24px!important",
        fontWeight: "600",
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