export const stickerWrapperStyle = (props, keyframes) => {

    const slideAnimation = keyframes`
    from {
        bottom: -55px
    }
    to {
        bottom: 0px
    }`;

    return {
        backgroundColor: `${props.theme.backgroundColor.grey}`,
        border: `1px solid ${props.theme.borderColor.primary}`,
        borderBottom: "none",
        animation: `${slideAnimation} 0.5s ease-out`,
        borderRadius: "10px 10px 0 0",
        height: "215px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
    }
}

export const stickerSectionListStyle = (props) => {

    return {
        borderTop: `1px solid ${props.theme.borderColor.primary}`,
        backgroundColor: `${props.theme.backgroundColor.silver}`,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        textTransform: "uppercase",
        overflowX: "auto",
        overflowY: "hidden",
        padding: "10px",
        "::-webkit-scrollbar": {
            background: `${props.theme.backgroundColor.primary}`
        },
        "::-webkit-scrollbar-thumb": {
            background: `${props.theme.backgroundColor.silver}`,
        }
    }
}

export const sectionListItemStyle = (props) => {

    return {

        height: "35px",
        width: "35px",
        cursor: "pointer",
        flexShrink: "0",
        ":not(:first-of-type)": {
            marginLeft: "16px",
        },
    }
}

export const stickerListStyle = () => {

    return {
        height: "calc(100% - 50px)",
        display: "flex",
        overflowX: "hidden",
        overflowY: "auto",
        flexWrap: "wrap",
        justifyContent: "space-between",
        alignItems: "center"
    }
}

export const stickerItemStyle = (props) => {

    const mq = [...props.theme.breakPoints];

    return {
        minWidth: "50px",
        minHeight: "50px",
        maxWidth: "70px",
        maxHeight: "70px",
        cursor: "pointer",
        flexShrink: "0",
        marginRight: "20px",
        [`@media ${mq[0]}`]: {
            maxWidth: "70px",
            maxHeight: "70px",
        }
    }
}

export const stickerMsgStyle = () => {

    return {
        overflow: "hidden",
        width: "100%",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        position: "absolute",
        top: "35%",
    }
}

export const stickerMsgTxtStyle = (theme) => {

    return {
        margin: "0",
        height: "30px",
        color: `${theme.color.secondary}`,
        fontSize: "24px!important",
        fontWeight: "600"
    }
}

export const stickerCloseStyle = (img) => {

    return {
        width: "20px",
        height: "20px",
        borderRadius: "50%",
        alignSelf: "flex-end",
        background: `url(${img}) center center no-repeat`,
        cursor: "pointer",
        margin: "8px 8px 0 0",
    }
}
