export const msgTimestampStyle = (context, props, loggedInUser) => {

    const colorValue = (props.message?.sender?.uid !== loggedInUser?.uid) ? {
        color: `${context.theme.color.helpText}`,
    } : {};

    return {
        display: "flex",
        fontSize: "11px",
        fontWeight: "500",
        lineHeight: "12px",
        textTransform: "uppercase",
        ...colorValue,
    }
}

export const iconStyle = (img, color) => {

    return {
        mask: `url(${img}) center center no-repeat`,
        backgroundColor: `${color}`,
        display: "inline-block",
        width: "24px",
        height: "24px"
    }
}