import React from "react";
import PropTypes from "prop-types";
import { AvatarStyles } from "../../../Shared/";
import * as styles from "./style";
import srcIcon from "./resources/default.jpg";

const CometChatAvatar = (props) => {

  const {
    name,
    image,
    style
  } = props;

  const _style = new AvatarStyles(style);

  /**
   * Component template scoping
   */
  const getImageView = () => {
    if (!image && name) {
      return (
        <p style={styles.textStyle(_style)}>
          {name.length >= 2 ? name.substring(0, 2).toUpperCase() : name}
        </p>
      )
    } else {
      let imageSource
      if (image) {
        imageSource = image
      } else imageSource = srcIcon

      return <span style={styles.getImageStyle(_style, imageSource)}></span>
    }
  }

  /**
   * Component template
   */
  return (
    <div style={styles.getOuterViewStyle(_style)}>
      <span style={styles.getContainerStyle(_style)}>
        {getImageView()}
      </span>
    </div>
  );
};

/**
 * Component default props values
 */
CometChatAvatar.defaultProps = {
  image: "",
  name: "",
  style: {
    textColor: "#ffffff",
    textFont: "bold 80px Inter",
    outerView: "",
    outerViewSpacing: "0px",
    backgroundColor: "#141414",
    backgroundSize: "cover",
    width: "36px",
    height: "36px",
    border: "none",
    borderRadius: "50%"
  }
};

/**
 * Component default props
 */
CometChatAvatar.propTypes = {
  image: PropTypes.string,
  name: PropTypes.string,
  style: PropTypes.object,
};

export { CometChatAvatar };
