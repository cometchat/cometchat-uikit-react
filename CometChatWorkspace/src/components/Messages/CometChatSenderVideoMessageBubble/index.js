import React from "react";
/** @jsxRuntime classic */
/** @jsx jsx */
import { jsx } from "@emotion/react";
import PropTypes from "prop-types";
import { theme } from "../../../resources/theme";
import {
	CometChatMessageActions,
	CometChatThreadedMessageReplyCount,
	CometChatReadReceipt,
} from "../";
import { CometChatMessageReactions } from "../Extensions";

import {
	checkMessageForExtensionsData,
	getMessageFileMetadata,
} from "../../../util/common";
import * as enums from "../../../util/enums.js";
import placeholderImage from "./resources/image_placeholder.png";
import {
	messageContainerStyle,
	messageWrapperStyle,
	messageVideoWrapperStyle,
	messageInfoWrapperStyle,
	messageReactionsWrapperStyle,
} from "./style";

class CometChatSenderVideoMessageBubble extends React.Component {
	constructor(props) {
		super(props);
		this._isMounted = false;
		this.state = {
			isHovering: false,
			fileData: {},
			thumbnailURL:placeholderImage
		};
	}

	componentDidMount() {
		this._isMounted = true;
		const fileData = this.getFileData();
		this.setImage();
		this.setState({ fileData: fileData });
	}
	componentWillUnmount(){
		this._isMounted = false;
	}

	shouldComponentUpdate(nextProps, nextState) {
		const currentMessageStr = JSON.stringify(this.props.message);
		const nextMessageStr = JSON.stringify(nextProps.message);

		if (
			currentMessageStr !== nextMessageStr ||
			this.state.isHovering !== nextState.isHovering ||
			this.state.fileData !== nextState.fileData ||
			this.state.thumbnailURL !== nextState.thumbnailURL
		) {
			return true;
		}
		return false;
	}

	componentDidUpdate(prevProps) {
		const previousMessageStr = JSON.stringify(prevProps.message);
		const currentMessageStr = JSON.stringify(this.props.message);

		if (previousMessageStr !== currentMessageStr) {
			this.setImage();
			const fileData = this.getFileData();

			const previousfileData = JSON.stringify(this.state.fileData);
			const currentfileData = JSON.stringify(fileData);

			if (previousfileData !== currentfileData) {
				this.setState({ fileData: fileData });
			}
		}
	}
	setImage = () => {

		const thumbnailGenerationData = checkMessageForExtensionsData(
			this.props.message,
			"thumbnail-generation"
		);
		if (thumbnailGenerationData) {
			const mq = window.matchMedia(this.props.theme.breakPoints[0]);

			mq.addListener(() => {
				const imageToDownload = this.chooseImage(thumbnailGenerationData);

				let img = new Image();
				img.src = imageToDownload;
				img.onload = () => {
					if (this._isMounted && this.state.thumbnailURL !== img.src) {
						this.setState({ thumbnailURL: img.src });
					}
				};
			});

			const imageToDownload = this.chooseImage(thumbnailGenerationData);
			this.downloadImage(imageToDownload)
				.then((response) => {
					let img = new Image();
					img.src = imageToDownload;
					img.onload = () => {
						if (this._isMounted && this.state.thumbnailURL !== img.src) {
							this.setState({ thumbnailURL: img.src });
						}
					};
				})
				.catch((error) => console.error(error));
		}
	};
	chooseImage = (thumbnailGenerationObject) => {
		const smallUrl = thumbnailGenerationObject["url_small"];
		const mediumUrl = thumbnailGenerationObject["url_medium"];

		const mq = window.matchMedia(this.props.theme.breakPoints[0]);

		let imageToDownload = mediumUrl;
		if (mq.matches) {
			imageToDownload = smallUrl;
		}

		return imageToDownload;
	};



	downloadImage(imgUrl) {
		const promise = new Promise((resolve, reject) => {
			const xhr = new XMLHttpRequest();
			xhr.open("GET", imgUrl, true);
			xhr.responseType = "blob";

			xhr.onload = () => {
				if (xhr.readyState === 4) {
					if (xhr.status === 200) {
						this.timer = null;
						resolve(imgUrl);
					} else if (xhr.status === 403) {
						this.timer = setTimeout(() => {
							this.downloadImage(imgUrl)
								.then((response) => resolve(imgUrl))
								.catch((error) => reject(error));
						}, 800);
					}
				} else {
					reject(xhr.statusText);
				}
			};

			xhr.onerror = (event) =>
				reject(new Error("There was a network error.", event));
			xhr.ontimeout = (event) =>
				reject(new Error("There was a timeout error.", event));
			xhr.send();
		});

		return promise;
	}
	getFileData = () => {
		const metadataKey = enums.CONSTANTS["FILE_METADATA"];
		const fileMetadata = getMessageFileMetadata(
			this.props.message,
			metadataKey
		);

		if (fileMetadata instanceof Blob) {
			return { fileName: fileMetadata["name"] };
		} else if (
			this.props.message.data.attachments &&
			typeof this.props.message.data.attachments === "object" &&
			this.props.message.data.attachments.length
		) {
			const fileName = this.props.message.data.attachments[0]?.name;
			const fileUrl = this.props.message.data.attachments[0]?.url;

			return { fileName, fileUrl: fileUrl };
		}
	};

	handleMouseHover = () => {
		this.setState(this.toggleHoverState);
	};

	toggleHoverState = (state) => {
		return {
			isHovering: !state.isHovering,
		};
	};

	render() {
		if (!Object.keys(this.state.fileData).length) {
			return null;
		}

		let messageReactions = null;
		const reactionsData = checkMessageForExtensionsData(
			this.props.message,
			"reactions"
		);
		if (reactionsData) {
			if (Object.keys(reactionsData).length) {
				messageReactions = (
					<div
						css={messageReactionsWrapperStyle()}
						className='message__reaction__wrapper'
					>
						<CometChatMessageReactions
							message={this.props.message}
							actionGenerated={this.props.actionGenerated}
						/>
					</div>
				);
			}
		}

		let toolTipView = null;
		if (this.state.isHovering) {
			toolTipView = (
				<CometChatMessageActions
					message={this.props.message}
					actionGenerated={this.props.actionGenerated}
				/>
			);
		}
		return (
			<div
				css={messageContainerStyle()}
				className='sender__message__container message__video'
				onMouseEnter={this.handleMouseHover}
				onMouseLeave={this.handleMouseHover}
			>
				{toolTipView}

				<div css={messageWrapperStyle()} className='message__wrapper'>
					<div
						css={messageVideoWrapperStyle()}
						className='message__video__wrapper'
					>
						<video controls src={this.state.fileData?.fileUrl} poster={this.state?.thumbnailURL}>
								</video>

					</div>
				</div>

				{messageReactions}

				<div css={messageInfoWrapperStyle()} className='message__info__wrapper'>
					<CometChatThreadedMessageReplyCount
						message={this.props.message}
						actionGenerated={this.props.actionGenerated}
					/>
					<CometChatReadReceipt message={this.props.message} />
				</div>
			</div>
		);
	}
}

// Specifies the default values for props:
CometChatSenderVideoMessageBubble.defaultProps = {
	theme: theme,
	actionGenerated: () => {},
};

CometChatSenderVideoMessageBubble.propTypes = {
	theme: PropTypes.object,
	actionGenerated: PropTypes.func.isRequired,
	message: PropTypes.object.isRequired,
};

export { CometChatSenderVideoMessageBubble };
