export const pollOptionAnswerStyle = () => {
  return {
    width: "100%",
    margin: "10px 0",
    position: "relative",
  };
};

export const pollOptionInputStyle = (props) => {
  return {
    ...props.style.inputStyles,
  };
};

export const removeOptionIconStyle = (props, img) => {
  return {
    WebkitMask: `url(${
      props.deleteIconURL || img
    }) right center / 24px no-repeat`,
    background: props.style.deleteIconTint,
    cursor: "pointer",
    display: "block",
    height: "28px",
    width: "28px",
    position: "absolute",
    top: "20%",
    left: "90%",
  };
};

export const iconWrapperStyle = (props) => {
  return {
    width: "28px",
    height: "28px",
  };
};
