export const callScreenWrapperStyle = (props, keyframes) => {

    const fadeAnimation = keyframes`
    from {
        opacity: 0;
    }
    to {
        opacity: 1;
    }`;

    return {
        width: "100%",
        height: "100%",
        position: "absolute",
        top: "0",
        right: "0",
        bottom: "0",
        left: "0",
        backgroundColor: `${props.theme.backgroundColor.darkGrey}`,
        zIndex: "999",
        color: `${props.theme.color.white}`,
        textAlign: "center",
        boxSizing: "border-box",
        animation: `${fadeAnimation} 250ms ease`,
        fontFamily: `${props.theme.fontFamily}`,
        "*": {
            boxSizing: "border-box",
            fontFamily: `${props.theme.fontFamily}`,
        },
    }
}

export const callScreenContainerStyle = () => {

    return {
        display: "flex",
        flexDirection: "column",
        height: "100%",
        width: "100%"
    }
}

export const headerStyle = () => {

    return {
        padding: "20px 10px",
        width: "100%",
        height: "20%",
    }
}

export const headerDurationStyle = () => {

    return {
        fontSize: "13px",
        display: "inline-block",
        padding: "5px"
    }
}

export const headerNameStyle = () => {

    return {
        margin: "0",
        fontWeight: "700",
        textTransform: "capitalize",
        fontSize: "16px",
    }
}

export const thumbnailWrapperStyle = () => {

    return {
        width: "100%",
        height: "50%",
        display: "flex",
        justifyContent: "center",
        alignItems: "center"
    }
}

export const thumbnailStyle = () => {

    return {
        width: "200px",
        flexShrink: "0",
    }
}

export const headerIconStyle = () => {

    return {
        width: "100%",
        height: "15%",
        padding: "10px",
        display: "flex",
        justifyContent: "center"
    }
}

export const iconWrapperStyle = () => {

    return {
        display: "flex"
    }
}

export const iconStyle = (img, callAction) => {

    const bgColor = (callAction) ? "#008000" : "#ff3b30";

    return {
        width: "50px",
        height: "50px",
        borderRadius: "27px",
        backgroundColor: "rgba(255, 255, 255, 0.2)",
        display: "block",
        margin: "auto 10px",
        cursor: "pointer",
        background: `url(${img}) center center no-repeat ${bgColor}`,
    }
}

export const errorContainerStyle = () => {

    return {
        color: "#fff",
        textAlign: "center",
        borderRadius: "2px",
        padding: "13px 10px",
        fontSize: "13px",
        width: "100%",
        height: "10%",
        backgroundColor: "#333",
    }
}
