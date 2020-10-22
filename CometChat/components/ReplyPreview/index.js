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

        return (<div key={key} css={previewOptionStyle(props)} className="option" onClick={() => props.clicked(option)}>{option}</div>)
    })

    return (
        <div css={previewWrapperStyle(props, keyframes)} className="reply__preview__wrapper">
            <div css={previewHeadingStyle()} className="preview__heading">
                <div css={previewCloseStyle(closeIcon)} onClick={props.close} className="preview__close"></div>
            </div>
            <div css={previewOptionsWrapperStyle()} className="preview__options">{options}</div>
        </div>
    )
}

export default ReplyPreview;
