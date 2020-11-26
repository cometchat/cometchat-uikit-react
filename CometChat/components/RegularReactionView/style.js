export const messageReactionsStyle = (props, reactionData) => {

    const uid = props.loggedInUser.uid;
    let borderStyle = {};
    let hoveredBorderStyle = {};

    if (reactionData.hasOwnProperty(uid)) {
        borderStyle = {
            border: `1px solid ${props.theme.borderColor.blue}`
        }

        hoveredBorderStyle = { ...borderStyle };

    } else {
        borderStyle = {
            border: "1px solid transparent"
        }

        hoveredBorderStyle = { 
            border: `1px solid ${props.theme.borderColor.primary}`
         };
    }

    return {
        fontSize: "11px",
        padding: "2px 6px",
        display: "inline-flex",
        alignItems: "center",
        verticalAlign: "top",
        backgroundColor: `${props.theme.backgroundColor.secondary}`,
        borderRadius: "12px",
        margin: "4px 4px 0 0",
        cursor: "pointer",
        ...borderStyle,
        ".emoji-mart-emoji": {
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
        },
        "&:hover": {
            ...hoveredBorderStyle,
        }
    }
}

export const emojiButtonStyle = (img) => {

    return {
        outline: "0",
        border: "0",
        borderRadius: "4px",
        alignItems: "center",
        display: "inline-flex",
        justifyContent: "center",
        position: "relative",
        "span": {
            height: "20px",
            width: "20px",
            background: `url(${img}) center center / 20px 19px no-repeat`,
        }        
    }
}

export const reactionCountStyle = (props) => {

    return {
        color: `${props.theme.color.primary}`,
        padding: "0 1px 0 3px",
    }
}