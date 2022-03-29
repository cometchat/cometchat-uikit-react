
export const containerStyle = (props, theme) => {
  return {
		width: props?.style?.width,
		height: props?.style?.height,
		display: "flex",
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		position: "relative",
		border: props.style.border,
	};
};