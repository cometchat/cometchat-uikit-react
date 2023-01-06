import { BaseStyles, fontHelper } from "../../Shared";
import {
  MessageHeaderStyle,
  MessageListStyle,
  MessageComposerStyle,
} from "../";

export const chatWrapperStyle = (style) => {
  return {
    display: "flex",
    flexDirection: "column",
    width: style.width,
    height: style.height,
    margin: "none",
    boxSizing: "border-box",
    position: "relative",
    overflowX: "hidden",
    border: style.border,
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

export const messageComposerStyle = (theme, messageComposerConfig) => {
  return {
    ...new MessageComposerStyle({
      width: messageComposerConfig.style.width,
      height: messageComposerConfig.style.height,
      background:
        messageComposerConfig.style.background || theme.palette.getBackground(),
      border: messageComposerConfig.style.border,
      borderRadius: messageComposerConfig.style.borderRadius,
      activeBackground: messageComposerConfig.style.activeBackground,
      inputBorderRadius: messageComposerConfig.style.inputBorderRadius,
      inputBackground:
        messageComposerConfig.style.inputBackground ||
        theme.palette.getAccent50(),
      inputTextFont:
        messageComposerConfig.style.inputTextFont ||
        fontHelper(theme.typography.subtitle1),
      inputTextColor:
        messageComposerConfig.style.inputTextColor ||
        theme?.palette?.getAccent(),
      placeholderTextFont:
        messageComposerConfig.style.placeholderTextFont ||
        fontHelper(theme.typography.subtitle1),
      placeholderTextColor:
        messageComposerConfig.style.placeholderTextColor ||
        theme.palette.getAccent600(),
      emojiIconTint:
        messageComposerConfig.style.emojiIconTint ||
        theme.palette.getAccent500(),
      attachmentIconTint:
        messageComposerConfig.style.attachmentIconTint ||
        theme.palette.getAccent500(),
      sendButtonIconTint:
        messageComposerConfig.style.sendButtonIconTint ||
        theme.palette.getAccent50(),
      stickerIconTint:
        messageComposerConfig.style.stickerIconTint ||
        theme.palette.getAccent500(),
      stickerCloseIconTint:
        messageComposerConfig.style.stickerCloseIconTint ||
        theme?.palette?.getPrimary(),
    }),
    inputBorderRadius: "8px",
    inputBackground: theme?.palette?.getAccent50(),
    inputTextFont: fontHelper(theme?.typography?.subtitle1),
    inputTextColor: theme?.palette?.getAccent(),
    placeholderTextFont: fontHelper(theme?.typography?.subtitle1),
    placeholderTextColor: theme?.palette?.getAccent600(),
    emojiIconTint: theme?.palette?.getAccent500(),
    attachmentIconTint: theme?.palette?.getAccent500(),
    microphoneIconTint: theme?.palette?.getAccent500(),
    sendButtonIconTint: theme?.palette?.getAccent300(),
    stickerIconTint: theme?.palette?.getAccent500(),
    stickerCloseIconTint: theme?.palette?.getPrimary(),
  };
};

export const messageHeaderStyle = (theme, messageHeaderConfig) => {
  return {
    ...new MessageHeaderStyle({
      width: messageHeaderConfig.style.width,
      height: messageHeaderConfig.style.height,
      background:
        messageHeaderConfig.style.background || theme.palette.getBackground(),
      border: messageHeaderConfig.style.border,
      borderRadius: messageHeaderConfig.style.borderRadius,
      activeBackground: messageHeaderConfig.style.activeBackground,
      backButtonIconTint:
        messageHeaderConfig.style.backButtonIconTint ||
        theme.palette.getPrimary(),
    }),
  };
};

export const messageListStyle = (theme, messageListConfiguration) => {
  return {
    ...new MessageListStyle({
      width: messageListConfiguration?.style?.width,
      height: messageListConfiguration?.style?.height,
      background:
        messageListConfiguration?.style?.background ||
        theme.palette.getBackground(),
      border: messageListConfiguration?.style?.border,
      borderRadius: messageListConfiguration?.style?.borderRadius,
      activeBackground: messageListConfiguration?.style?.activeBackground,
      loadingIconTint:
        messageListConfiguration?.style?.loadingIconTint ||
        theme.palette.getAccent600(),
      emptyTextFont:
        messageListConfiguration?.style?.emptyTextFont ||
        fontHelper(theme.typography.subtitle2),
      emptyTextColor:
        messageListConfiguration?.style?.emptyTextColor ||
        theme.palette.getAccent(),
      errorTextFont:
        messageListConfiguration?.style?.errorTextFont ||
        fontHelper(theme.typography.subtitle2),
      errorTextColor:
        messageListConfiguration?.style?.errorTextFont ||
        theme?.palette?.getAccent(),
      textFont:
        messageListConfiguration?.style?.textFont ||
        fontHelper(theme.typography.subtitle2),
      textColor:
        messageListConfiguration?.style?.textColor ||
        theme?.palette?.getAccent(),
    }),
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
