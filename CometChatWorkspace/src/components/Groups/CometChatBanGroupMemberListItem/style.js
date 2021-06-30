export const modalRowStyle = (context) => {

    return {
        borderLeft: `1px solid ${context.theme.borderColor.primary}`,
        borderRight: `1px solid ${context.theme.borderColor.primary}`,
        borderBottom: `1px solid ${context.theme.borderColor.primary}`,
        display: "flex",
        width: "100%",
        fontSize: "14px",
        flexDirection: "row",
        justifyContent: "flex-start",
        alignItems: "center",
        padding: "8px",
    };
}

export const userStyle = context => {
    
	const mq = context.theme.breakPoints.map(x => `@media ${x}`);

	return {
		width: "calc(100% - 220px)",
		[mq[0]]: {
			width: "calc(100% - 185px)",
		},
		[mq[1]]: {
			width: "calc(100% - 185px)",
		},
		[mq[2]]: {
			width: "calc(100% - 185px)",
		},
	};
};

export const avatarStyle = () => {

    return {
        display: "inline-block",
        float: "left",
        width: "36px",
        height: "36px",
        marginRight: "8px",
    }
}

export const nameStyle = () => {

    return {
        margin: "10px 0 0 0",
        width: "calc(100% - 50px)",
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap"
    }
}

export const roleStyle = (context) => {

    const mq = context.theme.breakPoints.map(x => `${x}`);

    return {
        width: "150px",
        fontSize: "12px",
        [`@media ${mq[1]}, ${mq[2]}`]: {
            width: "115px"
        }
    }
}

export const actionStyle = (img, context) => {

    return {
        width: "70px",
        "i": {
            width: "24px",
            height: "24px",
            cursor: "pointer",
            mask: `url(${img}) center center no-repeat`,
            backgroundColor: `${context.theme.secondaryTextColor}`,
            display: "inline-block"
        },
    };
}