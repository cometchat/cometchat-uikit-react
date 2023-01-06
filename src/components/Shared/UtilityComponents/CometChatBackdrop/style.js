export const backdropStyle = (props) => {
  return {
    zIndex: "3",
    background: props.background,
    position: "fixed",
    width: "100%",
    height: "100%",
    top: "0",
    left: "0",
    transition: "background .3s ease-out 0",
    ...props.style,
  };
};

export const dialogStyle = () => {
  return {
    opacity: "1",
    width: "100%",
    height: "100%",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  };
};
