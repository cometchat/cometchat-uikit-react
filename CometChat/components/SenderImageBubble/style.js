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
        width: "100%",
        ':hover': {
            'ul:first-of-type': {
                display: "inline-flex"
            }

        }
    }
}

export const messageImgWrapper = () => {

    return {
        display: "inline-block",
        borderRadius: "12px",
        alignSelf: "flex-end",
        ' > img': {
            maxWidth: "250px"
        }
    }
}

export const messageInfoWrapperStyle = () => {

    return {
        alignSelf: "flex-end",
    }
}