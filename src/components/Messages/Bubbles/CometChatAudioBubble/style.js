export const messageAudioBubbleStyle = (props) => {
  return {
    borderRadius: props.style.borderRadius,
    background: props.style.background,
    border: props.style.border,
    display: "flex",
    width: props.style.width,
  };
};

export const messageAudioBubbleBlockStyle = (props) => {
  return {
    width: props.style.width,
    height: props.style.height,
    whiteSpace: "pre-wrap",
    wordWrap: "break-word",
    textAlign: "left",
    display: "inline-block",
  };
};

export const messageBlockAudioStyle = (props) => {
  return {
    width: props.style.width,
    // height: "100%",
  };
};
