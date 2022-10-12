export const imgStyle = () => {
  return {
    overflow: "hidden",
    display: "inherit",
    width: "100%",
    height: "100%",
  };
};

export const getImageStyle = (style, imageURL) => {
  return {
    display: "flex",
    width: "100%",
    height: "100%",
    flex: "1 1 100%",
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
    backgroundSize: style?.backgroundSize,
    backgroundImage: `url(${imageURL})`,
    borderRadius: style?.borderRadius,
  };
};

export const getContainerStyle = (style) => {
  return {
    height: style?.height,
    width: style?.width,
    borderRadius: style?.borderRadius,
    margin: style?.outerViewSpacing,
    border: style?.border,
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "stretch",
    backgroundColor: style?.backgroundColor,
    boxSizing: "content-box",
    cursor: "inherit",
    outline: "none",
    overflow: "hidden",
    position: "static",
    padding: "0",
  };
};

export const getOuterViewStyle = (style) => {
  return {
    borderRadius: style?.borderRadius,
    border: style?.outerView,
    margin: "0",
    padding: "0",
  };
};

export const textStyle = (style) => {
  return {
    height: "100%",
    width: "100%",
    font: style?.textFont,
    color: style?.textColor,
    textAlign: 'center',
    textAlignVertical: 'center',
    lineHeight: style?.height
  }
}