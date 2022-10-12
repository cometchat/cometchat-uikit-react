export const messageStickerBlockStyle = (props) => {
  return {
    padding: "0",
    border: props.style.border,
    borderRadius: props.style.borderRadius,
    background: props.style.background,
  };
};

export const messageStickerBubbleBlockStyle = (props) => {
  return {
    margin: "0",
    maxWidth: props.style.width,
    height: props.style.height,
  };
};
