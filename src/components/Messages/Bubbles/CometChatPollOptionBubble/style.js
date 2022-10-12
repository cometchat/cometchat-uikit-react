import { fontHelper } from "../../../";

export const pollAnswerStyle = (props, theme) => {
  return {
    background:
      `${props.style.pollOptionBackground}` ||
      theme.palette.background[theme.palette.mode],
    margin: "5px 0",
    borderRadius: "8px",
    display: "flex",
    width: "100%",
    minWidth: "220px",
    cursor: "pointer",
    position: "relative",
  };
};

export const checkIconStyle = (props, img, theme) => {
  return {
    width: "24px",
    height: "24px",
    marginLeft: "5px",
    WebkitMask: `url(${img}) center center no-repeat`,
    background:
      props.style.optionIconTint || theme.palette.accent500[theme.palette.mode],
  };
};

export const pollPercentStyle = (props, width) => {
  const curvedBorders =
    width === "100%"
      ? { borderRadius: "8px" }
      : {
          borderRadius: "8px 0 0 8px",
        };

  return {
    maxWidth: "100%",
    width: width,
    height: "34px",
    ...curvedBorders,
    background: props.style.selectedPollOptionBackground,
    position: "absolute",
    zIndex: "5",
    opacity: "0.8",
  };
};

export const answerWrapperStyle = (props, theme) => {
  let widthProp = "calc(100% - 40px)";

  return {
    width: "100%",
    height: "34px",
    color:
      props.style.pollOptionTextColor ||
      theme?.palette?.getAccent(),
    display: "flex",
    alignItems: "center",
    zIndex: "2",
    p: {
      margin: "0",
      width: widthProp,
      minWidth: "75px",
      whiteSpace: "pre-wrap",
      wordWrap: "break-word",
      font:
        props.style.pollOptionTextFont ||
        fontHelper(theme.typography.subtitle1),
    },
    span: {
      maxWidth: "40px",
      padding: "0px 16px 0px 0px",
      display: "inline-block",
      font:
        props.style.pollOptionTextFont ||
        fontHelper(theme.typography.subtitle1),
    },
  };
};

export const pollOptionTitleStyle = (props, theme) => {
  return {
    width: "80%",
    marginLeft: "5%",
    font:
      props.style.pollOptionTextFont || fontHelper(theme.typography.subtitle1),
    color:
      props.style.pollOptionTextColor ||
      theme?.palette?.getAccent(),
    whiteSpace: "pre-wrap",
    wordWrap: "break-word",
  };
};

export const pollOptionPercentTextStyle = (props, theme) => {
  return {
    width: "15%",
    marginRight: "5%",
    font:
      props.style.votePercentTextFont || fontHelper(theme.typography.subtitle1),
    color:
      props.style.votePercentTextColor ||
      theme?.palette?.getAccent(),
    textAlign: "center",
  };
};
