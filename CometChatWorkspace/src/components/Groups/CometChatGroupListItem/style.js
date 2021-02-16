export const listItem = (props) => {

    const selectedState = (props.selectedGroup && props.selectedGroup.guid === props.group.guid) ? {
        backgroundColor: `${props.theme.backgroundColor.primary}`
    } : {};

    return {
        display: "flex",
        flexDirection: "row",
        justifyContent: "left",
        alignItems: "center",
        cursor: "pointer",
        width: "100%",
        padding: "8px 16px",
        ...selectedState,
        '&:hover': {
            backgroundColor: `${props.theme.backgroundColor.primary}`
        }
    }
}

export const listItemName = () => {

    return {
        maxWidth: "calc(100% - 30px)",
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
        margin: "0"
    }
}

export const listItemIcon = () => {

    return {
        width: "14px",
        height: "auto",
        margin: "0 8px",
    }
}

export const itemThumbnailStyle = () => {

    return {
        display: "inline-block",
        width: "36px",
        height: "36px",
        flexShrink: "0",
    }
}

export const itemDetailStyle = () => {

    return {
        width: "calc(100% - 70px)",
        flexGrow: "1",
        paddingLeft: "16px",
        "&[dir=rtl]": {
            paddingRight: "16px",
            paddingLeft: "0",
        }
    }
}

export const itemNameWrapperStyle = () => { 

    return {
        fontSize: "15px",
        fontWeight: "600",
        display: "flex",
        alignItems: "center",
        width: "100%",
        margin: "0",
    }
}

export const itemDescStyle = (props) => { 

    return {
        borderBottom: `1px solid ${props.theme.borderColor.primary}`,
        padding: "0 0 5px 0",
        fontSize: "12px",
        color: `${props.theme.color.helpText}`,
        "&:hover": {
            borderBottom: `1px solid ${props.theme.borderColor.primary}`,
        }
    }
}