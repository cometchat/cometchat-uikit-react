export const msgTimestampStyle = (props, state) => {

    const colorValue = (state.message.messageFrom !== "sender") ? {
        color: `${props.theme.color.helpText}`,
    } : {};

    return {
        display: "inline-block",
        fontSize: "11px",
        fontWeight: "500",
        lineHeight: "12px",
        textTransform: "uppercase",
        ...colorValue,
        ' > img': {
            marginLeft: "3px",
            display: "inline-block",
            verticalAlign: "bottom",
        }
    }
}