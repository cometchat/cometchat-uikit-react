export const groupScreenStyle = (theme) => {

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

export const groupScreenSidebarStyle = (state, props) => {

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
        ".groups": {
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

export const groupScreenMainStyle = (state, props) => {

    const mq = [...props.theme.breakPoints];

    const secondaryViewWidth = (state.threadmessageview || state.viewdetailscreen) ? {

        width: "calc(100% - 680px)!important",
        [`@media ${mq[1]}, ${mq[2]}`]: {
            width: "100%!important",
        },
        [`@media ${mq[3]}, ${mq[4]}`]: {
            width: "0!important",
            display: "none",
        },

    } : {
        width: "calc(100% - 280px)!important",
        [`@media ${mq[1]}, ${mq[2]}`]: {
            width: "100%!important",
        },

    };

    return {
        width: "calc(100% - 280px)",
        height: "100%",
        order: "2",
        ...secondaryViewWidth,
    }
}

export const groupScreenSecondaryStyle = (props) => {

    const mq = [...props.theme.breakPoints];

    return {
        float: "right",
        borderLeft: `1px solid ${props.theme.borderColor.primary}`,
        height: "100%",
        width: "400px",
        display: "flex",
        flexDirection: "column",
        order: "3",
        [`@media ${mq[1]}, ${mq[2]}, ${mq[3]}, ${mq[4]}`]: {
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
