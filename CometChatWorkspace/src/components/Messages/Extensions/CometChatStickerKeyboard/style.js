export const stickerWrapperStyle = (context, keyframes) => {

	const slideAnimation = keyframes`
    from {
        bottom: -55px
    }
    to {
        bottom: 0px
    }`;

	return {
		backgroundColor: `${context.theme.backgroundColor.grey}`,
		border: `1px solid ${context.theme.borderColor.primary}`,
		borderBottom: "none",
		animation: `${slideAnimation} 0.5s ease-out`,
		borderRadius: "10px 10px 0 0",
		height: "215px",
		display: "flex",
		flexDirection: "column",
		justifyContent: "center",
	};
};

export const stickerSectionListStyle = context => {

	return {
		borderTop: `1px solid ${context.theme.borderColor.primary}`,
		backgroundColor: `${context.theme.backgroundColor.silver}`,
		display: "flex",
		justifyContent: "space-between",
		alignItems: "center",
		textTransform: "uppercase",
		overflowX: "auto",
		overflowY: "hidden",
		padding: "10px",
		"::-webkit-scrollbar": {
			background: `${context.theme.backgroundColor.primary}`,
		},
		"::-webkit-scrollbar-thumb": {
			background: `${context.theme.backgroundColor.silver}`,
		},
	};
};

export const sectionListItemStyle = () => {

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

export const stickerItemStyle = context => {

	const mq = [...context.theme.breakPoints];

	return {
		minWidth: "50px",
		minHeight: "50px",
		maxWidth: "70px",
		maxHeight: "70px",
		cursor: "pointer",
		flexShrink: "0",
		marginRight: "20px",
		[`@media ${mq[1]}, ${mq[2]}, ${mq[3]}`]: {
			maxWidth: "70px",
			maxHeight: "70px",
		},
	};
};

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

export const stickerMsgTxtStyle = context => {

	return {
		margin: "0",
		height: "30px",
		color: `${context.theme.color.secondary}`,
		fontSize: "24px!important",
		fontWeight: "600",
	};
};

export const stickerCloseStyle = (img, context) => {
	
	return {
		width: "20px",
		height: "20px",
		borderRadius: "50%",
		alignSelf: "flex-end",
		mask: `url(${img}) center center no-repeat`,
		backgroundColor: `${context.theme.primaryColor}`,
		cursor: "pointer",
		margin: "8px 8px 0 0",
	};
};
