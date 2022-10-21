import { fontHelper } from "@cometchat-pro/react-ui-kit";

export const cardWrapperStyle = (theme) => {
    return {
        background: theme?.palette?.getBackground(),
        boxShadow: `${theme?.palette?.getAccent400()} 0px 0px 5px`,
        width: "calc(33% - 40px)",
        cursor: "pointer",
        padding: "20px",
        margin: "20px",
        borderRadius: "12px",
    }
}

export const cardStyle = () => {
    return {
			display: "flex",
			flexBasis: "30%",
		};
}

export const cardInfoStyle = () => {
    return {
        paddingLeft: "15px",
        paddingRight: "15px"
    }
}

export const cardTitleStyle = (theme) => {
    return {
        font: fontHelper(theme?.typography?.title1),
        color: theme?.palette?.getAccent()
    }
}

export const cardDescriptionStyle = (theme) => {
    return {
        font: fontHelper(theme?.typography?.subtitle2),
        color: theme?.palette?.getAccent600(),
        paddingTop: "20px",
        wordBreak: "break-word"
    }
}

export const iconStyle = (theme, icon) => {
    return {
        WebkitMask: `url(${icon}) center center no-repeat`,
        background: theme?.palette?.getAccent(),
        width: "100px",
        height: "30px",
    }
}