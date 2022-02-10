export const stickerWrapperStyle = (context) => {

	// const slideAnimation = keyframes`
    // from {
    //     bottom: -55px
    // }
    // to {
    //     bottom: 0px
    // }`;

	return {
		backgroundColor: `rgba(20, 20, 20, 0.04)`,
		border: `1px solid rgb(234, 234, 234)`,
		borderBottom: "none",
		//animation: `${slideAnimation} 0.5s ease-out`,
		borderRadius: "10px 10px 0 0",
		height: "215px",
		display: "flex",
		flexDirection: "column",
		justifyContent: "center",
	};
};

export const stickerSectionListStyle = context => {

	return {
		borderTop: `1px solid rgb(234, 234, 234)`,
		backgroundColor: `rgba(20, 20, 20, 0.04)`,
		display: "flex",
		justifyContent: "space-between",
		alignItems: "center",
		textTransform: "uppercase",
		overflowX: "auto",
		overflowY: "hidden",
		padding: "10px",
		"::WebkitScrollbar": {
			background: `#141414`,
		},
		"::WebkitScrollbarThumb": {
			background: `rgba(20, 20, 20, 0.04)`,
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

	//const mq = [...context.theme.breakPoints];

	return {
		minWidth: "50px",
		minHeight: "50px",
		maxWidth: "70px",
		maxHeight: "70px",
		cursor: "pointer",
		flexShrink: "0",
		marginRight: "20px",
		//[`@media ${mq[1]}, ${mq[2]}, ${mq[3]}`]: {
		//	maxWidth: "70px",
		//	maxHeight: "70px",
		//},
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

export const stickerMsgTxtStyle = () => {

	return {
		margin: "0",
		height: "30px",
		color: `rgba(20,20,20, 60%)`,
		font: "400 20px Inter, sans-serif",
	};
};

export const stickerCloseStyle = (img) => {
	
	return {
		width: "20px",
		height: "20px",
		borderRadius: "50%",
		alignSelf: "flex-end",
		mask: `url(${img}) center center no-repeat`,
		backgroundColor: `#39f`,
		cursor: "pointer",
		margin: "8px 8px 0 0",
	};
};
