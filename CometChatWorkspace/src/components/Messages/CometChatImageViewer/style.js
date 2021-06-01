export const imageWrapperStyle = (props, closeIcon, img) => {

    const heightProps = (img) ? {
        height: "auto",
    } : {
        height: "100%",
    };

	const mq = [`@media (min-width : 320px) and (max-width: 767px)`];

    return {
		position: "absolute",
		top: "0",
		left: "0",
		width: "100%",
		padding: "1.8% 2.3%",
		zIndex: "9999",
		display: "flex",
		justifyContent: "center",
		alignItems: "center",
		background: `url(${closeIcon}) no-repeat 99% 0.8% #fff`,
		cursor: "pointer",
		...heightProps,
		[mq[0]]: {
			height: "100%",
		},
	};
}

export const imgStyle = image => {

    const sizeProps = (!image) ? {
        width: "24px",
        height: "24px",
    } : {};

	return {
		objectFit: "contain",
		...sizeProps,
	};
};