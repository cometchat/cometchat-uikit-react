export const imageWrapperStyle = (context, closeIcon, img) => {
	const heightProps = img
		? {
				height: "auto",
		  }
		: {
				height: "100%",
		  };

	const mq = [...context.theme.breakPoints];

	return {
		position: "absolute",
		top: "0",
		left: "0",
		bottom: "0",
		right: "0",
		width: "100%",
		padding: "1.8% 2.3%",
		zIndex: "9999",
		display: "flex",
		justifyContent: "center",
		alignItems: "center",
		background: `url(${closeIcon}) no-repeat 99% 0.8% #fff`,
		cursor: "pointer",
		paddingTop:"26px",
		...heightProps,
		[`@media ${mq[1]}, ${mq[2]}`]: {
			height: "100%",
		},
	};
};

export const imgStyle = (image) => {
	const sizeProps = !image
		? {
				width: "24px",
				height: "24px",
		  }
		: {
				maxHeight: "100%",
		  };

	return {
		objectFit: "contain",
		...sizeProps,
	};
};
