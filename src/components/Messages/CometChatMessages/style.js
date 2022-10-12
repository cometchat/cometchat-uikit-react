import { BaseStyles, fontHelper } from "../../Shared";

export const chatWrapperStyle = (style) => {
  return {
    display: "flex",
    flexDirection: "column",
    height: style.height,
    width: style.width,
    margin: "none",
    boxSizing: "border-box",
    position: "relative",
    overflowX: "hidden",
  };
};

export const liveReactionWrapperStyle = () => {
  return {
    ...new BaseStyles({
      width: "100%",
      height: "100%",
      background: "none",
      border: "none",
      borderRadius: "none",
      activeBackground: "",
    }),
    position: "absolute",
    top: "0",
    right: "0",
    zIndex: "2",
    display: "flex",
    justifyContent: "left",
    alignItems: "center",
    boxSizing: "border-box",
  };
};

export const messageComposerStyle = (props, theme) => {
  return {
    ...new BaseStyles({
      width: "100%",
      height: "auto",
      background: theme.palette.getBackground(),
      border: "none",
      borderRadius: "12px",
      activeBackground: "none",
    }),
    inputBorderRadius: "8px",
    inputBackground: theme.palette.getAccent50(),
    inputTextFont: fontHelper(theme.typography.subtitle1),
    inputTextColor: theme?.palette?.getAccent(),
    placeholderTextFont: fontHelper(theme.typography.subtitle1),
    placeholderTextColor: theme.palette.getAccent600(),
    emojiIconTint: theme.palette.getAccent500(),
    attachmentIconTint: theme.palette.getAccent500(),
    microphoneIconTint: theme.palette.getAccent500(),
    sendButtonIconTint: theme.palette.getAccent50(),
    stickerIconTint: theme.palette.getAccent500(),
    stickerCloseIconTint: theme?.palette?.getPrimary(),
  };
};

export const messageHeaderStyle = (theme) => {
  return {
    ...new BaseStyles({
      width: "100%",
      height: "auto",
      background: theme.palette.getBackground(),
      border: "none",
      borderRadius: "none",
      activeBackground: "none",
    }),
    backButtonIconTint: theme.palette.getPrimary(),
  };
};

export const messageListStyle = (props, theme) => {
  return {
    ...new BaseStyles({
      width: "100%",
      height: "100%",
      background: theme.palette.getBackground(),
      border: "none",
      borderRadius: "8px",
      activeBackground: "none",
    }),
    textFont: fontHelper(theme.typography.subtitle2),
    textColor: theme?.palette?.getAccent(),
  };
};

export const liveReactionStyle = () => {
  return {
    ...new BaseStyles({
      width: "20px",
      height: "20px",
      background: "transparent",
      border: "none",
      borderRadius: "none",
      activeBackground: "transparent",
    }),
  };
};
