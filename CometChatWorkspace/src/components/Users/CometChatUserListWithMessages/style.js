export const userScreenStyle = (theme) => {

    return {
        display: "flex",
        height: "100%",
        width: "100%",
        boxSizing: "border-box",
        fontFamily: `${theme.fontFamily}`,
        "*": {
            boxSizing: "border-box",
            fontFamily: `${theme.fontFamily}`,
            "::-webkit-scrollbar": {
                width: "8px",
                height: "4px",
            },
            "::-webkit-scrollbar-track": {
                background: "#ffffff00"
            },
            "::-webkit-scrollbar-thumb": {
                background: "#ccc",
                "&:hover": {
                    background: "#aaa"
                }
            }
        }
    }
}

export const userScreenSidebarStyle = (state, props) => {

    const sidebarView = (state.sidebarview) ? {
        left: "0",
        boxShadow: "rgba(0, 0, 0, .4) -30px 0 30px 30px"
    } : {};

    const mq = [...props.theme.breakPoints];

    return {

        width: "280px",
        borderRight: `1px solid ${props.theme.borderColor.primary}`,
        height: "100%",
        position: "relative",
        display: "flex",
        flexDirection: "column",
        "> .contacts": {
            height: "calc(100% - 5px)",
        },
        [`@media ${mq[0]}`]: {
            position: "absolute!important",
            left: "-100%",
            top: "0",
            bottom: "0",
            width: "100%!important",
            zIndex: "2",
            backgroundColor: `${props.theme.backgroundColor.white}`,
            transition: "all .3s ease-out",
            ...sidebarView
        }
    }
}

export const userScreenMainStyle = (state, props) => {

    const secondaryView = (state.threadmessageview || state.detailview) ? {
        width: "calc(100% - 680px)"
    } : {};

    const mq = [...props.theme.breakPoints];

    return {
        width: "calc(100% - 280px)",
        height: "100%",
        order: "2",
        ...secondaryView,
        [`@media ${mq[0]}`]: {
            width: "100%!important",
        }
    }
}

export const userScreenSecondaryStyle = (props) => {

    const mq = [...props.theme.breakPoints];

    return {
        float: "right",
        borderLeft: `1px solid ${props.theme.borderColor.primary}`,
        height: "100%",
        width: "400px",
        display: "flex",
        flexDirection: "column",
        order: "3",
        [`@media ${mq[0]}`]: {
            position: "absolute!important",
            right: "0!important",
            top: "0",
            bottom: "0",
            width: "100%!important",
            zIndex: "2",
            backgroundColor: `${props.theme.backgroundColor.white}`,
        }
    }
}