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
        paddingTop: "16px"
    }
}

export const messageDateContainerStyle = () => {

    return {
        marginBottom: "16px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
    }
}

export const messageDateStyle = (props) => {

    return {
        padding: "8px 12px",
        backgroundColor: `${props.theme.backgroundColor.secondary}`,
        color: `${props.theme.color.primary}`,
        borderRadius: "10px"
    }
}

export const decoratorMessageStyle = () => {

    return {
        overflow: "hidden",
        width: "100%",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        position: "absolute",
        top: "50%",
    }
}

export const decoratorMessageTxtStyle = (props) => {

    return {
        margin: "0",
        height: "36px",
        color: `${props.theme.color.secondary}`,
        fontSize: "24px!important",
        fontWeight: "600",
        lineHeight: "30px",
    }
}