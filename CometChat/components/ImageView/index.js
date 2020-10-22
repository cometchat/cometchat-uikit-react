import React, { useRef } from "react";

/** @jsx jsx */
import { jsx } from '@emotion/core';

import {
    imageWrapperStyle,
    imgStyle,
} from "./style";

import srcIcon from "./resources/ring.svg";
import closeIcon from "./resources/clear.svg";

import Backdrop from "../Backdrop";

const ImageView = (props) => {

    let imgRef = useRef();

    let img = new Image();
    img.src = props.message.data.url;
    img.onload = () => {

        if (imgRef) {
            imgRef.src = img.src;
        }
    };

    return(
        <React.Fragment>
            <Backdrop show={props.open} clicked={props.close} />
            <div css={imageWrapperStyle(closeIcon)} onClick={props.close} className="image__wrapper">
                <img src={srcIcon} css={imgStyle()} alt="Full Screen View" ref={el => { imgRef = el; }} />
            </div>            
        </React.Fragment>
    )
}
export default ImageView;