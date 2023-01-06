import { fontHelper } from "../../../Shared";

export const messageKitTextBubbleBlockStyle = (props, theme) => {
  return {
    textAlign: "inherit",
    display: "inline-block",
    padding: "8px 12px",
    border: props.style.border,
    width: props.style.width,
    height: props.style.height,
    borderRadius: props.style.borderRadius,
    background: props.style.background, //theme not applied jut bcz transparent
  };
};

/** emoji font according to number of emoji to be display */
const emojiFont = (str) => {
  let strLength = str?.length;
  let fontSize = null;
  if (strLength) {
    let emojiRE = str?.match(
      /[\u{1f300}-\u{1f5ff}\u{1f900}-\u{1f9ff}\u{1f600}-\u{1f64f}\u{1f680}-\u{1f6ff}\u{2600}-\u{26ff}\u{2700}-\u{27bf}\u{1f1e6}-\u{1f1ff}\u{1f191}-\u{1f251}\u{1f004}\u{1f0cf}\u{1f170}-\u{1f171}\u{1f17e}-\u{1f17f}\u{1f18e}\u{3030}\u{2b50}\u{2b55}\u{2934}-\u{2935}\u{2b05}-\u{2b07}\u{2b1b}-\u{2b1c}\u{3297}\u{3299}\u{303d}\u{00a9}\u{00ae}\u{2122}\u{23f3}\u{24c2}\u{23e9}-\u{23ef}\u{25b6}\u{23f8}-\u{23fa}]/gu
    );

    let numbers = emojiRE?.length;
    if (numbers === 1 && parseInt(strLength / 2) === numbers) {
      fontSize = "32px";
    } else if (numbers === 2 && parseInt(strLength / 2) === numbers) {
      fontSize = "24px";
    } else if (numbers === 3 && parseInt(strLength / 2) === numbers) {
      fontSize = "16px";
    }
  }
  return fontSize;
};

export const messageTextBubbleStyle = (props, theme, strMessage) => {
  let emojiFontSize = emojiFont(strMessage);
  let fontStyle = {};

  if (emojiFontSize) {
    fontStyle = {
      fontSize: emojiFontSize,
    };
  } else {
    fontStyle = {
      font: props.style.textFont || fontHelper(theme.typography.subtitle1),
    };
  }

  return {
    color: props.style.textColor || theme.palette.accent900[theme.palette.mode],
    ...fontStyle,
    whiteSpace: "pre-wrap",
    wordWrap: "break-word",
    margin: "0",
    width: "auto",
  };
};

/** link previe style */
export const messagePreviewContainerStyle = (props, theme) => {
  return {
    display: "inline-block",
    borderRadius: "12px",
    backgroundColor:
      props.style.linkPreviewBackgroundColor ||
      theme.palette.background[theme.palette.mode],
    boxShadow: "0px 1px 2px 1px rgba(0,0,0,0.18)",
    alignSelf: "flex-start",
    width: "auto",
  };
};

export const messagePreviewWrapperStyle = () => {
  return {
    display: "flex",
    flexDirection: "column",
  };
};

export const previewImageStyle = (img) => {
  return {
    background: `url(${img}) no-repeat center center`,
    backgroundSize: "cover",
    height: "150px",
    minHeight: "50px",
    borderRadius: "12px 12px 0 0",
  };
};

export const previewDataStyle = () => {
  return {
    padding: "16px 16px 0 16px",
  };
};

export const previewTitleStyle = (props, theme) => {
  return {
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
    textAlign: "left",
    width: "auto",
    color:
      props.style.linkPreviewTitleColor ||
      theme.palette.accent[theme.palette.mode],
    font:
      props.style.linkPreviewTitleFont || fontHelper(theme.typography.title2),
    marginBottom: "8px",
  };
};

export const previewLinkStyle = () => {
  return {
    display: "flex",
    alignItems: "center",
    justifyContent: "left",
    padding: "0 16px 16px 16px",
  };
};

export const linkSubtitleStyle = (props, theme) => {
  return {
    display: "inline-block",
    color:
      props.style.linkPreviewSubtitleColor ||
      theme.palette.accent600[theme.palette.mode],
    font:
      props.style.linkPreviewSubtitleFont ||
      fontHelper(theme.typography.subtitle2),
    textDecoration: "none",
  };
};

export const dangerStyle = () => {
  return {};
};
