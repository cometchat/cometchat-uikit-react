export const actionMessageStyle = (props) => {
  return {
    padding: "8px 16px",
    marginBottom: "16px",
    textAlign: "center",
    height: props.style.height,
    width: props.style.width,
    border: props.style.border,
    borderRadius: props.style.borderRadius,
    background: props.style.background,
  };
};

export const actionMessageTxtStyle = (props) => {
  return {
    font: props.style.textFont,
    color: props.style.textColor,
    margin: "0",
    lineHeight: "20px",
  };
};
