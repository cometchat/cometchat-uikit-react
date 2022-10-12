export const detailStyle = () => {
  return {
    padding: "16px",
    display: "flex",
    flexDirection: "row",
    justifyContent: "left",
    alignItems: "center",
  };
};

export const thumbnailStyle = () => {
  return {
    display: "inline-block",
    width: "36px",
    height: "36px",
    flexShrink: "0",
  };
};

export const userDetailStyle = () => {
  return {
    width: "calc(100% - 45px)",
    flexGrow: "1",
    paddingLeft: "16px",
    "&[dir=rtl]": {
      paddingRight: "16px",
      paddingLeft: "0",
    },
  };
};

export const userNameStyle = () => {
  return {
    margin: "0",
    fontSize: "15px",
    fontWeight: "600",
    display: "block",
    maxWidth: "100%",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  };
};

export const userStatusStyle = (props) => {
  return {
    fontSize: "13px",
    margin: "0",
    color: `#39f`,
  };
};
