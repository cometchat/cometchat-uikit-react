export const callScreenWrapperStyle = (props) => {

    let displayValue = {
        width: "100%",
        height: "100%",
        position: "fixed!important",
    }
    if (props.hasOwnProperty("widgetsettings") && props.widgetsettings) {
        displayValue = {
            width: "inherit!important",
            height: "inherit!important",
            position: "absolute!important"
        }
    }

    return {
        top: "0!important",
        right: "0!important",
        bottom: "0!important",
        left: "0!important",
        backgroundColor: `${props.theme.backgroundColor.darkGrey}`,
        zIndex: "999",
        color: `${props.theme.color.white}`,
        textAlign: "center",
        boxSizing: "border-box",
        fontFamily: `${props.theme.fontFamily}`,
        "*": {
            boxSizing: "border-box",
            fontFamily: `${props.theme.fontFamily}`,
        },
        ...displayValue
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

export const callScreenHeaderStyle = () => {

    return {
        padding: "40px",
        width: "100%"
    }
}

export const headerDurationStyle = () => {
    
    return {
        fontSize: "13px",
        lineHeight: "20px",
    }
}

export const headerNameStyle = () => {

    return {
        margin: "0",
        fontWeight: "700",
        textTransform: "capitalize",
        fontSize: "1.8rem",
        lineHeight: "24px",
    }
}

export const thumbnailWrapperStyle = () => {

    return {
        width: "100%",
        height: "50%",
        display: "flex",
        justifyContent: "center"
    }
}

export const thumbnailStyle = () => {

    return {
        height: "200px",
        '> img': {
            maxHeight: "100%",
            display: "inline-block",
            borderRadius: "50%",
            overflow: "hidden",
            boxShadow: "rgba(20, 20, 20, 0.3) 0 19px 38px, rgba(20, 20, 20, 0.3) 0 2px 7px",
        }
    }
}

export const headerIconStyle = () => {

    return {
        width: "100%",
        padding:"40px",
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