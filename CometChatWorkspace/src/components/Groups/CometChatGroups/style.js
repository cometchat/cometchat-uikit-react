import { CometChatLocalize } from "../../";

export const containerStyle = (props) => {
  return {
    width: props.style?.width,
    height: props.style?.height,
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    border: props.style.border,
  };
};

export const createGroupBtnStyle = (props, theme) => {
  const direction = CometChatLocalize.isRTL()
    ? { left: "16px" }
    : { right: "16px" };
  return {
    WebkitMask: `url(${props.createGroupIconURL}) no-repeat left center`,
    backgroundColor: `${props.style.createGroupIconTint || theme.palette.primary[theme.palette.mode]}`,
    height: "24px",
    width: "24px",
    cursor: "pointer",
    position: "absolute",
    top: "20px",
    ...direction,
  };
};
