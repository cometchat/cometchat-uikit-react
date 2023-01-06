import {
  ActionSheetStyle,
  BaseStyles,
  fontHelper,
  PopoverStyle,
} from "../../Shared";

import { StickerKeyboardStyle, EmojiKeyboardStyle, CreatePollStyle } from "../";

import { MessagePreviewStyle } from "../CometChatMessagePreview/MessagePreviewStyle";

export const chatComposerStyle = (style, theme) => {
  return {
    width: style.width,
    height: style.height,
    bodrer: style.border,
    background: style.background || theme.palette.getAccent50(),
    order: "3",
    flex: "none",
    position: "relative",
    boxSizing: "border-box",
    zIndex: "1",
    padding: "8px 16px",
  };
};

export const composerInputStyle = (style) => {
  return {
    display: "flex",
    minHeight: "72px",
    flexDirection: "row",
    alignItems: "flex-end",
    boxSizing: "border-box",
    width: style.width,
    bodrer: style.border,
    borderRadius: style.inputBorderRadius,
  };
};

export const inputInnerStyle = (style, theme) => {
  return {
    outline: "none",
    display: "flex",
    flex: "1 1 auto",
    minHeight: "72px",
    flexDirection: "column",
    boxSizing: "border-box",
    width: style.width,
    border: style.inputBorder,
    background: style.inputBackground || theme.palette.getAccent50(),
    borderRadius: style.inputBorderRadius,
  };
};

export const messageInputStyle = (style, disabled, theme) => {
  const disabledState = disabled
    ? {
        pointerEvents: "none",
        opacity: "0.4",
      }
    : {};

  return {
    lineHeight: "20px",
    padding: "16px",
    width: "calc(100% - 32px)",
    outline: "none",
    overflowX: "hidden",
    overflowY: "auto",
    position: "relative",
    whiteSpace: "pre-wrap",
    wordWrap: "break-word",
    zIndex: "1",
    userSelect: "text",
    background: "transparent",
    borderRadius: "inherit",
    boxSizing: "border-box",
    ...disabledState,
    height: style.height,
    font: style?.placeholderTextFont || fontHelper(theme.typography.subtitle1),
    color: style?.placeholderTextColor || theme.palette.getAccent600(),
  };
};

export const inputStickyStyle = (disabled, attachments, theme) => {
  const disabledState = disabled ? { pointerEvents: "none" } : {};

  const flexDirectionProp =
    attachments === null ? { flexDirection: "row-reverse" } : {};

  return {
    padding: "8px 16px",
    borderTop: `1px solid ${theme.palette.getAccent50()}`,
    display: "flex",
    justifyContent: "space-between",
    ...flexDirectionProp,
    ...disabledState,
  };
};

export const stickyAttachmentStyle = () => {
  return {
    display: "flex",
    width: "auto",
  };
};

export const attachmentIconStyle = () => {
  return {
    margin: "auto 0",
    width: "24px",
    height: "20px",
    cursor: "pointer",
  };
};

export const filePickerStyle = (state) => {
  const active = state.showFilePicker
    ? { width: "calc(100% - 20px)", opacity: "1" }
    : {};

  return {
    width: "0",
    borderRadius: "8px",
    overflow: "hidden",
    zIndex: "1",
    opacity: "0",
    transition: "width 0.5s linear",
    ...active,
  };
};

export const fileListStyle = () => {
  return {
    width: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "0 0 0 16px",
  };
};

export const fileItemStyle = () => {
  return {
    height: "24px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    margin: "0 16px 0 0",
    justifyContent: "center",
  };
};

export const stickyAttachButtonStyle = () => {
  return {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    width: "24px",
  };
};

export const attchButtonIconStyle = (style, attachmentIconURL, theme) => {
  return {
    width: "24px",
    height: "24px",
    display: "inline-block",
    WebkitMask: `url(${attachmentIconURL}) center center no-repeat`,
    background: style.attachmentIconTint || theme.palette.getAccent500(),
    zIndex: 4,
  };
};

