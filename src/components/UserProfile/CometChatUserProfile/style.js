export const userInfoScreenStyle = (props) =>{

    return {
        display: "flex",
        flexDirection: "column!important",
        height: "100%",
        fontFamily: `${props.theme.fontFamily}`,
        backgroundColor: props.backgroundColor,
        "*": {
            boxSizing: "border-box",
            fontFamily: `${props.theme.fontFamily}`,
        }
    }
}

export const headerStyle = (props) => {

    return {
        padding: "16px",
        position: "relative",
        height: "70px",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
    }
}

export const headerTitleStyle = (props) => {

    return {
        margin: "0",
        font: props.titleFont,
		color: props.titleColor,
        lineHeight: "26px",
        display: "inline-block",
        width: "100%",
        textAlign: "center",
    }
}

export const optionsStyle = () => {

    return {
        height: "calc(100% - 145px)",
        overflowY: "auto",
        padding: "0 16px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "left",
        alignItems: "flex-start",
    }
}

export const optionTitleStyle = (props) => {

    return {
        margin: "5px 0",
        width: "100%",
        fontSize: "12px",
        color: `${props.theme.color.helpText}`,
        textTransform: "uppercase",
    }
}

export const optionListStyle = () => {

    return {
        padding: "10px 0",
        width: "100%",
        fontSize: "15px"
    }
}

export const optionStyle = (img) => {

    return {
        width: "100%",
        padding: "16px 16px 16px 36px",
        fontWeight: 600,
        background: `url(${img}) left center no-repeat`,
    }
}

export const optionNameStyle = () => {

    return {
        width: "100%",
    }
}