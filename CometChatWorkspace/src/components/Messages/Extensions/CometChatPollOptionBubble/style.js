export const pollAnswerStyle = (props) => {
    return {
        backgroundColor: `${props.pollOptionsBackgroundColor}`,
        margin: "10px 0",
        borderRadius: "8px",
        display: "flex",
        width: "100%",
        cursor: "pointer",
        position: "relative",
    };
}

export const checkIconStyle = (img)  => {
	return {
		width: "24px",
		height: "24px",
		mask: `url(${img}) center center no-repeat`,
		backgroundColor: `#141414`,
	};
};

export const pollPercentStyle = (width) => {

    const curvedBorders = (width === "100%") ? { borderRadius: "8px" } : {
        borderRadius: "8px 0 0 8px"
    };

    return {
		maxWidth: "100%",
		width: width,
		...curvedBorders,
		backgroundColor: `rgb(230, 230, 230)`,
		minHeight: "35px",
		height: "100%",
		position: "absolute",
		zIndex: "1",
	};
}

export const answerWrapperStyle = (props) => {

    let widthProp = "calc(100% - 40px)";
	if (props.pollOption.hasOwnProperty("voters") && props.pollOption.voters.hasOwnProperty(props.loggedInUser?.uid)) {
		widthProp = "calc(100% - 80px)";
	}

	return {
		width: "100%",
		color: `rgb(20, 20, 20)`,
		display: "flex",
		alignItems: "center",
		minHeight: "35px",
		padding: "0 16px",
		height: "100%",
		zIndex: "2",
		p: {
			margin: "0",
			width: widthProp,
			minWidth:"75px",
			whiteSpace: "pre-wrap",
			wordWrap: "break-word",
			font: `${props.pollOptionsFont}`,
		},
		span: {
			maxWidth: "40px",
			padding: "0px 16px 0px 0px",
			display: "inline-block",
			font: `${props.pollOptionsFont}`,
		},
	};
}