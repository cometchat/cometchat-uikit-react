import React from "react";
/** @jsxRuntime classic */
/** @jsx jsx */
import { jsx } from "@emotion/core";
import PropTypes from "prop-types";
import { CometChat } from "@cometchat-pro/chat";

import { theme } from "../../../resources/theme";

import { imgStyle } from "./style";

import srcIcon from "./resources/1px.png";

class CometChatAvatar extends React.Component {

  constructor(props) {
    
    super(props);
    this.imgRef = React.createRef();

    this.state = {
      avatarImage: srcIcon
    }
  }

  componentDidMount() {
    this.setAvatarImage();
  }

  componentDidUpdate(prevProps) {

    if(prevProps !== this.props) {

      this.setAvatarImage();
    }
  }

  setAvatarImage = () => {

    if ((this.props.image).trim().length) {

      this.getImage(this.props.image);

    } else if (Object.keys(this.props.user).length) {

      if (this.props.user.hasOwnProperty("avatar")) {

        const avatarImage = this.props.user.avatar;
        this.getImage(avatarImage);

      } else {

        const uid = this.props.user.uid;
        const char = this.props.user.name.charAt(0).toUpperCase();

        const avatarImage = this.setAvatar(uid, char);
        this.getImage(avatarImage);
      }

    } else if (Object.keys(this.props.group).length) {

      if (this.props.group.hasOwnProperty("icon")) {

        const avatarImage = this.props.group.icon;
        this.getImage(avatarImage);

      } else {

        const guid = this.props.group.guid;
        const char = this.props.group.name.charAt(0).toUpperCase();

        const avatarImage = this.setAvatar(guid, char);
        this.getImage(avatarImage);

      }
    }
  }

  getImage = (image) => {

    let img = new Image();
    img.src = image;
    img.onload = () => {
      this.setState({ avatarImage: image });
    }
  }

  setAvatar = (generator, data) => {

    const stringToColour = function (str) {

      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
      }

      let colour = '#';
      for (let i = 0; i < 3; i++) {
        let value = (hash >> (i * 8)) & 0xFF;
        colour += ('00' + value.toString(16)).substr(-2);
      }
      return colour;
    }

    const svg1 = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg1.setAttribute("width", "200");
    svg1.setAttribute("height", "200");

    const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    rect.setAttribute('x', '0');
    rect.setAttribute('y', '0');
    rect.setAttribute('width', '200');
    rect.setAttribute('height', '200');
    rect.setAttribute('fill', stringToColour(generator));
    const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
    text.setAttribute('x', '50%');
    text.setAttribute('y', '54%');
    text.setAttribute('dominant-baseline', 'middle');
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('fill', 'white');
    text.setAttribute('font-size', '120');
    text.setAttribute('font-family', "'Inter', sans-serif");
    text.setAttribute('font-wight', "600");
    text.textContent = data;
    svg1.appendChild(rect);
    svg1.appendChild(text);
    let svgString = new XMLSerializer().serializeToString(svg1);

    let decoded = unescape(encodeURIComponent(svgString));
    let base64 = btoa(decoded);

    let imgSource = `data:image/svg+xml;base64,${base64}`;
    return imgSource;
  }

  render() {

    const borderWidth = this.props.borderWidth;
    const borderStyle = this.props.borderStyle;
    const borderColor = this.props.borderColor;
    const cornerRadius = this.props.cornerRadius;

    const getStyle = () => ({ borderWidth: borderWidth, borderStyle: borderStyle, borderColor: borderColor, borderRadius: cornerRadius });

    return (
      <img src={this.state.avatarImage} css={imgStyle()} alt={this.state.avatarImage} style={getStyle()} ref={el => { this.imgRef = el;}} />
    );
  }
}

// Specifies the default values for props:
CometChatAvatar.defaultProps = {
  borderWidth: "1px",
  borderStyle: "solid",
  borderColor: theme.borderColor.primary,
  cornerRadius: "50%",
  theme: theme,
  image: "",
  user: {},
  group: {},
};

CometChatAvatar.propTypes = {
  borderWidth: PropTypes.string,
  borderStyle: PropTypes.string,
  borderColor: PropTypes.string,
  cornerRadius: PropTypes.string,
  image: PropTypes.string,
  theme: PropTypes.object,
  user: PropTypes.oneOfType([PropTypes.object, PropTypes.shape(CometChat.User)]),
  group: PropTypes.oneOfType([PropTypes.object, PropTypes.shape(CometChat.Group)])
}

export default CometChatAvatar;