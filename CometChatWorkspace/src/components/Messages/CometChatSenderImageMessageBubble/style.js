export const messageContainerStyle = () => {

    return {
        alignSelf: "flex-end",
        marginBottom: "16px",
        paddingLeft: "16px",
        paddingRight: "16px",
        maxWidth: "65%",
        clear: "both",
        position: "relative",
        display: "flex",
        flexDirection: "column",
        flexShrink: "0",
    }
}

export const messageWrapperStyle = () => {

    return {
        width: "auto",
        flex: "1 1",
        alignSelf: "flex-end",
        display: "flex",
    }
}

export const messageImgWrapper = context => {

	const mq = [...context.theme.breakPoints];

	return {
		display: "inline-block",
		alignSelf: "flex-end",
		maxWidth: "300px",
		height: "200px",
		cursor: "pointer",
		flexShrink: "0",
		img: {
			borderRadius: "8px",
			height: "100%",
		},
		[`@media ${mq[1]}, ${mq[2]}`]: {
			minWidth: "50px",
			maxWidth: "150px",
			height: "100px",
			padding: "2px 2px",
		},
	};
};

export const messageInfoWrapperStyle = () => {

    return {
        alignSelf: "flex-end",
        display: "flex",
        justifyContent: "flex-end",
        alignItems: "center",
        height: "25px",
        padding: "4px 8px",
    }
}

export const messageReactionsWrapperStyle = () => {

    return {
        display: "inline-flex",
        alignSelf: "flex-end",
        width: "100%",
        flexWrap: "wrap",
        justifyContent: "flex-end",
    }
}
