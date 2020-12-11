

export const previewWrapperStyle = (props, keyframes) => {

    const slideAnimation = keyframes`
    from {
        bottom: -55px
    }
    to {
        bottom: 0px
    }`;

    return {
        padding: "7px",
        backgroundColor: `${props.theme.backgroundColor.white}`,
        border: `1px solid ${props.theme.borderColor.primary}`,
        fontSize: "13px",
        display: "flex",
        flexDirection: "row-reverse",
        justifyContent: "space-between",
        animation: `${slideAnimation} 0.5s ease-out`,
        position: "relative",
    }
}

export const previewHeadingStyle = () => {

    return {
        alignSelf: "flex-start",
        display: "flex",
        alignItems: "baseline",
        justifyContent: "space-between"
    }
}

export const previewCloseStyle = (img) => {

    return {
        width: "24px",
        height: "24px",
        borderRadius: "50%",
        background: `url(${img}) center center no-repeat`,
        cursor: "pointer",
    }
}

export const previewOptionsWrapperStyle = () => {

    return {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-around",
        width: "100%",
    }
}

export const previewOptionStyle = (props) => {

    return {
        padding: "8px",
        margin: "0 8px",
        backgroundColor: `${props.theme.backgroundColor.grey}`,
        border: `1px solid ${props.theme.borderColor.primary}`,
        borderRadius: "10px",
        cursor: "pointer",
        height: "100%",
        textAlign: "center",
    }
}