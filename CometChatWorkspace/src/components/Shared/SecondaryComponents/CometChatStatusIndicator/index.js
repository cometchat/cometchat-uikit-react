import React from "react";
import PropTypes from "prop-types";

const CometChatStatusIndicator = (props) => {
  const getStyle = () => ({
    border: props.border,
    borderRadius: props.cornerRadius,
    backgroundColor: props.backgroundColor,
    backgroundImage: `url(${props.backgroundImage})`,
    width: props.width,
    height: props.height,
    display: "inline-block",
    ...props.style,
  });

  return <span style={getStyle()}></span>;
};

// Specifies the default values for props:
CometChatStatusIndicator.defaultProps = {
  width: "14px",
  height: "14px",
  border: "2px solid white",
  cornerRadius: "50%",
  backgroundImage: "",
  backgroundColor: "grey",
  style: null,
};

CometChatStatusIndicator.propTypes = {
  width: PropTypes.string,
  height: PropTypes.string,
  border: PropTypes.string,
  cornerRadius: PropTypes.string,
  backgroundColor: PropTypes.string,
  backgroundImage: PropTypes.string,
  style: PropTypes.object,
};

export { CometChatStatusIndicator };
