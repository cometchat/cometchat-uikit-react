export const messageContainerStyle = (props) => {
  return {
    // paddingLeft: "16px",
    // paddingRight: "16px",
    clear: "both",
    flexShrink: "0",
    
  };
};

export const messageWrapperStyle = (props) => {
  return {
    flex: "1 1",
    display: "flex",
    position: "relative",
    width: props.style.width,
    height: props.style.height,
  };
};

export const messageTxtWrapperStyle = (props) => {
  return {
    display: "inline-block",
    padding: "8px 12px",
    alignSelf: "flex-end",
    Width: props.style.width,
    height: props.style.height,
    border: props.style.border,
    background: props.style.background,
    borderRadius: props.style.borderRadius,
  };
};

export const messageTxtStyle = (props) => {
  return {
    
    font: props.style.textFont,
    color: props.style.textColor,
    margin: "0",
    lineHeight: "20px!important",
  };
};
