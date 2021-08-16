export const messageContainerStyle = () => {

    return {
        alignSelf: "flex-end",
        marginBottom: "16px",
        paddingLeft: "16px",
        paddingRight: "16px",
        maxWidth: "65%",
        clear: "both",
        position: "relative",
        display: "flex",
        flexDirection: "column",
        flexShrink: "0",
    }
}

export const messageWrapperStyle = () => {

    return {
        width: "auto",
        flex: "1 1",
        alignSelf: "flex-end",
        display: "flex",
    }
}

export const messageVideoWrapperStyle = () => {

    return {
        display: "inline-block",
        alignSelf: 'flex-end',
        ' > video': {
            maxWidth: "250px",
            borderRadius: "12px",
            display: "inherit",
        }
    }
}

export const messageInfoWrapperStyle = () => {

    return {
        alignSelf: "flex-end",
        display: "flex",
        justifyContent: "flex-end",
        alignItems: "center",
        height: "25px",
        padding: "4px 8px",
    }
}

export const messageReactionsWrapperStyle = () => {

    return {
        display: "inline-flex",
        alignSelf: "flex-end",
        width: "100%",
        flexWrap: "wrap",
        justifyContent: "flex-end",
    }
}
