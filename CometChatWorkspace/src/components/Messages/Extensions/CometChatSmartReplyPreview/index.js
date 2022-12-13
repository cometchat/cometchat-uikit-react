import { useContext } from "react";

/** @jsxRuntime classic */
/** @jsx jsx */
import { jsx, keyframes } from "@emotion/react";
import PropTypes from "prop-types";

import { CometChatContext } from "../../../../util/CometChatContext";

import { theme } from "../../../../resources/theme";

import {
	previewWrapperStyle,
	previewHeadingStyle,
	previewCloseStyle,
	previewOptionsWrapperStyle,
	previewOptionStyle,
} from "./style";

import closeIcon from "./resources/close.svg";

const CometChatSmartReplyPreview = (props) => {
	const context = useContext(CometChatContext);

	const options = props.options.map((option, key) => {
		return (
			<div
				key={key}
				css={previewOptionStyle(context)}
				className='option'
				onClick={() => props.clicked(option)}
			>
				{option}
			</div>
		);
	});

	return (
		<div
			css={previewWrapperStyle(context, keyframes)}
			className='reply__preview__wrapper'
		>
			<div css={previewHeadingStyle()} className='preview__heading'>
				<div
					css={previewCloseStyle(closeIcon, context)}
					onClick={props.close}
					className='preview__close'
				></div>
			</div>
			<div css={previewOptionsWrapperStyle()} className='preview__options'>
				{options}
			</div>
		</div>
	);
};

// Specifies the default values for props:
CometChatSmartReplyPreview.defaultProps = {
	theme: theme,
};

CometChatSmartReplyPreview.propTypes = {
	theme: PropTypes.object,
};

export { CometChatSmartReplyPreview };
