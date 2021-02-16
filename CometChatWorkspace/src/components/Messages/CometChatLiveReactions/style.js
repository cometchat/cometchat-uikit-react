export const reactionContainerStyle = () => {

    return {
        width: "100px",
        height: "calc(100% - 120px)",
        overflow: "hidden",
        position: "absolute",
        top: "70px",
        right: "0",
    }
}

export const reactionEmojiStyle = () => {

    return {
        position: "absolute",
        color: "#DD4144",
        visibility: "hidden",
        width: "20px",
        height: "20px",
        opacity: "1",
        transition: "opacity 3s",
        "&.fade": {
            opacity: "0"
        }
    }
}