/** @jsx jsx */
import { jsx, keyframes } from '@emotion/core';
import PropTypes from 'prop-types';

import {
    previewWrapperStyle,
    previewHeadingStyle,
    previewCloseStyle,
    previewOptionsWrapperStyle,
    previewOptionStyle,
} from "./style";

import { theme } from "../../resources/theme";

import closeIcon from "./resources/close.png";

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

// Specifies the default values for props:
ReplyPreview.defaultProps = {
    theme: theme
};

ReplyPreview.propTypes = {
    theme: PropTypes.object
}

export default ReplyPreview;
