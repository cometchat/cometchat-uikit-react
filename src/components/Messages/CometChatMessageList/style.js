import { messageAlignment } from "..";
import { fontHelper } from "../../Shared";
import { SmartReplyStyle, NewMessageIndicatorStyle } from "..";

export const chatListStyle = (style, theme) => {
  return {
    background:
      style.background || theme?.palette?.background[theme?.palette?.mode],
    width: style?.width,
    height: style?.height,
    minHeight: "200px",
    flex: "1 1 0",
    order: "2",
    position: "relative",
    ...theme?.globalStyles,
  };
};

export const listWrapperStyle = (style, theme) => {
  return {
    boxSizing: "border-box",
    display: "flex",
    flexDirection: "column",
    height: style.height,
    position: "absolute",
    top: "0",
    transition: "background .3s ease-out .1s",
    width: style.width,
    zIndex: "1",
    paddingTop: "16px",
    border: style.border,
    overflowX: "hidden",
    overflowY: "scroll",
    background:
      style.background || theme?.palette?.background[theme?.palette?.mode],
  };
};

export const messageDateContainerStyle = () => {
  return {
    margin: "16px 0",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  };
};

export const messageDateStyle = (theme) => {
  return {
    padding: "8px 12px",
    backgroundColor: theme?.palette?.accent100[theme?.palette?.mode],
    color: theme?.palette?.accent[theme?.palette?.mode],
    borderRadius: "10px",
  };
};

export const decoratorMsgStyle = (style) => {
  return {
    overflow: "hidden",
    width: style.width,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    position: "absolute",
    top: "50%",
  };
};

export const emojiKeyBoardStyle = (theme) => {
  return {
    width: "100%",
    height: "320px",
    border: "none",
    background: theme?.palette?.background[theme?.palette?.mode],
    borderRadius: "10px",
    sectionHeaderFont: fontHelper(theme?.typography?.caption1),
    sectionHeaderColor: theme?.palette?.accent600[theme?.palette?.mode],
    categoryIconTint: theme?.palette?.accent600[theme?.palette?.mode],
    selectedCategoryIconTint: theme?.palette?.primary[theme?.palette?.mode],
  };
};

export const emojiBoardToolTipStyle = (theme) => {
  return {
    border: "none",
    background: theme?.palette?.background[theme?.palette?.mode],
    borderRadius: "8px",
    width: "315px",
    height: "320px",
    boxShadow: `0 0 32px ${theme?.palette?.accent300[theme?.palette?.mode]}`,
  };
};

export const decoratorMsgTxtStyle = (
  style,
  fontHelper,
  theme,
  decoratorMessage,
  localize
) => {
  let color = { color: theme?.palette?.accent400[theme?.palette?.mode] };
  let font = { font: fontHelper(theme?.typography?.heading) };

  if (decoratorMessage?.toLowerCase() === localize("no_messages_found")) {
    if (style?.emptyTextColor) {
      color = { color: style?.emptyTextColor };
    }

    if (style?.emptyTextFont) {
      font = { font: style?.emptyTextFont };
    }
  } else if (decoratorMessage?.toLowerCase() === localize("something_wrong")) {
    if (style?.errorTextColor) {
      color = { color: style?.errorTextColor };
    }

    if (style?.errorTextFont) {
      font = { font: style?.errorTextFont };
    }
  }

  return {
    display: "flex",
    justifyContent: "center",
    margin: "0",
    minHeight: "36px",
    ...color,
    ...font,
    wordWrap: "break-word",
    padding: "0 16px",
    width: "calc(100% - 32px)",
  };
};

export const decoratorMsgImgStyle = (style, loadingIconURL, theme) => {
  let background = {
    background: theme?.palette?.accent600[theme?.palette?.mode],
  };
  if (style?.loadingIconTint) {
    background = { background: style?.loadingIconTint };
  }
  return {
    WebkitMask: `url(${loadingIconURL}) center center no-repeat`,
    ...background,
    margin: "0",
    height: "36px",
    wordWrap: "break-word",
    padding: "0 16px",
    width: "calc(100% - 32px)",
  };
};

export const messageBubbleStyle = (alignment, loggedInUser, messageObject) => {
  let flexAlignment = { alignSelf: "flex-start" };
  let userNameAlignment = { textAlign: "left" };
  let justifyContent = { justifyContent: "flex-start" };

  if (
    alignment === messageAlignment?.standard &&
    loggedInUser?.uid === messageObject?.sender?.uid
  ) {
    flexAlignment = { alignSelf: "flex-end" };
    userNameAlignment = { textAlign: "right" };
    justifyContent = { justifyContent: "flex-end" };
  }

  return {
    width: "auto",
    maxWidth: "65%",
    height: "auto",
    userSelect: "text",
    marginBottom: "8px",
    ...flexAlignment,
    ".message_kit__sender": {
      ...userNameAlignment,
    },
    ".message_kit__username_bar": {
      ...justifyContent,
    },
  };
};

export const smartReplyStyle = (theme, smartRepliesConfiguration) => {
  return {
    ...new SmartReplyStyle({
      background:
        smartRepliesConfiguration?.style?.background ||
        theme?.palette?.background[theme?.palette?.mode],
      textFont:
        smartRepliesConfiguration?.style?.textFont ||
        fontHelper(theme?.typography?.subtitle2),
      textBackground:
        smartRepliesConfiguration?.style?.textBackground ||
        theme?.palette?.accent900[theme?.palette?.mode],
      textColor:
        smartRepliesConfiguration?.style?.textColor ||
        theme?.palette?.accent[theme?.palette?.mode],
      closeIconTint:
        smartRepliesConfiguration?.style?.closeIconTint ||
        theme?.palette?.accent600[theme?.palette?.mode],
      border: smartRepliesConfiguration?.style?.border,
    }),
    marginBottom: "-8px",
    padding: "8px 8px 16px 8px",
    display: "flex",
    flexDirection: "row-reverse",
    justifyContent: "space-between",
  };
};

export const messageIndicatorStyle = (
  _theme,
  newMessageIndicatorConfiguration
) => {
  return {
    ...new NewMessageIndicatorStyle({
      textFont:
        newMessageIndicatorConfiguration?.style?.textFont ||
        fontHelper(_theme.typography.subtitle2),
      textColor:
        newMessageIndicatorConfiguration?.style?.textColor ||
        _theme.palette.background[_theme.palette.mode],
      iconTint:
        newMessageIndicatorConfiguration?.style?.iconTint ||
        _theme.palette.background[_theme.palette.mode],
      border: newMessageIndicatorConfiguration?.style?.border,
      borderRadius: newMessageIndicatorConfiguration?.style?.borderRadius,
      background:
        newMessageIndicatorConfiguration?.style?.background ||
        _theme.palette.primary[_theme.palette.mode],
    }),
  };
};
