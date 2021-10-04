export const blockedMessageWrapperStyle = () => {
    return {
        padding: "16px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#fff",
        zIndex: "1",
        order: "3",
        position: "relative",
        flex: "none",
        minHeight: "105px",
        width: "100%",
        margin: "auto"
    }
}

export const blockedMessageContainerStyle = () => {
    return {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center"
    }
}

export const blockedTitleStyle = () => {
    return {
        fontSize: "20px",
        fontWeight: "700",
        textAlign: "center"
    }
}

export const bockedSubTitleStyle = context => {
	return {
		margin: "16px 0",
		textAlign: "center",
		color: context.theme.color.helpText,
	};
};

export const unblockButtonStyle = context => {

    const mq = [...context.theme.breakPoints];

    const widthProp = {
        width: "15%",
        [`@media ${mq[1]}`]: {
            width: "70%",
        },
        [`@media ${mq[2]}`]: {
            width: "50%",
        },
        [`@media ${mq[3]}`]: {
            width: "30%",
        },
        [`@media ${mq[4]}`]: {
            width: "20%",
        }
    };

	return {
		...widthProp,
		padding: "8px 16px",
		margin: "0",
		borderRadius: "12px",
		backgroundColor: `${context.theme.primaryColor}!important`,
		color: `${context.theme.color.white}`,
	};
};