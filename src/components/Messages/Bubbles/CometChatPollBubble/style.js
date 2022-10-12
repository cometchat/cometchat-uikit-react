export const messageKitPollBubbleBlockStyle = (props, theme) => {
  return {
    padding: "4px 6px",
    alignItems: "center",
    flexDirection: "column",
    justifyContent: "center",
    boxSizing: "border-box",
    width: props.style.width,
    border: props.style.border,
    borderRadius: props.style.borderRadius,
    background: props.style.background,
  };
};

export const messagePollBubbleBlockStyle = (props) => {
  return {
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-start",
    margin: "5px",
    width: props.style.width,
  };
};

export const pollQuestionStyle = (props, theme) => {
  return {
    margin: "0",
    textAlign: "left",
    wordWrap: "break-word",
    whiteSpace: "pre-wrap",
    width: props.style.widht,
    font: props.style.pollQuestionTextFont,
    color: props.style.pollQuestionTextColor,
  };
};

export const pollAnswerStyle = (props) => {
  return {
    padding: "0",
    margin: "0",
    listStyleType: "none",
    width: props.style.width,
  };
};

export const voteCountStyle = (props, theme) => {
  return {
    width: props.style.width,
    margin: "5px",
    p: {
      margin: "0",
      whiteSpace: "pre-wrap",
      wordWrap: "break-word",
      textAlign: "left",
      width: props.style.width,
      font: props.style.totalVoteCountTextFont,
      color: props.style.totalVoteCountTextColor,
    },
  };
};

export const voteCountTextStyle = (props, theme) => {
  return {
    margin: "0",
    whiteSpace: "pre-wrap",
    wordWrap: "break-word",
    textAlign: "left",
    width: props.style.width,
    font: props.style.totalVoteCountTextFont,
    color: props.style.totalVoteCountTextColor,
  };
};
