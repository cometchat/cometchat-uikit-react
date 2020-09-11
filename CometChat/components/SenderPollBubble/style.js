export const messageContainerStyle = () => {

    return {
        alignSelf: "flex-end",
        marginBottom: "16px",
        paddingLeft: "16px",
        paddingRight: "16px",
        maxWidth: "65%",
        clear: "both",
    }
}

export const messageWrapperStyle = () => {

    return {
        flex: "1 1",
        display: "flex",
        flexDirection: "column",
        position: "relative",
        width: "100%"
    }
}

export const messageTxtWrapperStyle = (props) => {

    return {
        display: "inline-block",
        borderRadius: "12px",
        backgroundColor: `${props.theme.backgroundColor.blue}`,
        color: `${props.theme.color.white}`,
        padding: "8px 12px",
        alignSelf: "flex-end",
        width: "100%",
    }
}

export const pollQuestionStyle = () => {

    return {
        margin: "0",
        whiteSpace: "pre-wrap",
        wordWrap: "break-word",
        textAlign: "left",
        width: "100%",
        fontSize: "14px",
    }
}

export const pollAnswerStyle = (props) => {

    return {
        listStyleType: "none",
        padding: "0",
        margin: "0",
        width: "100%",
        "li": {
            backgroundColor: `${props.theme.backgroundColor.white}`,
            margin: "10px 0",
            borderRadius: "8px",
            display: "flex",
            width: "100%",
            position: "relative",
        }
    }
}

export const pollTotalStyle = () => {

    return {
        fontSize: "13px",
        margin: "0",
        alignSelf: "flex-end"
    }
}


export const pollPercentStyle = (props, width) => {

    const curvedBorders = (width === "100%") ? { borderRadius: "8px" } : {
        borderRadius: "8px 0 0 8px"
    };

    return {
        maxWidth: "100%",
        width: width,
        ...curvedBorders,
        backgroundColor: `${props.theme.backgroundColor.primary}`,
        minHeight: "35px",
        height: "100%",
        position: "absolute",
        zIndex: "1",
    }
}

export const answerWrapperStyle = (props, width) => {

    return {
        width: "100%",
        color: `${props.theme.color.primary}`,
        display: "flex",
        alignItems: "center",
        minHeight: "35px",
        height: "100%",
        zIndex: "2",
        "p": {
            margin: "0",
            padding: "6px 12px",
            width: "calc(100% - 40px)",
            whiteSpace: "pre-wrap",
            wordWrap: "break-word",
            fontSize: "14px",
        },
        "span": {
            width: "40px",
            padding: "6px 12px",
            fontWeight: "bold",
            display: "inline-block",
            fontSize: "13px",
        }
    }
}

export const messageInfoWrapperStyle = () => {

    return {
        alignSelf: "flex-end",
    }
}