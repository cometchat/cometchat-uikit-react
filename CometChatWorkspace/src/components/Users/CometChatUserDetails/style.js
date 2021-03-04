export const userDetailStyle = (props) => {

    return {
        display: "flex",
        flexDirection: "column",
        height: "100%",
        boxSizing: "border-box",
        fontFamily: `${props.theme.fontFamily}`,
        "*": {
            boxSizing: "border-box",
            fontFamily: `${props.theme.fontFamily}`,
        }
    }
}

export const headerStyle = (props) => {

    return {
        padding: "19px 16px",
        position: "relative",
        borderBottom: `1px solid ${props.theme.borderColor.primary}`,
        display: "flex",
        justifyContent: "flex-start",
        alignItems: "center",
    }
}

export const headerCloseStyle = (img, props) => {

    const mq = [...props.theme.breakPoints];

    return {
        cursor: "pointer",
        display: "none",
        background: `url(${img}) center center no-repeat`,
        width: "24px",
        height: "24px",
        [`@media ${mq[1]}, ${mq[2]}, ${mq[3]}, ${mq[4]}`]: {
            display: "block"
        },
    }
}

export const headerTitleStyle = () => {

    return {
        margin: "0",
        fontWeight: "700",
        fontSize: "20px"
    }
}

export const sectionStyle = () => {

    return {
        margin: "0",
        padding: "16px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        alignItems: "flex-start",
        height: "calc(100% - 70px)",
        '&:not(:last-of-type)': {
            marginBottom: "16px",
        }
    }
}

export const privacySectionStyle = (props) => {

    return {
        width: "100%",
        "> div": {
            color: `${props.theme.color.red}`,
            fontWeight: "600",
            cursor: "pointer",
            fontSize: "12px"
        }
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
    }
}

export const contentItemStyle = () => {

    return {
        width: 100%"",
        '&:not(:first-of-type):not(:last-of-type)': {
            padding: "6px 0",
        }
    }
}

export const itemLinkStyle = (deleteLink, props) => {

    const deleteCss = (deleteLink) ? {
        color: `${props.theme.color.red}`,
    } : {};

    return {
        fontSize: "15px",
        lineHeight: "20px",
        fontWeight: "600",
        display: "inline-block",
        ...deleteCss
    }
}
