import { fontHelper } from "../../Shared";

export const createPollWrapperStyle = (props, theme) => {
  return {
    width: props?.style?.width,
    height: props?.style?.height,
    border:
      props?.style?.border ||
      `1px solid ${theme.palette.accent50[theme.palette.mode]}`,
    boxShadow:
      props?.style.boxShadow ||
      `${theme.palette.accent50[theme.palette.mode]} 0 16px 32px, ${
        theme.palette.accent50[theme.palette.mode]
      } 0 0 0 1px`,
    background:
      props?.style?.background || theme.palette.background[theme.palette.mode],
    borderRadius: props?.style?.borderRadius,
    overflow: "hidden",
    position: "fixed",
    margin: "0 auto",
    cursor: "default",
  };
};

export const createPollBodyStyle = () => {
  return {
    overflow: "hidden auto",
    padding: "16px",
  };
};

export const questionInputStyle = (props, theme) => {
  return {
    width: "100%",
    height: "46px",
    padding: "6px 12px",
    outline: "none",
    border:
      props?.style?.questionInputBorder ||
      `1px solid ${theme.palette.accent50[theme.palette.mode]}`,
    borderRadius: props?.style?.questionInputBorderRadius || "8px",
    font:
      props?.style?.questionInputTextFont ||
      fontHelper(theme.typography.subtitle1),
    color: props?.style?.questionInputTextColor || theme?.palette?.getAccent(),
    boxShadow:
      props?.style?.questionInputBoxShadow ||
      `${theme.palette.accent50[theme.palette.mode]} 0 0 0 1px`,
    background:
      props?.style?.questionInputBackground ||
      theme.palette.accent50[theme.palette.mode],
    boxSizing: "border-box",
  };
};

export const answerInputStyle = (props, theme) => {
  return {
    width: "100%",
    height: "46px",
    padding: "6px 12px",
    outline: "none",
    border:
      props.style.answerInputBorder ||
      `1px solid ${theme.palette.accent50[theme.palette.mode]}`,
    borderRadius: props.style.answerInputBorderRadius || "8px",
    font:
      props.style.answerInputTextFont || fontHelper(theme.typography.subtitle1),
    color: props.style.answerInputTextColor || theme?.palette?.getAccent(),
    boxShadow:
      props.style.answerInputBoxShadow ||
      `${theme.palette.accent50[theme.palette.mode]} 0 0 0 1px`,
    background:
      props.style.answerInputBackground ||
      theme.palette.accent50[theme.palette.mode],
    boxSizing: "border-box",
  };
};

export const closeIconStyle = (props, img, theme) => {
  return {
    position: "absolute",
    width: "32px",
    height: "32px",
    top: "3%",
    right: "3%",
    WebkitMask: `url(${img}) center center no-repeat`,
    background: props.style.closeIconTint || theme?.palette?.getPrimary(),
    cursor: "pointer",
  };
};

export const createPollWarnMessageStyle = (props, theme) => {
  return {
    font: props?.style?.errorTextFont || fontHelper(theme.typography.subtitle2),
    color:
      props?.style?.errorTextColor || theme.palette.error[theme.palette.mode],
    textAlign: "center",
  };
};

export const createPollQuestionAnsStyle = () => {
  return {
    width: "100%",
    marginBottom: "10px",
    boxSizing: "border-box",
  };
};

export const createPollTitleStyle = (props, theme) => {
  return {
    font: props.style.titleFont || fontHelper(theme.typography.heading),
    color: props.style.titleColor || theme?.palette?.getAccent(),
    marginBottom: "15px",
    textAlign: "center",
  };
};

export const buttonStyle = (props, theme) => {
  return {
    width: "100%",
    height: "46px",
    outline: "0",
    cursor: "pointer",
    border:
      props?.style?.createPollButtonBorder ||
      `1px solid ${theme?.palette?.getPrimary()}`,
    borderRadius: props?.style?.createPollButtonBorderRadius || "8px",
    font:
      props?.style?.createPollButtonTextFont ||
      fontHelper(theme.typography.subtitle1),
    color:
      props?.style?.createPollButtonTextColor ||
      theme.palette.background[theme.palette.mode],
    background:
      props?.style?.createPollButtonBackground || theme?.palette?.getPrimary(),
  };
};

export const sendButtonStyle = () => {
  return {
    display: "inline-block",
    width: "calc(100% - 30px)",
    position: "absolute",
    bottom: "5%",
  };
};

export const iconWrapperStyle = () => {
  return {
    width: "30px",
  };
};

export const addOptionIconStyle = (props, img, theme) => {
  return {
    backgroundSize: "28px 28px",
    cursor: "pointer",
    display: "block",
    height: "24px",
    width: "24px",
    WebkitMask: `url(${img}) center center no-repeat`,
    background: props.style.addAnswerIconTint || theme?.palette?.getPrimary(),
  };
};
export const helperTextStyle = (props, theme) => {
  return {
    width: "100%",
    height: "auto",
    font:
      props?.style?.answerHelpTextFont || fontHelper(theme.typography.caption1),
    color:
      props?.style?.answerHelpTextColor ||
      theme.palette.accent500[theme.palette.mode],
    padding: "16px 0 5px 0",
  };
};

export const addItemStyle = (props, theme) => {
  return {
    width: "24px",
    height: "24px",
    font:
      props?.style?.addAnswerButtonTextFont ||
      fontHelper(theme.typography.text1),
    color:
      props?.style?.addAnswerButtonTextColor || theme?.palette?.getPrimary(),
  };
};

export const addAnswerInutFieldStyle = () => {
  return {
    display: "flex",
    width: "auto",
    justifyContent: "flex-start",
    alignItems: "center",
    marginTop: "20px",
  };
};
