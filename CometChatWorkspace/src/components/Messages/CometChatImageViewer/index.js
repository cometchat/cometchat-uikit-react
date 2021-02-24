import React, { useRef } from "react";
/** @jsxRuntime classic */
/** @jsx jsx */
import { jsx } from "@emotion/core";
import PropTypes from "prop-types";

import { CometChatBackdrop } from "../../Shared";

import {
    imageWrapperStyle,
    imgStyle,
} from "./style";

import srcIcon from "./resources/ring.svg";
import closeIcon from "./resources/close.png";

const CometChatImageViewer = (props) => {

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
            <CometChatBackdrop show={props.open} clicked={props.close} />
            <div css={imageWrapperStyle(closeIcon)} onClick={props.close} className="image__wrapper">
                <img src={srcIcon} css={imgStyle()} alt={srcIcon} ref={el => { imgRef = el; }} />
            </div>            
        </React.Fragment>
    )
}


// Specifies the default values for props:
CometChatImageViewer.defaultProps = {
    count: 0,
    close: () => { }
};

CometChatImageViewer.propTypes = {
    show: PropTypes.bool,
    close: PropTypes.func,
}

export default CometChatImageViewer;