export const badgeStyle = (props) => {

    return {
        display: "block",
        fontSize: "12px",
        width: "auto",
        height: "18px",
        borderRadius: "16px",
        backgroundColor: `${props.theme.primaryColor}`,
        color: `${props.theme.color.white}`,
        textAlign: "center",
        fontWeight: "700",
        lineHeight: "18px",
        marginLeft: "4px",
        padding: "0 9px",
        marginRight: "2px",
        opacity: "1",
        transition: "opacity .1s",
    }
}