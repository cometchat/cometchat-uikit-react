import React from "react";
import PropTypes from "prop-types";
import { StatusIndicatorStyles } from "../../../Shared"

const CometChatStatusIndicator = (props) => {

  /**
   * Component style
   */
  const getStyle = () => ({
    border: props?.style?.border,
    borderRadius: props?.style?.borderRadius,
    backgroundColor: props?.style?.backgroundColor,
    backgroundImage: `url(${props.backgroundImage})`,
    backgroundSize: "cover",
    width: props?.style?.width,
    height: props?.style?.height,
    display: "inline-block",
    position: "absolute",
    top: "70%",
    left: "70%"
  });

  /**
   * Component template
   */
  return <span style={getStyle()}></span>;
};

/**
 * Component default props values
 */
CometChatStatusIndicator.defaultProps = {
  backgroundImage: "",
  style: {
    backgroundColor: "grey",
    width: "14px",
    height: "14px",
    border: "2px solid #ffffff",
    borderRadius: "50%"
  }
};

/**
 * Component default props
 */
CometChatStatusIndicator.propTypes = {
  backgroundImage: PropTypes.string,
  style: PropTypes.object,
};

export { CometChatStatusIndicator };
