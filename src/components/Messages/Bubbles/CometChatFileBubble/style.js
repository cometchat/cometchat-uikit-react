import { fontHelper } from "../../../";

export const messageKitFileBubbleBlockStyle = (props, theme) => {
  return {
    borderRadius: props.style.borderRadius,
    padding: "8px 0px",
    background:
      props.style.background || theme.palette.accent50[theme.palette.mode],
    display: "flex",
    width: "100%",
    border: props.style.border,
    justifyContent: "center",
    alignItems: "center",
  };
};

export const messageFileBubbleBlockStyle = (props) => {
  return {
    width: "calc(100% - 24px)",
    whiteSpace: "pre-wrap",
    wordWrap: "break-word",
    textAlign: "left",
    margin: "0 0 0 10px",
  };
};

export const messageTitleStyle = (props, theme) => {
  return {
    color:
      `${props.style.titleColor}` || theme?.palette?.getAccent(),
    font: `${props.style.titleFont}` || fontHelper(theme.typography.title2),
  };
};

export const messageSubTitleStyle = (props, theme) => {
  return {
    color:
      `${props.style.subTitleColor}` ||
      theme.palette.accent600[theme.palette.mode],
    font:
      `${props.style.subTitleFont}` || fontHelper(theme.typography.subtitle2),
  };
};
export const messageFileIconStyle = (props, url, theme) => {
  return {
    WebkitMask: `url(${url}) center center no-repeat`,
    background:
      `${props.style.iconTint}` || theme?.palette?.getPrimary(),
    display: "inline-block",
    width: "24px",
    height: "24px",
    padding: "13px 20px",
    cursor: "pointer",
    zIndex: "2",
  };
};