export const stickyButtonStyle = () => {
  return {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    width: "auto",
  };
};

export const emojiButtonStyle = () => {
  return {
    height: "24px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 0 0 16px",
  };
};

export const emojiBtnIconStyle = (style, emojiIconURL, theme) => {
  return {
    width: "24px",
    height: "24px",
    display: "inline-block",
    zIndex: 4,
    WebkitMask: `url(${emojiIconURL}) center center no-repeat`,
    background: style.emojiIconTint || theme.palette.getAccent500(),
  };
};

export const sendButtonStyle = () => {
  return {
    height: "24px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 0 0 16px",
  };
};

export const sendBtnIconStyle = (
  style,
  sendButtonIconURL,
  theme,
  messageInput,
  isTyping
) => {
  let sendButtonColor = "rgba(20,20,20,0.24)";
  if (messageInput?.length && isTyping.current) {
    sendButtonColor = theme.palette.getPrimary() || "#39f";
  } else {
    sendButtonColor = style.sendButtonIconTint || theme.palette.getAccent300();
  }
  return {
    width: "24px",
    height: "24px",
    display: "inline-block",
    WebkitMask: `url(${sendButtonIconURL}) center center no-repeat`,
    background: sendButtonColor,
  };
};

export const reactionBtnStyle = () => {
  return {
    cursor: "pointer",
    height: "24px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 0 0 16px",
    zIndex: 4,
  };
};

export const reactionBtnIconStyle = () => {
  return {
    height: "20px",
    width: "20px",
  };
};

export const stickerBtnStyle = () => {
  return {
    cursor: "pointer",
    height: "24px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 0 0 16px",
  };
};

export const stickerBtnIconStyle = (style, stickerIcon, theme) => {
  return {
    width: "24px",
    height: "24px",
    display: "inline-block",
    WebkitMask: `url(${stickerIcon}) center center no-repeat`,
    background: style.stickerIconTint || theme.palette.getAccent500(),
  };
};

export const fileInputStyle = () => {
  return {
    visibility: "hidden",
    position: "absolute",
    width: "0",
  };
};

export const stickerKeyboardStyle = (theme, stickerConfig) => {
  return {
    ...new StickerKeyboardStyle({
      width: stickerConfig.style.width,
      height: stickerConfig.style.height,
      background: stickerConfig.style.background,
      border: stickerConfig.style.border,
      borderRadius: stickerConfig.style.borderRadius,
      activeBackground: stickerConfig.style.activeBackground,
      categoryBackground:
        stickerConfig.style.categoryBackground || theme.palette.getBackground(),
      textFont:
        stickerConfig.style.textFont || fontHelper(theme.typography.heading),
      textColor: stickerConfig.style.textColor || theme.palette.getAccent400(),
      emptyTextFont:
        stickerConfig.style.emptyTextFont || fontHelper(theme.typography.text1),
      emptyTextColor:
        stickerConfig.style.emptyTextColor || theme.palette.getAccent600(),
      errorTextFont:
        stickerConfig.style.errorTextFont || fontHelper(theme.typography.text1),
      errorTextColor:
        stickerConfig.style.errorTextColor || theme.palette.getAccent600(),
      loadingTextColor:
        stickerConfig.style.loadingTextColor || theme.palette.getAccent600(),
      loadingTextFont:
        stickerConfig.style.Font || fontHelper(theme.typography.text1),
    }),
  };
};

export const emojiBoardPopoverStyle = (theme, emojiConfig) => {
  return {
    ...new PopoverStyle({
      width: emojiConfig.style.width,
      height: emojiConfig.style.height,
      background: emojiConfig.style.background || theme.palette.getBackground(),
      border: emojiConfig.style.border,
      borderRadius: emojiConfig.style.borderRadius,
      activeBackground: emojiConfig.style.activeBackground,
      boxShadow: `0 0 32px ${theme.palette.getAccent300()}`,
    }),
  };
};

