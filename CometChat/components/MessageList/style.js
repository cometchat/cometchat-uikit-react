export const chatListStyle = (props) => {

    return {
        backgroundColor: `${props.theme.backgroundColor.white}`,
        zIndex: "1",
        width: "100%",
        flex: "1 1 0",
        order: "2",
        position: "relative",
    }
}

export const listWrapperStyle = () => {

    return {
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        height: "100%",
        overflowX: "hidden",
        overflowY: "scroll",
        position: "absolute",
        top: "0",
        transition: "background .3s ease-out .1s",
        width: "100%",
        zIndex: "100",
    }
}

export const listLoadingStyle = (props) => {

    return {
        height: "20px",
        color: `${props.theme.color.helpText}`,
        margin: "0 auto",
        width: "100px",
        textAlign: "center",
        fontSize: "15px",
    }
}

export const actionMessageStyle = () => {

    return {
        padding: "8px 12px",
        marginBottom: "16px",
        textAlign: "center",
    }
}

export const actionMessageTxtStyle = () => {

    return {
        fontSize: "13.5px",
        margin: "0",
        lineHeight: "20px",
    }
}