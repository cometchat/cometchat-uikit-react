export const messageImageBubbleStyle = (props) => {
  return {
    padding: "0",
    minWidth: "110px",
    height: props.style.height,
    border: props.style.border,
    background: props.style.background,
    borderRadius: props.style.borderRadius,
    position: "relative",
  };
};

export const messageImageBubbleBlockStyle = (props, unsafe) => {
  let unsafeStyle = {};
  if (unsafe) {
    unsafeStyle = {
      filter: "blur(12px)",
      opacity: "0.4",
    };
  }
  return {
    margin: "0",
    borderRadius: "inherit",
    maxWidth: props.style.width,
    height: props.style.height,
    ...unsafeStyle,
  };
};

/** message unsafe styles */
export const messageUnsafeStyle = (props) => {
  return {
    background: "transparent",
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    zIndex: "20",
    width: "90%",
    padding: "20px",
    textAlign: "center",
  };
};
export const messageUnsafeIconStyle = (img) => {
  return {
    width: "38px",
    height: "48px",
    WebkitMask: `url(${img}) center center no-repeat`,
    background: "rgba(255,255,255)",
    display: "block",
    margin: "auto",
    marginBottom: "5px",
    cursor: "pointer",
  };
};
