export const tableRowStyle = (props) => {

    return {
        border: `1px solid ${props.theme.borderColor.primary}`,
        display: "table",
        width: "100%",
        tableLayout: "fixed",
        fontSize: "14px"
    }
}

export const tableColumnStyle = () => {

    return {
        padding: "8px",
        "img": {
            width: "36px",
            height: "36px",
            float: "left",
        }
    }
}

export const avatarStyle = (participantView) => {

    const mq = [`@media (min-width : 320px) and (max-width: 767px)`];
    
    const displayProp = (participantView) ? {
        display: "none"
    } : {};

    return {
        display: "inline-block",
        float: "left",
        "span": {
            top: "26px",
            left: "-8px",
        },
        [mq[0]]: {
            ...displayProp
        }
    }
}

export const nameStyle = (participantView) => {

    const mq = [`@media (min-width : 320px) and (max-width: 767px)`];

    const widthProp = (participantView) ? {
        width: "100%"
    } : {};
    
    return {
        margin: "10px 0",
        width: "calc(100% - 50px)",
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
        [mq[0]]: {
            ...widthProp
        }
    }
}

export const roleStyle = () => {

    return {
        padding: "5px",
        float: "left",
        fontSize: "12px",
    }
}

export const scopeStyle = () => {

    const mq = [`@media (min-width : 320px) and (max-width: 767px)`];

    return {
        "img": {
            width: "20px",
            height: "20px",
            cursor: "pointer",
        },
        [mq[0]]: {
            width: "170px"
        }
    }
}

export const actionColumnStyle = () => {

    const mq = [`@media (min-width : 320px) and (max-width: 767px)`];

    return {
        width: "70px",
        padding: "8px",
        "img": {
            width: "20px",
            height: "20px",
            cursor: "pointer",
        },
        [mq[0]]: {
            width: "55px"
        }
    }
}

export const scopeWrapperStyle = () => {

    return {
        float: "left",
        width: "100%",
        transition: "opacity .1s linear",
        "img": {
            margin: "6px 3px",
            float: "left"
        }
    }
}

export const scopeSelectionStyle = () => {

    return {
        width: "65%",
        border: "0",
        boxShadow: "rgba(20, 20, 20, 0.04) 0 0 0 1px inset",
        borderRadius: "8px",
        backgroundColor: `rgba(20, 20, 20, 0.04)`,
        padding: "6px",
        color: `rgba(20, 20, 20, 0.6)`,
        float: "left",
    }
}