import * as React from "react";
import PropTypes from "prop-types";

import { CometChatBackdrop } from "../";
import {
  toolTipWrapperStyle,
  toolTipContentStyle,
  toolTipStyles,
} from "./style";

const CometChatPopover = (props) => {
  return (
    <>
      <CometChatBackdrop
        style={{ background: "rgba(20,20,20,0.46)" }}
        isOpen={props.withBackDrop}
      />
      <div className="tool_tip" style={toolTipWrapperStyle(props)}>
        <div className="tip" style={toolTipStyles(props)}></div>
        <div className="tool_tip_content" style={toolTipContentStyle(props)}>
          {props.children}
        </div>
      </div>
    </>
  );
};

CometChatPopover.defaultProps = {
  children: null,
  position: "",
  x: 0,
  y: 0,
  style: {
    width: "100%",
    height: "100%",
    border: "none",
    background: "#fff",
    borderRadius: "0px",
    boxShadow: "none",
  },
};

CometChatPopover.propTypes = {
  children: PropTypes.object,
  style: PropTypes.object,
  position: PropTypes.string,
  x: PropTypes.number,
  y: PropTypes.number,
};

export { CometChatPopover };
