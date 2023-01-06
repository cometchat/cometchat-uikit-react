import {
  MessageBubbleAlignmentConstants,
  MessageTypeConstants,
  messageAlignment,
  messageBubbleAlignment,
} from "../../..";
import { fontHelper } from "../../..";
import { MenuListStyle } from "../../../Shared";
import { MessageReactionsStyle } from "../../";

export const translatedTextBlockStyle = (alignment, theme) => {
  let color = theme.palette.accent900["light"];
  let textAlign = "end";

  if (alignment === MessageBubbleAlignmentConstants.left) {
    color = theme.palette.accent900["dark"];
    textAlign = "start";
  }
  return {
    color: color,
    textAlign: textAlign,
    border: "0 none",
    font: fontHelper(theme.typography.subtitle1),
    background: "transparent",
    whiteSpace: "pre-wrap",
  };
};

export const translateTextStyle = () => {
  return {
    whiteSpace: "pre-wrap",
    wordWrap: "break-word",
    margin: "0",
    width: "auto",
    height: "auto",
    padding: "0px 12px",
  };
};

export const translateLabelText = (alignment, theme) => {
  if (alignment === MessageBubbleAlignmentConstants.right) {
    return {
      textAlign: "start",
      padding: "0px 12px",
      font: fontHelper(theme.typography?.caption2),
    };
  } else {
    return {
      padding: "0px 12px",
      font: fontHelper(theme.typography?.caption2),
    };
  }
};
export const deleteBubbleStyle = (theme, deleteBubbledConfiguration) => {
  return {
    width: deleteBubbledConfiguration.style.width || "100%",
    height: deleteBubbledConfiguration.style.height || "auto",
    border:
      deleteBubbledConfiguration.style.border ||
      `1px dashed ${theme.palette.accent400[theme.palette.mode]}`,
    background: deleteBubbledConfiguration.style.background || "transparent",
    borderRadius: deleteBubbledConfiguration.style.borderRadius || "12px",
    textFont:
      deleteBubbledConfiguration.style.textFont ||
      fontHelper(theme.typography.subtitle1),
    textColor:
      deleteBubbledConfiguration.style.textColor ||
      theme.palette.accent400[theme.palette.mode],
  };
};

export const reactionsStyle = (
  theme,
  alignment,
  messageObject,
  messageReactionsConfiguration
) => {
  let addReactionIconTint =
    messageReactionsConfiguration.style.addReactionIconTint ||
    theme.palette.accent300[theme.palette.mode];
  if (messageObject?.type !== "text") {
    addReactionIconTint =
      messageReactionsConfiguration.style.addReactionIconTint ||
      theme.palette.accent500[theme.palette.mode];
  } else if (alignment === messageBubbleAlignment.left) {
    addReactionIconTint =
      messageReactionsConfiguration.style.addReactionIconTint ||
      theme.palette.accent500[theme.palette.mode];
  }
  return {
    ...new MessageReactionsStyle({
      width: messageReactionsConfiguration.style.width,
      height: messageReactionsConfiguration.style.height,
      borderRadius: messageReactionsConfiguration.style.borderRadius,
      addReactionIconTint: addReactionIconTint,
      border: messageReactionsConfiguration.style.border,
      background: messageReactionsConfiguration.style.background,
      activeBackground: messageReactionsConfiguration.style.activeBackground,
      textFont:
        messageReactionsConfiguration.style.textFont ||
        fontHelper(theme.typography.caption1),
      textColor:
        messageReactionsConfiguration.style.textColor ||
        theme.palette.background[theme.palette.mode],
      addReactionIconBackground:
        messageReactionsConfiguration.style.addReactionIconBackground ||
        theme.palette.primary[theme.palette.mode],
    }),
  };
};

