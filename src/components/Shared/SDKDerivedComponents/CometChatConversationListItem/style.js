import { CometChatLocalize } from "../..";

export const listItemStyle = (style, theme, isActive) => {
  return {
    display: "flex",
    flexDirection: "row",
    justifyContent: "left",
    alignItems: "center",
    cursor: "pointer",
    width: style?.width,
    padding: "0px 8px",
    position: "relative",
    background: isActive ? style?.activeBackground : style?.background,
  };
};

export const itemThumbnailStyle = () => {
  return {
    display: "flex",
    position: "relative",
    flexShrink: "0",
    justifyContent: "center",
    alignItems: "center",
    padding: "8px 0px",
  };
};

export const itemDetailStyle = (style, theme) => {
  const margin = CometChatLocalize.isRTL()
    ? { marginRight: "16px" }
    : { marginLeft: "16px" };

  return {
    //TODO: This needs to be replaced with Divider
    borderBottom: style?.border || "1px solid " + theme?.palette.getAccent200(),
    padding: "8px 0px",
    width: "100%",
    height: "100%",
    ...margin,
  };
};

export const itemTitleStyle = () => {
  return {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  };
};

export const itemSubTitleStyle = () => {
  return {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  };
};

export const titleStyle = (style) => {
  return {
    font: style?.titleFont,
    color: style?.titleColor,
    display: "block",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    lineHeight: "22px",
    width: "75%",
    minWidth: "100px",
  };
};

export const subTitleStyle = (style) => {
  return {
    font: style?.subtitleFont,
    color: style?.subtitleColor,
    width: "calc(100% - 24px)",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    lineHeight: "1",
    margin: "0",
  };
};

export const typingTextStyle = (style) => {
  return {
    font: style?.typingIndicatorTextFont,
    color: style?.typingIndicatorTextColor,
    width: "calc(100% - 24px)",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    lineHeight: "1",
    margin: "0",
  };
};

export const itemThreadIndicatorStyle = (style) => {
  return {
    font: style?.subtitleFont,
    color: style?.subtitleColor,
    width: "calc(100% - 24px)",
    lineHeight: "20px",
  };
};

export const subMenuStyles = (style, theme) => {
  const leftRightPosition = CometChatLocalize.isRTL()
    ? { left: "0" }
    : { right: "0" };

  return {
    position: "absolute",
    width: "auto",
    height: style?.height,
    padding: "0px 16px",
    moreIconTint: theme?.palette?.getAccent50(),
    iconTint: theme?.palette?.getAccent(),
    top: 0,
    ...leftRightPosition,
  };
};
