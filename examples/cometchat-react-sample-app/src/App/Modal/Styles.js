import { fontHelper } from "@cometchat-pro/react-ui-kit";

export const backdropStyle = () => {
    return {
        height: "100%",
        width: "100%",
        background: "rgba(0,0,0,0.3)",
        position: "absolute",
        top: "0%",
        left: "0%",
        display: "flex",
        justifyContent: "center",
        alignItems: "center"
    }
}

export const wrapperStyle = (theme, width) => {
    
    return {
        background: theme?.palette?.getBackground(),
        width: width || "70%",
        boxShadow: `${theme?.palette?.getAccent400()} 0px 0px 50px`,
        borderRadius: "15px",
    }
}

export const headerStyle = (theme) => {
    return {
        display: "flex",
        width: "100%",
        justifyContent: "space-between",
        alignItems: "center",
        borderBottom: `1px solid ${theme?.palette?.getAccent400()}`,
        padding: "15px"
    }
}


export const detailsWrapper = (theme) => {
    return {
        display: "flex",
        width: "100%",
        padding: "15px"
    }
}


export const titleStyle = (theme) => {
    return {
        font: fontHelper(theme?.typography?.title1),
        color: theme?.palette?.getAccent(),
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
    }
}

export const closeIconStyle = (theme, closeIconURL) => {
    return {
        WebkitMask: `url(${closeIconURL}) center center no-repeat`,
        background: theme?.palette?.getAccent600(),
        transform: "rotate(45deg)",
        height: "30px",
        width: "30px",
        cursor: "pointer",
    }
}