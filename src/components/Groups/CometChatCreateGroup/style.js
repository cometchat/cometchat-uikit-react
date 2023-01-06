import { fontHelper } from "../../Shared";

export const createGroupWrapperStyle = (style, theme) => {
  return {
    width: style?.width || "100%",
    height: style?.height || "100%",
    border:
      style?.border ||
      `1px solid ${theme.palette.accent50[theme.palette.mode]}`,
    boxShadow:
      style.boxShadow ||
      `${theme.palette.accent50[theme.palette.mode]} 0 16px 32px, ${
        theme.palette.accent50[theme.palette.mode]
      } 0 0 0 1px`,
    background:
      style?.background || theme.palette.background[theme.palette.mode],
    borderRadius: style?.borderRadius,
    overflow: "hidden",
    position: "fixed",
    margin: "auto",
    cursor: "default",
  };
};

export const createGroupBodyStyle = () => {
  return {
    display: "flex",
    flexDirection: "column",
    position: "relative",
    width: "100%",
    height: "calc(100% - 65px)",
    padding: "16px",
  };
};

export const closeIconStyle = (style, img, theme) => {
  return {
    position: "absolute",
    width: "24px",
    height: "24px",
    top: "3%",
    right: "3%",
    WebkitMask: `url(${img}) center center no-repeat`,
    background: style.closeIconTint || theme?.palette?.getPrimary(),
    cursor: "pointer",
    zIndex: 1,
  };
};
export const createGroupHeader = () => {
  return {
    padding: "20px",
  };
};

export const createGroupTitleStyle = (style, theme) => {
  return {
    margin: "0",
    font: style?.titleFont || fontHelper(theme?.typography?.heading),
    color: style?.titleColor || theme?.palette?.getAccent(),
    textAlign: "center",
  };
};

export const createGroupTabContainerStyle = (style) => {
  return {
    borderRadius: "8px",
    width: style?.width,
    margin: "0",
  };
};

export const createGroupTabListStyle = (style, theme) => {
  return {
    height: "inherit",
    width: "fit-content",
    padding: "0",
    borderRadius: "8px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "auto",
    background:
      style?.groupTypeTextBackground || theme?.palette?.getAccent100(),
    font:
      fontHelper(theme?.typography?.subtitle2) || "500 13px Inter,sans-serif",
    color: theme?.palette?.getAccent() || "rgb(20,20,20)",
  };
};

export const createGroupTabStyle = (
  style,
  theme,
  activeTab,
  tab,
  isHovering
) => {
  let activeTabStyle;
  if (activeTab === tab) {
    activeTabStyle = {
      background:
        style?.groupTypeTextActiveBackground || theme?.palette?.getBackground(),
      height: "28px",
      boxShadow: `${theme?.palette?.getAccent50()} 0px 0px 0px 1px`,
      borderRadius: "8px",
    };
  }
  return {
    width: "110px",
    textFont: style?.groupTypeTextFont,
    textColor: style?.groupTypeTextColor,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: isHovering
      ? style?.groupTypeTextActiveBackground || theme?.palette?.getBackground()
      : "transparent",
    ...activeTabStyle,
  };
};

export const createGroupInput = (style) => {
  return {
    width: style?.width,
    border: "none",
    outline: "none",
  };
};

export const createGroupInputName = () => {
  return {
    margin: "20px 0px 8px 0px",
    padding: "4px 0px",
  };
};

export const createGroupInputPassword = () => {
  return {
    padding: "4px 0px",
  };
};

export const nameInputStyle = (style, theme) => {
  return {
    background: style?.nameInputBackground || theme?.palette?.getAccent50(),
    border: style?.nameInputBorder || "none",
    borderRadius: style?.nameInputBorderRadius || "8px",
    boxShadow:
      style?.nameInputBoxShadow ||
      `${theme?.palette?.getAccent50()} 0px 0px 0px 1px`,
    width: style?.width,
    height: "46px",
    outline: "none",
    padding: "6px 12px",
  };
};

export const passwordInputStyle = (style, theme) => {
  return {
    background: style?.passwordInputBackground || theme?.palette?.getAccent50(),
    border: style?.passwordInputBorder || "none",
    borderRadius: style?.passwordInputBorderRadius || "8px",
    boxShadow:
      style?.passInputBoxShadow ||
      `${theme?.palette?.getAccent50()} 0px 0px 0px 1px`,
    width: style?.width,
    height: "46px",
    outline: "none",
    padding: "6px 12px",
  };
};

export const errorContainerStyle = (style, theme) => {
  return {
    width: style?.width,
    padding: "10px 0px",
    marginTop: "16px",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: style?.errorTextBackground || "rgba(255, 59, 48, 0.1)",
    border: style?.errorTextBorder || "none",
    borderRadius: style?.errorTextBorderRadius || "8px",
  };
};

export const errorIconStyle = (theme) => {
  return {
    iconBackground: theme?.palette?.getError() || "RGB(255, 59, 48)",
    iconTint: theme?.palette?.getBackground("light"),
    iconBackgroundWidth: "38px",
    iconBackgroundHeight: "38px",
    iconWidth: "24px",
    iconHeight: "24px",
    margin: "0px 12px",
  };
};
export const errorTextStyle = (style, theme) => {
  return {
    color: style?.errorTextColor || theme?.palette?.getError(),
    font: style?.errorTextFont || fontHelper(theme?.typography?.text1),
  };
};

export const createGroupButton = (style) => {
  return {
    display: "inline-block",
    width: "calc(100% - 30px)",
    position: "absolute",
    bottom: "0",
    right: "0",
    left: "0",
    margin: "16px",
  };
};

export const createButtonStyle = (style, theme) => {
  return {
    width: style?.width,
    height: "46px",
    outline: "0",
    borderRadius: style?.createGroupButtonBorderRadius || "8px",
    font:
      style?.createGroupButtonTextFont || fontHelper(theme?.typography?.title2),
    color:
      style?.createGroupButtonTextColor ||
      theme?.palette?.getAccent900("light"),
    background:
      style?.createGroupButtonBackground || theme?.palette?.getPrimary(),
    border: "none",
  };
};
