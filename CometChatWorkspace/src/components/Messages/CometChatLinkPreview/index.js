import React from "react";
/** @jsxRuntime classic */
/** @jsx jsx */
import { jsx } from "@emotion/react";
import PropTypes from "prop-types";

import { checkMessageForExtensionsData } from "../../../util/common";

import { CometChatContext } from "../../../util/CometChatContext";

import { theme } from "../../../resources/theme";
import Translator from "../../../resources/localization/translator";

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
	static contextType = CometChatContext;

	render() {
		const linkPreviewData = checkMessageForExtensionsData(
			this.props.message,
			"link-preview"
		);
		const linkObject = linkPreviewData["links"][0];

		const pattern = /(http:|https:)?\/\/(www\.)?(youtube.com|youtu.be)(\S+)?/;
		const linkText = linkObject["url"].match(pattern)
			? Translator.translate("VIEW_ON_YOUTUBE", this.context.language)
			: Translator.translate("VISIT", this.context.language);

		return (
			<div
				css={messagePreviewContainerStyle(this.context)}
				className='message__preview'
			>
				<div css={messagePreviewWrapperStyle()} className='preview__card'>
					<div
						css={previewImageStyle(linkObject["image"])}
						className='card__image'
					></div>
					<div css={previewDataStyle(this.context)} className='card__info'>
						<div css={previewTitleStyle(this.context)} className='card__title'>
							<span>{linkObject["title"]}</span>
						</div>
						<div css={previewDescStyle(this.context)} className='card__desc'>
							<span>{linkObject["description"]}</span>
						</div>
						<div css={previewTextStyle(this.context)} className='card__text'>
							{this.props.messageText}
						</div>
					</div>
					<div css={previewLinkStyle(this.context)} className='card__link'>
						<a
							href={linkObject["url"]}
							target='_blank'
							rel='noopener noreferrer'
						>
							{linkText}
						</a>
					</div>
				</div>
			</div>
		);
	}
}

// Specifies the default values for props:
CometChatLinkPreview.defaultProps = {
	theme: theme,
};

CometChatLinkPreview.propTypes = {
	theme: PropTypes.object,
	message: PropTypes.object.isRequired,
};

export { CometChatLinkPreview };
