export const actionWrapperStyle = (props) => {
  return {
    listStyleType: "none",
    padding: "5px",
    margin: "0",
    background: props?.style?.background,
    borderRadius: "10px",
    display: "flex",
    ...props.style,
  };
};

export const menuActionStyle = (props) => {
  return {
    border: "0",
    iconHeight: "24px",
    iconWidth: "24px",
    margin: "5px",
    borderRadius: "4px",
    alignItems: "center",
    display: "flex",
    justifyContent: "center",
    position: "relative",
    cursor: "pointer",
    iconTint: props?.style?.iconTint,
    iconBackground: props?.style?.iconBackground,
  };
};

export const menuWrapperStyle = (props) => {
  return {
    position: "absolute",
    background: "#fff",
    top: "20px",
    left: "90%",
    listStyle: "none",
    padding: "1px",

    ...props.style,
  };
};
export const toggleStyle = (props) => {
  let position;
  if (props.style.left) {
    position = {
      left: "0px",
    };
  } else {
    position = {
      right: "0px",
    };
  }
  return {
    backgroundColor: props.style.background,
    display: "flex",
    padding: "5px",
    flexDirection: "column",
    position: "absolute",
    height: "max-content",
    width: "max-content",
    maxHeight: "192px",
    zIndex: "1",
    borderRadius: "8px",
    border: props.style.border,
    top: "38px",
    ...position,
    overflow: "visible",
    marginTop: "2px",
  };
};

export const listItemStyle = (props) => {
  return {
    width: "100%",
    height: "100%",
    iconTint: props?.style?.iconTint,
    iconBackground: props?.style?.iconBackground,
    borderRadius: "",
    textColor: props?.style?.textColor,
    border: "0",
    background: "transparent",
    textFont: props?.style?.textFont,
    // WebkitMask: `url(${props?.addReactionIconURL})`,
  };
};
