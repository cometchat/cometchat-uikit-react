export const messageVideoBubbleStyle = (props) => {
  return {
    padding: "0",
    borderRadius: props.style.borderRadius,
    background: props.style.background,
    border: props.style.border,
    alignItems: props.alignItems,
  };
};

export const messageVideoBubbleBlockStyle = (props) => {
  return {
    margin: "0",
    outline: "none",
    borderRadius: "inherit",
    maxWidth: props.style.width,
  };
};
