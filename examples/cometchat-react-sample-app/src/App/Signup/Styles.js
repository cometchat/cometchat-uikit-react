import { fontHelper } from "@cometchat-pro/react-ui-kit";

export const loginWrapperStyle = (theme) => {
    return {
        background: theme?.palette?.getAccent100()
    }
}
export const errorTextStyle = (theme) => {
    return {
        font: fontHelper(theme?.typography?.subtitle2),
        color: theme?.palette?.getError()
    }
}
export const headerTitleStyle = (theme) => {
    return {
        font: fontHelper(theme?.typography?.name),
        color: theme?.palette?.getAccent()
    }
}
export const headerSectionStyle = (theme) => {
    return {
        borderBottom: `1px solid ${theme?.palette?.getAccent100()}`

    }
}
export const headerSubtitleStyle = (theme) => {
    return {
        font: fontHelper(theme?.typography?.subtitle2),
        color: theme?.palette?.getAccent400()
    }
}
export const titleStyle = (theme) => {
    return {
        font: fontHelper(theme?.typography?.heading),
        color: theme?.palette?.getAccent()
    }
}
export const subtitleStyle = (theme) => {
    return {
        font: fontHelper(theme?.typography?.subtitle2),
        color: theme?.palette?.getAccent600()
    }
}
export const containerStyle = (theme) => {
    return {
        background: theme?.palette?.getBackground(),
        boxShadow: `${theme?.palette?.getAccent400()} 0px 0px 5px`
    }
}
export const usernameStyle = (theme) => {
    return {
        font: fontHelper(theme?.typography?.title1),
        color: theme?.palette?.getAccent()
    }
}
export const useruidStyle = (theme) => {
    return {
        font: fontHelper(theme?.typography?.subtitle2),
        color: theme?.palette?.getAccent600()
    }
}
export const userDetailsStyle = (theme) => {
    return {
        background: theme?.palette?.getSecondary()
    }
}
export const loginMessageStyle = (theme) => {
    return {
        font: fontHelper(theme?.typography?.subtitle2),
        color: theme?.palette?.getAccent600()
    }
}
export const inputStyle = (theme) => {
    return {
        font: fontHelper(theme?.typography?.subtitle2),
        color: theme?.palette?.getAccent600(),
        border: `1px solid ${theme?.palette?.getAccent100()}`,
    }
}
export const footerStyle = (theme) => {
    return {
        font: fontHelper(theme?.typography?.subtitle2),
        color: theme?.palette?.getAccent500()
    }
}
export const signupButtonStyle = (theme, buttonImage) => {
    return {
        font: fontHelper(theme?.typography?.subtitle1),
        color: theme?.palette?.getAccent(),
        backgroundColor: theme?.palette?.getPrimary(),
        backgroundImage: `url(${buttonImage})`
    }
}
export const sectionImageStyle = (backgroundImage) => {
    return {
        background: `url(${backgroundImage}) center center no-repeat`,
        backgroundSize: "contain"
    }
}