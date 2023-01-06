export const listItem = (props) => {
  return {
    ...props.style,
  };
};

export const listTitle = (props) => {
  let margin = { margin: "0 6px" },
    padding = { padding: "5px 5px" };
  if (props.style.margin || props.style.padding) {
    margin = { margin: props.style.margin };
    padding = { padding: props.style.padding };
  }
  return {
    ...margin,
    background: "transparent",
    textTransform: "capitalize",
    ...padding,
    font: props.style.textFont,
    color: props.style.textColor,
    wordWrap: "break-word",
    cursor: "pointer",
  };
};

export const listItemIconStyle = (props) => {
  let padding = { padding: "5px 5px" };
  if (props.style.margin || props.style.padding) {
    padding = { padding: props.style.padding };
  }

  return {
    WebkitMask: `url(${props.iconURL})center center no-repeat`,
    background: props.style.iconTint,
    transform: props.style.iconTransform,
    width: props.style.iconWidth,
    height: props.style.iconHeight,
    ...padding,
    cursor: "pointer",
    boxSizing: "border-box",
  };
};

export const iconBackgroundStyle = (props) => {
  return {
    borderRadius: "50%",
    background: props.style.iconBackground,
    cursor: "pointer",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    width: props.style.iconBackgroundWidth,
    height: props.style.iconBackgroundHeight,
  };
};
