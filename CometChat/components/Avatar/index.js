import React from "react";

/** @jsx jsx */
import { jsx } from '@emotion/core';

import {
  imgStyle
} from "./style";

import srcIcon from "./resources/1px.png";

class Avatar extends React.Component {

  constructor(props) {
    super(props);

    this.imgRef = React.createRef();
  }

  render() {

    const borderWidth = this.props.borderWidth || '1px';
    const borderColor = this.props.borderColor || '#AAA';
    const cornerRadius = this.props.cornerRadius || '50%';
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
      <img src={srcIcon} data-src={image} css={imgStyle()} alt="Avatar" style={getStyle()} ref={el => { this.imgRef = el;}} />
    );
  }
}

export default Avatar;