import { fontHelper } from "../../../Shared";

export const dataItemStyle = (style, theme, isActive) => {
  return {
    display: "flex",
    flexDirection: "row",
    justifyContent: "left",
    alignItems: "center",
    cursor: "pointer",
    width: style?.width,
    height: style?.height,
    borderRadius: style?.borderRadius,
    padding: "0 16px",
    background: isActive
      ? style?.activeBackground
      : style?.background || theme?.palette?.getBackground(),
  };
};

export const dataItemThumbnailStyle = () => {
  return {
    display: "flex",
    position: "relative",
    flexShrink: "0",
    justifyContent: "center",
    alignItems: "center",
    padding: "8px 0px",
  };
};

export const dataItemDetailStyle = (style, theme) => {
  return {
    borderBottom: style?.border,
    width: "100%",
    marginLeft: "16px",
    padding: "8px 0px",
  };
};

export const dataItemNameStyle = (style, theme) => {
  return {
    font: style?.titleFont || fontHelper(theme?.typography?.title2),
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    width: "100%",
    lineHeight: "22px",
    color: style?.titleColor || theme?.palette?.getAccent(),
  };
};

export const dataItemSubtitleStyle = (style, theme) => {
  return {
    font: style?.subtitleFont || fontHelper(theme?.typography?.subtitle2),
    color: style?.subtitleColor || theme?.palette?.getAccent600(),
    display: "flex",
    justifyContent: "left",
    alignItems: "center",
    width: "100%",
    letterSpacing: -1,
  };
};
