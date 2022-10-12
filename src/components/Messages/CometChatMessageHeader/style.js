import { BaseStyles, fontHelper } from "../../Shared";

export const chatHeaderStyle = (props, theme) => {
  return {
    ...new BaseStyles({
      width: "100%",
      height: "auto",
      background:
        props.style.background || theme.palette.background[theme.palette.mode],
      border: props.style.border || "none",
      borderRadius: "none",
      activeBackground: "none",
    }),
    padding: "16px",
    zIndex: "1",
    display: "inline-flex",
    flexDirection: "row",
    justifyContent: "space-between",
  };
};

export const chatDetailStyle = (props) => {
  return {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    width: "calc(100% - 116px)",
    height: "auto",
  };
};
export const backButtonStyle = (props) => {
  return {
    WebkitMask: `url(${props.backButtonIconURL}) no-repeat left center`,
    backgroundColor: `${props.style.backButtonIconTint}`,
    height: "24px",
    width: "24px",
    cursor: "pointer",
    padding: "16px",
  };
};
export const chatThumbnailStyle = () => {
  return {
    display: "inline-block",
    flexShrink: "0",
    marginRight: "16px",
    position: "relative",
  };
};

export const chatOptionWrapStyle = () => {
  return {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "auto",
  };
};
export const menuActionStyle = (infoIcon) => {
  return {
    outline: "0",
    border: "0",
    height: "24px",
    width: "24px",
    padding: "18px",
    borderRadius: "4px",
    alignItems: "center",
    display: "inline",
    justifyContent: "center",
    position: "relative",
    WebkitMask: `url(${infoIcon}) center center no-repeat`,
    background: "rgb(51, 153, 255)",
    cursor: "pointer",
  };
};
export const iconStyle = () => {
  return {
    width: "auto%",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    lexDirection: "row",
    display: "none",
  };
};

export const listStyle = () => {
  return {
    display: "flex",
  };
};

export const dataItemStyle = (props, theme) => {
  return {
    ...new BaseStyles(
      "100%",
      "100%",
      theme.palette.background[theme.palette.mode],
      "none",
      "8px",
      "none"
    ),
    titleFont: fontHelper(theme.typography.title2),
    titleColor: theme?.palette?.getAccent(),
    subtitleFont: fontHelper(theme.typography.subtitle2),
    subtitleColor: theme?.palette?.getPrimary(),
    tailColor: theme?.palette?.getPrimary(),
    tailFont: "none",
  };
};
