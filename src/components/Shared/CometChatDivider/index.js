import React from "react";
import PropTypes from "prop-types";
import { CometChatDividerStyle } from "./style";

const CometChatDivider = (props) => {
  return <hr style={CometChatDividerStyle(props)} />;
};

CometChatDivider.defaultProps = {
  style: {
    width: "95%",
    border: "1px solid white",
    color: "1px solid rgb(255,255,255)",

    // color: "rgba(20,20,20,0.08)",
    // width: "100%",
    // border: "none",
    // height: "1px",
    // background: "white",
  },
};

CometChatDivider.propTypes = {
  style: PropTypes.object,
};

export { CometChatDivider };
