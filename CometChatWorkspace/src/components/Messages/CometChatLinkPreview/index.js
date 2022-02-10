import React from "react";
import PropTypes from "prop-types";

import { localize } from "../../";
import { getExtensionsData, metadataKey } from "../"

import {
    messagePreviewContainerStyle,
    messagePreviewWrapperStyle,
    previewImageStyle,
    previewDataStyle,
    previewTitleStyle,
    previewDescStyle,
    previewLinkStyle,
    previewTextStyle,
} from "./style";

class CometChatLinkPreview extends React.PureComponent {

    render() {

        const linkPreviewData = getExtensionsData(this.props.message, metadataKey.extensions.linkpreview);
        const linkObject = linkPreviewData["links"][0];

        const pattern = /(http:|https:)?\/\/(www\.)?(youtube.com|youtu.be)(\S+)?/;
        const linkText = linkObject["url"].match(pattern) ? localize("VIEW_ON_YOUTUBE", this.props.lang) : localize("VISIT", this.props.lang);

        return (
            <div style={messagePreviewContainerStyle()} className="message__preview">
                <div style={messagePreviewWrapperStyle()} className="preview__card">
                    <div style={previewImageStyle(linkObject["image"])} className="card__image"></div>
                    <div style={previewDataStyle()} className="card__info">
                        <div style={previewTitleStyle()} className="card__title"><span>{linkObject["title"]}</span></div>
                        <div style={previewDescStyle()} className="card__desc"><span>{linkObject["description"]}</span></div>
                        <div style={previewTextStyle()} className="card__text">{this.props.messageText}</div>
                    </div>
                    <div style={previewLinkStyle()} className="card__link">
                        <a href={linkObject["url"]} target="_blank" rel="noopener noreferrer">{linkText}</a>
                    </div>
                </div>
            </div>
        );
    }
}

// Specifies the default values for props:
CometChatLinkPreview.defaultProps = {
    language: "en",
};

CometChatLinkPreview.propTypes = {
	language: PropTypes.string,
	message: PropTypes.object.isRequired,
};

export { CometChatLinkPreview };