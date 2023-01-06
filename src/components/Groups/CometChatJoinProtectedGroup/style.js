import { fontHelper, BaseStyles } from "../..";

export const joinGroupContainerStyle = (style, theme) => {
  return {
    margin: "auto",
    width: style?.width,
    height: style?.height,
    borderRadius: style?.borderRadius,
    border: style.border,
    zIndex: "2",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    background: style?.background || theme?.pallete?.getBackground(),
  };
};

export const joinGroupTitleStyle = (style, theme) => {
  return {
    font: style?.titleTextFont || fontHelper(theme?.typography?.heading),
    color: style?.titleTextColor || theme?.palette?.getAccent700(),
  };
};

export const joinGroupPasswordInputStyle = (style, theme) => {
  return {
    width: style?.width,
    height: "46px",
    color: style?.passwordTextFont || fontHelper(theme?.typography?.subtitle2),
    font: style?.passwordTextColor || theme?.palette?.getAccent900(),
    background: style?.passwordInputBackground || theme?.palette?.getAccent50(),
    border: style?.passwordInputBorder || "none",
    borderRadius: style?.passwordInputBorderRadius || "8px",
    boxShadow:
      style?.passwordInputBoxShadow ||
      `${theme?.palette?.getAccent50()} 0px 0px 0px 1px`,
    margin: "38px 0px 16px 0px",
    outline: "none",
    padding: "6px 12px",
  };
};

export const joinGroupButtonStyle = (style, theme) => {
  return {
    width: style?.width,
    height: "46px",
    font: style?.joinButtonTextFont || fontHelper(theme?.typography?.title2),
    color: style?.joinButtonTextColor || theme?.palette?.getAccent900("light"),
    background: style?.joinButtonBackground || theme?.palette?.getPrimary(),
    borderRadius: style?.joinButtonBorderRadius,
    border: "none",
  };
};

export const errorContainerStyle = (style, theme) => {
  return {
    width: style?.width,
    height: "60px",
    margin: "16px 0px 32px 0px",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "rgba(255, 59, 48, 0.1)", //not in theme
    border: "none",
    borderRadius: "8px",
  };
};

export const errorIconStyle = (theme) => {
  return {
    iconBackground: theme?.palette?.getError() || "RGB(255, 59, 48)",
    iconTint: "white",
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

export const joinGroupPasswordInputContainerStyle = (style) => {
  return {
    width: style?.width,
    height: "auto",
    margin: "0",
    padding: "0",
  };
};

export const errorMessageBoxStyle = (style) => {
  return {
    width: style?.width,
    height: "auto",
    margin: "0",
    padding: "0",
  };
};

export const joinGroupProtectedWrapperStyle = () => {
  return {
    margin: "auto",
    width: "343px",
    height: "100%",
    borderRadius: "8px",
    zIndex: "4",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
  };
};

export const messageHeaderStyle = (theme) => {
  return {
    ...new BaseStyles({
      width: "100%",
      height: "auto",
      background: theme?.palette?.getBackground(),
      border: "none",
      borderRadius: "none",
      activeBackground: "none",
    }),
    backButtonIconTint: theme?.palette?.getPrimary(),
  };
};
