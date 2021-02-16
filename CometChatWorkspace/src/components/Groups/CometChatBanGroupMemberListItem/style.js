export const tableRowStyle = (props) => {

    return {
        border: `1px solid ${props.theme.borderColor.primary}`,
        display: "table",
        width: "100%",
        tableLayout: "fixed",
        fontSize: "14px",
        "td": {
            padding: ".625em",
        }
    }
}

export const avatarStyle = () => {

    return {
        display: "inline-block",
        float: "left",
        width: "36px",
        height: "36px",
        marginRight: "8px",
    }
}

export const nameStyle = () => {

    return {
        margin: "10px 0 0 0",
        width: "calc(100% - 50px)",
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap"
    }
}

export const roleStyle = () => {

    const mq = [`@media (min-width : 320px) and (max-width: 767px)`];

    return {
        width: "150px",
        fontSize: "12px",
        [mq[0]]: {
            width: "115px"
        }
    }
}

export const actionStyle = () => {

    return {
        width: "70px",
        "img": {
            width: "20px!important",
            height: "20px!important",
            cursor: "pointer",
        },
    }
}