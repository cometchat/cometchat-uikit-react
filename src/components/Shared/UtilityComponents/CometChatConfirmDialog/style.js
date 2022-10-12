export const dialogLoadingWrapperStyle = (props, state) => {
  const display =
    state === "loading" ? { display: "flex" } : { display: "none" };
  return {
    justifyContent: "center",
    alignItems: "center",
    height: props?.style?.height,
    width: props?.style?.width,
    ...display,
  };
};

export const dialogLoadingStyle = (loadingIcon) => {
  return {
    background: `url(${loadingIcon}) center center`,
    width: "24px",
    height: "24px",
  };
};
export const dialogTitleStyle = (props) => {
  return {
    width: props?.style?.width,
    font: props?.style?.titleTextFont,
    color: props?.style?.titleTextColor,
    textAlign: "center",
    padding: "10px",
    boxSizing: "border-box",
  };
};
export const dialogWrapperStyle = (props) => {
  const display = props?.isOpen ? { display: "block" } : { display: "none" };

  return {
    background: props?.style?.background,
    fontSize: "13px",
    zIndex: "4",
    ...display,
    ...props?.styles,
  };
};

export const dialogFormStyle = (props, state) => {
  const display =
    state === "initial" || state === "done"
      ? { display: "block" }
      : { display: "none" };
  return {
    width: props?.style?.width,
    height: "auto",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    ...display,
  };
};

export const dialogErrorStyle = (props, state) => {
  const display =
    state === "error" ? { display: "block" } : { display: "none" };
  return {
    font: "11px Inter",
    color: "red",
    textAlign: "center",
    ...display,
  };
};

export const dialogMessageStyle = (props) => {
  return {
    textAlign: "center",
    margin: "10px 35px",
    font: "500 11px Inter,sans-serif",
    color: "rgba(20,20,20, 0.6)",
    boxSizing: "border-box",
    wordSpacing: "1px",
  };
};

export const dialogButtonStyle = (props) => {
  return {
    width: props?.style?.width,
    justifyContent: "center",
    alignItems: "center",
    margin: "15px 0 0 0",
    textAlign: "center",
    display: "flex",
    flexDirection: "column",
  };
};

export const buttonConfirmStyle = (props) => {
  return {
    width: "90%",
    height: "46px",
    marginBottom: "5px",
    cursor: "pointer",
    borderRadius: props?.style?.borderRadius,
    font: props?.style?.confirmButtonTextFont,
    border: props?.style?.border,
    background: props?.style?.confirmBackground,
    color: props?.style?.confirmButtonTextColor,
  };
};

export const buttonCancelStyle = (props) => {
  return {
    width: "90%",
    height: "46px",
    border: "none",
    marginBottom: "5px",
    cursor: "pointer",
    borderRadius: props?.style?.borderRadius,
    font: props?.style?.cancelButtonTextFont,
    background: props?.style?.cancelBackground,
    color: props?.style?.cancelButtonTextColor,
  };
};
