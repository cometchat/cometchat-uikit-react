export const replyCountStyle = (props) => {
  return {
    display: "block",
    font: props.style.textFont,
    background: props.style.background,
    borderRadius: props.style.borderRadius,
    paddingRight: "10px",
    cursor: "pointer",
    color: props.style.textColor,
    lineHeight: "normal",
    letterSpacing: "-0.1px",
    "&:hover": {
      textDecoration: "underline",
    },
  };
};

export const messageThreadCloseIconStyle = (props) => {
  return {
    WebkitMask: `url(${props.iconURL}) center center no-repeat`,
    background: props.style.iconTint,
    color: props.style.iconBackground,
    margin: "0",
    zIndex: "2",
  };
};