export const messageOptionStyle = (
  alignment,
  loggedInUser,
  messageObject,
  theme
) => {
  let position = {};
  let direction = { flexDirection: "row" };

  if (alignment === messageAlignment.leftAligned) {
    position = {
      right: "0px",
    };
  } else if (loggedInUser?.uid !== messageObject?.sender?.uid) {
    position = {
      left: "0px",
    };
  } else {
    position = {
      right: "0px",
    };
  }

  return {
    ...new MenuListStyle({
      width: "auto",
      height: "36px",
      background: theme.palette.background[theme.palette.mode],
      border: `1px solid ${theme.palette.accent200[theme.palette.mode]}`,
      borderRadius: "10px",
      activeBackground: "none",

      textFont: fontHelper(theme.typography.subtitle1),
      textColor: theme.palette.accent600[theme.palette.mode],
      iconTint: theme.palette.accent600[theme.palette.mode],
      moreIconTint: theme.palette.accent600[theme.palette.mode],
      iconBorder: "none",
      iconBackground: "none",
      iconBorderRadius: "none",
    }),
    position: "absolute",
    zIndex: "1",
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
    top: "-28px",
    ...position,
    ...direction,
  };
};

export const messageActionsStyle = () => {
  return {
    position: "relative",
  };
};

export const messageGutterStyle = () => {
  return {
    padding: "8px",
    display: "flex",
    width: "auto",
  };
};

export const messageLeftGutterStyle = () => {
  return {
    display: "flex",
    padding: "5px",
    flexDirection: "column",
    justifyContent: "flex-start",
    alignItems: "flex-end",
  };
};

export const messageRightGutterStyle = () => {
  return {
    display: "flex",
    padding: "5px",
    flexDirection: "column",
    minWidth: "0",
    justifyContent: "flex-start",
    alignItems: "flex-start",
  };
};

export const messageBlockStyle = (alignment, style, messageObject, theme) => {
  let backgroundColor = "";
  let alignItems = "flex-end";

  if (
    messageObject.type === MessageTypeConstants.image ||
    messageObject.type === MessageTypeConstants.audio ||
    messageObject.type === MessageTypeConstants.video ||
    messageObject.type === MessageTypeConstants.sticker ||
    (messageObject && messageObject.deletedAt)
  ) {
    backgroundColor = "none";
  } else if (messageObject.type === MessageTypeConstants.file) {
    backgroundColor = theme.palette.accent50[theme.palette.mode]; //not clear
  } else if (messageObject.type === MessageTypeConstants.poll) {
    backgroundColor = theme.palette.accent50[theme.palette.mode];
  } else if (messageObject.type === MessageTypeConstants.whiteboard) {
    backgroundColor = theme.palette.accent50[theme.palette.mode];
  } else if (messageObject.type === MessageTypeConstants.document) {
    backgroundColor = theme.palette.accent50[theme.palette.mode];
  } else {
    backgroundColor = style.background || theme?.palette?.getPrimary();
  }

  if (alignment === MessageBubbleAlignmentConstants.left) {
    alignItems = "flex-start";
  }
  return {
    background: backgroundColor,
    display: "flex",
    flexDirection: "column",
    alignItems: alignItems,
    borderRadius: style.borderRadius,
    width: "fit-content",
    position: "relative",
  };
};

export const emojiStyle = (props) => {
  return {
    width: "24px",
    height: "24px",
  };
};

export const messageAvatarStyle = () => {
  return {
    flexShrink: "0",
    position: "relative",
  };
};

export const messageSenderStyle = (style, theme) => {
  return {
    display: "flex",
    alignItems: "center",
    height: "24px",
    color: style.nameTextColor || fontHelper(theme.typography.caption1),
    font: style.nameTextFont || theme.palette.accent500[theme.palette.mode],
    letterSpacing: "-0.1",
    lineHeight: "16",
  };
};

export const messageKitReceiptStyle = () => {
  return {
    display: "flex",
    alignItems: "center",
    height: "24px",
  };
};

export const messageTimestampStyle = (style, theme) => {
  return {
    color: style.timetampColor || theme.palette.accent[theme.palette.mode],
    font: style.timestampFont || fontHelper(theme.typography.caption2),
    display: "flex",
    alignItems: "center",
    height: "24px",
  };
};

export const messageNameTimestampStyle = () => {
  return {
    display: "flex",
    alignItems: "center",
    height: "24px",
  };
};
