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
    font: props?.style?.titleFont,
    color: props?.style?.titleColor,
    textAlign: "center",
    padding: "10px",
    boxSizing: "border-box",
  };
};
export const dialogWrapperStyle = (props) => {
  const display = props?.isOpen ? { display: "block" } : { display: "none" };
  return {
    background: props?.style?.background,
    borderRadius: props.style.borderRadius,
    fontSize: "13px",
    zIndex: "4",
    ...display,
    ...props?.style,
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
    margin: "10px",
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
    margin: "10px 25px",
    font: props.style.subTitleFont,
    color: props.style.subTitleColor,
    boxSizing: "border-box",
    wordSpacing: "1px",
  };
};

export const dialogButtonStyle = (props) => {
  return {
    width: props?.style?.width,
    justifyContent: "center",
    alignItems: "center",
    margin: "15px 0",
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
    background: props?.style?.confirmButtonBackground,
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
    background: props?.style?.cancelButtonBackground,
    color: props?.style?.cancelButtonTextColor,
  };
};