export const emojiKeyBoardStyle = (theme, emojiConfig) => {
  return {
    ...new EmojiKeyboardStyle({
      width: "100%",
      height: "100%",
      background: "transparent",
      border: "none",
      borderRadius: emojiConfig.style.borderRadius,
      activeBackground: "",

      sectionHeaderFont:
        emojiConfig.style.sectionHeaderFont ||
        fontHelper(theme.typography.caption1),
      sectionHeaderColor:
        emojiConfig.style.sectionHeaderColor || theme.palette.getAccent600(),
      categoryIconTint:
        emojiConfig.style.categiryIconTint || theme.palette.getAccent600(),
      selectedCategoryIconTint:
        emojiConfig.style.selectedCategoryIconTint ||
        theme?.palette?.getPrimary(),
      categoryBackground:
        emojiConfig.style.background || theme.palette.getBackground(),
    }),
  };
};

export const messagePreviewStyle = (theme, messagePreviewConfig) => {
  return {
    ...new MessagePreviewStyle({
      border:
        messagePreviewConfig.style.border ||
        `3px solid ${theme.palette.accent100[theme.palette.mode]}`,
      background:
        messagePreviewConfig.style.background ||
        theme.palette.background[theme.palette.mode],
      borderRadius: messagePreviewConfig.style.borderRadius,
      messagePreviewTitleFont:
        messagePreviewConfig.style.messagePreviewTitleFont ||
        fontHelper(theme.typography.caption1),
      messagePreviewTitleColor:
        messagePreviewConfig.style.messagePreviewTitleColor ||
        theme?.palette?.getAccent(),
      messagePreviewSubtitleColor:
        messagePreviewConfig.style.messsagePreviewSubtitleColor ||
        theme.palette.accent600[theme.palette.mode],
      messagePreviewSubtitleFont:
        messagePreviewConfig.style.messagePreviewSubtitleFont ||
        fontHelper(theme.typography.subtitle2),
      closeIconTint:
        messagePreviewConfig.style.closeIconTint ||
        theme.palette.accent500[theme.palette.mode],
    }),
  };
};

export const actionSheetPopoverStyle = (theme) => {
  return {
    ...new PopoverStyle({
      width: "295px",
      height: "350px",
      background: theme.palette.getBackground(),
      border: `none`,
      borderRadius: "8px",
      activeBackground: theme.palette.getPrimary(),
      boxShadow: `0 0 32px ${theme.palette.getAccent300()}`,
    }),
    position: "relative",
  };
};

export const actionSheetStyle = (theme) => {
  return {
    ...new ActionSheetStyle({
      width: "100%",
      height: "100%",
      background: "transparent",
      border: `none`,
      borderRadius: "8px",
      activeBackground: "",
      titleColor: theme.palette.getAccent(),
      titleFont: fontHelper(theme.typography.title2),
      layoutModeIconTint: theme.palette.getAccent100(),
    }),
  };
};

