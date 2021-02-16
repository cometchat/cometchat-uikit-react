export const replyCountStyle = (props) => {

    return {
        display: "inline-block",
        fontSize: "11px",
        fontWeight: "500",
        lineHeight: "12px",
        textTransform: "lowercase",
        padding: "0 10px",
        cursor: "pointer",
        color: props.theme.color.blue,
        '&:hover': {
            textDecoration: "underline",
        }
    }
}