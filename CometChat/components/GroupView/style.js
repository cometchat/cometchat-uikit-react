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
        padding: "10px 20px",
        ...selectedState,
        '&:hover': {
            backgroundColor: `${props.theme.backgroundColor.primary}`
        }
    }
}

export const listItemIcon = () => {

    return {
        alignSelf: "center",
        width: "16px",
        height: "16px",
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
        paddingLeft: "15px",
    }
}

export const itemNameStyle = () => { 
    return {
        fontSize: "15px",
        fontWeight: "600",
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
        width: "100%",
        margin: "0",
        marginTop: "5px",
    }
}

export const itemDescStyle = (props) => { 

    return {
        borderBottom: `1px solid ${props.theme.borderColor.primary}`,
        marginTop: "10px",
    }
}