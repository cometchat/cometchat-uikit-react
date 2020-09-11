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

export const messageVideoWrapperStyle = (props) => {

    return {
        display: "inline-block",
        borderRadius: "12px",
        backgroundColor: `${props.theme.color.blue}`,
        padding: "8px 12px",
        alignSelf: 'flex-end',
        ' > video': {
            maxWidth: "250px",
            display: "inherit",
        }
    }
}

export const messageInfoWrapperStyle = () => {

    return {
        alignSelf: "flex-end",
    }
}