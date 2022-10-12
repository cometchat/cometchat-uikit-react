import { fontHelper } from "../../../";

export const messageKitDocumentBlockStyle = (props, theme) => {
  return {
    padding: "12px 0",
    display: "inline-block",
    alignSelf: "flex-end",
    flexDirection: "column",
    justifyContent: "center",
    border: props.style.border,
    width: props?.style?.width,
    height: props?.style?.height,
    borderRadius: props.style.borderRadius,
    background:
      props.style.background || theme.palette.background[theme.palette.mode],
    boxSizing: "border-box",
  };
};

export const messageDocumentBlockStyle = (props) => {
  return {
    width: props.style.width,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  };
};

export const messageDocumentIconStyle = (props, theme) => {
  return {
    WebkitMask: `url(${props.iconURL}) no-repeat left center`,
    background:
      props.style.iconTint || theme.palette.accent700[theme.palette.mode],
    width: "24px",
    height: "24px",
    display: "inline-block",
  };
};

export const messageDocumentTitleStyle = (props, theme) => {
  return {
    width: "70%",
    margin: "0 10px 0 0",
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
    textAlign: "left",
    font: props.style.titleFont || fontHelper(theme.typography.title2),
    color: props.style.titleColor || theme?.palette?.getAccent(),
  };
};

export const messageSubtitleWrapperStyle = (props, theme) => {
  return {
    padding: "8px 16px",
    display: "inline-block",
    alignSelf: "flex-end",
    flexDirection: "column",
    justifyContent: "center",
    border: props.style.border,
    width: props.style.width,
    borderRadius: props.style.borderRadius,
    background:
      props.style.background || theme.palette.background[theme.palette.mode],
    boxSizing: "border-box",
  };
};

export const messageDocumentSubtitleStyle = (props, theme) => {
  return {
    width: "80%",
    margin: "0",
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
    textAlign: "left",
    boxSizing: "border-box",
    font: props.style.subTitleFont || fontHelper(theme.typography.subtitle2),
    color:
      props.style.subTitleColor || theme.palette.accent600[theme.palette.mode],
  };
};

export const seperatorStyle = (props, theme) => {
  return {
    width: props.style.width,
    height: "1px",
    background: theme.palette.accent100[theme.palette.mode],
  };
};

export const messageDocumentBtnStyle = (props) => {
  return {
    width: props.style.width,
    padding: "0",
    margin: "0",
    listStyleType: "none",
  };
};

export const messageDocumentBtnItemStyle = (props) => {
  return {
    margin: "8px 0 0",
    cursor: "pointer",
    display: "flex",
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
    width: props.style.width,
    background: props.style.buttonBackground,
    borderRadius: props.style.borderRadius,
    boxSizing: "border-box",
  };
};

export const messageBtnItemTextStyle = (props, theme) => {
  return {
    margin: "0",
    background: "0 0",
    textAlign: "center",
    display: "inline-block",
    width: props.style.width,
    color: props.style.buttonTextColor || theme?.palette?.getPrimary(),
    font: props.style.buttonTextFont || fontHelper(theme.typography.title2),
  };
};
