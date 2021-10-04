export const listItem = (props, context) => {

    const selectedState = (props.selectedUser && props.selectedUser.uid === props.user.uid) ? {
        backgroundColor: `${context.theme.backgroundColor.primary}`
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
            backgroundColor: `${context.theme.backgroundColor.primary}`
        }
    }
}

export const itemThumbnailStyle = () => {
    
    return {
        display: "inline-block",
        width: "36px",
        height: "36px",
        flexShrink: "0"
    }
}

export const itemDetailStyle = () => {
    
    return {
        width: "calc(100% - 45px)",
        flexGrow: 1,
        paddingLeft: "16px",
        "&[dir=rtl]": {
            paddingRight: "16px",
            paddingLeft: "0",
        }
    }
}

export const itemNameStyle = (context) => { 
    
    return {
        fontSize: "15px",
        fontWeight: "600",
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
        width: "100%",
        margin: "5px 0 0 0",
        lineHeight: "22px",
        color: `${context.theme.color.primary}`
    }
};

export const itemDescStyle = context => {
	return {
		marginTop: "10px",
		borderBottom: `1px solid ${context.theme.borderColor.primary}`,
	};
};

