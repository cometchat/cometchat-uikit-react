export const chatWrapperStyle = (theme) => {

    return {
        display: "flex",
        flexDirection: "column",
        height: "100%",
        width: "100%",
        boxSizing: "border-box",
        fontFamily: `${theme.fontFamily}`,
        "*": {
            boxSizing: "border-box",
            fontFamily: `${theme.fontFamily}`,
        }
    }
}

export const reactionsWrapperStyle = () => {

    return {
        position: "fixed", 
        width: "100%", 
        height: "100%", 
        top: "0", 
        right: "0",
        zIndex: "2",
        display: "flex",
        justifyContent: "left",
        alignItems: "center"
    }
}