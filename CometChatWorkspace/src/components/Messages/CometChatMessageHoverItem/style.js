export const hoverItemStyle = props => {

    return {
        display: "flex",
        position: "relative",
    }
}

export const hoverItemButtonStyle = props => {

    return {
        outline: "0",
        border: "0",
        height: "24px",
        width: "24px",
        borderRadius: "4px",
        alignItems: "center",
        display: "inline-flex",
        justifyContent: "center",
        position: "relative",
        //WebkitMask: `url(${props.iconURL}) center center no-repeat`,
        background: `url(${props.iconURL})`
    };
}