import { fontHelper } from "../../..";
export const editPreviewContainerStyle = (props, theme) => {
  return {
    padding: "5px",
    margin: "0 10px 5px 5px",
    width: props.style.width,
    height: props.style.height,
    zIndex: "12",
    borderLeft:
      props.style.border || theme.palette.accent100[theme.palette.mode],
    background:
      props.style.messagePreviewBackground ||
      theme.palette.background[theme.palette.mode],
  };
};

export const previewHeadingStyle = () => {
  return {
    display: "flex",
    marginBottom: "5px",
    alignItems: "center",
    justifyContent: "space-between",
  };
};

export const previewTitleStyle = (props, theme) => {
  return {
    font:
      props.style.messagePreviewTitleFont ||
      fontHelper(theme.typography.caption1),
    color:
      props.style.messagePreviewTitleColor ||
      theme.palette.accent[theme.palette.mode],
    lineHeight: "1.33",
    letterSpacing: ".5px",
  };
};

export const previewSubTitleStyle = (props, theme) => {
  return {
    font:
      props.style.messagePreviewSubtitleFont ||
      fontHelper(theme.typography.subtitle2),
    color:
      props.style.messagePreviewSubtitleColor ||
      theme.palette.accent600[theme.palette.mode],
    lineHeight: "1.38",
    letterSpacing: ".5px",
  };
};

export const previewCloseStyle = (props, theme) => {
  return {
    width: "16px",
    height: "16px",
    cursor: "pointer",
    borderRadius: "50%",
    WebkitMask: `url(${props.closeIconURL}) center center no-repeat`,
    backgroundColor:
      props.style.closeIconTint || theme.palette.accent500[theme.palette.mode],
  };
};