export const createPollStyle = (theme, createPollConfig) => {
  return {
    position: "fixed",
    ...new CreatePollStyle({
      width: "100%",
      height: "100%",
      background: "transparent",
      border: "none",
      borderRadius: createPollConfig.style.borderRadius,
      activeBackground: "",

      boxShadow:
        createPollConfig.style.boxShadow ||
        `${theme.palette.getAccent50()} 0 16px 32px, ${theme.palette.getAccent50()} 0 0 0 1px`,
      titleFont:
        createPollConfig.style.titleFont ||
        fontHelper(theme.typography.heading),
      titleColor:
        createPollConfig.style.titleColor || theme?.palette?.getAccent(),
      closeIconTint:
        createPollConfig.style.closeIconTint || theme?.palette?.getPrimary(),
      errorTextFont:
        createPollConfig.style.errorTextFont ||
        fontHelper(theme.typography.subtitle2),
      errorTextColor:
        createPollConfig.style.errorTextColor || theme.palette.getError(),
      questionInputBorder:
        createPollConfig.style.questionInputBorder ||
        `1px solid ${theme.palette.getAccent50()}`,
      questionInputBorderRadius:
        createPollConfig.style.questionInputBorderRadius,
      questionInputBoxShadow:
        createPollConfig.style.questionInputBoxShadow ||
        `${theme.palette.getAccent50()} 0 0 0 1px`,
      questionInputBackground:
        createPollConfig.style.questionInputBackground ||
        theme.palette.getAccent50(),
      questionPlaceholderTextFont:
        createPollConfig.style.questionPlaceholderTextFont ||
        fontHelper(theme.typography.subtitle1),
      questionPlaceholderTextColor:
        createPollConfig.style.questionPlaceholderTextColor ||
        theme.palette.getAccent600(),
      questionInputTextFont:
        createPollConfig.style.questionInputTextFont ||
        fontHelper(theme.typography.subtitle1),
      questionInputTextColor:
        createPollConfig.style.questionInputTextColor ||
        theme?.palette?.getAccent(),
      answerHelpTextFont:
        createPollConfig.style.answerHelpTextFont ||
        fontHelper(theme.typography.caption1),
      answerHelpTextColor:
        createPollConfig.style.answerHelpTextColor ||
        theme.palette.getAccent500(),
      answerInputBoxShadow:
        createPollConfig.style.answerInputBoxShadow ||
        `${theme.palette.getAccent50()} 0 0 0 1px`,
      answerInputBackground:
        createPollConfig.style.answerInputBackground ||
        theme.palette.getAccent50(),
      answerInputTextFont:
        createPollConfig.style.answerInputTextFont ||
        fontHelper(theme.typography.subtitle1),
      answerInputTextColor:
        createPollConfig.style.answerInputTextColor ||
        theme?.palette?.getAccent(),
      answerInputBorder:
        createPollConfig.style.answerInputBorder ||
        `1px solid ${theme.palette.getAccent50()}`,
      answerInputBorderRadius: createPollConfig.style.answerInputBorderRadius,
      answerPlaceholderTextFont:
        createPollConfig.style.answerPlaceholderTextFont ||
        fontHelper(theme.typography.subtitle1),
      answerPlaceholderTextColor:
        createPollConfig.style.answerPlaceholderTextColor ||
        theme.palette.getAccent600(),
      addAnswerButtonTextColor:
        createPollConfig.style.addAnswerButtonTextColor ||
        theme?.palette?.getPrimary(),
      addAnswerButtonTextFont:
        createPollConfig.style.addAnswerButtonTextFont ||
        fontHelper(theme.typography.text1),
      addAnswerIconTint:
        createPollConfig.style.addAnswerIconTint ||
        theme?.palette?.getPrimary(),
      createPollButtonBorder:
        createPollConfig.style.createPollButtonBorder ||
        `1px solid ${theme?.palette?.getPrimary()}`,
      createPollButtonBorderRadius:
        createPollConfig.style.createPollButtonBorderRadius,
      createPollButtonBackground:
        createPollConfig.style.createPollButtonBackground ||
        theme?.palette?.getPrimary(),
      createPollButtonTextFont:
        createPollConfig.style.createPollButtonTextFont ||
        fontHelper(theme.typography.subtitle1),
      createPollButtonTextColor:
        createPollConfig.style.createPollButtonTextColor ||
        theme.palette.getBackground(),
    }),
  };
};

export const popoverForCreatePollStyle = (theme, createPollConfig) => {
  return {
    ...new PopoverStyle({
      width: createPollConfig?.style?.width,
      height: createPollConfig?.style?.height,
      background:
        createPollConfig.style.background || theme?.palette?.getBackground(),
      border:
        createPollConfig?.style?.border ||
        `1px solid ${theme?.palette?.getAccent50()}`,
      borderRadius: createPollConfig?.style?.borderRadius,
      activeBackground: "",
      boxShadow: `0 0 32px ${theme?.palette?.getAccent300()}`,
    }),
    position: "fixed",
    top: "50%",
    left: "50%",
    transform: "translate(-50%,-50%)",
  };
};
