import { fontHelper } from "@cometchat-pro/react-ui-kit"

export const sidebarStyle = (theme) => {
    return {
        background: theme?.palette?.getBackground(),
        border: `1px solid ${theme?.palette?.getAccent200()}`
    }
}

export const sectionHeadingStyle = (theme) => {
    return {
        font: fontHelper(theme?.typography?.subtitle1),
        color: theme?.palette?.getAccent500(),
        padding: "0px 50px",
        margin: 0,
    }
}

export const headerTitleStyle = (theme) => {
    return {
        font: fontHelper(theme?.typography?.heading),
        color: theme?.palette?.getAccent(),
    }
}

export const mainscreenStyle = (theme) => {
    return {
        background: theme?.palette?.getBackground(),
        border: `1px solid ${theme?.palette?.getAccent200()}`,
    }
}

export const cardTitleStyle = (theme) => {
    return {
        font: fontHelper(theme?.typography?.title1),
        color: theme?.palette?.getAccent()
    }
}

export const cardStyle = (theme) => {
    return {
        background: theme?.palette?.getBackground(),
        boxShadow: `${theme?.palette?.getAccent400()} 0px 0px 5px`
    }
}

export const cardDescriptionStyle = (theme) => {
    return {
        font: fontHelper(theme?.typography?.subtitle2),
        color: theme?.palette?.getAccent600()

    }
}

export const rootPageStyle = (theme) => {
    return {
        font: fontHelper(theme?.typography?.subtitle1),
        color: theme?.palette?.getAccent600()

    }
}

export const currentPageStyle = (theme) => {
    return {
        font: fontHelper(theme?.typography?.subtitle2),
        color: theme?.palette?.getAccent400(),
        display: "flex",
        alignItems: "center",
        justifyContent: "center",

    }
}

export const pointerStyle = (theme) => {
    return {
        font: fontHelper(theme?.typography?.subtitle1),
        color: theme?.palette?.getAccent200()

    }
}

export const footerStyle = (theme) => {
    return {
        font: fontHelper(theme?.typography?.subtitle2),
        color: theme?.palette?.getAccent500()

    }
}

export const iconStyle = (theme, rightconURL) => {
    return {

        WebkitMask: `url(${rightconURL}) center center no-repeat`,
        background: theme?.palette?.getAccent600(),
        height: "24px",
        width: "24px"


    }
}

export const navigateIconURL = (theme, navigateconURL) => {
    return {
        WebkitMask: `url(${navigateconURL}) center center no-repeat`,
        background: theme?.palette?.getAccent600(),
        height: "19px",
        width: "20px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
    }

}

export const logoutIoncStyle = (theme, logoutIconURL) => {
    return {
        WebkitMask: `url(${logoutIconURL}) center center no-repeat`,
        background: theme?.palette?.getAccent(),
        height: "24px",
        width: "24px"

    }
}

export const themeModeIoncStyle = (theme, themeIconURL) => {
    return {
        WebkitMask: `url(${themeIconURL}) center center no-repeat`,
        background: theme?.palette?.getAccent(),
        height: "24px",
        width: "24px"

    }
}