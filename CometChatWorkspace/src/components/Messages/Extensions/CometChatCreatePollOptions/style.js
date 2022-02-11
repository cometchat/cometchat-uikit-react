export const removeOptionIconStyle = (img) => {

	return {
		mask: `url(${img}) center center no-repeat`,
		backgroundColor: `red`,
		cursor: "pointer",
		display: "block",
		height: "24px",
		width: "24px",
	};
};

export const iconWrapperStyle = () => {
    return {
        width: "50px"
    }
}