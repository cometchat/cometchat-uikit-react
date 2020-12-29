import React from "react";

/** @jsx jsx */
import { jsx } from '@emotion/core';
import PropTypes from 'prop-types';

import { imgStyle } from "./style";

import srcIcon from "./resources/1px.png";

class Avatar extends React.Component {

  constructor(props) {
    
    super(props);
    this.imgRef = React.createRef();
  }

  render() {

    const borderWidth = this.props.borderWidth;
    const borderColor = this.props.borderColor;
    const cornerRadius = this.props.cornerRadius;
    const image = this.props.image;

    let img = new Image();
    img.src = image;
    img.onload = () => {

      if (this.imgRef) {
        this.imgRef.src = image;
      }
    }

    const getStyle = () => ({ borderWidth: borderWidth, borderStyle: 'solid', borderColor: borderColor, 'borderRadius': cornerRadius });

    return (
      <img src={srcIcon} data-src={image} css={imgStyle()} alt={image} style={getStyle()} ref={el => { this.imgRef = el;}} />
    );
  }
}

// Specifies the default values for props:
Avatar.defaultProps = {
  borderWidth: "1px",
  borderColor: "#AAA",
  cornerRadius: "50%",
  image: srcIcon
};

Avatar.propTypes = {
  borderWidth: PropTypes.string,
  borderColor: PropTypes.string,
  cornerRadius: PropTypes.string,
  image: PropTypes.string
}

export default Avatar;