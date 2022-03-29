import React from "react";
import PropTypes from "prop-types";

import { Hooks } from "./hooks";
import srcIcon from "./resources/default.jpg";

const CometChatAvatar = (props) => {
  const [imageURL, setImageURL] = React.useState(srcIcon);

  const getImageStyle = () => {
    return {
      width: "100%",
      height: "100%",
      backgroundColor: "#fff",
      backgroundPosition: "center",
      backgroundRepeat: "no-repeat",
      backgroundSize: props.backgroundSize,
      backgroundImage: `url(${imageURL})`,
      border: props.border,
      borderRadius: props.cornerRadius,
    };
  };

  const getContainerStyle = () => {
    return {
      height: props.height,
      width: props.width,
      borderRadius: props.cornerRadius,
      margin: props.outerViewSpacing,
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "stretch",
      backgroundColor: "#ffffff",
      boxSizing: "content-box",
      cursor: "inherit",
      outline: "none",
      overflow: "hidden",
      position: "static",
      padding: "0",
    };
  };

  const getOuterViewStyle = () => {
    return {
      justifyContent: "center",
      alignItems: "center",
      display: "inline-block",
      borderRadius: props.cornerRadius,
      border: props.outerView,
      margin: "0",
      padding: "0",
    };
  };

  Hooks(setImageURL, props);

  return (
    <div style={getOuterViewStyle()}>
      <span style={getContainerStyle()}>
        <span style={getImageStyle()}></span>
      </span>
    </div>
  );
};

// Specifies the default values for props
CometChatAvatar.defaultProps = {
  cornerRadius: "50%",
  border: "",
  backgroundColor: "#141414",
  backgroundSize: "cover",
  outerView: "",
  outerViewSpacing: "",
  width: "28px",
  height: "28px",
  image: "",
  name: "",
  nameTextFont: "bold 80px Inter",
  nameTextColor: "#ffffff",
};

CometChatAvatar.propTypes = {
  cornerRadius: PropTypes.string,
  border: PropTypes.string,
  backgroundColor: PropTypes.string,
  backgroundSize: PropTypes.string,
  outerView: PropTypes.string,
  outerViewSpacing: PropTypes.string,
  width: PropTypes.string,
  height: PropTypes.string,
  image: PropTypes.string,
  name: PropTypes.string,
  nameTextFont: PropTypes.string,
  nameTextColor: PropTypes.string,
};

export { CometChatAvatar };
