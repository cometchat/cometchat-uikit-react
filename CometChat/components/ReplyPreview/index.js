import React from "react";

/** @jsx jsx */
import { jsx, keyframes } from '@emotion/core';

import {
    previewWrapperStyle,
    previewHeadingStyle,
    previewCloseStyle,
    previewOptionsWrapperStyle,
    previewOptionStyle,
} from "./style";

import closeIcon from "./resources/clear.png";

const ReplyPreview = (props) => {

    const options = props.options.map((option, key) => {

        return (<div key={key} css={previewOptionStyle(props)} onClick={() => props.clicked(option)}>{option}</div>)
    })

    return (
        <div css={previewWrapperStyle(props, keyframes)}>
            <div css={previewHeadingStyle()}>
                <div css={previewCloseStyle(closeIcon)} onClick={props.close}></div>
            </div>
            <div css={previewOptionsWrapperStyle()}>{options}</div>
        </div>
    )
}

export default ReplyPreview;
